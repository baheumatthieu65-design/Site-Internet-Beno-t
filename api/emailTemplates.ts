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
  if (!redis) return 'Maison des Pyrénées';

  try {
    const config = await redis.get<any>('mdp_site_config');
    return (
      String(config?.brandName || 'Maison des Pyrénées').trim() ||
      'Maison des Pyrénées'
    );
  } catch {
    return 'Maison des Pyrénées';
  }
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

  const articles = orderData.items.length
    ? orderData.items
        .map(
          (item) =>
            `- ${item.quantity}x ${item.jacketName} (${item.color}, ${item.size}) — ${item.totalPrice} ${orderData.currency}`
        )
        .join('\n')
    : 'Aucun — demande de rendez-vous atelier';

  const rendered = renderEmailTemplate(
    appointment ? templates.appointment : templates.order,
    {
      marque: brandName,
      reference: orderData.id,
      date: orderData.formattedDate,
      civilite: orderData.salutation || 'Autre',
      nom: orderData.clientName,
      email: orderData.clientEmail,
      telephone: orderData.clientPhone || 'Non renseigné',
      remarques: orderData.clientNotes || 'Aucune',
      type,
      articles,
      total: String(orderData.totalPrice),
      devise: orderData.currency,
    }
  );

  const htmlBody = `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.55">${escapeHtml(rendered.body)}</div>`;
  const fromEmail =
    process.env.EMAIL_FROM || 'Maison des Pyrénées <onboarding@resend.dev>';

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
        text: rendered.body,
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
