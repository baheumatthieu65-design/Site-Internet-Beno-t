import type { VercelRequest, VercelResponse } from '@vercel/node';
import login from '../../server/admin/login.js';
import logout from '../../server/admin/logout.js';
import resetPassword from '../../server/admin/reset-password.js';
import verify from '../../server/admin/verify.js';
import orders from '../../server/admin/orders.js';
import products from '../../server/admin/products.js';
import ordersReport from '../../server/admin/orders-report.js';
import orderEmail from '../../server/admin/order-email.js';
import emailTemplates from '../../server/admin/email-templates.js';

const handlers: Record<string, (req: any, res: any) => unknown | Promise<unknown>> = {
  login,
  logout,
  'reset-password': resetPassword,
  verify,
  orders,
  products,
  'orders-report': ordersReport,
  'order-email': orderEmail,
  'email-templates': emailTemplates,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawAction = req.query?.action;
  const action = Array.isArray(rawAction)
    ? rawAction[0]
    : String(rawAction || '').trim();

  const selected = handlers[action];

  if (!selected) {
    return res.status(404).json({
      success: false,
      message: 'Route administrateur introuvable.',
    });
  }

  try {
    return await selected(req, res);
  } catch (error) {
    console.error(`Admin route error (${action}):`, error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur.',
      });
    }
  }
}
