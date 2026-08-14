import crypto from 'crypto';

// Secret key for signing session cookies
const getSessionSecret = () => {
  return process.env.SESSION_SECRET || process.env.Admin || process.env.ADMIN_PASSWORD || 'pyrenees-default-session-secret-key-2026';
};

/**
 * Validates admin password against environment variables (process.env.Admin or process.env.ADMIN_PASSWORD)
 */
export const checkAdminPassword = (passwordInput: string): boolean => {
  if (!passwordInput) return false;
  
  const envAdminPass = process.env.Admin || process.env.ADMIN_PASSWORD;
  
  // If env variable is set, verify against it
  if (envAdminPass) {
    return passwordInput.trim() === envAdminPass.trim();
  }
  
  // Fallback for local development if env var is missing
  return passwordInput.trim() === 'pyrenees2025';
};

/**
 * Validates admin reset code against environment variables
 */
export const checkResetCode = (code: string): boolean => {
  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();
  const envAdminPass = process.env.Admin || process.env.ADMIN_PASSWORD;
  const envResetCode = process.env.ADMIN_RESET_CODE || 'VJFGC';
  
  if (envAdminPass && cleanCode === envAdminPass.trim().toUpperCase()) {
    return true;
  }
  return cleanCode === envResetCode.toUpperCase();
};

/**
 * Generates an HMAC signed session token
 */
export const createSessionToken = (username: string = 'admin'): string => {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = `${username}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}:${signature}`;
};

/**
 * Verifies an HMAC signed session token
 */
export const verifySessionToken = (token: string | null | undefined): { valid: boolean; username?: string } => {
  if (!token) return { valid: false };

  try {
    const parts = token.split(':');
    if (parts.length !== 3) return { valid: false };

    const [username, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false };
    }

    const payload = `${username}:${expiresAtStr}`;
    const hmac = crypto.createHmac('sha256', getSessionSecret());
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return { valid: true, username };
    }
  } catch (e) {
    console.error('Error verifying session token:', e);
  }

  return { valid: false };
};

/**
 * Parse cookies from request Cookie header
 */
export const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      cookies[name] = decodeURIComponent(val);
    }
  });

  return cookies;
};

/**
 * Format Cookie header string for setting admin session
 */
export const createSessionCookieHeader = (token: string): string => {
  const isProd = process.env.NODE_ENV === 'production';
  return `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${isProd ? '; Secure' : ''}`;
};

/**
 * Format Cookie header string for clearing admin session
 */
export const createClearCookieHeader = (): string => {
  return `admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

/**
 * Sends an order confirmation notification email to the administrator
 */
export const sendOrderEmailNotification = async (orderData: {
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
}): Promise<{ sent: boolean; message?: string }> => {
  const adminEmail = process.env.ADMIN_EMAIL || 'contact@maisondespyrenees.fr';
  const resendApiKey = process.env.RESEND_API_KEY;

  const itemsListHtml = orderData.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #334235;">
        <td style="padding: 10px; color: #f3ece0; font-family: serif;">${item.jacketName}</td>
        <td style="padding: 10px; color: #a3b1a5;">${item.color}</td>
        <td style="padding: 10px; color: #d4af37; font-weight: bold;">${item.size}</td>
        <td style="padding: 10px; color: #f3ece0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; color: #f3ece0; text-align: right;">${item.unitPrice} ${orderData.currency}</td>
        <td style="padding: 10px; color: #d4af37; font-weight: bold; text-align: right;">${item.totalPrice} ${orderData.currency}</td>
      </tr>`
    )
    .join('');

  const itemsListText = orderData.items
    .map(
      (item) =>
        `- ${item.quantity}x ${item.jacketName} (Couleur: ${item.color}, Taille: ${item.size}) - ${item.totalPrice} ${orderData.currency}`
    )
    .join('\n');

  const emailSubject = `[MAISON DES PYRÉNÉES] Nouvelle Commande ${orderData.id} - ${orderData.clientName}`;

  const emailTextContent = `
==================================================
MAISON DES PYRÉNÉES - NOUVELLE COMMANDE CLIENT
==================================================

Référence : ${orderData.id}
Date & Heure : ${orderData.formattedDate}
Type : ${orderData.orderTypeLabel || 'Commande Directe'}

INFORMATIONS CLIENT :
- Nom : ${orderData.clientName}
- E-mail : ${orderData.clientEmail}
- Téléphone : ${orderData.clientPhone || 'Non renseigné'}
- Remarques / Instructions : ${orderData.clientNotes || 'Aucune remarque.'}

DÉTAIL DES ARTICLES COMMANDÉS :
${itemsListText}

MONTANT TOTAL : ${orderData.totalPrice} ${orderData.currency}

-- 
Ce message a été généré automatiquement par le serveur de la boutique Maison des Pyrénées.
`;

  const emailHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="background-color: #0f1410; color: #e2d5c3; font-family: sans-serif; padding: 20px;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #161d18; border: 1px solid #3c4e40; border-radius: 16px; padding: 24px;">
    
    <div style="text-align: center; border-bottom: 1px solid #2f3d31; padding-bottom: 16px; margin-bottom: 20px;">
      <span style="color: #d4af37; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Maison des Pyrénées • Confection Artisanale</span>
      <h2 style="color: #f3ece0; font-family: serif; margin: 6px 0 0 0;">Nouvelle Commande Received</h2>
      <p style="color: #a3b1a5; font-size: 13px; margin-top: 4px;">Référence : <strong style="color: #d4af37;">${orderData.id}</strong></p>
    </div>

    <div style="background-color: #111712; border: 1px solid #2c392e; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <h3 style="color: #d4af37; font-size: 13px; text-transform: uppercase; margin-top: 0;">Coordonnées du Client</h3>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Client :</strong> ${orderData.clientName}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>E-mail :</strong> <a href="mailto:${orderData.clientEmail}" style="color: #d4af37;">${orderData.clientEmail}</a></p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Téléphone :</strong> ${orderData.clientPhone || 'Non renseigné'}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Date & Heure :</strong> ${orderData.formattedDate}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Type :</strong> ${orderData.orderTypeLabel || 'Commande Directe'}</p>
      ${
        orderData.clientNotes
          ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #b8c5ba; font-style: italic; border-top: 1px solid #29362b; padding-top: 8px;"><strong>Remarques :</strong> "${orderData.clientNotes}"</p>`
          : ''
      }
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="color: #d4af37; font-size: 13px; text-transform: uppercase; margin-top: 0;">Articles Commandés</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #3c4e40; color: #a3b1a5; text-transform: uppercase; font-size: 11px;">
            <th style="padding: 8px; text-align: left;">Article</th>
            <th style="padding: 8px; text-align: left;">Nuance</th>
            <th style="padding: 8px; text-align: left;">Taille</th>
            <th style="padding: 8px; text-align: center;">Qté</th>
            <th style="padding: 8px; text-align: right;">Prix unitaire</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsListHtml}
        </tbody>
      </table>
    </div>

    <div style="background-color: #1e2820; border: 1px solid #3b4e3e; border-radius: 12px; padding: 14px; text-align: right;">
      <span style="color: #a3b1a5; font-size: 13px; text-transform: uppercase;">Montant Total de la Commande : </span>
      <strong style="color: #f3ece0; font-size: 20px; font-family: serif; margin-left: 8px;">${orderData.totalPrice} ${orderData.currency}</strong>
    </div>

    <div style="margin-top: 24px; text-align: center; color: #7d8e80; font-size: 11px; border-top: 1px solid #2c392e; padding-top: 12px;">
      Notification automatique envoyée à l'administrateur : <strong>${adminEmail}</strong>
    </div>

  </div>
</body>
</html>
`;

  // If RESEND_API_KEY is configured, dispatch real email
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'Maison des Pyrénées <onboarding@resend.dev>';
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [adminEmail],
          subject: emailSubject,
          html: emailHtmlContent,
          text: emailTextContent,
        }),
      });

      if (resendRes.ok) {
        console.log(`[EMAIL SUCCESS] Order notification email sent to ${adminEmail}`);
        return { sent: true };
      } else {
        const errText = await resendRes.text();
        console.error(`[EMAIL RESEND ERROR] ${resendRes.status}: ${errText}`);
        return { sent: false, message: `Erreur service Resend (${resendRes.status})` };
      }
    } catch (e: any) {
      console.error('[EMAIL DISPATCH ERROR]', e);
      return { sent: false, message: e?.message || 'Erreur lors de l\'envoi de l\'email' };
    }
  }

  console.log(`[EMAIL MOCK/LOG] Resend API key not configured. Order notification logged for ${adminEmail}`);
  return { sent: false, message: 'RESEND_API_KEY non configuré sur Vercel' };
};
