import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { OrdersManagementView } from './OrdersManagementView';
import { EmailTemplatesEditor } from './EmailTemplatesEditor';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordersEmail?: string;
  reportEmail?: string;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  ordersEmail = 'baheu.matthieu65@gmail.com',
  reportEmail = 'baheu.matthieu65@gmail.com',
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="orders-modal-overlay"
      className="fixed inset-0 z-[2147483646] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div
        id="orders-modal-box"
        className="relative z-[2147483647] w-full max-w-6xl max-h-[92vh] bg-[#141a15] border border-[#3b4a3c] rounded-3xl shadow-2xl text-[#e2d5c3] flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 bg-[#1a221c] border-b border-[#2e3b30] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#253227] text-[#d4af37] border border-[#3c4e40]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#f3ece0]">
                Espace Réception des Commandes & Réservations
              </h3>
              <p className="text-xs text-[#a3b1a5]">
                Suivi des commandes, réservations et modèles d’e-mails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#9ea99f] hover:text-white hover:bg-[#253026] transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <EmailTemplatesEditor />
          <OrdersManagementView ordersEmail={ordersEmail} reportEmail={reportEmail} />
        </div>

        <div className="px-6 py-3 bg-[#111612] border-t border-[#2a362c] flex items-center justify-between text-xs text-[#a3b1a5] flex-shrink-0">
          <span>Maison Mailhagut — Espace de réception des commandes et réservations</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#243126] text-[#f3ece0] hover:bg-[#304133] transition-colors font-semibold cursor-pointer"
          >
            Fermer l'espace
          </button>
        </div>
      </div>
    </div>
  );
};
