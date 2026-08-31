import crypto from 'crypto';
import { Redis } from '@upstash/redis';
import { defaultInitialProducts } from './_initialProducts.js';

// ============================================================
// SESSION / AUTHENTIFICATION
// ============================================================

const getSessionSecret = (): string => {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "La variable d'environnement SESSION_SECRET est obligatoire."
    );
  }

  return secret;
};

export const checkAdminPassword = (
  passwordInput: string
): boolean => {
  if (!passwordInput) return false;

  const envAdminPass = process.env.Admin;

  if (!envAdminPass) {
    console.error(
      "La variable d'environnement Admin est manquante."
    );
    return false;
  }

  return passwordInput.trim() === envAdminPass.trim();
};

export const checkResetCode = (
  code: string
): boolean => {
  if (!code) return false;

  const cleanCode = code.trim().toUpperCase();

  const envAdminPass = process.env.Admin;
  const envResetCode = process.env.ADMIN_RESET_CODE;

  if (
    envAdminPass &&
    cleanCode === envAdminPass.trim().toUpperCase()
  ) {
    return true;
  }

  if (
    envResetCode &&
    cleanCode === envResetCode.trim().toUpperCase()
  ) {
    return true;
  }

  return false;
};

// ============================================================
// SESSION TOKEN
// ============================================================

export const createSessionToken = (
  username: string = 'admin'
): string => {
  const expiresAt =
    Date.now() + 24 * 60 * 60 * 1000;

  const payload = `${username}:${expiresAt}`;

  const hmac = crypto.createHmac(
    'sha256',
    getSessionSecret()
  );

  hmac.update(payload);

  const signature = hmac.digest('hex');

  return `${payload}:${signature}`;
};

export const verifySessionToken = (
  token: string | null | undefined
): {
  valid: boolean;
  username?: string;
  error?: string;
} => {
  if (!token) {
    return { valid: false };
  }

  try {
    const secret = getSessionSecret();

    const parts = token.split(':');

    if (parts.length !== 3) {
      return { valid: false };
    }

    const [
      username,
      expiresAtStr,
      signature,
    ] = parts;

    const expiresAt = Number(expiresAtStr);

    if (
      !Number.isFinite(expiresAt) ||
      Date.now() > expiresAt
    ) {
      return { valid: false };
    }

    const payload =
      `${username}:${expiresAtStr}`;

    const hmac = crypto.createHmac(
      'sha256',
      secret
    );

    hmac.update(payload);

    const expectedSignature =
      hmac.digest('hex');

    const signatureBuffer =
      Buffer.from(signature, 'utf8');

    const expectedBuffer =
      Buffer.from(expectedSignature, 'utf8');

    if (
      signatureBuffer.length ===
        expectedBuffer.length &&
      crypto.timingSafeEqual(
        signatureBuffer,
        expectedBuffer
      )
    ) {
      return {
        valid: true,
        username,
      };
    }

    return { valid: false };
  } catch (error: any) {
    console.error(
      'Error verifying session token:',
      error?.message || error
    );

    return {
      valid: false,
      error: error?.message,
    };
  }
};

// ============================================================
// COOKIES
// ============================================================

export const parseCookies = (
  cookieHeader: string | undefined
): Record<string, string> => {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader
    .split(';')
    .forEach((cookie) => {
      const parts = cookie.split('=');

      if (parts.length < 2) return;

      const name = parts[0].trim();

      const value = parts
        .slice(1)
        .join('=')
        .trim();

      try {
        cookies[name] =
          decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    });

  return cookies;
};

export const createSessionCookieHeader = (
  token: string
): string => {
  const isProd =
    process.env.NODE_ENV === 'production';

  return [
    `admin_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=86400',
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
};

export const createClearCookieHeader = (): string => {
  return [
    'admin_session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ].join('; ');
};

// ============================================================
// UPSTASH REDIS
// ============================================================

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (redisClient) {
    return redisClient;
  }

  const url =
    process.env.UPSTASH_REDIS_REST_URL;

  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redisClient = new Redis({
    url,
    token,
  });

  return redisClient;
};

// ============================================================
// FALLBACK LOCAL
// ============================================================

let localProductsCache: any[] | null = null;

let localOrdersCache: any[] = [];

// ============================================================
// PRODUITS
// ============================================================

export const getProductsFromDB =
  async (): Promise<any[]> => {
    const redis = getRedisClient();

    if (redis) {
      try {
        const data =
          await redis.get<any[]>(
            'mdp_products'
          );

        if (Array.isArray(data)) {
          return data;
        }

        // La base Redis n'est pas encore initialisée.
        // On ne charge volontairement aucun fichier
        // du frontend ici.
        await redis.set(
          'mdp_products',
          []
        );

        return [];
      } catch (error) {
        console.error(
          'Erreur lecture produits Redis:',
          error
        );

        throw error;
      }
    }

    // Fallback développement local.
    if (!localProductsCache) {
      localProductsCache = [];
    }

    return localProductsCache;
  };

export const saveProductsToDB =
  async (
    products: any[]
  ): Promise<void> => {
    const redis = getRedisClient();

    if (redis) {
      await redis.set(
        'mdp_products',
        products
      );

      return;
    }

    localProductsCache = products;
  };

// ============================================================
// COMMANDES / PROTECTION DES DONNÉES CLIENTS
// ============================================================

const CUSTOMER_DATA_PROTECTION_MS = 365 * 24 * 60 * 60 * 1000;

const getCustomerDataKey = (): Buffer => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET est obligatoire pour protéger les données client.");
  return crypto.createHash('sha256').update(`${secret}|customer-data-v1`).digest();
};

const encryptCustomerValue = (value: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getCustomerDataKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
};

const protectExpiredOrder = (order: any): any => {
  if (!order || order.customerDataProtectedAt) return order;
  const timestamp = Number(order.timestamp);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp < CUSTOMER_DATA_PROTECTION_MS) return order;

  const protectedAt = new Date().toISOString();
  const next = {
    ...order,
    customerDataProtectedAt: protectedAt,
    clientNameEncrypted: order.clientName ? encryptCustomerValue(String(order.clientName)) : '',
    clientEmailEncrypted: order.clientEmail ? encryptCustomerValue(String(order.clientEmail)) : '',
    clientPhoneEncrypted: order.clientPhone ? encryptCustomerValue(String(order.clientPhone)) : '',
    clientNotesEncrypted: order.clientNotes ? encryptCustomerValue(String(order.clientNotes)) : '',
    clientName: 'Donnée client protégée',
    clientEmail: '',
    clientPhone: '',
    clientNotes: '',
    generatedEmail: {
      ...(order.generatedEmail || {}),
      subject: `[MAISON DES PYRÉNÉES] Données client protégées — ${order.id}`,
      body: `Données personnelles client protégées après 12 mois. Référence : ${order.id}.`,
    },
  };
  return next;
};

export const protectExpiredCustomerData = async (orders: any[]): Promise<any[]> => {
  let changed = false;
  const protectedOrders = orders.map((order) => {
    const next = protectExpiredOrder(order);
    if (next !== order) changed = true;
    return next;
  });
  return changed ? protectedOrders : orders;
};

export const getOrdersFromDB =
  async (): Promise<any[]> => {
    const redis = getRedisClient();

    if (redis) {
      try {
        const data =
          await redis.get<any[]>(
            'mdp_orders'
          );

        if (Array.isArray(data)) {
          const protectedOrders = await protectExpiredCustomerData(data);
          if (protectedOrders !== data) await redis.set('mdp_orders', protectedOrders);
          return protectedOrders;
        }

        return [];
      } catch (error) {
        console.error(
          'Erreur lecture commandes Redis:',
          error
        );

        throw error;
      }
    }

    const protectedOrders = await protectExpiredCustomerData(localOrdersCache);
    localOrdersCache = protectedOrders;
    return protectedOrders;
  };

export const saveOrdersToDB =
  async (
    orders: any[]
  ): Promise<void> => {
    const redis = getRedisClient();

    if (redis) {
      await redis.set(
        'mdp_orders',
        orders
      );

      return;
    }

    localOrdersCache = orders;
  };

// ============================================================
// DESTINATAIRE DES COMMANDES
// ============================================================

const ORDER_EMAIL_KEY = 'mdp_order_notification_email';
const ORDER_EMAIL_MIGRATION_KEY = 'mdp_order_notification_email_gmail_migration_v1';
const DEFAULT_SITE_EMAIL = 'baheu.matthieu65@gmail.com';

export const getOrderNotificationEmail = async (): Promise<string> => {
  const redis = getRedisClient();
  if (redis) {
    try {
      const stored = await redis.get<string>(ORDER_EMAIL_KEY);
      if (typeof stored === 'string' && stored.trim()) {
        const cleanStored = stored.trim();
        // Migration unique de l'ancienne configuration vers l'adresse Gmail
        // demandée. Une fois marquée, une modification volontaire depuis
        // l'administration (même vers Hotmail) est conservée.
        const migrated = await redis.get<string>(ORDER_EMAIL_MIGRATION_KEY);
        if (!migrated && ['obiones@hotmail.fr', 'contact@maisondespyrenees.fr'].includes(cleanStored.toLowerCase())) {
          await redis.set(ORDER_EMAIL_KEY, DEFAULT_SITE_EMAIL);
          await redis.set(ORDER_EMAIL_MIGRATION_KEY, '1');
          return DEFAULT_SITE_EMAIL;
        }
        if (!migrated) await redis.set(ORDER_EMAIL_MIGRATION_KEY, '1');
        return cleanStored;
      }
    } catch (error) {
      console.error('Erreur lecture email commandes Redis:', error);
    }
  }

  return String(process.env.ADMIN_EMAIL || DEFAULT_SITE_EMAIL).trim();
};

export const saveOrderNotificationEmail = async (email: string): Promise<void> => {
  const cleanEmail = email.trim();
  const redis = getRedisClient();
  if (redis) {
    await redis.set(ORDER_EMAIL_KEY, cleanEmail);
    return;
  }
};

// ============================================================
// EMAIL RESEND
// ============================================================

export const sendOrderEmailNotification =
  async (orderData: {
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
  }): Promise<{
    sent: boolean;
    message?: string;
  }> => {
    const adminEmail =
      await getOrderNotificationEmail();

    const resendApiKey =
      process.env.RESEND_API_KEY;

    if (!adminEmail) {
      console.error(
        'ADMIN_EMAIL non configuré.'
      );

      return {
        sent: false,
        message:
          'ADMIN_EMAIL non configuré sur Vercel.',
      };
    }

    const itemsListHtml =
      orderData.items
        .map(
          (item) => `
<tr>
<td>${item.jacketName}</td>
<td>${item.color}</td>
<td>${item.size}</td>
<td>${item.quantity}</td>
<td>${item.unitPrice} ${orderData.currency}</td>
<td>${item.totalPrice} ${orderData.currency}</td>
</tr>
`
        )
        .join('');

    const itemsListText =
      orderData.items
        .map(
          (item) =>
            `- ${item.quantity}x ${item.jacketName} (${item.color}, ${item.size}) - ${item.totalPrice} ${orderData.currency}`
        )
        .join('\n');

    const emailSubject =
      `[MAISON DES PYRÉNÉES] Nouvelle Commande ${orderData.id} - ${orderData.clientName}`;

    const emailTextContent = `
MAISON DES PYRÉNÉES - NOUVELLE COMMANDE

Référence : ${orderData.id}
Date : ${orderData.formattedDate}
Type : ${orderData.orderTypeLabel || 'Commande Directe'}

CLIENT
Nom : ${orderData.clientName}
E-mail : ${orderData.clientEmail}
Téléphone : ${orderData.clientPhone || 'Non renseigné'}
Remarques : ${orderData.clientNotes || 'Aucune'}

ARTICLES
${itemsListText}

TOTAL : ${orderData.totalPrice} ${orderData.currency}
`;

    const emailHtmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${emailSubject}</title>
</head>
<body>
<h2>Nouvelle commande</h2>

<p><strong>Référence :</strong> ${orderData.id}</p>
<p><strong>Date :</strong> ${orderData.formattedDate}</p>

<h3>Client</h3>
<p><strong>Nom :</strong> ${orderData.clientName}</p>
<p><strong>Email :</strong> ${orderData.clientEmail}</p>
<p><strong>Téléphone :</strong> ${orderData.clientPhone || 'Non renseigné'}</p>
<p><strong>Remarques :</strong> ${orderData.clientNotes || 'Aucune'}</p>

<h3>Articles</h3>

<table border="1" cellpadding="8" cellspacing="0">
<thead>
<tr>
<th>Article</th>
<th>Couleur</th>
<th>Taille</th>
<th>Qté</th>
<th>Prix</th>
<th>Total</th>
</tr>
</thead>
<tbody>
${itemsListHtml}
</tbody>
</table>

<h3>
Total : ${orderData.totalPrice} ${orderData.currency}
</h3>

</body>
</html>
`;

    if (!resendApiKey) {
      console.warn(
        'RESEND_API_KEY non configuré.'
      );

      return {
        sent: false,
        message:
          'RESEND_API_KEY non configuré sur Vercel.',
      };
    }

    try {
      const fromEmail =
        process.env.EMAIL_FROM ||
        'Maison des Pyrénées <onboarding@resend.dev>';

      const response = await fetch(
        'https://api.resend.com/emails',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,
            'Content-Type':
              'application/json',
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

      if (response.ok) {
        console.log(
          `[EMAIL SUCCESS] ${orderData.id}`
        );

        return { sent: true };
      }

      const errorText =
        await response.text();

      console.error(
        '[RESEND ERROR]',
        response.status,
        errorText
      );

      return {
        sent: false,
        message:
          `Erreur Resend (${response.status})`,
      };
    } catch (error: any) {
      console.error(
        '[EMAIL ERROR]',
        error
      );

      return {
        sent: false,
        message:
          error?.message ||
          "Erreur lors de l'envoi de l'email.",
      };
    }
  };


export const sendOrdersReportEmail = async (params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ sent: boolean; message?: string }> => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return { sent: false, message: 'RESEND_API_KEY non configuré sur Vercel.' };
  const fromEmail = process.env.EMAIL_FROM || 'Maison des Pyrénées <onboarding@resend.dev>';
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [params.to], subject: params.subject, html: params.html, text: params.text }),
    });
    if (response.ok) return { sent: true };
    return { sent: false, message: `Erreur Resend (${response.status})` };
  } catch (error: any) {
    return { sent: false, message: error?.message || "Erreur lors de l'envoi du rapport." };
  }
};
