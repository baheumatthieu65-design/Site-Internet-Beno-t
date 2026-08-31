import {
  getProductsFromDB,
  getOrdersFromDB,
  saveOrdersToDB,
  getOrderNotificationEmail,
} from './_helpers.js';
import { sendTemplatedOrderEmail } from './emailTemplates.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { clientName, salutation, clientEmail, clientPhone, clientNotes, orderType, items } = body;

    if (!clientName || !String(clientName).trim()) {
      return res.status(400).json({ success: false, message: 'Le nom du client est obligatoire.' });
    }
    if (!clientEmail || !String(clientEmail).trim()) {
      return res.status(400).json({ success: false, message: "L'adresse e-mail du client est obligatoire." });
    }

    const requestedItems = Array.isArray(items) ? items : [];

    if (orderType !== 'essayage' && requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'La commande doit contenir au moins un article.' });
    }

    const officialProducts = await getProductsFromDB();

    if (orderType !== 'essayage' && (!Array.isArray(officialProducts) || officialProducts.length === 0)) {
      return res.status(400).json({ success: false, message: 'Aucun produit disponible.' });
    }

    let primaryCurrency = '€';
    const validatedItems: any[] = [];

    for (let index = 0; index < requestedItems.length; index++) {
      const item = requestedItems[index];

      if (!item || !item.jacketId) {
        return res.status(400).json({ success: false, message: `Article ${index + 1} invalide.` });
      }

      const dbJacket = officialProducts.find((product: any) => product.id === item.jacketId);

      if (!dbJacket) {
        return res.status(400).json({ success: false, message: `Produit introuvable : ${item.jacketId}` });
      }

      if (dbJacket.isAvailable === false) {
        return res.status(400).json({ success: false, message: `Le produit "${dbJacket.name}" n'est plus disponible.` });
      }

      const officialUnitPrice = Number(dbJacket.price);

      if (!Number.isFinite(officialUnitPrice) || officialUnitPrice < 0) {
        return res.status(500).json({ success: false, message: `Prix invalide pour le produit "${dbJacket.name}".` });
      }

      const quantity = Math.floor(Number(item.quantity));

      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ success: false, message: 'La quantité demandée est invalide.' });
      }

      if (dbJacket.currency) primaryCurrency = dbJacket.currency;

      validatedItems.push({
        id: item.id || `line-${Date.now()}-${index}`,
        jacketId: dbJacket.id,
        jacketName: dbJacket.name,
        color: item.color || 'Standard',
        size: item.size || 'M',
        quantity,
        unitPrice: officialUnitPrice,
        totalPrice: officialUnitPrice * quantity,
        imageUrl: dbJacket.heroImage || dbJacket.imageUrl || dbJacket.image || '',
      });
    }

    const computedTotalOrderPrice = validatedItems.reduce((total: number, item: any) => total + item.totalPrice, 0);
    const totalQuantity = validatedItems.reduce((total: number, item: any) => total + item.quantity, 0);
    const now = new Date();

    const formattedDate =
      `${now.toLocaleDateString('fr-FR')} à ` +
      `${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const orderRef = `MDP-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;

    const typeLabels: Record<string, string> = {
      commander: 'Commande Directe & Expédition',
      essayage: 'Réservation Atelier & Essayage',
      sur_mesure: 'Commande Sur-Mesure Artisanale',
    };

    const orderTypeLabel = typeLabels[orderType] || 'Commande Directe';

    const cleanSalutation =
      ['Monsieur', 'Madame', 'Autre'].includes(String(salutation))
        ? String(salutation)
        : 'Monsieur';

    const cleanName = String(clientName).trim();
    const cleanEmail = String(clientEmail).trim();
    const cleanPhone = String(clientPhone || '').trim();
    const cleanNotes = String(clientNotes || '').trim();

    const createdOrder = {
      id: orderRef,
      date: formattedDate,
      timestamp: now.getTime(),
      clientName: cleanName,
      salutation: cleanSalutation,
      clientEmail: cleanEmail,
      clientPhone: cleanPhone,
      clientNotes: cleanNotes,
      orderType: orderType || 'commander',
      orderTypeLabel,
      items: validatedItems,
      totalQuantity,
      totalPrice: computedTotalOrderPrice,
      currency: primaryCurrency,
      status: 'Demande',
      recipientEmail: await getOrderNotificationEmail(),
      generatedEmail: { subject: '', body: '' },
    };

    const existingOrders = await getOrdersFromDB();

    await saveOrdersToDB([createdOrder, ...existingOrders]);

    const emailResult = await sendTemplatedOrderEmail({
      id: orderRef,
      clientName: cleanName,
      clientEmail: cleanEmail,
      clientPhone: cleanPhone,
      clientNotes: cleanNotes,
      salutation: cleanSalutation,
      orderTypeLabel,
      items: validatedItems,
      totalPrice: computedTotalOrderPrice,
      currency: primaryCurrency,
      formattedDate,
    });

    createdOrder.generatedEmail = {
      subject: emailResult.subject || '',
      body: emailResult.body || '',
    };

    await saveOrdersToDB([createdOrder, ...existingOrders]);

    return res.status(200).json({
      success: true,
      order: createdOrder,
      emailSent: emailResult.sent,
      emailError: emailResult.sent ? undefined : emailResult.message,
      message: emailResult.sent
        ? 'Demande enregistrée et e-mail transmis à l’atelier avec succès.'
        : 'Demande enregistrée, mais l’e-mail n’a pas pu être envoyé.',
    });
  } catch (error: any) {
    console.error('Order Handler Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la demande.',
    });
  }
}
