import React, { useState, useEffect } from 'react';
import {
  CustomerOrder,
  getStoredOrders,
  saveOrders,
  getAvailableStatuses,
  addCustomStatus,
  removeCustomStatus,
  sortOrdersByStatusPriority,
} from '../utils/orderStorage';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Mail,
  User,
  Phone,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Tag,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface OrdersManagementViewProps {
  ordersEmail?: string;
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({
  ordersEmail = 'contact@maisondespyrenees.fr',
}) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [newStatusInput, setNewStatusInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [expandedOrderEmailId, setExpandedOrderEmailId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load orders & statuses on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const loadedOrders = getStoredOrders();
    const loadedStatuses = getAvailableStatuses();
    setOrders(loadedOrders);
    setAvailableStatuses(loadedStatuses);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Add new status
  const handleAddStatus = () => {
    if (!newStatusInput.trim()) return;
    const updated = addCustomStatus(newStatusInput.trim());
    setAvailableStatuses(updated);
    showToast(`Nouveau statut « ${newStatusInput.trim()} » ajouté avec succès au menu déroulant !`);
    setNewStatusInput('');
  };

  // Remove status
  const handleRemoveStatus = (st: string) => {
    if (st === 'Commande passée' || st === 'Prise en compte' || st === 'Commande annulée') {
      alert('Les statuts par défaut (Commande passée, Prise en compte, Commande annulée) ne peuvent pas être supprimés.');
      return;
    }
    const updated = removeCustomStatus(st);
    setAvailableStatuses(updated);
    showToast(`Statut « ${st} » supprimé du menu déroulant.`);
  };

  // Change individual order status
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setOrders(updated);
    saveOrders(updated);
    showToast(`Statut de la commande ${orderId} passé à : « ${newStatus} »`);
  };

  // Delete an order with 2-step interactive click (iframe safe)
  const handleDeleteOrder = (orderId: string) => {
    if (deletingOrderId !== orderId) {
      setDeletingOrderId(orderId);
      // Reset confirmation if not clicked within 5 seconds
      setTimeout(() => {
        setDeletingOrderId((prev) => (prev === orderId ? null : prev));
      }, 5000);
      return;
    }

    // Confirmed second click
    const updated = orders.filter((o) => o.id !== orderId);
    setOrders(updated);
    saveOrders(updated);
    setDeletingOrderId(null);
    showToast(`Commande ${orderId} supprimée définitivement de l'espace de réception.`);
  };

  // Copy email body
  const handleCopyEmail = (order: CustomerOrder) => {
    if (order.generatedEmail?.body) {
      navigator.clipboard.writeText(order.generatedEmail.body);
      setCopiedEmailId(order.id);
      setTimeout(() => setCopiedEmailId(null), 2000);
    }
  };

  // Filter & Sort Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.jacketName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusFilter === 'all' || o.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort orders with 'Commande passée' FIRST
  const sortedOrders = sortOrdersByStatusPriority(filteredOrders, availableStatuses);

  // Status color badge map
  const getStatusBadgeStyle = (st: string) => {
    switch (st) {
      case 'Commande passée':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 font-bold shadow-md';
      case 'Prise en compte':
        return 'bg-amber-950/80 text-amber-300 border-amber-600/80 font-semibold';
      case 'Commande annulée':
        return 'bg-red-950/80 text-red-300 border-red-800/80';
      default:
        return 'bg-[#263328] text-[#d4af37] border-[#d4af37]/60 font-medium';
    }
  };

  return (
    <div className="space-y-6 text-[#e2d5c3] animate-fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1c261e] border border-[#d4af37] text-[#d4af37] text-xs font-semibold shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#1a221c] border border-[#3b4b3e] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2d3a2f] pb-4">
          <div>
            <div className="flex items-center space-x-2.5 text-[#d4af37]">
              <ShoppingBag className="w-6 h-6" />
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#f3ece0]">
                Espace Réception des Commandes & Réservations
              </h3>
            </div>
            <p className="text-xs text-[#a3b1a5] mt-1">
              Consultez les commandes des clients, modifiez leur statut de traitement et accédez aux e-mails générés vers votre compte référent.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-[#121613] px-4 py-2.5 rounded-2xl border border-[#2e3b30]">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#a3b1a5] block">Total Commandes :</span>
              <strong className="text-lg font-mono text-[#d4af37] font-bold">{orders.length}</strong>
            </div>
            <div className="h-7 w-px bg-[#2e3b30]" />
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#a3b1a5] block">En attente / Passées :</span>
              <strong className="text-lg font-mono text-emerald-400 font-bold">
                {orders.filter((o) => o.status === 'Commande passée').length}
              </strong>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* ADD & MANAGE DROPDOWN STATUSES SECTION                            */}
        {/* ----------------------------------------------------------------- */}
        <div className="p-4 rounded-2xl bg-[#121613] border border-[#2e3c30] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-bold text-[#d4af37] font-serif flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Gestion des Options du Menu Déroulant des Statuts</span>
            </span>
            <span className="text-[11px] text-[#a3b1a5]">
              {availableStatuses.length} statuts configurés
            </span>
          </div>

          <p className="text-xs text-[#a3b1a5]">
            Ajoutez de nouvelles étapes ou états de traitement personnalisés (ex: <em>Expédiée</em>, <em>En confection atelier</em>, <em>Livrée</em>) qui apparaîtront immédiatement dans les menus déroulants de chaque commande.
          </p>

          {/* Status Pills List */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {availableStatuses.map((st) => (
              <span
                key={st}
                className={`text-xs px-3 py-1 rounded-xl border flex items-center space-x-1.5 ${getStatusBadgeStyle(
                  st
                )}`}
              >
                <span>{st}</span>
                {st !== 'Commande passée' && st !== 'Prise en compte' && st !== 'Commande annulée' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStatus(st)}
                    className="ml-1 text-red-300 hover:text-white transition-colors cursor-pointer"
                    title={`Supprimer le statut ${st}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Add New Status Form Input */}
          <div className="flex items-center space-x-2 pt-2 border-t border-[#253227]">
            <input
              type="text"
              value={newStatusInput}
              onChange={(e) => setNewStatusInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStatus();
                }
              }}
              placeholder="Nouveau statut personnalisable (ex: Expédiée, Livrée, En préparation...)"
              className="flex-1 bg-[#18201a] border border-[#38483b] text-xs text-white px-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
            />
            <button
              type="button"
              onClick={handleAddStatus}
              className="px-4 py-2.5 rounded-xl bg-[#28362b] border border-[#d4af37] text-[#d4af37] hover:bg-[#344638] text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter au Menu Déroulant</span>
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#7d8c7f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, ref, mail, veste..."
              className="w-full bg-[#121613] border border-[#334235] text-xs text-white pl-10 pr-3.5 py-2.5 rounded-xl outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-[#a3b1a5] whitespace-nowrap">Filtrer par statut :</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#121613] border border-[#38483b] text-xs text-[#f3ece0] px-3 py-2 rounded-xl outline-none focus:border-[#d4af37] cursor-pointer"
            >
              <option value="all">Tous les statuts ({orders.length})</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st} ({orders.filter((o) => o.status === st).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* ORDERS LIST CLASSIFIED BY STATUS (WITH 'Commande passée' FIRST)     */}
      {/* ----------------------------------------------------------------- */}
      {sortedOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#1a221c] border border-[#324234] space-y-3">
          <ShoppingBag className="w-12 h-12 text-[#a3b1a5] mx-auto opacity-50" />
          <h4 className="font-serif text-lg font-light text-[#f3ece0]">Aucune commande ne correspond à ces critères</h4>
          <p className="text-xs text-[#8e9f90]">
            Les nouvelles commandes passées sur le site s'afficheront automatiquement dans cet espace.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#a3b1a5] px-1">
            <span>
              Classement automatique : <strong className="text-[#d4af37]">« Commande passée » en premier</strong>, puis par priorité d'état et date.
            </span>
            <span>
              Affichage de <strong className="text-white">{sortedOrders.length}</strong> commande(s)
            </span>
          </div>

          {sortedOrders.map((order, index) => {
            const isEmailOpen = expandedOrderEmailId === order.id;

            return (
              <div
                key={order.id}
                className={`p-5 rounded-3xl bg-[#18201a] border transition-all space-y-4 shadow-xl ${
                  order.status === 'Commande passée'
                    ? 'border-[#d4af37]/60 ring-1 ring-[#d4af37]/30 bg-[#1a231c]'
                    : 'border-[#2d3a2f] hover:border-[#3d4f40]'
                }`}
              >
                {/* ORDER ROW HEADER */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#29362b] pb-3.5">
                  <div className="flex items-center space-x-3">
                    <span className="w-8 h-8 rounded-xl bg-[#232f25] border border-[#3c4e40] text-[#d4af37] font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="font-serif text-base sm:text-lg text-[#f3ece0]">{order.id}</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#253227] text-[#b89f74] border border-[#3c4e40] font-sans">
                          {order.orderTypeLabel}
                        </span>
                      </div>
                      <span className="text-xs text-[#a3b1a5] flex items-center space-x-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Passée le {order.date}</span>
                      </span>
                    </div>
                  </div>

                  {/* STATUS DROPDOWN & ACTIONS */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-[#a3b1a5] font-medium hidden sm:inline">État de traitement :</label>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className={`text-xs px-3.5 py-2 rounded-xl border outline-none font-bold cursor-pointer transition-colors ${getStatusBadgeStyle(
                          order.status
                        )}`}
                      >
                        {availableStatuses.map((st) => (
                          <option key={st} value={st} className="bg-[#121613] text-white font-normal">
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        deletingOrderId === order.id
                          ? 'bg-red-600 text-white animate-pulse border border-red-400 shadow-lg shadow-red-900/50'
                          : 'bg-red-950/50 text-red-300 hover:bg-red-900/80 hover:text-white border border-red-800/60'
                      }`}
                      title="Supprimer cette commande"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deletingOrderId === order.id ? 'Cliquer pour confirmer la suppression !' : 'Supprimer'}</span>
                    </button>
                  </div>
                </div>

                {/* CUSTOMER & ORDER DETAILS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* CLIENT INFO */}
                  <div className="lg:col-span-5 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-2.5">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#d4af37] font-serif block border-b border-[#222c24] pb-1.5">
                      Informations Client
                    </span>

                    <div className="space-y-1.5 text-xs text-[#e2d5c3]">
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span className="font-semibold">{order.clientName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-[#a3b1a5]" />
                        <a href={`mailto:${order.clientEmail}`} className="text-[#a3b1a5] hover:text-[#d4af37] underline">
                          {order.clientEmail}
                        </a>
                      </div>
                      {order.clientPhone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-[#a3b1a5]" />
                          <span>{order.clientPhone}</span>
                        </div>
                      )}
                      {order.clientNotes && (
                        <div className="pt-2 border-t border-[#222c24] text-[11px] text-[#a3b1a5] italic flex items-start space-x-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                          <span>"{order.clientNotes}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ORDER ITEMS TABLE */}
                  <div className="lg:col-span-7 p-4 rounded-2xl bg-[#111612] border border-[#273429] space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#222c24] pb-1.5">
                      <span className="text-xs uppercase tracking-widest font-bold text-[#d4af37] font-serif">
                        Détail des Articles ({order.totalQuantity} pièces)
                      </span>
                      <span className="font-serif text-sm font-bold text-[#f3ece0]">
                        Total : {order.totalPrice} {order.currency || '€'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {order.items.map((item, iIdx) => (
                        <div
                          key={item.id || iIdx}
                          className="p-2 rounded-xl bg-[#18201a] border border-[#28352b] flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <strong className="text-[#f3ece0] block truncate font-serif">{item.jacketName}</strong>
                            <span className="text-[11px] text-[#a3b1a5]">
                              Nuance : <strong className="text-white">{item.color}</strong> | Taille : <strong className="text-[#d4af37]">{item.size}</strong>
                            </span>
                          </div>
                          <div className="text-right pl-3 flex-shrink-0">
                            <span className="font-mono text-white font-bold block">
                              {item.quantity} × {item.unitPrice} € = {item.totalPrice} €
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* E-MAIL GENERATION PREVIEW DRAWER BUTTON */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedOrderEmailId(isEmailOpen ? null : order.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#212b23] hover:bg-[#2c3a2f] border border-[#3a4b3d] text-xs font-semibold text-[#d4af37] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-[#d4af37]" />
                      <span>Voir le contenu de l'e-mail généré au compte référent</span>
                    </span>
                    {isEmailOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isEmailOpen && order.generatedEmail && (
                    <div className="mt-2.5 p-4 rounded-2xl bg-[#0f1410] border border-[#314133] space-y-3 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#253227] pb-2 text-xs">
                        <div>
                          <span className="text-[10px] text-[#a3b1a5] uppercase block font-semibold">Sujet de l'E-mail :</span>
                          <strong className="text-[#f3ece0] font-serif">{order.generatedEmail.subject}</strong>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(order)}
                            className="px-3 py-1 rounded-lg bg-[#1f2a21] hover:bg-[#2a382d] border border-[#3b4c3e] text-xs text-[#d4af37] font-medium flex items-center space-x-1 cursor-pointer"
                          >
                            {copiedEmailId === order.id ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copier l'e-mail</span>
                              </>
                            )}
                          </button>
                          <a
                            href={`mailto:${order.recipientEmail}?subject=${encodeURIComponent(
                              order.generatedEmail.subject
                            )}&body=${encodeURIComponent(order.generatedEmail.body)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-lg bg-[#28362b] hover:bg-[#344638] border border-[#d4af37] text-xs text-[#d4af37] font-bold flex items-center space-x-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Ouvrir dans client e-mail</span>
                          </a>
                        </div>
                      </div>

                      <pre className="text-xs font-mono text-[#d1c5b4] bg-[#151c16] p-3.5 rounded-xl overflow-x-auto whitespace-pre-wrap border border-[#232f25]">
                        {order.generatedEmail.body}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
