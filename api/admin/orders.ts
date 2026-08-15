import {
  parseCookies,
  verifySessionToken,
  getOrdersFromDB,
  saveOrdersToDB,
} from '../_helpers';

const parseBody = (body: any) => {
  if (!body) return {};

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }

  return body;
};

export default async function handler(req: any, res: any) {
  // ============================================================
  // AUTHENTIFICATION ADMIN
  // ============================================================

  const cookies = parseCookies(req.headers?.cookie);
  const sessionToken = cookies.admin_session;
  const auth = verifySessionToken(sessionToken);

  if (!auth.valid) {
    return res.status(401).json({
      success: false,
      message: 'Accès refusé. Session administrateur non valide ou expirée.',
    });
  }

  try {
    // ============================================================
    // GET — LISTE DES COMMANDES
    // ============================================================

    if (req.method === 'GET') {
      const orders = await getOrdersFromDB();

      return res.status(200).json({
        success: true,
        orders,
      });
    }

    // ============================================================
    // DELETE — SUPPRESSION D'UNE COMMANDE
    // ============================================================

    if (req.method === 'DELETE') {
      const body = parseBody(req.body);

      const orderId =
        req.query?.id ||
        body.id ||
        body.orderId;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "L'identifiant de la commande est obligatoire.",
        });
      }

      const orders = await getOrdersFromDB();

      const exists = orders.some(
        (order: any) => order.id === orderId
      );

      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée.',
        });
      }

      const updatedOrders = orders.filter(
        (order: any) => order.id !== orderId
      );

      await saveOrdersToDB(updatedOrders);

      return res.status(200).json({
        success: true,
        orders: updatedOrders,
        message: 'Commande supprimée avec succès.',
      });
    }

    // ============================================================
    // PUT — MODIFICATION DU STATUT
    // ============================================================

    if (req.method === 'PUT') {
      const body = parseBody(req.body);

      const orderId = body.orderId || body.id;
      const status = body.status;

      if (!orderId || !status) {
        return res.status(400).json({
          success: false,
          message:
            "L'identifiant et le statut de la commande sont obligatoires.",
        });
      }

      const orders = await getOrdersFromDB();

      const exists = orders.some(
        (order: any) => order.id === orderId
      );

      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Commande non trouvée.',
        });
      }

      const updatedOrders = orders.map((order: any) =>
        order.id === orderId
          ? {
              ...order,
              status: String(status).trim(),
            }
          : order
      );

      await saveOrdersToDB(updatedOrders);

      return res.status(200).json({
        success: true,
        orders: updatedOrders,
        message: 'Statut de la commande mis à jour avec succès.',
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Méthode non autorisée.',
    });
  } catch (error: any) {
    console.error('Admin Orders Handler Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la gestion des commandes.',
    });
  }
}