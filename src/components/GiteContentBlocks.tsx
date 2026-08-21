import React from 'react';
import type { GiteContentBlock } from '../types';

export const GiteContentBlocks: React.FC<{ moduleId: string; blocks?: GiteContentBlock[] }> = ({ moduleId, blocks = [] }) => (
  <>
    {blocks.filter((b) => b.visible && b.moduleId === moduleId).map((block) => {
      const style: React.CSSProperties = {
        left: `${Math.max(0, Math.min(100, block.x))}%`,
        top: `${Math.max(0, Math.min(100, block.y))}%`,
        width: `${Math.max(8, Math.min(95, block.width || 30))}%`,
        color: block.color || undefined,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        textAlign: block.align || 'left',
        transform: 'translate(-50%, -50%)',
      };

      if (block.type === 'video' && block.url) {
        return (
          <div key={block.id} className="gite-content-block" style={style}>
            <video src={block.url} controls playsInline className="w-full rounded-2xl shadow-2xl border border-black/10" />
          </div>
        );
      }

      if (block.type === 'button') {
        return (
          <div key={block.id} className="gite-content-block" style={style}>
            <a href={block.link || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#24231f] text-white border border-[#8c6e3f] shadow-xl no-underline hover:bg-[#8c6e3f] transition-colors">
              {block.text || 'Réserver'}
            </a>
          </div>
        );
      }

      return (
        <div key={block.id} className="gite-content-block" style={{ ...style, fontFamily: block.type === 'heading' ? "'DM Serif Display', serif" : undefined, fontWeight: block.type === 'heading' ? 400 : 400 }}>
          {block.text || ''}
        </div>
      );
    })}
  </>
);
