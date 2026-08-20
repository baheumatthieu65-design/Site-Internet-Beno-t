export interface OrderItem {
  id: string;
  jacketId: string;
  jacketName: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CustomerOrder {
  id: string; // e.g. MDP-2026-8492
  date: string; // ISO string or formatted string
  timestamp: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
  orderType: 'commander' | 'sur_mesure' | 'essayage';
  orderTypeLabel: string;
  items: OrderItem[];
  totalQuantity: number;
  totalPrice: number;
  currency: string;
  status: string; // e.g., 'Commande passée', 'Prise en compte', 'Commande annulée', etc.
  recipientEmail: string; // referent email address (internal)
  customerDataProtectedAt?: string;
  clientNameEncrypted?: string;
  clientEmailEncrypted?: string;
  clientPhoneEncrypted?: string;
  clientNotesEncrypted?: string;
  generatedEmail: {
    subject: string;
    recipient: string;
    body: string;
    sentAt: string;
  };
}

export const DEFAULT_ORDER_STATUSES: string[] = [
  'Demande',
  'Prise en compte',
  'Commande passée',
  'Commande annulée',
];

const ORDERS_STORAGE_KEY = 'pyrenees_orders_history_v1';
const STATUSES_STORAGE_KEY = 'pyrenees_order_custom_statuses_v1';

// Initial mock orders to demonstrate functionality if empty
const INITIAL_DEMO_ORDERS: CustomerOrder[] = [
  {
    id: 'MDP-2026-4812',
    date: '14/08/2026 à 14:15',
    timestamp: Date.now() - 3600000 * 2,
    clientName: 'Jean-Marc Dupré',
    clientEmail: 'jeanmarc.dupre@example.com',
    clientPhone: '+33 6 18 24 39 01',
    clientNotes: 'Ajustement de longueur de manche souhaité (+2cm). Livraison sous 10 jours.',
    orderType: 'commander',
    orderTypeLabel: 'Commande Directe & Expédition',
    items: [
      {
        id: 'line-demo-1',
        jacketId: 'j1',
        jacketName: 'La Haute-Montagne N°1',
        color: 'Sapin des Cimes',
        size: 'L',
        quantity: 1,
        unitPrice: 420,
        totalPrice: 420,
      },
    ],
    totalQuantity: 1,
    totalPrice: 420,
    currency: '€',
    status: 'Commande passée',
    recipientEmail: 'contact@maisondespyrenees.fr',
    generatedEmail: {
      subject: '[MAISON DES PYRÉNÉES] Nouvelle Commande MDP-2026-4812 - Jean-Marc Dupré',
      recipient: 'contact@maisondespyrenees.fr',
      body: `Bonjour,\n\nUne nouvelle commande a été passée sur la boutique Maison des Pyrénées.\n\nRéférence : MDP-2026-4812\nDate : 14/08/2026 à 14:15\nClient : Jean-Marc Dupré (jeanmarc.dupre@example.com / +33 6 18 24 39 01)\nType : Commande Directe & Expédition\n\nDétail des articles :\n- 1x La Haute-Montagne N°1 (Couleur: Sapin des Cimes, Taille: L) - 420 €\n\nMontant Total : 420 €\n\nRemarques du client : "Ajustement de longueur de manche souhaité (+2cm). Livraison sous 10 jours."`,
      sentAt: '14/08/2026 à 14:15',
    },
  },
  {
    id: 'MDP-2026-3109',
    date: '13/08/2026 à 10:45',
    timestamp: Date.now() - 3600000 * 28,
    clientName: 'Camille de Saint-Lary',
    clientEmail: 'camille.saintlary@example.fr',
    clientPhone: '+33 6 88 12 45 90',
    clientNotes: 'Prise de rendez-vous pour un essayage sur-mesure au village.',
    orderType: 'essayage',
    orderTypeLabel: 'Réservation Atelier & Essayage',
    items: [
      {
        id: 'line-demo-2',
        jacketId: 'j2',
        jacketName: 'L’Élégance Champêtre N°2',
        color: 'Tweed Brun Miel',
        size: 'M',
        quantity: 2,
        unitPrice: 380,
        totalPrice: 760,
      },
    ],
    totalQuantity: 2,
    totalPrice: 760,
    currency: '€',
    status: 'Prise en compte',
    recipientEmail: 'contact@maisondespyrenees.fr',
    generatedEmail: {
      subject: '[MAISON DES PYRÉNÉES] Nouvelle Commande MDP-2026-3109 - Camille de Saint-Lary',
      recipient: 'contact@maisondespyrenees.fr',
      body: `Bonjour,\n\nUne nouvelle réservation atelier a été passée sur la boutique Maison des Pyrénées.\n\nRéférence : MDP-2026-3109\nDate : 13/08/2026 à 10:45\nClient : Camille de Saint-Lary (camille.saintlary@example.fr / +33 6 88 12 45 90)\nType : Réservation Atelier & Essayage\n\nDétail des articles :\n- 2x L’Élégance Champêtre N°2 (Couleur: Tweed Brun Miel, Taille: M) - 760 €\n\nMontant Total : 760 €\n\nRemarques : "Prise de rendez-vous pour un essayage sur-mesure au village."`,
      sentAt: '13/08/2026 à 10:45',
    },
  },
];

export const getStoredOrders = (): CustomerOrder[] => {
  const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse orders:', e);
    }
  }
  // Default initial set
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
  return INITIAL_DEMO_ORDERS;
};

export const saveOrders = (orders: CustomerOrder[]) => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

export const getAvailableStatuses = (): string[] => {
  const saved = localStorage.getItem(STATUSES_STORAGE_KEY);
  let custom: string[] = [];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) custom = parsed.map(String).filter(Boolean);
    } catch (e) {
      console.error('Failed to parse custom statuses:', e);
    }
  }
  const merged = [...DEFAULT_ORDER_STATUSES, ...custom.filter((status) => !DEFAULT_ORDER_STATUSES.includes(status))];
  return merged;
};

export const saveAvailableStatuses = (statuses: string[]) => {
  localStorage.setItem(STATUSES_STORAGE_KEY, JSON.stringify(statuses));
};

export const addCustomStatus = (newStatus: string): string[] => {
  const current = getAvailableStatuses();
  const trimmed = newStatus.trim();
  if (!trimmed || current.includes(trimmed)) return current;
  const updated = [...current, trimmed];
  saveAvailableStatuses(updated);
  return updated;
};

export const removeCustomStatus = (statusToRemove: string): string[] => {
  const current = getAvailableStatuses();
  if (current.length <= 1) return current;
  const updated = current.filter((s) => s !== statusToRemove);
  saveAvailableStatuses(updated);
  return updated;
};

export const createOrder = (orderData: {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
  orderType: 'commander' | 'sur_mesure' | 'essayage';
  items: OrderItem[];
  totalPrice: number;
  currency: string;
  recipientEmail: string;
}): CustomerOrder => {
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  
  const typeLabels: Record<string, string> = {
    commander: 'Commande Directe & Expédition',
    essayage: 'Réservation Atelier & Essayage',
    sur_mesure: 'Commande Sur-Mesure Artisanale',
  };

  const typeLabel = typeLabels[orderData.orderType] || 'Commande Directe';
  const totalQty = orderData.items.reduce((sum, i) => sum + i.quantity, 0);

  const itemsFormattedText = orderData.items
    .map(
      (item) =>
        `- ${item.quantity}x ${item.jacketName} (Couleur: ${item.color}, Taille: ${item.size}) - ${item.totalPrice} ${orderData.currency}`
    )
    .join('\n');

  const generatedEmailBody = `Bonjour,

Une nouvelle commande a été passée sur la boutique Maison des Pyrénées.

Référence : ${orderData.id}
Date : ${formattedDate}
Client : ${orderData.clientName} (${orderData.clientEmail}${orderData.clientPhone ? ' / ' + orderData.clientPhone : ''})
Type de commande : ${typeLabel}

Détail des articles commandés :
${itemsFormattedText}

Montant Total : ${orderData.totalPrice} ${orderData.currency}
Nombre d'articles : ${totalQty}

${orderData.clientNotes ? `Remarques et demandes du client :\n"${orderData.clientNotes}"` : 'Aucune remarque particulière.'}

--
Notification automatique générée pour l'adresse référente de gestion des commandes : ${orderData.recipientEmail}`;

  const generatedEmailObj = {
    subject: `[MAISON DES PYRÉNÉES] Nouvelle Commande ${orderData.id} - ${orderData.clientName}`,
    recipient: orderData.recipientEmail,
    body: generatedEmailBody,
    sentAt: formattedDate,
  };

  const newOrder: CustomerOrder = {
    id: orderData.id,
    date: formattedDate,
    timestamp: now.getTime(),
    clientName: orderData.clientName,
    clientEmail: orderData.clientEmail,
    clientPhone: orderData.clientPhone,
    clientNotes: orderData.clientNotes,
    orderType: orderData.orderType,
    orderTypeLabel: typeLabel,
    items: orderData.items,
    totalQuantity: totalQty,
    totalPrice: orderData.totalPrice,
    currency: orderData.currency,
    status: 'Demande', // Toute nouvelle demande arrive d'abord dans l'état Demande
    recipientEmail: orderData.recipientEmail,
    generatedEmail: generatedEmailObj,
  };

  const existing = getStoredOrders();
  const updated = [newOrder, ...existing];
  saveOrders(updated);

  return newOrder;
};

// Sort orders strictly according to status priority, with 'Commande passée' FIRST!
export const sortOrdersByStatusPriority = (
  orders: CustomerOrder[],
  statusList: string[]
): CustomerOrder[] => {
  // Ensure 'Commande passée' is first in the list
  const preferredOrder = ['Commande passée', ...statusList.filter((s) => s !== 'Commande passée')];

  return [...orders].sort((a, b) => {
    const indexA = preferredOrder.indexOf(a.status);
    const indexB = preferredOrder.indexOf(b.status);

    const posA = indexA === -1 ? 999 : indexA;
    const posB = indexB === -1 ? 999 : indexB;

    if (posA !== posB) {
      return posA - posB;
    }

    // Secondary sort: Newest timestamp first
    return b.timestamp - a.timestamp;
  });
};
