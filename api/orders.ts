import { sendOrderEmailNotification } from './_helpers';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientNotes,
      orderType,
      items,
      totalPrice,
      currency = '€',
    } = body;

    if (!clientName || !clientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et l\'adresse e-mail du client sont obligatoires.',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La commande doit contenir au moins un article.',
      });
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const orderRef = `MDP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const typeLabels: Record<string, string> = {
      commander: 'Commande Directe & Expédition',
      essayage: 'Réservation Atelier & Essayage',
      sur_mesure: 'Commande Sur-Mesure Artisanale',
    };

    const orderTypeLabel = typeLabels[orderType] || 'Commande Directe';

    const validatedItems = items.map((item: any, idx: number) => ({
      id: item.id || `line-${Date.now()}-${idx}`,
      jacketId: item.jacketId || 'unknown',
      jacketName: item.jacketName || 'Veste des Pyrénées',
      color: item.color || 'Standard',
      size: item.size || 'M',
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      unitPrice: Number(item.unitPrice) || 0,
      totalPrice: (Number(item.unitPrice) || 0) * Math.max(1, parseInt(item.quantity, 10) || 1),
    }));

    const computedTotal = validatedItems.reduce((acc: number, it: any) => acc + it.totalPrice, 0);

    const createdOrder = {
      id: orderRef,
      date: formattedDate,
      timestamp: now.getTime(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: (clientPhone || '').trim(),
      clientNotes: (clientNotes || '').trim(),
      orderType: orderType || 'commander',
      orderTypeLabel,
      items: validatedItems,
      totalQuantity: validatedItems.reduce((acc: number, it: any) => acc + it.quantity, 0),
      totalPrice: computedTotal || Number(totalPrice) || 0,
      currency: currency || '€',
      status: 'Commande passée',
    };

    // Send email notification to admin server-side
    const emailResult = await sendOrderEmailNotification({
      id: orderRef,
      clientName: createdOrder.clientName,
      clientEmail: createdOrder.clientEmail,
      clientPhone: createdOrder.clientPhone,
      clientNotes: createdOrder.clientNotes,
      orderTypeLabel: createdOrder.orderTypeLabel,
      items: createdOrder.items,
      totalPrice: createdOrder.totalPrice,
      currency: createdOrder.currency,
      formattedDate,
    });

    return res.status(200).json({
      success: true,
      order: createdOrder,
      emailSent: emailResult.sent,
      message: 'Commande enregistrée et transmise à l\'atelier avec succès.',
    });
  } catch (error: any) {
    console.error('Order Handler Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la commande.',
    });
  }
}
