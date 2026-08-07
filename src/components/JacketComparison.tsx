import React from 'react';
import { JacketModel } from '../types';
import { Mountain, CloudRain, Shield, Sparkles, Scale, ArrowRight } from 'lucide-react';

interface JacketComparisonProps {
  jackets: [JacketModel, JacketModel];
  onSelectJacket: (id: string) => void;
  onOpenInquiry: (id: string) => void;
}

export const JacketComparison: React.FC<JacketComparisonProps> = ({
  jackets,
  onSelectJacket,
  onOpenInquiry,
}) => {
  const [j1, j2] = jackets;

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
    <section id="comparatif" className="py-20 bg-[#121613] text-[#e2d5c3] relative">
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
                <th className="py-6 px-6 w-1/3 bg-[#18201a] rounded-t-2xl border-t border-x border-[#39483c] text-center">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-bold block">
                    Modèle N°1
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#f3ece0] mt-1">
                    {j1.name}
                  </h3>
                  <p className="text-xs text-[#a3b0a2] mt-0.5">{j1.price} {j1.currency}</p>
                  <button
                    onClick={() => onOpenInquiry(j1.id)}
                    className="mt-3 px-4 py-1.5 text-xs uppercase tracking-wider bg-[#d4af37] text-[#121613] font-bold rounded-lg hover:brightness-110 transition-all"
                  >
                    Choisir la N°1
                  </button>
                </th>

                {/* Jacket 2 Column Header */}
                <th className="py-6 px-6 w-1/3 bg-[#1d261f] rounded-t-2xl border-t border-x border-[#39483c] text-center">
                  <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-serif font-bold block">
                    Modèle N°2
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#f3ece0] mt-1">
                    {j2.name}
                  </h3>
                  <p className="text-xs text-[#a3b0a2] mt-0.5">{j2.price} {j2.currency}</p>
                  <button
                    onClick={() => onOpenInquiry(j2.id)}
                    className="mt-3 px-4 py-1.5 text-xs uppercase tracking-wider bg-[#b89f74] text-[#121613] font-bold rounded-lg hover:brightness-110 transition-all"
                  >
                    Choisir la N°2
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#273229] text-xs sm:text-sm">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#181f19] transition-colors">
                  <td className="py-4 px-4 font-semibold text-[#c4ceb8] uppercase tracking-wider text-[11px]">
                    {row.label}
                  </td>
                  <td className="py-4 px-6 text-center bg-[#18201a]/50 text-[#e2d5c3] border-x border-[#273229]">
                    {row.val1}
                  </td>
                  <td className="py-4 px-6 text-center bg-[#1d261f]/50 text-[#e2d5c3] border-x border-[#273229]">
                    {row.val2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
