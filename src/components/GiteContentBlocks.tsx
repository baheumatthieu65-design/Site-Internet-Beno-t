import React, { useRef } from 'react';
import type { GiteContentBlock } from '../types';

const fontMap: Record<string, string> = {
  sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  display: '"DM Serif Display", Georgia, serif',
  elegant: '"Playfair Display", Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

interface Props {
  moduleId: string;
  blocks?: GiteContentBlock[];
  editable?: boolean;
  onChange?: (blocks: GiteContentBlock[]) => void;
}

export const GiteContentBlocks: React.FC<Props> = ({ moduleId, blocks = [], editable = false, onChange }) => {
  const dragRef = useRef<{ id: string; rect: DOMRect } | null>(null);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, block: GiteContentBlock) => {
    if (!editable || !onChange) return;
    if ((event.target as Element).closest('input,textarea,select')) return;
    const section = event.currentTarget.closest('section');
    if (!section) return;
    dragRef.current = { id: block.id, rect: section.getBoundingClientRect() };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !onChange) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - drag.rect.left) / drag.rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - drag.rect.top) / drag.rect.height) * 100));
    onChange(blocks.map((b) => b.id === drag.id ? { ...b, x, y } : b));
  };

  const stopDrag = () => { dragRef.current = null; };

  return <>
    {blocks.filter((b) => b.visible && b.moduleId === moduleId).map((block) => {
      const style: React.CSSProperties = {
        left: `${Math.max(0, Math.min(100, block.x))}%`,
        top: `${Math.max(0, Math.min(100, block.y))}%`,
        width: `${Math.max(8, Math.min(95, block.width || 30))}%`,
        height: block.height ? `${Math.max(10, block.height)}%` : undefined,
        color: block.color || undefined,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        textAlign: block.align || 'left',
        fontFamily: block.fontFamily ? (fontMap[block.fontFamily] || block.fontFamily) : (block.type === 'heading' ? fontMap.display : undefined),
        fontWeight: block.fontWeight || (block.type === 'heading' ? 500 : 400),
        lineHeight: block.lineHeight || undefined,
        fontStyle: block.italic ? 'italic' : undefined,
        backgroundColor: block.backgroundColor || undefined,
        border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || 'transparent'}` : undefined,
        borderRadius: block.borderRadius != null ? `${block.borderRadius}px` : undefined,
        padding: block.padding != null ? `${block.padding}px` : undefined,
        opacity: block.opacity != null ? Math.max(0, Math.min(1, block.opacity / 100)) : undefined,
        transform: `translate(-50%, -50%) rotate(${block.rotation || 0}deg)`,
        cursor: editable ? 'move' : undefined,
        touchAction: editable ? 'none' : undefined,
        zIndex: editable ? 70 : 30,
        outline: editable ? '1px dashed rgba(212,175,55,.65)' : undefined,
      };
      const dragProps = editable ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => startDrag(e, block),
        onPointerMove: moveDrag,
        onPointerUp: stopDrag,
        onPointerCancel: stopDrag,
        onClick: editable ? (e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); } : undefined,
      } : {};

      if (block.type === 'image' && block.url) return <div key={block.id} className="gite-content-block" style={style} {...dragProps}><img src={block.url} alt={block.alt || ''} className="w-full h-full rounded-2xl shadow-2xl border border-black/10" style={{ objectFit: block.objectFit || 'cover', display: 'block' }} /></div>;
      if (block.type === 'video' && block.url) return <div key={block.id} className="gite-content-block" style={style} {...dragProps}><video src={block.url} controls playsInline className="w-full h-full rounded-2xl shadow-2xl border border-black/10" /></div>;
      if (block.type === 'button') return <div key={block.id} className="gite-content-block" style={style} {...dragProps}><a href={block.link || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#24231f] text-white border border-[#8c6e3f] shadow-xl no-underline hover:bg-[#8c6e3f] transition-colors">{block.text || 'Réserver'}</a></div>;
      return <div key={block.id} className="gite-content-block" style={style} {...dragProps}>{block.text || ''}</div>;
    })}
  </>;
};
