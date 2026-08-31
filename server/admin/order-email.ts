import { checkResetCode, parseCookies, verifySessionToken, getRedisClient, getOrderNotificationEmail, saveOrderNotificationEmail } from '../../api/_helpers.js';

const SITE_CONFIG_KEY = 'mdp_site_config';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const DEFAULT_RECOVERY_EMAIL = 'baheu.matthieu65@gmail.com';

function json(res: any, status: number, data: unknown) {
  return res.status(status)
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    .json(data);
}

async function sendChangeConfirmation(oldEmail: string, newEmail: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, message: 'RESEND_API_KEY non configuré.' };
  }

  const from = process.env.EMAIL_FROM || 'Maison des Pyrénées <onboarding@resend.dev>';

  // IMPORTANT :
  // Le domaine resend.dev ne peut envoyer qu'à l'adresse du compte Resend.
  // On n'envoie donc JAMAIS le mail de confirmation à la nouvelle adresse
  // si celle-ci est Gmail/Hotmail/etc. Elle est simplement enregistrée.
  const recoveryEmail = String(
    process.env.ADMIN_EMAIL || DEFAULT_RECOVERY_EMAIL
  ).trim().toLowerCase();

  const subject = '[MAISON DES PYRÉNÉES] Modification de l’adresse de réception des commandes';
  const text =
    `La configuration de réception des commandes a été modifiée.\n\n` +
    `Ancienne adresse : ${oldEmail}\n` +
    `Nouvelle adresse : ${newEmail}\n\n` +
    `Cette modification a été validée depuis l’administration du site.`;

  const html =
    `<p>La configuration de réception des commandes a été modifiée.</p>` +
    `<p><strong>Ancienne adresse :</strong> ${oldEmail}</p>` +
    `<p><strong>Nouvelle adresse :</strong> ${newEmail}</p>` +
    `<p>Cette modification a été validée depuis l’administration du site.</p>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [recoveryEmail],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Erreur Resend changement email:', body);
    return {
      sent: false,
      message: 'Impossible d’envoyer le mail de confirmation à l’adresse de récupération.',
    };
  }

  return {
    sent: true,
    sentTo: recoveryEmail,
  };
}

export default async function handler(req: any, res: any) {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySessionToken(cookies.admin_session);

  if (!session.valid) {
    return json(res, 401, {
      success: false,
      message: 'Session administrateur invalide.',
    });
  }

  if (req.method === 'GET') {
    try {
      const email = await getOrderNotificationEmail();
      return json(res, 200, { success: true, email });
    } catch (error) {
      console.error('Lecture email commandes:', error);
      return json(res, 500, {
        success: false,
        message: 'Impossible de lire l’adresse de réception.',
      });
    }
  }

  if (req.method !== 'PUT') {
    return json(res, 405, {
      success: false,
      message: 'Méthode non autorisée.',
    });
  }

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body || {};

    const email = String(body.email || '').trim();
    const code = String(body.code || '').trim();
    const sendConfirmation = body.sendConfirmation !== false;

    if (!EMAIL_RE.test(email)) {
      return json(res, 400, {
        success: false,
        message: 'Adresse email invalide.',
      });
    }

    if (!code || !checkResetCode(code)) {
      return json(res, 401, {
        success: false,
        message: 'Code administrateur incorrect.',
      });
    }

    const oldEmail = await getOrderNotificationEmail();

    if (oldEmail.toLowerCase() === email.toLowerCase()) {
      return json(res, 200, {
        success: true,
        email: oldEmail,
        changed: false,
        confirmationSent: false,
        message: 'Cette adresse est déjà configurée.',
      });
    }

    // Le changement est enregistré même si la nouvelle adresse est
    // Gmail/Hotmail. La restriction Resend concerne l'envoi, pas le stockage.
    await saveOrderNotificationEmail(email);

    // Synchronisation avec la configuration publique existante.
    const redis = getRedisClient();

    if (redis) {
      const currentConfig = await redis.get<any>(SITE_CONFIG_KEY);

      if (currentConfig && typeof currentConfig === 'object') {
        await redis.set(SITE_CONFIG_KEY, {
          ...currentConfig,
          ordersEmail: email,
        });
      }
    }

    let confirmationSent = false;
    let confirmationMessage = '';
    let confirmationSentTo = '';

    if (sendConfirmation) {
      const result = await sendChangeConfirmation(oldEmail, email);
      confirmationSent = result.sent;
      confirmationMessage = result.message || '';
      confirmationSentTo = result.sentTo || '';
    }

    const usesResendTestDomain =
      !(process.env.EMAIL_FROM || '').trim() ||
      (process.env.EMAIL_FROM || '').includes('resend.dev');

    const deliveryWarning =
      usesResendTestDomain &&
      email.toLowerCase() !== String(
        process.env.ADMIN_EMAIL || DEFAULT_RECOVERY_EMAIL
      ).trim().toLowerCase()
        ? 'Adresse enregistrée, mais Resend en mode test ne peut pas envoyer les commandes à cette adresse. Pour recevoir les commandes sur cette nouvelle adresse, il faudra utiliser un domaine vérifié dans Resend.'
        : '';

    return json(res, 200, {
      success: true,
      email,
      changed: true,
      confirmationSent,
      confirmationSentTo,
      deliveryWarning,
      message: confirmationSent
        ? `Adresse de réception modifiée. Le mail de confirmation a été envoyé à ${confirmationSentTo}.`
        : confirmationMessage ||
          (deliveryWarning
            ? `Adresse de réception modifiée. ${deliveryWarning}`
            : 'Adresse de réception modifiée avec succès.'),
    });
  } catch (error) {
    console.error('Modification email commandes:', error);

    return json(res, 500, {
      success: false,
      message: 'Erreur lors de la modification de l’adresse de réception.',
    });
  }
}
