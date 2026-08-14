import React from 'react';
import { JacketModel, ThemeConfig, ComparisonCriterion } from '../types';
import { Scale, ArrowRight, Edit3 } from 'lucide-react';
import {
  getButtonClasses,
  getCardClasses,
  getTextAlignClass,
  getContentPaddingClass,
  getContainerWidthClass,
} from '../utils/themeStyles';

interface JacketComparisonProps {
  jackets: JacketModel[];
  theme?: ThemeConfig;
  isAdminLoggedIn?: boolean;
  onOpenEditorSection?: (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onSelectJacket: (id: string) => void;
  onOpenInquiry: (id: string) => void;
}

const DEFAULT_CRITERIA: ComparisonCriterion[] = [
  { id: 'crit_category', label: 'Style principal', key: 'category' },
  { id: 'crit_fabric', label: 'Tissu signature', key: 'fabric' },
  { id: 'crit_warmth', label: 'Indice de Chaleur', key: 'warmth' },
  { id: 'crit_water', label: 'Résistance à la pluie', key: 'water' },
  { id: 'crit_weight', label: 'Poids de la veste', key: 'weight' },
  { id: 'crit_fit', label: 'Coupe & Silhouette', key: 'fit' },
  { id: 'crit_care', label: 'Entretien', key: 'care' },
  { id: 'crit_price', label: 'Prix public', key: 'price' },
];

export const JacketComparison: React.FC<JacketComparisonProps> = ({
  jackets,
  theme,
  isAdminLoggedIn,
  onOpenEditorSection,
  onOpenInquiry,
}) => {
  const cardStyle = getCardClasses(theme);
  const primaryBtnClass = getButtonClasses(theme, 'primary');
  const orderText = theme?.orderButtonText || 'Commander';

  const textAlignClass = getTextAlignClass(theme);
  const containerWidthClass = getContainerWidthClass(theme);
  const contentPaddingClass = getContentPaddingClass(theme);

  const sectionTitle = theme?.comparatifTabLabel || 'Tableau Comparatif des Vestes';
  const criteria = theme?.comparisonCriteria && theme.comparisonCriteria.length > 0
    ? theme.comparisonCriteria
    : DEFAULT_CRITERIA;

  const getCriterionValue = (crit: ComparisonCriterion, j: JacketModel) => {
    switch (crit.key) {
      case 'category':
        return j.category || '—';
      case 'fabric':
        return j.fabrics?.[0] || 'Laine & Tissage Noble';
      case 'warmth':
        return j.specs?.warmthRating || '—';
      case 'water':
        return j.specs?.waterResistance || '—';
      case 'weight':
        return j.specs?.weight || '—';
      case 'fit':
        return j.specs?.fitType || '—';
      case 'care':
        return j.specs?.care || '—';
      case 'price':
        return `${j.price} ${j.currency || '€'}`;
      default:
        return j.customSpecs?.[crit.key] || '—';
    }
  };

  return (
    <section id="comparatif" className={`${contentPaddingClass} bg-[#121613] text-[#e2d5c3] relative group/comparatif`}>
      {/* Admin Quick Edit Trigger */}
      {isAdminLoggedIn && onOpenEditorSection && (
        <div className="absolute top-8 right-6 z-30 opacity-90 hover:opacity-100 transition-opacity">
          <button
            onClick={() => onOpenEditorSection('theme')}
            className="flex items-center space-x-1.5 bg-[#1b241d]/90 backdrop-blur-md border border-[#d4af37]/60 px-3 py-1.5 rounded-full shadow-2xl text-xs text-[#d4af37] cursor-pointer"
            title="Gérer les critères techniques du tableau comparatif"
          >
            <Edit3 className="w-3 h-3" />
            <span>Gérer les critères du Tableau</span>
          </button>
        </div>
      )}

      <div className={`${containerWidthClass} px-4 sm:px-6 lg:px-8`}>
        {/* Header */}
        <div className={`${textAlignClass} max-w-3xl mx-auto mb-16`}>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#242e26] text-[#d4af37] text-xs uppercase tracking-widest font-serif mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Guide de choix</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0]">
            {sectionTitle}
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
                <th className="py-6 px-4 text-xs uppercase tracking-widest text-[#a3b1a5] w-1/4">
                  Caractéristiques
                </th>
                {jackets.map((j, idx) => (
                  <th key={j.id} className={`py-6 px-6 text-center ${cardStyle.card} rounded-t-2xl`}>
                    <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-bold block">
                      Modèle N°{idx + 1}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-[#f3ece0] mt-1 truncate">
                      {j.name}
                    </h3>
                    <span className="text-sm text-[#c2a26d] font-serif font-semibold block mt-1">
                      {j.price} {j.currency}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263128]">
              {criteria.map((crit) => (
                <tr key={crit.id} className="hover:bg-[#161c17] transition-colors">
                  <td className="py-4 px-4 text-xs uppercase tracking-wider font-semibold text-[#a3b1a5]">
                    {crit.label}
                  </td>
                  {jackets.map((j) => (
                    <td key={j.id} className="py-4 px-6 text-sm text-[#e2d5c3] text-center bg-[#171e19]/40">
                      {getCriterionValue(crit, j)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-6 px-4"></td>
                {jackets.map((j, idx) => (
                  <td key={j.id} className="py-6 px-6 text-center bg-[#171e19]/60 rounded-b-2xl">
                    <button
                      onClick={() => onOpenInquiry(j.id)}
                      className={`w-full py-3 px-4 text-xs uppercase tracking-widest flex items-center justify-center space-x-2 ${primaryBtnClass}`}
                    >
                      <span>{orderText} N°{idx + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
