import { checkResetCode, parseCookies, verifySessionToken, getRedisClient, getOrderNotificationEmail, saveOrderNotificationEmail } from '../../api/_helpers.js';

const SITE_CONFIG_KEY = 'mdp_site_config';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function json(res: any, status: number, data: unknown) {
  return res.status(status).setHeader('Cache-Control', 'no-store, no-cache, must-revalidate').json(data);
}

async function sendChangeConfirmation(recipients: string[], oldEmail: string, newEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, message: 'RESEND_API_KEY non configuré.' };

  const from = process.env.EMAIL_FROM || 'Maison des Pyrénées <onboarding@resend.dev>';
  const uniqueRecipients = Array.from(new Set(recipients.map((email) => email.trim().toLowerCase()).filter(Boolean)));
  if (!uniqueRecipients.length) return { sent: false, message: 'Aucun destinataire de confirmation.' };

  const subject = '[MAISON DES PYRÉNÉES] Modification de l’adresse de réception des commandes';
  const text = `La configuration de réception des commandes a été modifiée.\n\nAncienne adresse : ${oldEmail}\nNouvelle adresse : ${newEmail}\n\nCette modification a été validée depuis l’administration du site.`;
  const html = `<p>La configuration de réception des commandes a été modifiée.</p><p><strong>Ancienne adresse :</strong> ${oldEmail}</p><p><strong>Nouvelle adresse :</strong> ${newEmail}</p><p>Cette modification a été validée depuis l’administration du site.</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: uniqueRecipients, subject, html, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Erreur Resend changement email:', body);
    return { sent: false, message: 'Impossible d’envoyer le mail de confirmation.' };
  }

  return { sent: true };
}

export default async function handler(req: any, res: any) {
  const session = verifySessionToken(parseCookies(req.headers.cookie).admin_session);
  if (!session.valid) return json(res, 401, { success: false, message: 'Session administrateur invalide.' });

  if (req.method === 'GET') {
    try {
      const email = await getOrderNotificationEmail();
      return json(res, 200, { success: true, email });
    } catch (error) {
      console.error('Lecture email commandes:', error);
      return json(res, 500, { success: false, message: 'Impossible de lire l’adresse de réception.' });
    }
  }

  if (req.method !== 'PUT') return json(res, 405, { success: false, message: 'Méthode non autorisée.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const email = String(body.email || '').trim();
    const code = String(body.code || '').trim();
    const sendConfirmation = body.sendConfirmation !== false;

    if (!EMAIL_RE.test(email)) return json(res, 400, { success: false, message: 'Adresse email invalide.' });
    if (!code || !checkResetCode(code)) return json(res, 401, { success: false, message: 'Code administrateur incorrect.' });

    const oldEmail = await getOrderNotificationEmail();
    if (oldEmail.toLowerCase() === email.toLowerCase()) {
      return json(res, 200, { success: true, email: oldEmail, changed: false, confirmationSent: false, message: 'Cette adresse est déjà configurée.' });
    }

    await saveOrderNotificationEmail(email);

    // On conserve la valeur dans la configuration publique existante pour la compatibilité
    // avec les anciens composants, tout en empêchant un futur enregistrement global de l’écraser.
    const redis = getRedisClient();
    if (redis) {
      const currentConfig = await redis.get<any>(SITE_CONFIG_KEY);
      if (currentConfig && typeof currentConfig === 'object') {
        await redis.set(SITE_CONFIG_KEY, { ...currentConfig, ordersEmail: email });
      }
    }

    let confirmationSent = false;
    let confirmationMessage = '';
    if (sendConfirmation) {
      const result = await sendChangeConfirmation([oldEmail, email], oldEmail, email);
      confirmationSent = result.sent;
      confirmationMessage = result.message || '';
    }

    return json(res, 200, {
      success: true,
      email,
      changed: true,
      confirmationSent,
      message: confirmationSent
        ? 'Adresse de réception modifiée et mail de confirmation envoyé.'
        : confirmationMessage || 'Adresse de réception modifiée avec succès.',
    });
  } catch (error) {
    console.error('Modification email commandes:', error);
    return json(res, 500, { success: false, message: 'Erreur lors de la modification de l’adresse de réception.' });
  }
}
