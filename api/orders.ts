import {
  getProductsFromDB,
  getOrdersFromDB,
  saveOrdersToDB,
  sendOrderEmailNotification,
} from './_helpers.js';

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message:
        'Méthode non autorisée. Utilisez POST.',
    });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body || {};

    const {
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      orderType,
      items,
    } = body;

    // ============================================================
    // VALIDATION CLIENT
    // ============================================================

    if (
      !clientName ||
      !String(clientName).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Le nom du client est obligatoire.',
      });
    }

    if (
      !clientEmail ||
      !String(clientEmail).trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "L'adresse e-mail du client est obligatoire.",
      });
    }

    const requestedItems = Array.isArray(items) ? items : [];

    // Une réservation atelier peut être créée sans article : le formulaire
    // ne demande alors que les coordonnées et les demandes particulières.
    if (
      orderType !== 'essayage' &&
      requestedItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'La commande doit contenir au moins un article.',
      });
    }

    // ============================================================
    // RÉCUPÉRATION DES PRODUITS OFFICIELS
    // ============================================================

    const officialProducts =
      await getProductsFromDB();

    if (
      orderType !== 'essayage' &&
      (!Array.isArray(officialProducts) ||
      officialProducts.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Aucun produit disponible.',
      });
    }

    // ============================================================
    // VALIDATION + CALCUL SERVEUR
    // ============================================================

    let primaryCurrency = '€';

    const validatedItems: any[] = [];

    for (
      let index = 0;
      index < requestedItems.length;
      index++
    ) {
      const item = requestedItems[index];

      if (
        !item ||
        !item.jacketId
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Article ${index + 1} invalide.`,
        });
      }

      const dbJacket =
        officialProducts.find(
          (product: any) =>
            product.id === item.jacketId
        );

      if (!dbJacket) {
        return res.status(400).json({
          success: false,
          message:
            `Produit introuvable : ${item.jacketId}`,
        });
      }

      if (dbJacket.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message:
            `Le produit "${dbJacket.name}" n'est plus disponible.`,
        });
      }

      const officialUnitPrice =
        Number(dbJacket.price);

      if (
        !Number.isFinite(officialUnitPrice) ||
        officialUnitPrice < 0
      ) {
        return res.status(500).json({
          success: false,
          message:
            `Prix invalide pour le produit "${dbJacket.name}".`,
        });
      }

      const quantity =
        Math.floor(Number(item.quantity));

      if (
        !Number.isFinite(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            'La quantité demandée est invalide.',
        });
      }

      if (dbJacket.currency) {
        primaryCurrency =
          dbJacket.currency;
      }

      const totalPrice =
        officialUnitPrice * quantity;

      validatedItems.push({
        id:
          item.id ||
          `line-${Date.now()}-${index}`,
        jacketId: dbJacket.id,
        jacketName: dbJacket.name,
        color: item.color || 'Standard',
        size: item.size || 'M',
        quantity,
        unitPrice: officialUnitPrice,
        totalPrice,
      });
    }

    // ============================================================
    // TOTAL SERVEUR
    // ============================================================

    const computedTotalOrderPrice =
      validatedItems.reduce(
        (
          total: number,
          item: any
        ) =>
          total +
          item.totalPrice,
        0
      );

    const totalQuantity =
      validatedItems.reduce(
        (
          total: number,
          item: any
        ) =>
          total +
          item.quantity,
        0
      );

    // ============================================================
    // CRÉATION COMMANDE
    // ============================================================

    const now = new Date();

    const formattedDate =
      `${now.toLocaleDateString(
        'fr-FR'
      )} à ${now.toLocaleTimeString(
        'fr-FR',
        {
          hour: '2-digit',
          minute: '2-digit',
        }
      )}`;

    const orderRef =
      `MDP-${now.getFullYear()}-${String(
        now.getTime()
      ).slice(-6)}`;

    const typeLabels: Record<
      string,
      string
    > = {
      commander:
        'Commande Directe & Expédition',

      essayage:
        'Réservation Atelier & Essayage',

      sur_mesure:
        'Commande Sur-Mesure Artisanale',
    };

    const orderTypeLabel =
      typeLabels[orderType] ||
      'Commande Directe';

    const createdOrder = {
      id: orderRef,

      date: formattedDate,

      timestamp:
        now.getTime(),

      clientName:
        String(clientName).trim(),

      clientEmail:
        String(clientEmail).trim(),

      clientPhone:
        String(
          clientPhone || ''
        ).trim(),

      clientNotes:
        String(
          clientNotes || ''
        ).trim(),

      orderType:
        orderType ||
        'commander',

      orderTypeLabel,

      items:
        validatedItems,

      totalQuantity,

      totalPrice:
        computedTotalOrderPrice,

      currency:
        primaryCurrency,

      status:
        'Demande',

      recipientEmail:
        process.env.ADMIN_EMAIL ||
        '',

      generatedEmail: {
        subject:
          `[MAISON DES PYRÉNÉES] Nouvelle Commande ${orderRef} - ${String(clientName).trim()}`,

        body:
          `Réf: ${orderRef}\n` +
          `Client: ${String(clientName).trim()} (${String(clientEmail).trim()})\n` +
          `Total: ${computedTotalOrderPrice} ${primaryCurrency}\n` +
          `Articles: ${validatedItems.length > 0
            ? validatedItems
                .map(
                  (item) =>
                    `${item.quantity}x ${item.jacketName} (${item.color}, ${item.size})`
                )
                .join(', ')
            : 'Aucun — demande de rendez-vous atelier'}`,
      },
    };

    // ============================================================
    // ENREGISTREMENT
    // ============================================================

    const existingOrders =
      await getOrdersFromDB();

    const updatedOrders = [
      createdOrder,
      ...existingOrders,
    ];

    await saveOrdersToDB(
      updatedOrders
    );

    // ============================================================
    // EMAIL
    // ============================================================

    const emailResult =
      await sendOrderEmailNotification({
        id: orderRef,
        clientName:
          createdOrder.clientName,
        clientEmail:
          createdOrder.clientEmail,
        clientPhone:
          createdOrder.clientPhone,
        clientNotes:
          createdOrder.clientNotes,
        orderTypeLabel:
          createdOrder.orderTypeLabel,
        items:
          createdOrder.items,
        totalPrice:
          createdOrder.totalPrice,
        currency:
          createdOrder.currency,
        formattedDate,
      });

    return res.status(200).json({
      success: true,
      order: createdOrder,
      emailSent:
        emailResult.sent,
      message:
        'Commande enregistrée et transmise à l’atelier avec succès.',
    });
  } catch (error: any) {
    console.error(
      'Order Handler Error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Erreur lors du traitement de la commande.',
    });
  }
}
