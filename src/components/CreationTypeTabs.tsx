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
    <div className="w-full overflow-x-auto py-1">
      <div className="mx-auto flex w-fit min-w-max items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-[#d4af37]/35 bg-[#121613]/90 backdrop-blur-md p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        {types.map((type) => {
          const selected = selectedCategory === type.id;
          const count = counts[type.id] ?? type.count ?? 0;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              aria-pressed={selected}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm uppercase tracking-widest transition-all duration-200 font-semibold whitespace-nowrap border ${
                selected
                  ? 'bg-gradient-to-r from-[#354238] to-[#465449] text-[#fff8ea] border-[#d4af37] shadow-[0_4px_18px_rgba(212,175,55,0.22)] ring-1 ring-[#d4af37]/40'
                  : 'bg-[#1b221d]/80 text-[#e5dccd] border-[#718071]/55 hover:bg-[#29342c] hover:text-[#fff8ea] hover:border-[#d4af37]/80'
              }`}
            >
              <span>{type.label}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[1.6rem] h-6 px-1.5 rounded-full text-[10px] font-bold ${
                  selected
                    ? 'bg-[#d4af37] text-[#172019]'
                    : 'bg-[#e7dcc8]/15 text-[#f1e8d8] border border-white/10'
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
