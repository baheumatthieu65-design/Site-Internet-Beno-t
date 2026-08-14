import React from 'react';
import { JacketModel, ThemeConfig } from '../types';
import { Mountain, CloudRain, Shield, Sparkles, Scale, ArrowRight, Edit3 } from 'lucide-react';
import { getButtonClasses, getCardClasses } from '../utils/themeStyles';

interface JacketComparisonProps {
  jackets: [JacketModel, JacketModel];
  theme?: ThemeConfig;
  isAdminLoggedIn?: boolean;
  onOpenEditorSection?: (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onSelectJacket: (id: string) => void;
  onOpenInquiry: (id: string) => void;
}

export const JacketComparison: React.FC<JacketComparisonProps> = ({
  jackets,
  theme,
  isAdminLoggedIn,
  onOpenEditorSection,
  onSelectJacket,
  onOpenInquiry,
}) => {
  const [j1, j2] = jackets;
  const cardStyle = getCardClasses(theme);
  const primaryBtnClass = getButtonClasses(theme, 'primary');
  const secondaryBtnClass = getButtonClasses(theme, 'secondary');
  const orderText = theme?.orderButtonText || 'Commander';

  const comparisonRows = [
    { label: 'Style principal', val1: j1.category, val2: j2.category },
    { label: 'Tissu signature', val1: j1.fabrics[0], val2: j2.fabrics[0] },
    { label: 'Indice de Chaleur', val1: j1.specs.warmthRating, val2: j2.specs.warmthRating },
    { label: 'Résistance à la pluie', val1: j1.specs.waterResistance, val2: j2.specs.waterResistance },
    { label: 'Poids de la veste', val1: j1.specs.weight, val2: j2.specs.weight },
    { label: 'Coupe & Silouhette', val1: j1.specs.fitType, val2: j2.specs.fitType },
    { label: 'Utilisation idéale', val1: 'Sommets, soirées fraîches & sorties élégantes', val2: 'Escapades champêtres, météo pluvieuse & quotidien' },
    { label: 'Entretien', val1: j1.specs.care, val2: j2.specs.care },
    { label: 'Prix public', val1: `${j1.price} ${j1.currency}`, val2: `${j2.price} ${j2.currency}` },
  ];

  return (
    <section id="comparatif" className="py-20 bg-[#121613] text-[#e2d5c3] relative group/comparatif">
      {/* Admin Quick Edit Trigger */}
      {isAdminLoggedIn && onOpenEditorSection && (
        <div className="absolute top-8 right-6 z-30 opacity-90 hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOpenEditorSection('j1')}
            className="flex items-center space-x-1.5 bg-[#1b241d]/90 backdrop-blur-md border border-[#d4af37]/60 px-3 py-1.5 rounded-full shadow-2xl text-xs text-[#d4af37]"
            title="Modifier les caractéristiques des vestes"
          >
            <Edit3 className="w-3 h-3" />
            <span>Éditer les specs</span>
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#242e26] text-[#d4af37] text-xs uppercase tracking-widest font-serif mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Guide de choix</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0]">
            Comparatif des 2 Modèles
          </h2>
          <p className="text-sm text-[#a3b0a2] mt-3 font-sans max-w-xl mx-auto">
            Découvrez en un coup d’œil quelle création correspond le mieux à votre style de vie et vos escapades dans les Pyrénées.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-[#313e33]">
                <th className="py-6 px-4 w-1/3 text-xs uppercase tracking-widest text-[#a3b1a5]">
                  Caractéristiques
                </th>
                {/* Jacket 1 Column Header */}
                <th className={`py-6 px-6 w-1/3 text-center ${cardStyle.card} rounded-t-2xl`}>
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-bold block">
                    Modèle N°1
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#f3ece0] mt-1">
                    {j1.name}
                  </h3>
                  <span className="text-sm text-[#c2a26d] font-serif font-semibold block mt-1">
                    {j1.price} {j1.currency}
                  </span>
                </th>
                {/* Jacket 2 Column Header */}
                <th className={`py-6 px-6 w-1/3 text-center ${cardStyle.card} rounded-t-2xl`}>
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-bold block">
                    Modèle N°2
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#f3ece0] mt-1">
                    {j2.name}
                  </h3>
                  <span className="text-sm text-[#c2a26d] font-serif font-semibold block mt-1">
                    {j2.price} {j2.currency}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263128]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#161c17] transition-colors">
                  <td className="py-4 px-4 text-xs uppercase tracking-wider font-semibold text-[#a3b1a5]">
                    {row.label}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#e2d5c3] text-center bg-[#171e19]/40">
                    {row.val1}
                  </td>
                  <td className="py-4 px-6 text-sm text-[#e2d5c3] text-center bg-[#1b221d]/40">
                    {row.val2}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-6 px-4"></td>
                <td className="py-6 px-6 text-center bg-[#171e19]/60 rounded-b-2xl">
                  <button
                    onClick={() => onOpenInquiry(j1.id)}
                    className={`w-full py-3 px-4 text-xs uppercase tracking-widest flex items-center justify-center space-x-2 ${primaryBtnClass}`}
                  >
                    <span>{orderText} N°1</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="py-6 px-6 text-center bg-[#1b221d]/60 rounded-b-2xl">
                  <button
                    onClick={() => onOpenInquiry(j2.id)}
                    className={`w-full py-3 px-4 text-xs uppercase tracking-widest flex items-center justify-center space-x-2 ${primaryBtnClass}`}
                  >
                    <span>{orderText} N°2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
