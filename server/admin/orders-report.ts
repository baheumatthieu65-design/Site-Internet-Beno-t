import { parseCookies, verifySessionToken, getOrdersFromDB, sendOrdersReportEmail } from '../../api/_helpers.js';

const parseBody = (body: any) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

const getTimestamp = (order: any) => Number.isFinite(Number(order.timestamp)) ? Number(order.timestamp) : Date.parse(String(order.date || '').replace(' à ', ' ')) || 0;
const getWeek = (date: Date) => {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export default async function handler(req: any, res: any) {
  const auth = verifySessionToken(parseCookies(req.headers?.cookie).admin_session);
  if (!auth.valid) return res.status(401).json({ success: false, error: 'Non autorisé' });
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Méthode non autorisée.' });

  try {
    const body = parseBody(req.body);
    const to = String(body.to || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ success: false, error: 'Adresse de rapport invalide.' });

    const allOrders = await getOrdersFromDB();
    const ids = Array.isArray(body.orderIds) ? new Set(body.orderIds.map(String)) : null;
    const status = body.status && body.status !== 'all' ? String(body.status) : null;
    const orderType = body.orderType && body.orderType !== 'all' ? String(body.orderType) : 'all';
    const periodMode = body.periodMode || 'all';
    const periodValue = String(body.periodValue || '');
    const query = String(body.searchQuery || '').trim().toLowerCase();

    const filtered = allOrders.filter((order: any) => {
      if (ids && !ids.has(String(order.id))) return false;
      if (status && order.status !== status) return false;
      if (orderType !== 'all') {
        const isAppointment =
          order.orderType === 'essayage' ||
          order.orderTypeLabel === 'Réservation Atelier & Essayage';
        if (orderType === 'appointments' && !isAppointment) return false;
        if (orderType === 'orders' && isAppointment) return false;
      }
      if (query && ![order.id, order.clientName, order.clientEmail, ...(Array.isArray(order.items) ? order.items.map((i: any) => i.jacketName) : [])].some((v) => String(v || '').toLowerCase().includes(query))) return false;
      if (periodMode === 'all') return true;
      const date = new Date(getTimestamp(order));
      if (Number.isNaN(date.getTime())) return false;
      if (periodMode === 'year') return date.getFullYear() === Number(periodValue);
      if (periodMode === 'month') return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` === periodValue;
      return getWeek(date) === periodValue;
    });

    const totals = filtered.reduce((acc: any, order: any) => {
      const amount = Number(order.totalPrice) || 0;
      if (order.status === 'Demande') acc.demande += amount;
      else if (order.status === 'Prise en compte') acc.priseEnCompte += amount;
      else if (order.status === 'Commande passée') acc.passees += amount;
      else if (order.status === 'Commande annulée') acc.annulees += amount;
      return acc;
    }, { demande: 0, priseEnCompte: 0, passees: 0, annulees: 0 });

    const remaining = totals.demande + totals.priseEnCompte;
    const subject = `[MAISON DES PYRÉNÉES] Rapport commandes — ${filtered.length} élément(s)`;
    const filterLabel = [status ? `État : ${status}` : 'Tous les états', periodMode !== 'all' ? `Période : ${periodValue}` : 'Toutes les périodes', query ? `Recherche : ${query}` : ''].filter(Boolean).join(' • ');
    const text = [
      'RAPPORT DE RÉCEPTION — MAISON DES PYRÉNÉES', '', filterLabel, '',
      `Demandes : ${totals.demande.toLocaleString('fr-FR')} €`,
      `Prises en compte : ${totals.priseEnCompte.toLocaleString('fr-FR')} €`,
      `Commandes passées : ${totals.passees.toLocaleString('fr-FR')} €`,
      `Annulées : ${totals.annulees.toLocaleString('fr-FR')} €`,
      `Reste à traiter : ${remaining.toLocaleString('fr-FR')} €`, '',
      ...filtered.map((order: any) => `${order.id} — ${order.status} — ${order.totalPrice || 0} ${order.currency || '€'} — ${order.clientName || 'Donnée protégée'}`),
    ].join('\n');
    const rows = filtered.map((order: any) => {
      const items = Array.isArray(order.items) ? order.items : [];
      const articleRows = items.length
        ? items.map((item: any) => {
            const imageUrl = String(item.imageUrl || item.heroImage || item.image || '').trim();
            const image = imageUrl
              ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.jacketName || 'Article')}" width="52" height="52" style="display:block;width:52px;height:52px;object-fit:cover;border-radius:5px;" />`
              : `<div style="width:52px;height:52px;line-height:52px;text-align:center;background:#f2f2f2;color:#777;border-radius:5px;">—</div>`;
            return `<tr>
              <td style="padding:4px 6px;border:1px solid #d9d9d9;text-align:center;vertical-align:middle;">${image}</td>
              <td style="padding:4px 7px;border:1px solid #d9d9d9;text-align:center;white-space:nowrap;">${escapeHtml(item.quantity || 0)}</td>
              <td style="padding:4px 7px;border:1px solid #d9d9d9;">${escapeHtml(item.jacketName || '')}</td>
              <td style="padding:4px 7px;border:1px solid #d9d9d9;">${escapeHtml(item.color || '')}</td>
              <td style="padding:4px 7px;border:1px solid #d9d9d9;">${escapeHtml(item.size || '')}</td>
              <td style="padding:4px 7px;border:1px solid #d9d9d9;text-align:right;white-space:nowrap;">${escapeHtml(item.totalPrice || 0)} ${escapeHtml(order.currency || '€')}</td>
            </tr>`;
          }).join('')
        : `<tr><td colspan="6" style="padding:8px;border:1px solid #d9d9d9;text-align:center;">Demande de rendez-vous atelier — aucun article</td></tr>`;

      return `<tr>
        <td colspan="6" style="padding:7px 8px;border:1px solid #d9d9d9;background:#f8f8f8;font-weight:bold;">
          ${escapeHtml(order.id)} — ${escapeHtml(order.clientName || '')} — ${escapeHtml(order.date || '')}
        </td>
      </tr>${articleRows}`;
    }).join('');

    const html = `<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.35;color:#111;">
      <h2>Rapport de réception — Maison Mailhagut</h2>
      <p>${escapeHtml(filterLabel)}</p>
      <ul>
        <li>Demandes : <strong>${totals.demande.toLocaleString('fr-FR')} €</strong></li>
        <li>Prises en compte : <strong>${totals.priseEnCompte.toLocaleString('fr-FR')} €</strong></li>
        <li>Commandes passées : <strong>${totals.passees.toLocaleString('fr-FR')} €</strong></li>
        <li>Annulées : <strong>${totals.annulees.toLocaleString('fr-FR')} €</strong></li>
        <li>Reste à traiter : <strong>${remaining.toLocaleString('fr-FR')} €</strong></li>
      </ul>
      <table cellpadding="0" cellspacing="0" border="0" style="width:auto;max-width:100%;border-collapse:collapse;border-spacing:0;margin:10px 0;font-family:Arial,sans-serif;font-size:13px;">
        <thead><tr>
          <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;">Image de l'article</th>
          <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;">Nombre</th>
          <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">Nom de l'article</th>
          <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">Couleur</th>
          <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">Taille</th>
          <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:right;">Coût</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

    const result = await sendOrdersReportEmail({ to, subject, text, html });
    if (!result.sent) return res.status(502).json({ success: false, error: result.message || 'Rapport non envoyé. Si Resend renvoie 403, le destinataire n’est pas autorisé avec le domaine de test : configure EMAIL_FROM avec un domaine vérifié ou utilise l’adresse autorisée de ton compte Resend.' });
    return res.status(200).json({ success: true, count: filtered.length, totals });
  } catch (error) {
    console.error('Orders report error:', error);
    return res.status(500).json({ success: false, error: 'Impossible de générer le rapport.' });
  }
}
