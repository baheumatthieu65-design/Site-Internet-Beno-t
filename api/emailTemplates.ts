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
      return logoText.trim().replace(/\s*\n\s*/g, ' ');
    }

    return String(config?.brandName || 'Maison Mailhagut').trim() || 'Maison Mailhagut';
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
    const safeImageUrl = item.imageUrl
      ? escapeHtml(item.imageUrl)
      : '';

    const imageHtml = safeImageUrl
      ? `<img src="${safeImageUrl}" alt="${escapeHtml(item.jacketName)}" width="52" height="52" style="display:block;width:52px;height:52px;object-fit:cover;border:0;border-radius:5px;" />`
      : `<div style="width:52px;height:52px;line-height:52px;text-align:center;background:#f2f2f2;color:#777;border-radius:5px;">—</div>`;

    return `<tr>
      <td style="padding:4px 6px;border:1px solid #d9d9d9;text-align:center;width:64px;height:60px;vertical-align:middle;">${imageHtml}</td>
      <td style="padding:4px 7px;border:1px solid #d9d9d9;text-align:center;vertical-align:middle;">${item.quantity}</td>
      <td style="padding:4px 7px;border:1px solid #d9d9d9;vertical-align:middle;">${escapeHtml(item.jacketName)}</td>
      <td style="padding:4px 7px;border:1px solid #d9d9d9;vertical-align:middle;">${escapeHtml(item.color)}</td>
      <td style="padding:4px 7px;border:1px solid #d9d9d9;vertical-align:middle;">${escapeHtml(item.size)}</td>
      <td style="padding:4px 7px;border:1px solid #d9d9d9;text-align:right;white-space:nowrap;vertical-align:middle;">${item.totalPrice} ${escapeHtml(currency)}</td>
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

const renderTemplate = (
  template: EmailTemplate,
  values: Record<string, string>
): { subject: string; body: string } => {
  const replace = (input: string) =>
    input.replace(
      /{{\s*([a-zA-Z0-9_]+)\s*}}/g,
      (_, token: string) => values[token] ?? ''
    );

  return {
    subject: replace(template.subject),
    body: template.body,
  };
};

const renderHtmlBody = (
  body: string,
  values: Record<string, string>,
  articlesTable: string
): string => {
  const articleToken = /{{\s*articles\s*}}/g;
  const parts = body.split(articleToken);

  return parts.map((part, index) => {
    const replaced = part.replace(
      /{{\s*([a-zA-Z0-9_]+)\s*}}/g,
      (_, token: string) => values[token] ?? ''
    );

    const html = replaced.replace(/\r?\n/g, '<br>');

    if (index === 0) {
      return html.replace(/(?:<br>\s*)+$/g, '');
    }

    return `<div style="margin:0;padding:0;">${html.replace(/^(?:<br>\s*)+/g, '')}</div>`;
  }).join(articlesTable);
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

  if (!adminEmail) {
    return { sent: false, message: 'Adresse de réception des commandes non configurée.' };
  }

  if (!resendApiKey) {
    return { sent: false, message: 'RESEND_API_KEY non configuré sur Vercel.' };
  }

  const templates = await getEmailTemplates();
  const brandName = await getBrandName();

  const appointment =
    orderData.orderTypeLabel === 'Réservation Atelier & Essayage' ||
    orderData.items.length === 0;

  const type = appointment
    ? 'Demande de rendez-vous atelier'
    : orderData.orderTypeLabel || 'Commande';

  const values = {
    marque: escapeHtml(brandName),
    reference: escapeHtml(orderData.id),
    date: escapeHtml(orderData.formattedDate),
    civilite: escapeHtml(orderData.salutation || 'Monsieur'),
    nom: escapeHtml(orderData.clientName),
    email: escapeHtml(orderData.clientEmail),
    telephone: escapeHtml(orderData.clientPhone || 'Non renseigné'),
    remarques: escapeHtml(orderData.clientNotes || 'Aucune'),
    type: escapeHtml(type),
    total: escapeHtml(String(orderData.totalPrice)),
    devise: escapeHtml(orderData.currency),
  };

  const selectedTemplate = appointment
    ? templates.appointment
    : templates.order;

  const rendered = renderTemplate(selectedTemplate, values);
  const articlesTable = buildArticlesTable(orderData.items, orderData.currency);

  const htmlBody =
    `<div style="font-family:Arial,sans-serif;line-height:1.45;margin:0;padding:0;">` +
    renderHtmlBody(rendered.body, values, articlesTable) +
    `</div>`;

  const textBody = rendered.body.replace(
    /{{\s*articles\s*}}/g,
    orderData.items.length
      ? orderData.items.map(
          (item) =>
            `- ${item.quantity}x ${item.jacketName} (${item.color}, ${item.size}) — ${item.totalPrice} ${orderData.currency}`
        ).join('\n')
      : 'Aucun article — demande de rendez-vous atelier'
  );

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
        text: textBody,
      }),
    });

    if (response.ok) {
      return {
        sent: true,
        subject: rendered.subject,
        body: rendered.body,
      };
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
