import React from 'react';

export interface CreationType {
  id: string;
  label: string;
  count: number;
}

interface CreationTypeTabsProps {
  types: CreationType[];
  selectedType: string;
  onSelect: (typeId: string) => void;
}

export function CreationTypeTabs({
  types,
  selectedType,
  onSelect,
}: CreationTypeTabsProps) {
  if (!types.length) return null;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 sm:gap-3 min-w-max pb-2">
        {types.map((type) => {
          const selected = selectedType === type.id;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              aria-pressed={selected}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-widest transition-all font-medium whitespace-nowrap ${
                selected
                  ? 'bg-gradient-to-r from-[#2c372f] to-[#3b493e] text-[#f3ece0] border border-[#d4af37]/60 shadow-lg ring-1 ring-[#d4af37]/30'
                  : 'bg-transparent text-[#2c372f] border border-[#2c372f]/30 hover:border-[#d4af37] hover:text-[#8d7020]'
              }`}
            >
              <span>{type.label}</span>

              <span
                className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-[10px] font-semibold ${
                  selected
                    ? 'bg-[#d4af37]/20 text-[#f3ece0]'
                    : 'bg-[#2c372f]/10 text-[#2c372f]'
                }`}
              >
                {type.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
