import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JacketModel } from '../types';
import { createOrder, OrderItem } from '../utils/orderStorage';
import {
  ShoppingBag,
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Mail,
  Phone,
  User,
  MessageSquare,
  Package,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export interface OrderLineItem {
  id: string;
  jacketId: string;
  color: string;
  size: string;
  quantity: number;
}

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  jackets: JacketModel[];
  preselectedJacketId?: string;
  preselectedColor?: string;
  preselectedSize?: string;
  ordersEmail?: string;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  jackets,
  preselectedJacketId,
  preselectedColor,
  preselectedSize,
  ordersEmail = 'contact@maisondespyrenees.fr',
}) => {
  const validJackets = Array.isArray(jackets) ? jackets.filter((j) => j.isAvailable !== false) : [];
  const defaultJacket = validJackets.find((j) => j.id === preselectedJacketId) || validJackets[0];

  const createInitialLine = (): OrderLineItem => ({
    id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    jacketId: defaultJacket?.id || '',
    color: preselectedColor || defaultJacket?.colors[0]?.name || 'Standard',
    size: preselectedSize || defaultJacket?.sizes[1] || defaultJacket?.sizes[0] || 'M',
    quantity: 1,
  });

  const [orderLines, setOrderLines] = useState<OrderLineItem[]>([createInitialLine()]);
  const [orderType, setOrderType] = useState<'commander' | 'sur_mesure' | 'essayage'>('commander');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial = createInitialLine();
      setOrderLines([initial]);
      setSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen, preselectedJacketId, preselectedColor, preselectedSize]);

  const handleAddLine = () => {
    if (validJackets.length === 0) return;
    const targetJacket = validJackets[orderLines.length % validJackets.length] || validJackets[0];
    const newLine: OrderLineItem = {
      id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      jacketId: targetJacket.id,
      color: targetJacket.colors[0]?.name || 'Standard',
      size: targetJacket.sizes[1] || targetJacket.sizes[0] || 'M',
      quantity: 1,
    };
    setOrderLines([...orderLines, newLine]);
  };

  const handleRemoveLine = (lineId: string) => {
    if (orderLines.length <= 1) return;
    setOrderLines(orderLines.filter((line) => line.id !== lineId));
  };

  const handleUpdateLineJacket = (lineId: string, newJacketId: string) => {
    const jacket = validJackets.find((j) => j.id === newJacketId) || validJackets[0];
    setOrderLines(
      orderLines.map((line) => {
        if (line.id === lineId) {
          return {
            ...line,
            jacketId: newJacketId,
            color: jacket?.colors[0]?.name || 'Standard',
            size: jacket?.sizes[1] || jacket?.sizes[0] || 'M',
          };
        }
        return line;
      })
    );
  };

  const handleUpdateLineField = (lineId: string, field: 'color' | 'size' | 'quantity', value: any) => {
    setOrderLines(
      orderLines.map((line) => {
        if (line.id === lineId) {
          if (field === 'quantity') {
            const parsed = Math.max(1, parseInt(value, 10) || 1);
            return { ...line, quantity: parsed };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const getJacketForLine = (jacketId: string): JacketModel | undefined => {
    return validJackets.find((j) => j.id === jacketId) || validJackets[0];
  };

  const totalQuantity = orderLines.reduce((sum, line) => sum + (line.quantity || 1), 0);

  const totalPrice = orderLines.reduce((sum, line) => {
    const jacket = getJacketForLine(line.jacketId);
    const unitPrice = jacket ? jacket.price : 0;
    return sum + unitPrice * (line.quantity || 1);
  }, 0);

  const primaryCurrency = validJackets[0]?.currency || '€';

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const itemsPayload: OrderItem[] = orderType === 'essayage'
      ? []
      : orderLines.map((line) => {
          const j = getJacketForLine(line.jacketId);
          const unitP = j ? j.price : 0;
          return {
            id: line.id,
            jacketId: line.jacketId,
            jacketName: j ? j.name : 'Veste des Pyrénées',
            color: line.color,
            size: line.size,
            quantity: line.quantity || 1,
            unitPrice: unitP,
            totalPrice: unitP * (line.quantity || 1),
          };
        });

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName || 'Client Anonyme',
          clientEmail: clientEmail || 'client@example.com',
          clientPhone: clientPhone || '',
          clientNotes: clientNotes || '',
          orderType,
          items: itemsPayload,
          totalPrice: orderType === 'essayage' ? 0 : totalPrice,
          currency: primaryCurrency,
        }),
      });

      const data = await response.json();
      if (!response.ok || data?.success !== true) {
        throw new Error(data?.message || 'La commande n’a pas pu être enregistrée sur le serveur.');
      }
      const ref = data.order?.id || `MDP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderReference(ref);

      // Save locally to reflect in Admin Order Management View instantly
      createOrder({
        id: ref,
        clientName: clientName || 'Client Anonyme',
        clientEmail: clientEmail || 'client@example.com',
        clientPhone: clientPhone || '',
        clientNotes: clientNotes || '',
        orderType,
        items: itemsPayload,
        totalPrice: orderType === 'essayage' ? 0 : totalPrice,
        currency: primaryCurrency,
        recipientEmail: ordersEmail || 'contact@maisondespyrenees.fr',
      });
      window.dispatchEvent(new CustomEvent('pyrenees-order-created', { detail: { orderId: ref } }));
    } catch (err) {
      console.error('Server order submission failed, falling back to local creation:', err);
      const ref = `MDP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderReference(ref);
      createOrder({
        id: ref,
        clientName: clientName || 'Client Anonyme',
        clientEmail: clientEmail || 'client@example.com',
        clientPhone: clientPhone || '',
        clientNotes: clientNotes || '',
        orderType,
        items: itemsPayload,
        totalPrice: orderType === 'essayage' ? 0 : totalPrice,
        currency: primaryCurrency,
        recipientEmail: ordersEmail || 'contact@maisondespyrenees.fr',
      });
      window.dispatchEvent(new CustomEvent('pyrenees-order-created', { detail: { orderId: ref, localOnly: true } }));
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  return createPortal((

    <div
      id="order-modal-overlay"
      className="fixed inset-0 z-[40000] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        id="order-modal-container"
        className="relative w-full max-w-4xl bg-[#161d18] border border-[#3e4f41] rounded-3xl p-5 sm:p-8 shadow-2xl text-[#e2d5c3] max-h-[92vh] flex flex-col overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#a3b1a5] hover:text-white bg-[#222d24] p-2 rounded-full border border-[#3c4e40] transition-colors cursor-pointer z-20"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="text-center max-w-xl mx-auto mb-5 flex-shrink-0">
              <span className="text-[11px] uppercase tracking-widest text-[#d4af37] font-serif font-bold">
                Maison des Pyrénées • Confection Artisanale
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#f3ece0] mt-1">
                Bon de Commande & Réservation
              </h3>
              <p className="text-xs text-[#a3b0a2] mt-1">
                {orderType === 'essayage'
                  ? 'Laissez vos coordonnées et vos demandes particulières pour organiser votre rendez-vous à l’atelier.'
                  : 'Ajoutez un ou plusieurs modèles, sélectionnez vos tailles et précisez les quantités souhaitées.'}
              </p>
            </div>

            <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto pr-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderType('commander')}
                  className={`py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all flex items-center justify-center space-x-2.5 cursor-pointer ${
                    orderType === 'commander'
                      ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-lg font-bold'
                      : 'bg-[#1e2720] text-[#a3b1a5] border-[#374739] hover:bg-[#253228]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>1. Commande Directe & Expédition</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('essayage')}
                  className={`py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all flex items-center justify-center space-x-2.5 cursor-pointer ${
                    orderType === 'essayage'
                      ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-lg font-bold'
                      : 'bg-[#1e2720] text-[#a3b1a5] border-[#374739] hover:bg-[#253228]'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>2. Réservation & Rendez-vous Atelier</span>
                </button>
              </div>

              {orderType !== 'essayage' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#121713] border border-[#344437] space-y-4">
                <div className="flex items-center justify-between border-b border-[#29362b] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs uppercase tracking-widest font-bold text-[#f3ece0] font-serif">
                      Articles Commandés ({orderLines.length} {orderLines.length > 1 ? 'pièces distinctes' : 'pièce'})
                    </span>
                  </div>
                  <span className="text-[11px] text-[#a3b1a5]">
                    Quantité totale : <strong className="text-[#d4af37] font-mono">{totalQuantity}</strong>
                  </span>
                </div>

                <div className="space-y-3.5">
                  {orderLines.map((line, index) => {
                    const currentJacket = getJacketForLine(line.jacketId);
                    const lineSubtotal = (currentJacket?.price || 0) * (line.quantity || 1);

                    return (
                      <div
                        key={line.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#19211a] border border-[#324335] hover:border-[#4b614f] transition-all space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between border-b border-[#273429] pb-2.5">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-6 h-6 rounded-lg bg-[#243026] text-[#d4af37] text-xs font-serif font-bold flex items-center justify-center border border-[#3d4f40]">
                              #{index + 1}
                            </span>
                            <span className="font-serif text-base sm:text-lg font-normal text-[#f3ece0]">
                              {currentJacket?.name || 'Veste des Pyrénées'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-semibold text-[#d4af37]">
                              {currentJacket?.price} {currentJacket?.currency || primaryCurrency}
                            </span>
                            {orderLines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(line.id)}
                                className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          <div className="md:col-span-5 flex items-center space-x-3">
                            <div className="w-11 h-11 rounded-xl bg-[#0e130f] border border-[#38483b] overflow-hidden flex-shrink-0 relative">
                              {currentJacket?.heroImage ? (
                                <img
                                  src={currentJacket.heroImage}
                                  alt={currentJacket.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-[#a3b1a5]">
                                  N°{index + 1}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <label className="block text-[10px] uppercase text-[#a3b1a5] font-semibold mb-1">
                                Modèle :
                              </label>
                              <select
                                value={line.jacketId}
                                onChange={(e) => handleUpdateLineJacket(line.id, e.target.value)}
                                className="w-full h-10 bg-[#121613] border border-[#3d4f40] text-xs text-[#f3ece0] rounded-xl px-3 py-2 focus:border-[#d4af37] outline-none font-medium truncate cursor-pointer"
                              >
                                {validJackets.map((j) => (
                                  <option key={j.id} value={j.id}>
                                    {j.name} ({j.price} {j.currency})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="md:col-span-4 grid grid-cols-2 gap-2 items-center">
                            <div className="min-w-0">
                              <label className="block text-[10px] uppercase text-[#a3b1a5] font-semibold mb-1">
                                Nuance :
                              </label>
                              <select
                                value={line.color}
                                onChange={(e) => handleUpdateLineField(line.id, 'color', e.target.value)}
                                className="w-full h-10 bg-[#121613] border border-[#3d4f40] text-xs text-[#f3ece0] rounded-xl px-2.5 py-2 focus:border-[#d4af37] outline-none cursor-pointer truncate"
                              >
                                {currentJacket?.colors?.map((c) => (
                                  <option key={c.name} value={c.name}>
                                    {c.name}
                                  </option>
                                )) || <option value="Standard">Standard</option>}
                              </select>
                            </div>

                            <div className="min-w-0">
                              <label className="block text-[10px] uppercase text-[#a3b1a5] font-semibold mb-1">
                                Taille :
                              </label>
                              <select
                                value={line.size}
                                onChange={(e) => handleUpdateLineField(line.id, 'size', e.target.value)}
                                className="w-full h-10 bg-[#121613] border border-[#3d4f40] text-xs text-[#f3ece0] rounded-xl px-2.5 py-2 focus:border-[#d4af37] outline-none font-bold cursor-pointer"
                              >
                                {currentJacket?.sizes?.map((sz) => (
                                  <option key={sz} value={sz}>
                                    {sz.startsWith('Taille') ? sz : `Taille ${sz}`}
                                  </option>
                                )) || (
                                  <>
                                    <option value="S">Taille S</option>
                                    <option value="M">Taille M</option>
                                    <option value="L">Taille L</option>
                                    <option value="XL">Taille XL</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>

                          <div className="md:col-span-3 flex flex-col justify-center">
                            <label className="block text-[10px] uppercase text-[#a3b1a5] font-semibold mb-1">
                              Quantité & Total :
                            </label>
                            <div className="flex items-center justify-between space-x-2">
                              <div className="h-10 flex items-center space-x-1 bg-[#121613] border border-[#3d4f40] rounded-xl px-1.5 py-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLineField(line.id, 'quantity', line.quantity - 1)}
                                  disabled={line.quantity <= 1}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[#a3b1a5] hover:text-white hover:bg-[#253228] disabled:opacity-30 cursor-pointer font-bold"
                                >
                                  -
                                </button>
                                <span className="w-6 text-center font-mono text-xs font-bold text-[#f3ece0]">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateLineField(line.id, 'quantity', line.quantity + 1)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-[#a3b1a5] hover:text-white hover:bg-[#253228] cursor-pointer font-bold"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right min-w-[70px]">
                                <span className="font-serif text-sm font-bold text-[#d4af37] block">
                                  {lineSubtotal} {currentJacket?.currency || primaryCurrency}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#29362b]">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#232f25] border border-[#d4af37]/70 text-[#d4af37] hover:bg-[#2d3d30] text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#d4af37]" />
                    <span>Ajouter un article ou une autre taille (+)</span>
                  </button>

                  <div className="flex items-center space-x-3 text-sm bg-[#18201a] px-4 py-2 rounded-xl border border-[#2b382d]">
                    <span className="text-xs uppercase tracking-wider text-[#a3b1a5]">Total Commande :</span>
                    <span className="font-serif text-lg font-bold text-[#f3ece0] font-mono">
                      {totalPrice} {primaryCurrency}
                    </span>
                  </div>
                </div>
              </div>
              )}

              <div className="space-y-4">
                <span className="text-xs uppercase tracking-widest font-bold text-[#d4af37] font-serif block">
                  {orderType === 'essayage' ? 'Coordonnées du demandeur' : 'Coordonnées de Livraison & Contact'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Nom & Prénom *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Jean-Marc Dupré"
                      className="w-full bg-[#1b231d] border border-[#38483b] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Adresse Email *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="votre@email.fr"
                      className="w-full bg-[#1b231d] border border-[#38483b] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{orderType === 'essayage' ? 'Téléphone *' : 'Téléphone (pour le suivi de commande)'}</span>
                    </label>
                    <input
                      type="tel"
                      required={orderType === 'essayage'}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full bg-[#1b231d] border border-[#38483b] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{orderType === 'essayage' ? 'Demandes particulières' : 'Demandes particulières ou mensurations'}</span>
                    </label>
                    <textarea
                      rows={1}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Ajustements de manches, essayage dans les Pyrénées, broderie..."
                      className="w-full bg-[#1b231d] border border-[#38483b] text-[#f3ece0] text-xs rounded-xl p-2.5 focus:border-[#d4af37] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#b89f74] via-[#d4af37] to-[#8c6d3f] text-[#121613] font-serif font-bold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all shadow-xl flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Traitement et envoi sécurisé...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {orderType === 'essayage'
                          ? 'Confirmer et Envoyer la Demande de Rendez-vous'
                          : `Confirmer et Envoyer la Commande (${totalQuantity} ${totalQuantity > 1 ? 'articles' : 'article'} • ${totalPrice} ${primaryCurrency})`}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-[#7d8d7f] text-center mt-2">
                  Validation automatique sécurisée et notification instantanée transmise à l'atelier.
                </p>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-6 space-y-5 animate-fadeIn max-h-[85vh] overflow-y-auto pr-1">
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-14 h-14 text-[#d4af37] mx-auto animate-bounce" />
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-serif font-bold">
                Réf : {orderReference}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[#f3ece0] font-light">
                Merci {clientName || 'cher client'} !
              </h3>
              <p className="text-xs text-[#a3b1a5] max-w-md mx-auto">
                {orderType === 'essayage'
                  ? 'Votre demande de rendez-vous a été enregistrée et transmise à notre atelier pyrénéen par notification automatique.'
                  : 'Votre commande a été enregistrée avec succès et transmise à notre atelier pyrénéen par notification automatique.'}
              </p>
            </div>

            {orderType !== 'essayage' && (
              <div className="p-4 rounded-2xl bg-[#111612] border border-[#303d32] space-y-3">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#d4af37] block border-b border-[#243026] pb-2">
                Récapitulatif de votre sélection ({orderLines.length} {orderLines.length > 1 ? 'lignes' : 'ligne'}) :
              </span>

              <div className="space-y-2">
                {orderLines.map((line, idx) => {
                  const j = getJacketForLine(line.jacketId);
                  const sub = (j?.price || 0) * (line.quantity || 1);
                  return (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl bg-[#18201a] border border-[#29362b] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <span className="text-[#d4af37] font-mono text-[11px] font-bold">#{idx + 1}</span>
                        <div className="min-w-0">
                          <strong className="text-[#f3ece0] block truncate font-serif">
                            {j?.name || 'Veste des Pyrénées'}
                          </strong>
                          <span className="text-[11px] text-[#a3b1a5]">
                            Couleur : <strong className="text-white">{line.color}</strong> | Taille : <strong className="text-[#d4af37]">{line.size}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right pl-3 flex-shrink-0">
                        <span className="font-mono text-white font-bold block">
                          {line.quantity} × {j?.price} € = {sub} €
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#243026] flex items-center justify-between text-sm">
                <span className="text-xs uppercase tracking-widest text-[#a3b1a5] font-semibold">
                  Montant Total de la Commande :
                </span>
                <span className="font-serif text-lg font-bold text-[#d4af37] font-mono">
                  {totalPrice} {primaryCurrency}
                </span>
              </div>
            </div>
            )}

            <div className="p-3.5 rounded-xl bg-[#18231b] border border-[#3b4e3e] text-xs text-[#b8c5ba] space-y-1">
              <p>
                {orderType === 'essayage'
                  ? 'Notre équipe vous recontactera pour confirmer le rendez-vous et organiser votre accueil à l’atelier.'
                  : "Un récapitulatif détaillé a été transmis à l’atelier. Notre équipe vérifiera vos options sous 24h."}
              </p>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-8 py-3 rounded-xl bg-[#28352b] border border-[#435747] text-[#e2d5c3] text-xs uppercase font-bold tracking-wider hover:bg-[#344638] transition-colors cursor-pointer"
              >
                Fermer ce bon de commande
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ), document.body);
};
