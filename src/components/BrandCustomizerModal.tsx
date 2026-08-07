import React, { useState } from 'react';
import { BrandConfig, JacketModel } from '../types';
import { Sliders, Save, RotateCcw, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandData: BrandConfig;
  onSave: (newData: BrandConfig) => void;
  onReset: () => void;
}

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({
  isOpen,
  onClose,
  brandData,
  onSave,
  onReset,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<BrandConfig>(JSON.parse(JSON.stringify(brandData)));
  const [activeTab, setActiveTab] = useState<'brand' | 'j1' | 'j2'>('brand');

  const handleChangeBrand = (field: keyof BrandConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeJacket = (jacketIdx: 0 | 1, field: keyof JacketModel, value: any) => {
    setFormData((prev) => {
      const jackets = [...prev.jackets] as [JacketModel, JacketModel];
      jackets[jacketIdx] = { ...jackets[jacketIdx], [field]: value };
      return { ...prev, jackets };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#18201a] border border-[#3d4f40] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#e2d5c3] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#2e3b30]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#28352a] text-[#d4af37] border border-[#3f5242]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#f3ece0] font-semibold">
                Personnalisateur de Marque & Contenu
              </h3>
              <p className="text-xs text-[#a3b1a5]">
                Modifiez facilement votre nom de marque, logo, vos 2 vestes, prix et textes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#a3b1a5] hover:text-white bg-[#222c24] p-2 rounded-full border border-[#3b4b3e]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization Navigation Tabs */}
        <div className="flex space-x-2 my-4 border-b border-[#2e3b30] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'brand'
                ? 'bg-[#d4af37] text-[#121613]'
                : 'bg-[#202a22] text-[#a3b1a5] hover:text-white'
            }`}
          >
            🏛️ Marque & Terroir
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('j1')}
            className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'j1'
                ? 'bg-[#d4af37] text-[#121613]'
                : 'bg-[#202a22] text-[#a3b1a5] hover:text-white'
            }`}
          >
            🧥 Veste N°1 ({formData.jackets[0].name})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('j2')}
            className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'j2'
                ? 'bg-[#d4af37] text-[#121613]'
                : 'bg-[#202a22] text-[#a3b1a5] hover:text-white'
            }`}
          >
            🧥 Veste N°2 ({formData.jackets[1].name})
          </button>
        </div>

        {/* Tab Form Contents */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Brand & Terroir Settings */}
          {activeTab === 'brand' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Nom de votre Marque
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => handleChangeBrand('brandName', e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Slogan / Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChangeBrand('tagline', e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  Sous-titre / Description Courte
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => handleChangeBrand('subtitle', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Localisation de l'Atelier
                  </label>
                  <input
                    type="text"
                    value={formData.designerLocation}
                    onChange={(e) => handleChangeBrand('designerLocation', e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    URL de l'Image du Logo
                  </label>
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => handleChangeBrand('logoUrl', e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  Récit de la Marque (L'Histoire)
                </label>
                <textarea
                  rows={3}
                  value={formData.storyText1}
                  onChange={(e) => handleChangeBrand('storyText1', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Jacket 1 Form */}
          {activeTab === 'j1' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Nom de la Veste N°1
                  </label>
                  <input
                    type="text"
                    value={formData.jackets[0].name}
                    onChange={(e) => handleChangeJacket(0, 'name', e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Prix (en Euros)
                  </label>
                  <input
                    type="number"
                    value={formData.jackets[0].price}
                    onChange={(e) => handleChangeJacket(0, 'price', Number(e.target.value))}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  Tagline / Accroche de la Veste
                </label>
                <input
                  type="text"
                  value={formData.jackets[0].tagline}
                  onChange={(e) => handleChangeJacket(0, 'tagline', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  Description détaillée
                </label>
                <textarea
                  rows={3}
                  value={formData.jackets[0].longDescription}
                  onChange={(e) => handleChangeJacket(0, 'longDescription', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  URL Photo Principale (Hero)
                </label>
                <input
                  type="text"
                  value={formData.jackets[0].heroImage}
                  onChange={(e) => handleChangeJacket(0, 'heroImage', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Jacket 2 Form */}
          {activeTab === 'j2' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Nom de la Veste N°2
                  </label>
                  <input
                    type="text"
                    value={formData.jackets[1].name}
                    onChange={(e) => handleChangeJacket(1, 'name', e.target.value)}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                    Prix (en Euros)
                  </label>
                  <input
                    type="number"
                    value={formData.jackets[1].price}
                    onChange={(e) => handleChangeJacket(1, 'price', Number(e.target.value))}
                    className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  Tagline / Accroche de la Veste
                </label>
                <input
                  type="text"
                  value={formData.jackets[1].tagline}
                  onChange={(e) => handleChangeJacket(1, 'tagline', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  Description détaillée
                </label>
                <textarea
                  rows={3}
                  value={formData.jackets[1].longDescription}
                  onChange={(e) => handleChangeJacket(1, 'longDescription', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-[#a3b1a5] uppercase tracking-wider mb-1 font-medium">
                  URL Photo Principale (Hero)
                </label>
                <input
                  type="text"
                  value={formData.jackets[1].heroImage}
                  onChange={(e) => handleChangeJacket(1, 'heroImage', e.target.value)}
                  className="w-full bg-[#202a22] border border-[#374739] text-[#f3ece0] p-3 rounded-xl outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#2e3b30] flex items-center justify-between">
            <button
              type="button"
              onClick={onReset}
              className="px-4 py-2 rounded-xl bg-[#28201a] border border-[#4d3829] text-[#d48c6d] text-xs uppercase tracking-wider hover:bg-[#382b22] flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser par défaut</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#202a22] text-[#a3b1a5] text-xs uppercase tracking-wider hover:text-white"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#d4af37] text-[#121613] font-serif font-bold text-xs uppercase tracking-wider hover:brightness-110 flex items-center space-x-2 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer & Appliquer</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
