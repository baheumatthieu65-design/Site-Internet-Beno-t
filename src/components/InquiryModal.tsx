import React, { useState } from 'react';
import { JacketModel } from '../types';
import { ShoppingBag, CheckCircle, Sparkles, Send, MapPin, X } from 'lucide-react';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  jackets: [JacketModel, JacketModel];
  preselectedJacketId?: string;
  preselectedColor?: string;
  preselectedSize?: string;
}

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  jackets,
  preselectedJacketId,
  preselectedColor,
  preselectedSize,
}) => {
  if (!isOpen) return null;

  const initialJacket =
    jackets.find((j) => j.id === preselectedJacketId) || jackets[0];

  const [selectedJacket, setSelectedJacket] = useState<JacketModel>(initialJacket);
  const [color, setColor] = useState<string>(
    preselectedColor || initialJacket.colors[0]?.name || ''
  );
  const [size, setSize] = useState<string>(
    preselectedSize || initialJacket.sizes[1] || 'M'
  );
  const [type, setType] = useState<'commander' | 'essayage'>('commander');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleJacketChange = (jacketId: string) => {
    const found = jackets.find((j) => j.id === jacketId) || jackets[0];
    setSelectedJacket(found);
    setColor(found.colors[0]?.name || '');
    setSize(found.sizes[1] || 'M');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#18201a] border border-[#3d4f40] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#e2d5c3]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#a3b1a5] hover:text-white bg-[#222c24] p-2 rounded-full border border-[#3b4b3e]"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            <div className="text-center max-w-md mx-auto mb-6">
              <span className="text-xs uppercase tracking-widest text-[#d4af37] font-serif font-bold">
                Maison des Pyrénées
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#f3ece0] mt-1">
                Réservation & Commande
              </h3>
              <p className="text-xs text-[#a3b0a2] mt-1">
                Chaque pièce est confectionnée en édition limitée dans notre atelier pyrénéen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('commander')}
                  className={`py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all ${
                    type === 'commander'
                      ? 'bg-[#d4af37] text-[#121613] border-[#d4af37]'
                      : 'bg-[#202a22] text-[#a3b1a5] border-[#374739]'
                  }`}
                >
                  🛒 Commande Directe
                </button>
                <button
                  type="button"
                  onClick={() => setType('essayage')}
                  className={`py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider font-semibold border transition-all ${
                    type === 'essayage'
                      ? 'bg-[#d4af37] text-[#121613] border-[#d4af37]'
                      : 'bg-[#202a22] text-[#a3b1a5] border-[#374739]'
                  }`}
                >
                  🏔️ Rendez-vous Essayage
                </button>
              </div>

              {/* Jacket Choice */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-2 font-medium">
                  Modèle sélectionné
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {jackets.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => handleJacketChange(j.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                        selectedJacket.id === j.id
                          ? 'border-[#d4af37] bg-[#222e25]'
                          : 'border-[#334235] bg-[#1a221b]'
                      }`}
                    >
                      <img src={j.heroImage} alt={j.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <span className="font-serif font-bold text-xs text-[#f3ece0] block truncate">
                          {j.name}
                        </span>
                        <span className="text-[10px] text-[#c2a26d] font-serif">
                          {j.price} {j.currency}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Size Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1.5 font-medium">
                    Couleur
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                  >
                    {selectedJacket.colors.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1.5 font-medium">
                    Taille
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                  >
                    {selectedJacket.sizes.map((sz) => (
                      <option key={sz} value={sz}>
                        Taille {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium">
                    Nom Complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean-Marc Dupré"
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium">
                  Téléphone (pour vous recontacter)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#a3b1a5] mb-1 font-medium">
                  Message ou demandes particulières
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajustement de manches, essayage dans les Pyrénées, question sur la laine..."
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] text-xs rounded-xl p-3 focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#b89f74] via-[#d4af37] to-[#8c6d3f] text-[#121613] font-serif font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-xl"
              >
                Envoyer la Demande ({selectedJacket.price} {selectedJacket.currency})
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-8 space-y-4 animate-fadeIn">
            <CheckCircle className="w-16 h-16 text-[#d4af37] mx-auto" />
            <h3 className="font-serif text-3xl font-light text-[#f3ece0]">
              Merci, {name} !
            </h3>
            <p className="text-sm text-[#b8c5ba] max-w-md mx-auto">
              Votre demande pour <strong className="text-[#d4af37]">{selectedJacket.name}</strong> (Taille {size}, Couleur {color}) a bien été enregistrée. Notre maître tailleur prendra contact avec vous sous 24 heures à l'adresse <strong className="text-white">{email}</strong>.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#28352b] border border-[#3f5243] text-[#e2d5c3] text-xs uppercase tracking-wider hover:bg-[#324236]"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
