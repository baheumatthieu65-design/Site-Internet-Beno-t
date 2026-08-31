import {
  checkResetCode,
  parseCookies,
  verifySessionToken,
} from '../../api/_helpers.js';
import {
  getEmailTemplates,
  saveEmailTemplates,
  EmailTemplates,
} from '../../api/emailTemplates.js';

function json(res: any, status: number, data: unknown) {
  return res
    .status(status)
    .setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    .json(data);
}

export default async function handler(req: any, res: any) {
  const session = verifySessionToken(
    parseCookies(req.headers.cookie).admin_session
  );

  if (!session.valid) {
    return json(res, 401, {
      success: false,
      message: 'Session administrateur invalide.',
    });
  }

  if (req.method === 'GET') {
    return json(res, 200, {
      success: true,
      templates: await getEmailTemplates(),
    });
  }

  if (req.method !== 'PUT') {
    return json(res, 405, {
      success: false,
      message: 'Méthode non autorisée.',
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const code = String(body.code || '').trim();
    const templates = body.templates as EmailTemplates;

    if (!code || !checkResetCode(code)) {
      return json(res, 401, {
        success: false,
        message: 'Code administrateur incorrect.',
      });
    }

    if (
      !templates ||
      !templates.order ||
      !templates.appointment ||
      typeof templates.order.subject !== 'string' ||
      typeof templates.order.body !== 'string' ||
      typeof templates.appointment.subject !== 'string' ||
      typeof templates.appointment.body !== 'string'
    ) {
      return json(res, 400, {
        success: false,
        message: 'Templates email invalides.',
      });
    }

    await saveEmailTemplates(templates);

    return json(res, 200, {
      success: true,
      templates: await getEmailTemplates(),
      message: 'Templates email enregistrés.',
    });
  } catch (error) {
    console.error('Modification templates email:', error);
    return json(res, 500, {
      success: false,
      message: 'Erreur lors de l’enregistrement des templates.',
    });
  }
}
