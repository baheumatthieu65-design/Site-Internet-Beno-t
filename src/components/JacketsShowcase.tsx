import React, { useState, useEffect } from 'react';
import { JacketModel, Hotspot, ThemeConfig, ProductBlockId } from '../types';
import {
  Check,
  Info,
  Shield,
  Feather,
  Sparkles,
  CloudRain,
  Compass,
  Layers,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Ruler,
  Edit3,
  Sliders,
  Maximize2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Move
} from 'lucide-react';
import {
  getButtonClasses,
  getButtonInlineStyle,
  getCardClasses,
  getTextAlignClass,
  getButtonAlignClass,
  getContentPaddingClass,
  getContainerWidthClass,
} from '../utils/themeStyles';

interface JacketsShowcaseProps {
  jackets: JacketModel[];
  selectedJacketId: string;
  theme?: ThemeConfig;
  isAdminLoggedIn?: boolean;
  isDragReorderMode?: boolean;
  onOpenEditorSection?: (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onSelectJacket: (id: string) => void;
  onOpenInquiry: (jacketId: string, color?: string, size?: string) => void;
  onReorderProductBlocks?: (newOrder: ProductBlockId[]) => void;
}

export const JacketsShowcase: React.FC<JacketsShowcaseProps> = ({
  jackets,
  selectedJacketId,
  theme,
  isAdminLoggedIn,
  isDragReorderMode = true,
  onOpenEditorSection,
  onSelectJacket,
  onOpenInquiry,
  onReorderProductBlocks,
}) => {
  const visibleJackets = Array.isArray(jackets)
    ? jackets.filter((j) => isAdminLoggedIn || j.isAvailable !== false)
    : [];
  const activeJacket = visibleJackets.find((j) => j.id === selectedJacketId) || visibleJackets[0] || jackets[0];
  const [activeImage, setActiveImage] = useState(activeJacket?.heroImage || '');
  const [selectedColor, setSelectedColor] = useState(activeJacket?.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(activeJacket?.sizes[1] || 'M');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  // Drag and drop state for product blocks
  const [draggingBlockId, setDraggingBlockId] = useState<ProductBlockId | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<ProductBlockId | null>(null);

  // Update image and color when active jacket changes
  useEffect(() => {
    if (activeJacket) {
      setActiveImage(activeJacket.heroImage);
      if (activeJacket.colors.length > 0) {
        setSelectedColor(activeJacket.colors[0].name);
      }
      if (activeJacket.sizes.length > 0) {
        setSelectedSize(activeJacket.sizes[1] || activeJacket.sizes[0]);
      }
    }
  }, [activeJacket?.id]);

  if (!activeJacket) return null;

  // La galerie publique est toujours normalisée : image principale en premier,
  // puis toutes les images secondaires, sans doublons.
  const activeGallery = Array.from(new Set([
    activeJacket.heroImage,
    ...(Array.isArray(activeJacket.gallery) ? activeJacket.gallery : []),
  ].map((url) => String(url || '').trim()).filter(Boolean)));

  const layout = theme?.showcaseLayout || 'split-interactive';
  const cardStyle = getCardClasses(theme);
  const primaryBtnClass = getButtonClasses(theme, 'primary', 'showcase-order');
  const buttonInlineStyle = getButtonInlineStyle(theme, 'showcase-order');
  const radius = theme?.buttonRadius || 'rounded-full';

  const textAlignClass = getTextAlignClass(theme);
  const buttonAlignClass = getButtonAlignClass(theme);
  const containerWidthClass = getContainerWidthClass(theme);
  const contentPaddingClass = getContentPaddingClass(theme);
  const cardMediaPos = theme?.cardMediaPosition || 'left';

  const orderText = theme?.orderButtonText || 'Commander';
  const inquiryText = theme?.inquiryButtonText || 'Commander sur Mesure';

  const blocksOrder: ProductBlockId[] = theme?.productBlocksOrder || [
    'title-price',
    'description',
    'colors',
    'sizes',
    'specs',
    'cta',
  ];

  const blockLabels: Record<ProductBlockId, string> = {
    'title-price': 'Titre & Prix',
    'description': 'Description & Récit',
    'colors': 'Nuances de Couleurs',
    'sizes': 'Tailles & Mensurations',
    'specs': 'Spécifications Techniques',
    'cta': 'Bouton de Commande',
  };

  const handleBlockDragStart = (blockId: ProductBlockId, e: React.DragEvent) => {
    setDraggingBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleBlockDragOver = (blockId: ProductBlockId, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlockId !== blockId) {
      setDragOverBlockId(blockId);
    }
  };

  const handleBlockDrop = (targetBlockId: ProductBlockId) => {
    if (!draggingBlockId || draggingBlockId === targetBlockId) {
      setDraggingBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    const current = [...blocksOrder];
    const fromIdx = current.indexOf(draggingBlockId);
    const toIdx = current.indexOf(targetBlockId);

    if (fromIdx !== -1 && toIdx !== -1 && onReorderProductBlocks) {
      const updated = [...current];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      onReorderProductBlocks(updated);
    }

    setDraggingBlockId(null);
    setDragOverBlockId(null);
  };

  const handleMoveBlock = (blockId: ProductBlockId, direction: 'up' | 'down') => {
    const current = [...blocksOrder];
    const idx = current.indexOf(blockId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= current.length) return;

    if (onReorderProductBlocks) {
      const updated = [...current];
      const [moved] = updated.splice(idx, 1);
      updated.splice(targetIdx, 0, moved);
      onReorderProductBlocks(updated);
    }
  };

  const renderRawProductBlock = (blockId: ProductBlockId) => {
    switch (blockId) {
      case 'title-price':
        return (
          <div key="title-price">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#a3b1a5] font-serif">
                {activeJacket.subTitle}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#382b1c] text-[#d4af37] border border-[#8c6d3f]">
                Sur Commande
              </span>
            </div>
            <h3 className="font-serif text-3xl sm:text-4xl text-[#f3ece0] font-normal mt-1">
              {activeJacket.name}
            </h3>
            {activeJacket.tagline && (
              <p className="text-sm text-[#c2a26d] italic font-serif mt-1">
                "{activeJacket.tagline}"
              </p>
            )}

            <div className="mt-4 flex items-baseline space-x-3">
              <span className="font-serif text-3xl font-semibold text-[#f3ece0]">
                {activeJacket.price} {activeJacket.currency}
              </span>
              <span className="text-xs text-[#a3b0a2]">
                TVA incluse • Livraison offerte en France & Europe
              </span>
            </div>
          </div>
        );

      case 'description':
        return activeJacket.longDescription || activeJacket.description ? (
          <div key="description" className="space-y-3">
            <hr className="border-[#2f3b31]" />
            <p className="text-sm text-[#b8c5ba] leading-relaxed">
              {activeJacket.longDescription || activeJacket.description}
            </p>
          </div>
        ) : null;

      case 'colors':
        return (
          <div key="colors">
            <label className="block text-xs uppercase tracking-widest text-[#a3b1a5] font-medium mb-2">
              Couleur sélectionnée : <span className="text-[#f3ece0] font-semibold">{selectedColor}</span>
            </label>
            <div className="flex items-center space-x-3">
              {activeJacket.colors.map((color) => {
                const isChosen = selectedColor === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                      isChosen ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#151a16] scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {isChosen && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'sizes':
        return (
          <div key="sizes">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-[#a3b1a5] font-medium">
                Taille : <span className="text-[#f3ece0] font-semibold">{selectedSize}</span>
              </label>
              <button
                type="button"
                onClick={() => {}}
                className="text-xs text-[#d4af37] flex items-center space-x-1"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Guide des tailles</span>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {activeJacket.sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 text-xs uppercase tracking-wider font-semibold ${radius} border transition-all ${
                      isSelected
                        ? 'bg-[#d4af37] text-[#121613] border-[#d4af37] shadow-md font-bold'
                        : 'bg-[#1e2520] text-[#c4ceb8] border-[#374639] hover:border-[#a3b0a2]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'specs':
        return (
          <div key="specs" className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-3 ${radius} ${cardStyle.card}`}>
              <span className="block text-[#a3b0a2] text-[10px] uppercase tracking-wider">Origine</span>
              <span className="font-semibold text-[#f3ece0]">{activeJacket.specs.origin}</span>
            </div>
            <div className={`p-3 ${radius} ${cardStyle.card}`}>
              <span className="block text-[#a3b0a2] text-[10px] uppercase tracking-wider">Résistance</span>
              <span className="font-semibold text-[#f3ece0]">{activeJacket.specs.waterResistance}</span>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div key="cta" className="pt-2 space-y-3">
            <div className={`flex ${buttonAlignClass}`}>
              <button
                id={`buy-jacket-${activeJacket.id}`}
                onClick={() => onOpenInquiry(activeJacket.id, selectedColor, selectedSize)}
                style={buttonInlineStyle}
                className={`w-full py-4 px-6 text-sm uppercase tracking-widest flex items-center justify-center space-x-3 ${primaryBtnClass}`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{orderText} / Réserver ({activeJacket.price} {activeJacket.currency})</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-[#a3b0a2] flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Atelier artisanal local • Réponse personnalisée sous 24h</span>
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderProductBlock = (blockId: ProductBlockId) => {
    const rawBlock = renderRawProductBlock(blockId);
    if (!rawBlock) return null;

    if (!isAdminLoggedIn || !isDragReorderMode) {
      return <div key={blockId}>{rawBlock}</div>;
    }

    const isDragging = draggingBlockId === blockId;
    const isDragOver = dragOverBlockId === blockId;

    return (
      <div
        key={blockId}
        draggable
        onDragStart={(e) => handleBlockDragStart(blockId, e)}
        onDragOver={(e) => handleBlockDragOver(blockId, e)}
        onDragLeave={() => setDragOverBlockId(null)}
        onDrop={() => handleBlockDrop(blockId)}
        className={`relative group/block transition-all rounded-2xl p-2 -m-2 ${
          isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
        } ${
          isDragOver
            ? 'border-2 border-dashed border-[#d4af37] bg-[#d4af37]/10 ring-2 ring-[#d4af37]/30'
            : 'hover:bg-[#1a221b]/60 border border-transparent hover:border-[#38483b]'
        }`}
      >
        {/* Drag handle tooltip bar for admin */}
        <div className="opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center justify-between bg-[#121613]/95 border border-[#d4af37]/50 rounded-lg px-2.5 py-1 mb-1.5 text-[10px] text-[#f3ece0] shadow-xl">
          <div className="flex items-center space-x-1.5 cursor-grab active:cursor-grabbing text-[#d4af37]">
            <GripVertical className="w-3.5 h-3.5" />
            <span className="font-semibold">{blockLabels[blockId] || blockId}</span>
            <span className="text-[#a3b1a5] font-normal hidden sm:inline">(Glisser pour déplacer)</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleMoveBlock(blockId, 'up')}
              className="p-0.5 rounded hover:bg-[#28362b] text-[#a3b1a5] hover:text-[#d4af37]"
              title="Monter ce bloc"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleMoveBlock(blockId, 'down')}
              className="p-0.5 rounded hover:bg-[#28362b] text-[#a3b1a5] hover:text-[#d4af37]"
              title="Descendre ce bloc"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        {rawBlock}
      </div>
    );
  };

  return (
    <section id="collection" className="py-20 bg-[#151a16] text-[#e2d5c3] relative overflow-hidden group/showcase">
      {/* Decorative mountain graphic accent */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 opacity-5 pointer-events-none">
        <svg className="w-96 h-96 text-[#d4af37]" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 6l-3.8 5.7 1.8 2.7H5l7-10 7 10h-2.5l-2.5-3.7z" />
        </svg>
      </div>

      {/* Admin Quick Edit Trigger */}
      {isAdminLoggedIn && onOpenEditorSection && (
        <div className="absolute top-8 right-6 z-30 opacity-90 hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2 bg-[#1b241d]/90 backdrop-blur-md border border-[#d4af37]/60 px-3 py-1.5 rounded-full shadow-2xl text-xs text-[#f3ece0]">
            <span className="text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider">Showcase</span>
            <button
              onClick={() => onOpenEditorSection('layouts')}
              className="px-2 py-0.5 rounded bg-[#28362b] hover:bg-[#344638] text-[#d4af37] flex items-center space-x-1"
              title="Changer l'ordre des éléments et agencements"
            >
              <Layers className="w-3 h-3" />
              <span>Agencement</span>
            </button>
            <button
              onClick={() => onOpenEditorSection('j1')}
              className="px-2 py-0.5 rounded bg-[#28362b] hover:bg-[#344638] text-white flex items-center space-x-1"
              title="Ajouter, supprimer ou modifier les articles"
            >
              <Edit3 className="w-3 h-3" />
              <span>Articles ({jackets.length})</span>
            </button>
          </div>
        </div>
      )}

      <div className={`${containerWidthClass} px-4 sm:px-6 lg:px-8`}>
        {/* Section Header */}
        <div className={`${textAlignClass} max-w-3xl mx-auto mb-10`}>
          <span className="text-xs uppercase tracking-widest text-[#d4af37] font-serif font-medium">
            Mise en valeur exclusive
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-[#f3ece0] mt-2 mb-4">
            Nos {jackets.length} Créations Signatures
          </h2>
          <p className="text-sm sm:text-base text-[#a3b1a5] font-sans">
            Des modèles pensés pour allier l’authenticité du grand air pyrénéen et l’élégance urbaine la plus raffinée.
          </p>
        </div>

        {/* Jacket Selector Tabs */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-2">
          <div className={`inline-flex p-1.5 ${radius} bg-[#1e2520] border border-[#3b473e] shadow-xl flex-wrap justify-center gap-1`}>
            {visibleJackets.map((j, idx) => {
              const isSelected = j.id === activeJacket.id;
              return (
                <button
                  key={j.id}
                  id={`jacket-tab-${j.id}`}
                  onClick={() => onSelectJacket(j.id)}
                  className={`flex items-center space-x-2.5 px-5 py-2.5 ${radius} text-xs sm:text-sm uppercase tracking-widest transition-all font-medium ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#2c372f] to-[#3b493e] text-[#f3ece0] border border-[#d4af37]/60 shadow-lg ring-1 ring-[#d4af37]/30'
                      : 'text-[#9eb0a0] hover:text-[#f3ece0]'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-black/40 text-[#d4af37] font-serif text-xs flex items-center justify-center font-bold">
                    N°{idx + 1}
                  </span>
                  <span>{j.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LAYOUT 1: SPLIT INTERACTIVE (Default / Haute Montagne) */}
        {layout === 'split-interactive' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Image & Hotspots */}
            <div className={`${cardMediaPos === 'right' ? 'lg:col-span-7 lg:order-2' : 'lg:col-span-7'} space-y-6`}>
              <div className="relative rounded-3xl bg-[#1d241f] border border-[#39483c] overflow-hidden shadow-2xl group min-h-[420px] sm:min-h-[520px] flex items-center justify-center">
                <img
                  data-vce-gallery-main="true"
                  data-vce-gallery-product-id={activeJacket.id}
                  src={activeImage}
                  alt={activeJacket.name}
                  className="w-full h-full max-h-[620px] object-cover object-center transition-all duration-500"
                />

                {/* Hotspots */}
                {activeJacket.hotspots.map((hs) => {
                  const isSelected = activeHotspot?.id === hs.id;
                  return (
                    <button
                      key={hs.id}
                      onClick={() => setActiveHotspot(isSelected ? null : hs)}
                      style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                      className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 group/pin focus:outline-none"
                      title={hs.title}
                    >
                      <span className="relative flex h-8 w-8 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-[#1a201b] border-2 border-[#d4af37] text-[#d4af37] text-[10px] font-bold items-center justify-center shadow-lg group-hover/pin:scale-110 transition-transform">
                          +
                        </span>
                      </span>
                    </button>
                  );
                })}

                {/* Hotspot details overlay */}
                {activeHotspot && (
                  <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-30 p-4 sm:p-5 rounded-2xl bg-[#141915]/95 backdrop-blur-md border border-[#d4af37] shadow-2xl animate-fadeIn">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 text-[#d4af37] text-xs uppercase tracking-wider font-semibold">
                        <Eye className="w-4 h-4" />
                        <span>Détail d'Atelier • {activeHotspot.category}</span>
                      </div>
                      <button
                        onClick={() => setActiveHotspot(null)}
                        className="text-[#9eb0a0] hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-black/40"
                      >
                        ✕
                      </button>
                    </div>
                    <h4 className="font-serif text-lg text-[#f3ece0] font-semibold mt-1">
                      {activeHotspot.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-[#b8c5ba] mt-1 leading-relaxed">
                      {activeHotspot.description}
                    </p>
                  </div>
                )}

                <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-2">
                  <span className="px-3 py-1 rounded-full bg-[#121613]/90 backdrop-blur-md border border-[#3b473e] text-[#d4af37] text-xs font-serif tracking-widest uppercase">
                    {activeJacket.category}
                  </span>
                  <span className="text-[10px] text-[#a3b0a2] bg-black/60 px-2 py-0.5 rounded">
                    💡 Cliquez sur les points <span>+</span> pour inspecter
                  </span>
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {activeGallery.length > 1 && (
                <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                  {activeGallery.map((imgUrl, idx) => {
                    const isActive = activeImage === imgUrl;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          isActive
                            ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40 scale-105'
                            : 'border-[#39483c] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          data-vce-gallery-thumbnail="true"
                          data-vce-gallery-product-id={activeJacket.id}
                          data-vce-gallery-index={idx}
                          src={imgUrl}
                          alt={`Vue ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fabrics */}
              <div className={`p-4 rounded-2xl ${cardStyle.card} flex flex-wrap items-center justify-between gap-3 text-xs text-[#b8c5ba]`}>
                <span className="font-serif text-[#d4af37] font-semibold uppercase tracking-wider">
                  Composition Noble :
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeJacket.fabrics.map((fabric, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#28322a] border border-[#435346] text-[#e2d5c3]"
                    >
                      {fabric}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Details with Configurable Product Blocks Order */}
            <div className={`${cardMediaPos === 'right' ? 'lg:col-span-5 lg:order-1' : 'lg:col-span-5'} space-y-6`}>
              {blocksOrder.map((blockId) => renderProductBlock(blockId))}
            </div>
          </div>
        )}

        {/* LAYOUT 2: MAGAZINE EDITORIAL */}
        {layout === 'magazine-editorial' && (
          <div className="space-y-10 max-w-5xl mx-auto">
            {/* Massive Hero Photo */}
            <div className="relative rounded-3xl overflow-hidden border border-[#3d4c40] bg-[#121613] shadow-2xl h-[480px] sm:h-[600px]">
              <img src={activeImage} alt={activeJacket.name} className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121613] via-[#121613]/30 to-transparent" />
              
              <div className="absolute bottom-8 left-6 right-6 sm:left-10 sm:right-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#d4af37] font-serif font-semibold">
                    {activeJacket.category}
                  </span>
                  <h3 className="font-serif text-3xl sm:text-5xl text-[#f3ece0] font-normal mt-1">
                    {activeJacket.name}
                  </h3>
                  <p className="text-sm text-[#d0c5b4] font-serif italic mt-1">
                    "{activeJacket.tagline}"
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-serif text-3xl font-semibold text-[#f3ece0]">
                    {activeJacket.price} {activeJacket.currency}
                  </span>
                  <button
                    onClick={() => onOpenInquiry(activeJacket.id, selectedColor, selectedSize)}
                style={buttonInlineStyle}
                    className={`px-6 py-3 text-xs uppercase tracking-widest ${primaryBtnClass}`}
                  >
                    {orderText}
                  </button>
                </div>
              </div>
            </div>

            {/* Spec Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl ${cardStyle.card}`}>
                <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37] font-semibold mb-3">
                  L'Histoire de la Pièce
                </h4>
                <p className="text-xs text-[#b8c5ba] leading-relaxed">
                  {activeJacket.longDescription}
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${cardStyle.card}`}>
                <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37] font-semibold mb-3">
                  Détails & Matières
                </h4>
                <ul className="text-xs text-[#b8c5ba] space-y-2">
                  <li><strong>Matières :</strong> {activeJacket.fabrics.join(', ')}</li>
                  <li><strong>Poids :</strong> {activeJacket.specs.weight}</li>
                  <li><strong>Résistance :</strong> {activeJacket.specs.waterResistance}</li>
                  <li><strong>Indice Chaleur :</strong> {activeJacket.specs.warmthRating}</li>
                </ul>
              </div>

              <div className={`p-6 rounded-2xl ${cardStyle.card} space-y-4`}>
                <h4 className="font-serif text-sm uppercase tracking-widest text-[#d4af37] font-semibold">
                  Personnalisation
                </h4>
                <div>
                  <span className="block text-[11px] text-[#a3b1a5] mb-2">Couleur : {selectedColor}</span>
                  <div className="flex space-x-2">
                    {activeJacket.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`w-7 h-7 rounded-full ${selectedColor === c.name ? 'ring-2 ring-[#d4af37]' : ''}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] text-[#a3b1a5] mb-2">Taille : {selectedSize}</span>
                  <div className="flex space-x-1.5">
                    {activeJacket.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-2.5 py-1 text-xs ${radius} border ${selectedSize === s ? 'bg-[#d4af37] text-black font-bold' : 'border-[#39483c]'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 3: LOOKBOOK FOCUS (Multi-Angle Gallery) */}
        {layout === 'lookbook-focus' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeGallery.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer h-72 border-2 transition-all ${
                    activeImage === img ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40' : 'border-[#39483c]'
                  }`}
                >
                  <img
                    data-vce-gallery-thumbnail="true"
                    data-vce-gallery-product-id={activeJacket.id}
                    data-vce-gallery-index={idx}
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-[#d4af37] text-[10px] px-2 py-0.5 rounded font-serif">
                    Angle {idx + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className={`p-6 rounded-2xl ${cardStyle.card} flex flex-col md:flex-row items-center justify-between gap-6`}>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#d4af37]">{activeJacket.category}</span>
                <h3 className="font-serif text-2xl text-[#f3ece0]">{activeJacket.name}</h3>
                <p className="text-xs text-[#a3b0a2] max-w-xl">{activeJacket.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-serif text-2xl font-bold text-[#c2a26d]">{activeJacket.price} {activeJacket.currency}</span>
                <button
                  onClick={() => onOpenInquiry(activeJacket.id, selectedColor, selectedSize)}
                style={buttonInlineStyle}
                  className={`px-6 py-3 text-xs uppercase tracking-widest ${primaryBtnClass}`}
                >
                  {orderText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
