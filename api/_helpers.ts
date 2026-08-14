```ts
import crypto from 'crypto';

/**
 * Récupère obligatoirement le secret de session depuis Vercel.
 * Aucun secret de secours ne doit être présent dans le code.
 */
const getSessionSecret = (): string => {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }

  return secret;
};

/**
 * Vérifie le mot de passe administrateur.
 * Le mot de passe doit obligatoirement être configuré
 * dans les variables d'environnement Vercel.
 */
export const checkAdminPassword = (passwordInput: string): boolean => {
  if (!passwordInput) return false;

  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD is not configured');
    return false;
  }

  const input = passwordInput.trim();
  const expected = adminPassword.trim();

  if (input.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(input),
    Buffer.from(expected)
  );
};

/**
 * Vérifie le code de récupération du compte administrateur.
 *
 * Le code doit obligatoirement être configuré dans :
 * ADMIN_RESET_CODE
 *
 * Aucun code par défaut n'est présent dans le code source.
 */
export const checkResetCode = (code: string): boolean => {
  if (!code) return false;

  const resetCode = process.env.ADMIN_RESET_CODE;

  if (!resetCode) {
    console.error('ADMIN_RESET_CODE is not configured');
    return false;
  }

  const input = code.trim().toUpperCase();
  const expected = resetCode.trim().toUpperCase();

  if (input.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(input),
    Buffer.from(expected)
  );
};

/**
 * Génère un token de session signé HMAC-SHA256.
 *
 * Durée : 24 heures.
 */
export const createSessionToken = (
  username: string = 'admin'
): string => {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const safeUsername = username === 'admin' ? 'admin' : 'admin';

  const payload = `${safeUsername}:${expiresAt}`;

  const hmac = crypto.createHmac(
    'sha256',
    getSessionSecret()
  );

  hmac.update(payload);

  const signature = hmac.digest('hex');

  return `${payload}:${signature}`;
};

/**
 * Vérifie un token de session.
 */
export const verifySessionToken = (
  token: string | null | undefined
): { valid: boolean; username?: string } => {
  if (!token) {
    return { valid: false };
  }

  try {
    const parts = token.split(':');

    if (parts.length !== 3) {
      return { valid: false };
    }

    const [username, expiresAtStr, signature] = parts;

    if (username !== 'admin') {
      return { valid: false };
    }

    const expiresAt = Number(expiresAtStr);

    if (!Number.isFinite(expiresAt)) {
      return { valid: false };
    }

    if (Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${username}:${expiresAtStr}`;

    const hmac = crypto.createHmac(
      'sha256',
      getSessionSecret()
    );

    hmac.update(payload);

    const expectedSignature = hmac.digest('hex');

    const providedBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (providedBuffer.length !== expectedBuffer.length) {
      return { valid: false };
    }

    const validSignature = crypto.timingSafeEqual(
      providedBuffer,
      expectedBuffer
    );

    if (!validSignature) {
      return { valid: false };
    }

    return {
      valid: true,
      username: 'admin',
    };
  } catch (error) {
    console.error('Error verifying session token:', error);
    return { valid: false };
  }
};

/**
 * Analyse les cookies reçus par le serveur.
 */
export const parseCookies = (
  cookieHeader: string | undefined
): Record<string, string> => {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach((cookie) => {
    const separatorIndex = cookie.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const name = cookie
      .slice(0, separatorIndex)
      .trim();

    const value = cookie
      .slice(separatorIndex + 1)
      .trim();

    if (!name) {
      return;
    }

    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  });

  return cookies;
};

/**
 * Crée le cookie de session administrateur.
 */
export const createSessionCookieHeader = (
  token: string
): string => {
  const isProduction =
    process.env.NODE_ENV === 'production';

  return [
    `admin_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=86400',
    isProduction ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
};

/**
 * Supprime le cookie de session administrateur.
 */
export const createClearCookieHeader = (): string => {
  return [
    'admin_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Secure',
  ].join('; ');
};

/**
 * Envoie une notification de commande par e-mail via Resend.
 *
 * Toutes les informations sensibles sont récupérées
 * côté serveur depuis les variables d'environnement.
 */
export const sendOrderEmailNotification = async (
  orderData: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientNotes?: string;
    orderTypeLabel?: string;
    items: Array<{
      jacketName: string;
      color: string;
      size: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    totalPrice: number;
    currency: string;
    formattedDate: string;
    shippingAddress?: string;
  }
): Promise<{
  sent: boolean;
  message?: string;
}> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not configured');

    return {
      sent: false,
      message: 'ADMIN_EMAIL non configuré sur Vercel',
    };
  }

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured');

    return {
      sent: false,
      message: 'RESEND_API_KEY non configuré sur Vercel',
    };
  }

  if (!fromEmail) {
    console.error('EMAIL_FROM is not configured');

    return {
      sent: false,
      message: 'EMAIL_FROM non configuré sur Vercel',
    };
  }

  const itemsListHtml = orderData.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px;">
            ${escapeHtml(item.jacketName)}
          </td>
          <td style="padding:10px;">
            ${escapeHtml(item.color)}
          </td>
          <td style="padding:10px;">
            ${escapeHtml(item.size)}
          </td>
          <td style="padding:10px;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px;text-align:right;">
            ${item.unitPrice} ${escapeHtml(orderData.currency)}
          </td>
          <td style="padding:10px;text-align:right;">
            ${item.totalPrice} ${escapeHtml(orderData.currency)}
          </td>
        </tr>
      `
    )
    .join('');

  const itemsListText = orderData.items
    .map(
      (item) =>
        `- ${item.quantity}x ${item.jacketName} | ${item.color} | Taille ${item.size} | ${item.totalPrice} ${orderData.currency}`
    )
    .join('\n');

  const emailSubject =
    `[MAISON DES PYRÉNÉES] Nouvelle commande ${orderData.id}`;

  const emailTextContent = `
MAISON DES PYRÉNÉES
NOUVELLE COMMANDE

Référence : ${orderData.id}
Date : ${orderData.formattedDate}
Type : ${orderData.orderTypeLabel || 'Commande Directe'}

CLIENT
Nom : ${orderData.clientName}
E-mail : ${orderData.clientEmail}
Téléphone : ${orderData.clientPhone || 'Non renseigné'}

ADRESSE
${orderData.shippingAddress || 'Non renseignée'}

REMARQUES
${orderData.clientNotes || 'Aucune remarque.'}

ARTICLES
${itemsListText}

TOTAL
${orderData.totalPrice} ${orderData.currency}
`;

  const emailHtmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouvelle commande</title>
</head>

<body style="
  margin:0;
  padding:20px;
  background:#0f1410;
  color:#f3ece0;
  font-family:Arial,sans-serif;
">

  <div style="
    max-width:650px;
    margin:auto;
    background:#161d18;
    padding:24px;
    border-radius:16px;
  ">

    <h2>
      Nouvelle commande
    </h2>

    <p>
      <strong>Référence :</strong>
      ${escapeHtml(orderData.id)}
    </p>

    <p>
      <strong>Date :</strong>
      ${escapeHtml(orderData.formattedDate)}
    </p>

    <hr>

    <h3>Client</h3>

    <p>
      <strong>Nom :</strong>
      ${escapeHtml(orderData.clientName)}
    </p>

    <p>
      <strong>E-mail :</strong>
      ${escapeHtml(orderData.clientEmail)}
    </p>

    <p>
      <strong>Téléphone :</strong>
      ${escapeHtml(orderData.clientPhone || 'Non renseigné')}
    </p>

    <p>
      <strong>Adresse :</strong><br>
      ${escapeHtml(orderData.shippingAddress || 'Non renseignée')}
    </p>

    <p>
      <strong>Remarques :</strong><br>
      ${escapeHtml(orderData.clientNotes || 'Aucune remarque.')}
    </p>

    <hr>

    <h3>Articles commandés</h3>

    <table style="
      width:100%;
      border-collapse:collapse;
    ">

      <thead>
        <tr>
          <th style="text-align:left;padding:10px;">
            Article
          </th>

          <th style="text-align:left;padding:10px;">
            Couleur
          </th>

          <th style="text-align:left;padding:10px;">
            Taille
          </th>

          <th style="text-align:center;padding:10px;">
            Qté
          </th>

          <th style="text-align:right;padding:10px;">
            Prix
          </th>

          <th style="text-align:right;padding:10px;">
            Total
          </th>
        </tr>
      </thead>

      <tbody>
        ${itemsListHtml}
      </tbody>

    </table>

    <hr>

    <h2 style="text-align:right;">
      ${orderData.totalPrice}
      ${escapeHtml(orderData.currency)}
    </h2>

  </div>

</body>
</html>
`;

  try {
    const response = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: emailSubject,
          html: emailHtmlContent,
          text: emailTextContent,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        `[RESEND ERROR] ${response.status}:`,
        errorText
      );

      return {
        sent: false,
        message: `Erreur Resend (${response.status})`,
      };
    }

    console.log(
      `[EMAIL SUCCESS] Commande ${orderData.id} envoyée à l'administrateur`
    );

    return {
      sent: true,
    };
  } catch (error) {
    console.error(
      '[EMAIL DISPATCH ERROR]',
      error
    );

    return {
      sent: false,
      message: 'Erreur lors de l’envoi de l’e-mail',
    };
  }
};

/**
 * Échappe les données utilisateur avant insertion dans du HTML.
 */
const escapeHtml = (value: unknown): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
```
