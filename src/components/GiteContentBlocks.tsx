import React, { useEffect, useRef } from 'react';
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
  const blocksRef = useRef(blocks);
  const onChangeRef = useRef(onChange);
  blocksRef.current = blocks;
  onChangeRef.current = onChange;

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      const change = onChangeRef.current;
      if (!drag || !change) return;
      const x = Math.max(0, Math.min(100, ((event.clientX - drag.rect.left) / drag.rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((event.clientY - drag.rect.top) / drag.rect.height) * 100));
      change(blocksRef.current.map((b) => b.id === drag.id ? { ...b, x, y } : b));
    };
    const up = () => { dragRef.current = null; document.body.style.userSelect = ''; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>, block: GiteContentBlock) => {
    if (!editable || !onChange) return;
    if ((event.target as Element).closest('input,textarea,select,button')) return;
    const section = event.currentTarget.closest('section');
    if (!section) return;
    dragRef.current = { id: block.id, rect: section.getBoundingClientRect() };
    document.body.style.userSelect = 'none';
    event.preventDefault();
  };

  const stopDrag = () => { dragRef.current = null; document.body.style.userSelect = ''; };

  return <>
    {blocks.filter((b) => b.visible && b.moduleId === moduleId).map((block, index) => {
      const moduleBlocks = blocks.filter((b) => b.visible && b.moduleId === moduleId);
      const style: React.CSSProperties = {
        left: `${Math.max(0, Math.min(100, block.x))}%`,
        top: `${Math.max(0, Math.min(100, block.y))}%`,
        width: block.autoSize && ['text', 'heading', 'button'].includes(block.type) ? 'fit-content' : `${Math.max(8, Math.min(95, block.width || 30))}%`,
        maxWidth: block.autoSize && ['text', 'heading', 'button'].includes(block.type) ? '90%' : undefined,
        height: block.height ? `${Math.max(10, block.height)}%` : undefined,
        color: block.color || undefined,
        fontSize: block.fontSize ? `${block.fontSize}px` : undefined,
        textAlign: block.align || 'left',
        fontFamily: block.fontFamily ? (fontMap[block.fontFamily] || block.fontFamily) : (block.type === 'heading' ? fontMap.display : undefined),
        fontWeight: block.fontWeight || (block.type === 'heading' ? 500 : 400),
        lineHeight: block.lineHeight || undefined,
        fontStyle: block.italic ? 'italic' : undefined,
        backgroundColor: block.backgroundColor === 'transparent' ? 'transparent' : (block.backgroundColor || undefined),
        border: block.borderWidth ? `${block.borderWidth}px solid ${block.borderColor || '#8c6e3f'}` : 'none',
        borderRadius: block.borderRadius != null ? `${block.borderRadius}px` : undefined,
        padding: block.padding != null ? `${block.padding}px` : undefined,
        opacity: block.opacity != null ? Math.max(0, Math.min(1, block.opacity / 100)) : undefined,
        transform: `translate(-50%, -50%) rotate(${block.rotation || 0}deg)`,
        cursor: editable ? 'move' : undefined,
        touchAction: editable ? 'none' : undefined,
        zIndex: 100 + moduleBlocks.findIndex((b) => b.id === block.id),
        outline: 'none',
        whiteSpace: ['text', 'heading'].includes(block.type) ? 'pre-wrap' : undefined,
        overflowWrap: 'anywhere',
      };
      const dragProps = editable ? {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => startDrag(e, block),
        onPointerUp: stopDrag,
        onPointerCancel: stopDrag,
        onClick: (e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); },
      } : {};

      if (block.type === 'image' && block.url) return <div key={block.id} className="gite-content-block" style={style} {...dragProps}><img src={block.url} alt={block.alt || ''} className="w-full rounded-2xl shadow-2xl border border-black/10" style={{ objectFit: block.objectFit || 'contain', display: 'block', height: block.height ? '100%' : 'auto' }} /></div>;
      if (block.type === 'video' && block.url) return <div key={block.id} className="gite-content-block" style={style} {...dragProps}><video src={block.url} controls playsInline className="w-full h-full rounded-2xl shadow-2xl border border-black/10" /></div>;
      if (block.type === 'button') return <div key={block.id} className="gite-content-block" style={style} {...dragProps}><a href={block.link || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (editable) e.preventDefault(); }} className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#24231f] text-white border border-[#8c6e3f] shadow-xl no-underline hover:bg-[#8c6e3f] transition-colors">{block.text || 'Réserver'}</a></div>;
      return <div key={block.id} className="gite-content-block" style={style} {...dragProps}>{block.text || ''}</div>;
    })}
  </>;
};
