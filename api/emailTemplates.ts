import { getOrderNotificationEmail, getRedisClient } from './_helpers.js';

export type EmailTemplateType = 'order' | 'appointment';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailTemplates {
  order: EmailTemplate;
  appointment: EmailTemplate;
}

const KEY = 'mdp_email_templates_v1';

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplates = {
  order: {
    subject: '[{{marque}}] Nouvelle commande — {{reference}} — {{nom}}',
    body: `Bonjour,

Une nouvelle commande a été reçue sur le site {{marque}}.

Référence : {{reference}}
Date : {{date}}
Civilité : {{civilite}}
Nom : {{nom}}
E-mail : {{email}}
Téléphone : {{telephone}}

Articles :
{{articles}}

Total : {{total}} {{devise}}

Remarques : {{remarques}}`,
  },
  appointment: {
    subject: '[{{marque}}] Demande de Rendez-vous — {{nom}} — {{date}}',
    body: `Demande de Rendez-vous :

Le {{date}} {{civilite}} {{nom}} a demandé un rendez-vous afin de visiter votre atelier.
Il/elle est disponible au Téléphone : {{telephone}} et à l’adresse suivante : {{email}}

{{civilite}} {{nom}} a des remarques particulières :

Remarques : {{remarques}}`,
  },
};

export const getEmailTemplates = async (): Promise<EmailTemplates> => {
  const redis = getRedisClient();
  if (!redis) return DEFAULT_EMAIL_TEMPLATES;

  try {
    const saved = await redis.get<Partial<EmailTemplates>>(KEY);
    return {
      order: { ...DEFAULT_EMAIL_TEMPLATES.order, ...(saved?.order || {}) },
      appointment: {
        ...DEFAULT_EMAIL_TEMPLATES.appointment,
        ...(saved?.appointment || {}),
      },
    };
  } catch (error) {
    console.error('Erreur lecture templates email:', error);
    return DEFAULT_EMAIL_TEMPLATES;
  }
};

export const saveEmailTemplates = async (
  templates: EmailTemplates
): Promise<void> => {
  const redis = getRedisClient();
  if (!redis) return;
  await redis.set(KEY, templates);
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const getBrandName = async (): Promise<string> => {
  const redis = getRedisClient();
  if (!redis) return 'Maison Mailhagut';

  try {
    const config = await redis.get<any>('mdp_site_config');
    const logoText = config?.logos?.boutique?.text;
    if (typeof logoText === 'string' && logoText.trim()) {
      // The primary boutique logo text is the source of truth for emails.
      return logoText.trim().replace(/\s*\n\s*/g, ' ');
    }

    // Backward-compatible fallback for older saved configurations.
    return (
      String(config?.brandName || 'Maison Mailhagut').trim() ||
      'Maison Mailhagut'
    );
  } catch {
    return 'Maison Mailhagut';
  }
};

const buildArticlesTable = (
  items: Array<{
    jacketName: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
  }>,
  currency: string
): string => {
  if (!items.length) {
    return '<span style="font-family:Arial,sans-serif;font-size:13px;">Aucun article.</span>';
  }

  const rows = items.map((item) => {
    const image = item.imageUrl
      ? `<img src="${escapeHtml(item.imageUrl)}" alt="" width="48" height="48" style="display:block;width:48px;height:48px;object-fit:cover;border-radius:5px;border:1px solid #d9d9d9;" />`
      : '<div style="width:48px;height:48px;line-height:48px;text-align:center;background:#f2f2f2;color:#777;border-radius:5px;">—</div>';

    return `
      <tr>
        <td style="padding:4px 6px;border:1px solid #d9d9d9;text-align:center;width:62px;height:56px;">${image}</td>
        <td style="padding:4px 7px;border:1px solid #d9d9d9;text-align:center;">${item.quantity}</td>
        <td style="padding:4px 7px;border:1px solid #d9d9d9;">${escapeHtml(item.jacketName)}</td>
        <td style="padding:4px 7px;border:1px solid #d9d9d9;">${escapeHtml(item.color)}</td>
        <td style="padding:4px 7px;border:1px solid #d9d9d9;">${escapeHtml(item.size)}</td>
        <td style="padding:4px 7px;border:1px solid #d9d9d9;text-align:right;white-space:nowrap;">${item.totalPrice} ${escapeHtml(currency)}</td>
      </tr>`;
  }).join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;border-spacing:0;margin:0;padding:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.2;">
    <thead>
      <tr>
        <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:center;">Image de l'article</th>
        <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:center;">Nombre</th>
        <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">Nom de l'article</th>
        <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">Couleur</th>
        <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:left;">Taille</th>
        <th style="padding:5px 6px;border:1px solid #d9d9d9;background:#f4f4f4;text-align:right;">Coût</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
};

export const renderEmailTemplate = (
  template: EmailTemplate,
  values: Record<string, string>
): EmailTemplate => {
  const replaceTokens = (input: string) =>
    input.replace(
      /{{\s*([a-zA-Z0-9_]+)\s*}}/g,
      (_, token: string) => values[token] ?? ''
    );

  return {
    subject: replaceTokens(template.subject),
    body: replaceTokens(template.body),
  };
};

export const sendTemplatedOrderEmail = async (orderData: {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientNotes?: string;
  salutation?: string;
  orderTypeLabel?: string;
  items: Array<{
    jacketName: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
  }>;
  totalPrice: number;
  currency: string;
  formattedDate: string;
}): Promise<{ sent: boolean; message?: string; subject?: string; body?: string }> => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = await getOrderNotificationEmail();

  if (!adminEmail) return { sent: false, message: 'Adresse de réception des commandes non configurée.' };
  if (!resendApiKey) return { sent: false, message: 'RESEND_API_KEY non configuré sur Vercel.' };

  const templates = await getEmailTemplates();
  const brandName = await getBrandName();

  const appointment =
    orderData.orderTypeLabel === 'Réservation Atelier & Essayage' ||
    orderData.items.length === 0;

  const type = appointment
    ? 'Demande de rendez-vous atelier'
    : orderData.orderTypeLabel || 'Commande';

  const articles = buildArticlesTable(orderData.items, orderData.currency);

  const rendered = renderEmailTemplate(
    appointment ? templates.appointment : templates.order,
    {
      marque: escapeHtml(brandName),
      reference: escapeHtml(orderData.id),
      date: escapeHtml(orderData.formattedDate),
      civilite: escapeHtml(orderData.salutation || 'Monsieur'),
      nom: escapeHtml(orderData.clientName),
      email: escapeHtml(orderData.clientEmail),
      telephone: escapeHtml(orderData.clientPhone || 'Non renseigné'),
      remarques: escapeHtml(orderData.clientNotes || 'Aucune'),
      type: escapeHtml(type),
      articles,
      total: escapeHtml(String(orderData.totalPrice)),
      devise: escapeHtml(orderData.currency),
    }
  );

  // Admin-authored template text is converted to readable HTML. The
  // {{articles}} token is intentionally replaced with the generated table.
  const ARTICLE_TOKEN = /{{\\s*articles\\s*}}/g;
  const articleTable = articles;
  const htmlBodyContent = rendered.body
    .split(ARTICLE_TOKEN)
    .map((part: string, index: number) => {
      const compact = part
        .replace(/(?:\\r?\\n|<br\\s*\\/?>)+\\s*$/gi, '')
        .replace(/^\\s*(?:<br\\s*\\/?>|\\r?\\n)+/gi, '');
      return index === 0
        ? compact.replace(/\\r?\\n/g, '<br>')
        : `<div style="margin:0;padding:0;">${compact.replace(/\\r?\\n/g, '<br>')}</div>`;
    })
    .join(articleTable);

  const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.45;margin:0;padding:0;">${htmlBodyContent}</div>`;
  const fromEmail =
    process.env.EMAIL_FROM || 'Maison Mailhagut <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [adminEmail],
        subject: rendered.subject,
        html: htmlBody,
        text: rendered.body.replace(/{{\s*articles\s*}}/g, 'Voir le tableau des articles.').replace(/<[^>]+>/g, ''),
      }),
    });

    if (response.ok) {
      return { sent: true, subject: rendered.subject, body: rendered.body };
    }

    const errorText = await response.text().catch(() => '');
    console.error('[RESEND ERROR]', response.status, errorText);

    return {
      sent: false,
      message: `Erreur Resend (${response.status})`,
      subject: rendered.subject,
      body: rendered.body,
    };
  } catch (error: any) {
    return {
      sent: false,
      message: error?.message || "Erreur lors de l'envoi de l'email.",
      subject: rendered.subject,
      body: rendered.body,
    };
  }
};
