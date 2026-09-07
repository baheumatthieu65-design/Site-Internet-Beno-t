import React from 'react';

export interface CreationType {
  id: string;
  label: string;
  count?: number;
}

interface CreationTypeTabsProps {
  types: CreationType[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  counts?: Record<string, number>;
}

export function CreationTypeTabs({
  types,
  selectedCategory,
  onSelect,
  counts = {},
}: CreationTypeTabsProps) {
  if (!types.length) return null;

  return (
    <div className="w-full overflow-x-hidden" role="tablist" aria-label="Catégories de créations">
      <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 pb-2">
        {types.map((type) => {
          const selected = selectedCategory === type.id;
          const count = counts[type.id] ?? type.count ?? 0;

          return (
            <button
              key={type.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(type.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-widest transition-all font-medium whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]/60 ${
                selected
                  ? 'bg-gradient-to-r from-[#2c372f] to-[#3b493e] text-[#f3ece0] border border-[#d4af37]/60 shadow-lg shadow-[#d4af37]/10'
                  : 'bg-[#151b17]/85 text-[#e2d5c3] border border-[#526355] hover:border-[#8f9d91] hover:bg-[#1d2820]'
              }`}
            >
              <span>{type.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-[10px] font-semibold ${
                  selected
                    ? 'bg-[#d4af37] text-[#121613]'
                    : 'bg-[#39443c] text-[#e2d5c3]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
