import React, { useEffect, useRef } from 'react';
import type { GiteContentBlock } from '../types';


const GITE_FONT_URL = 'https://fonts.googleapis.com/css2?family=Allura&family=Berkshire+Swash&family=Bodoni+Moda:ital,wght@0,400;0,500;0,600;1,400&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Dancing+Script:wght@400;500;600;700&family=DM+Serif+Display&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:wght@400;700&family=Montserrat:wght@400;500;600;700&family=Nunito+Sans:wght@400;500;600;700&family=Parisienne&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Raleway:wght@400;500;600;700&family=Sacramento&family=Source+Sans+3:wght@400;500;600;700&family=Tangerine:wght@400;700&display=swap';

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

  useEffect(() => {
    if (document.querySelector('link[data-gite-content-fonts="true"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = GITE_FONT_URL;
    link.dataset.giteContentFonts = 'true';
    document.head.appendChild(link);
  }, []);
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
        zIndex: 10 + moduleBlocks.findIndex((b) => b.id === block.id),
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
      if (block.type === 'button') {
        const imageEnabled = !!(block as any).buttonImageEnabled && !!(block as any).buttonImageUrl;
        const hoverEffect = (block as any).buttonHoverEffect || 'scale';
        const hoverClass = hoverEffect === 'opacity'
          ? 'hover:opacity-70'
          : hoverEffect === 'scale'
            ? 'hover:scale-105'
            : hoverEffect === 'brightness'
              ? 'hover:brightness-125'
              : hoverEffect === 'grayscale'
                ? 'hover:grayscale'
                : hoverEffect === 'lift'
                  ? 'hover:-translate-y-1'
                  : '';
        return <div key={block.id} className="gite-content-block" style={style} {...dragProps}>
          <a href={block.link || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (editable) e.preventDefault(); }} className={`inline-flex items-center justify-center no-underline transition-all duration-200 ${imageEnabled ? hoverClass : 'px-6 py-3 rounded-xl bg-[#24231f] text-white border border-[#8c6e3f] shadow-xl hover:bg-[#8c6e3f]'}`}>
            {imageEnabled ? <img src={(block as any).buttonImageUrl} alt={block.text || 'Bouton'} className="block max-h-full max-w-full object-contain rounded-xl" draggable={false} /> : (block.text || 'Réserver')}
          </a>
        </div>;
      }
      return <div key={block.id} className="gite-content-block" style={style} {...dragProps}>{block.text || ''}</div>;
    })}
  </>;
};
