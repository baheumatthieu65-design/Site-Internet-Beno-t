import React from 'react';
import { CatalogCategory } from '../utils/catalogCategories';

interface CreationTypeTabsProps {
  types: CatalogCategory[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  counts?: Record<string, number>;
  compact?: boolean;
}

export const CreationTypeTabs: React.FC<CreationTypeTabsProps> = ({
  types,
  selectedCategory,
  onSelect,
  counts = {},
  compact = false,
}) => {
  if (!types.length) return null;

  return (
    <div className={`flex justify-center ${compact ? 'mb-6' : 'mb-8'} overflow-x-auto pb-2`}>
      <div className={`inline-flex ${compact ? 'p-1' : 'p-1.5'} rounded-full bg-[#1e2520] border border-[#3b473e] shadow-xl flex-wrap justify-center gap-1">
        {types.map((type) => {
          const selected = type.id === selectedCategory;
          const count = counts[type.id] ?? 0;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              aria-pressed={selected}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-widest transition-all font-medium whitespace-nowrap ${
                selected
                  ? 'bg-gradient-to-r from-[#2c372f] to-[#3b493e] text-[#f3ece0] border border-[#d4af37]/60 shadow-lg ring-1 ring-[#d4af37]/30'
                  : 'text-[#9eb0a0] hover:text-[#f3ece0]'
              }`}
            >
              <span>{type.label}</span>
              <span className={`text-[10px] font-semibold ${selected ? 'text-[#d4af37]' : 'text-[#738174]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
