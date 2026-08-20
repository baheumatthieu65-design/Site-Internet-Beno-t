import { parseCookies, verifySessionToken, getOrdersFromDB, sendOrdersReportEmail } from '../_helpers.js';

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
    const periodMode = body.periodMode || 'all';
    const periodValue = String(body.periodValue || '');
    const query = String(body.searchQuery || '').trim().toLowerCase();

    const filtered = allOrders.filter((order: any) => {
      if (ids && !ids.has(String(order.id))) return false;
      if (status && order.status !== status) return false;
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
    const rows = filtered.map((order: any) => `<tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(order.status)}</td><td>${escapeHtml(order.clientName || 'Donnée protégée')}</td><td>${escapeHtml(order.totalPrice || 0)} ${escapeHtml(order.currency || '€')}</td><td>${escapeHtml(order.date)}</td></tr>`).join('');
    const html = `<h2>Rapport de réception — Maison des Pyrénées</h2><p>${escapeHtml(filterLabel)}</p><ul><li>Demandes : <strong>${totals.demande.toLocaleString('fr-FR')} €</strong></li><li>Prises en compte : <strong>${totals.priseEnCompte.toLocaleString('fr-FR')} €</strong></li><li>Commandes passées : <strong>${totals.passees.toLocaleString('fr-FR')} €</strong></li><li>Annulées : <strong>${totals.annulees.toLocaleString('fr-FR')} €</strong></li><li>Reste à traiter : <strong>${remaining.toLocaleString('fr-FR')} €</strong></li></ul><table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Référence</th><th>État</th><th>Client</th><th>Montant</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table>`;
    const result = await sendOrdersReportEmail({ to, subject, text, html });
    if (!result.sent) return res.status(502).json({ success: false, error: result.message || 'Rapport non envoyé.' });
    return res.status(200).json({ success: true, count: filtered.length, totals });
  } catch (error) {
    console.error('Orders report error:', error);
    return res.status(500).json({ success: false, error: 'Impossible de générer le rapport.' });
  }
}
