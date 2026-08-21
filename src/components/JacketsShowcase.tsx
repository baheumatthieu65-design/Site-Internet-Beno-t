import React, { useState, useEffect } from 'react';
import { initialBrandData } from '../data/brandData';
import { createPortal } from 'react-dom';
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
import { sortProductsByAvailability } from '../utils/productOrdering';
import { getProductAvailabilityStatus, getProductStatusLabel, isProductOrderable } from '../utils/productStatus';
import {
  getButtonClasses,
  getButtonInlineStyle,
  getCardClasses,
  getTextAlignClass,
  getButtonAlignClass,
  getContentPaddingClass,
  getContainerWidthClass,
} from '../utils/themeStyles';

const rawProductNameFromId = (id: string) => {
  const known: Record<string, string> = {
    'veste-des-cimes': 'La Veste des Cimes',
    'veste-des-cimes-enfant': 'La Veste des Cimes Enfant',
    'manteau-pastorale': 'Le Manteau Pastorale',
  };
  if (known[id]) return known[id];
  return String(id || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Article';
};

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
  sectionBackgroundImage?: string;
  sectionBackgroundOpacity?: number;
  sectionBackgroundMedia?: { type: 'image' | 'gif' | 'video'; url: string; poster?: string; positionX?: number; positionY?: number };
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
  sectionBackgroundImage,
  sectionBackgroundOpacity = 100,
  sectionBackgroundMedia,
}) => {
  // Showcase : affiche tous les articles, y compris « Bientôt disponible »
  // et « Épuisé ». L'ordre commercial reste En vente → Bientôt disponible
  // → Épuisé, puis par numéro de modèle.
  const orderedJackets = sortProductsByAvailability(Array.isArray(jackets) ? jackets : []);
  const visibleJackets = orderedJackets
    .sort((a, b) => {
      const modelNumber = (product: JacketModel) => {
        const source = `${product.subTitle || ''} ${product.name || ''}`;
        const match = source.match(/mod[eè]le\s*n[°ºo]?\s*(\d+)/i) || source.match(/n[°ºo]\s*(\d+)/i);
        return match ? Number(match[1]) : 9999;
      };
      const statusRank = (product: JacketModel) => {
        const status = getProductAvailabilityStatus(product);
        return status === 'on-sale' ? 0 : status === 'coming-soon' ? 1 : 2;
      };
      return statusRank(a) - statusRank(b) || modelNumber(a) - modelNumber(b);
    });
  const activeJacket = visibleJackets.find((j) => j.id === selectedJacketId) || visibleJackets[0] || null;

  const displayProductName = (product: JacketModel) => {
    const raw = String(product.name || '').trim();
    const generic = /^(maison\s+mailha(?:gut)?|maison\s+des\s+pyrenees)$/i.test(raw);
    if (!generic) return raw;
    const extended = product as JacketModel & { title?: string; productName?: string; displayName?: string; label?: string };
    const explicit = [extended.title, extended.productName, extended.displayName, extended.label]
      .map((value) => String(value || '').trim())
      .find((value) => value && !/^(maison\s+mailha(?:gut)?|maison\s+des\s+pyrenees)$/i.test(value));
    if (explicit) return explicit;
    const source = `${product.subTitle || ''} ${product.name || ''}`;
    const modelMatch = source.match(/mod[eè]le\s*n[°ºo]?\s*(\d+)/i) || source.match(/n[°ºo]\s*(\d+)/i);
    if (modelMatch) {
      const modelNumber = Number(modelMatch[1]);
      const fallbackProduct = (initialBrandData.jackets || []).find((candidate) => {
        const candidateSource = `${candidate.subTitle || ''} ${candidate.name || ''}`;
        const candidateMatch = candidateSource.match(/mod[eè]le\s*n[°ºo]?\s*(\d+)/i) || candidateSource.match(/n[°ºo]\s*(\d+)/i);
        return candidateMatch && Number(candidateMatch[1]) === modelNumber;
      });
      if (fallbackProduct?.name) return fallbackProduct.name;
    }
    return rawProductNameFromId(product.id);
  };

  const modelNumberLabel = (product: JacketModel) => {
    const source = `${product.subTitle || ''} ${product.name || ''}`;
    const match = source.match(/mod[eè]le\s*n[°ºo]?\s*(\d+)/i) || source.match(/n[°ºo]\s*(\d+)/i);
    return match ? match[1] : '';
  };
  const [activeImage, setActiveImage] = useState(activeJacket?.heroImage || '');
  const [selectedColor, setSelectedColor] = useState(activeJacket?.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState(activeJacket?.sizes[1] || 'M');
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);

  // Drag and drop state for product blocks
  const [draggingBlockId, setDraggingBlockId] = useState<ProductBlockId | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<ProductBlockId | null>(null);

  // Recalcule aussi l'image active quand la fiche est modifiée sans changer
  // d'identifiant. L'ancien code ne dépendait que de `id`, ce qui laissait
  // l'ancienne photo affichée après un changement de heroImage.
  useEffect(() => {
    if (activeJacket) {
      const gallery = Array.from(new Set([
        activeJacket.heroImage,
        ...(Array.isArray(activeJacket.gallery) ? activeJacket.gallery : []),
      ].map((url) => String(url || '').trim()).filter(Boolean)));
      setActiveImage(gallery[0] || '');
      if (activeJacket.colors.length > 0) {
        setSelectedColor(activeJacket.colors[0].name);
      }
      if (activeJacket.sizes.length > 0) {
        setSelectedSize(activeJacket.sizes[1] || activeJacket.sizes[0]);
      }
      setActiveHotspot(null);
    }
  }, [activeJacket?.id, activeJacket?.heroImage, activeJacket?.gallery?.join('|')]);

  if (!activeJacket) return null;

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
  const galleryImages = Array.from(
    new Set(
      [activeJacket.heroImage, ...(Array.isArray(activeJacket.gallery) ? activeJacket.gallery : [])]
        .map((url) => String(url || '').trim())
        .filter(Boolean)
    )
  );

  const orderText = theme?.orderButtonText || 'Commander';
  const inquiryText = theme?.inquiryButtonText || 'Commander sur Mesure';

  const showcaseImageScale = 100;
  const showcaseFrameWidth = Math.min(100, Math.max(40, Number(theme?.showcaseImageFrameWidth ?? 100)));
  const showcaseFrameHeight = Math.min(520, Math.max(220, Number(theme?.showcaseImageFrameHeight ?? 360)));

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
              {displayProductName(activeJacket)}
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
                onClick={() => isProductOrderable(activeJacket) && onOpenInquiry(activeJacket.id, selectedColor, selectedSize)}
                disabled={!isProductOrderable(activeJacket)}
                style={buttonInlineStyle}
                className={`w-full py-3 px-5 text-sm uppercase tracking-widest flex items-center justify-center space-x-3 ${primaryBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isProductOrderable(activeJacket) ? `${orderText} / Réserver (${activeJacket.price} ${activeJacket.currency})` : getProductStatusLabel(activeJacket)}</span>
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
    <section id="collection" className={`py-20 ${sectionBackgroundImage ? 'bg-transparent' : 'bg-[#151a16]'} text-[#e2d5c3] relative overflow-hidden group/showcase`}>
      {(sectionBackgroundMedia?.url || sectionBackgroundImage) && (
        <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {sectionBackgroundMedia?.type === 'video' ? (
            <video src={sectionBackgroundMedia.url} poster={sectionBackgroundMedia.poster} muted autoPlay loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ opacity: Math.min(100, Math.max(0, sectionBackgroundOpacity)) / 100, objectPosition: `${sectionBackgroundMedia.positionX ?? 50}% ${sectionBackgroundMedia.positionY ?? 50}%` }} />
          ) : sectionBackgroundImage ? (
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(sectionBackgroundImage)})`, opacity: Math.min(100, Math.max(0, sectionBackgroundOpacity)) / 100 }} />
          ) : null}
        </div>
      )}
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

      <div className={`${containerWidthClass} px-4 sm:px-6 lg:px-8 relative z-10`}>
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
                    N°{modelNumberLabel(j) || (idx + 1)}
                  </span>
                  <span>{displayProductName(j)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LAYOUT 1: SPLIT INTERACTIVE (Default / Haute Montagne) */}
        {layout === 'split-interactive' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch max-w-6xl mx-auto">
            {/* Image / hotspots */}
            <div className={`${cardMediaPos === 'right' ? 'lg:col-span-5 lg:order-2' : 'lg:col-span-5'} space-y-3`}>
              <div
                className="relative rounded-3xl bg-[#1d241f] border border-[#39483c] overflow-hidden shadow-2xl group flex items-center justify-center mx-auto"
                style={{ width: '100%', height: `${showcaseFrameHeight}px` }}
              >
                <div className="relative h-full w-full flex items-center justify-center overflow-hidden cursor-zoom-in"
                  onClick={() => setIsImageLightboxOpen(true)}
                  title="Cliquer pour agrandir">
                  <img data-vce-gallery-main="true" data-vce-gallery-product-id={activeJacket.id} src={activeImage} alt={displayProductName(activeJacket)} className="w-full h-full object-cover object-center transition-all duration-500" />
                </div>
                {activeJacket.hotspots.map((hs) => {
                  const isSelected = activeHotspot?.id === hs.id;
                  return (
                    <button key={hs.id} onClick={(event) => { event.stopPropagation(); setActiveHotspot(isSelected ? null : hs); }} style={{ left: `${hs.x}%`, top: `${hs.y}%` }} className="absolute z-20 -translate-x-1/2 -translate-y-1/2" title={hs.title}>
                      <span className="relative flex h-8 w-8 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#d4af37] opacity-40 animate-ping" />
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-[#1a201b] border-2 border-[#d4af37] text-[#d4af37] text-[10px] font-bold items-center justify-center shadow-lg">+</span>
                      </span>
                    </button>
                  );
                })}
                <span className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-lg ${getProductAvailabilityStatus(activeJacket) === 'on-sale' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600' : getProductAvailabilityStatus(activeJacket) === 'sold-out' ? 'bg-red-950/90 text-red-300 border-red-800' : 'bg-amber-950/90 text-amber-200 border-amber-700'}`}>
                  {getProductStatusLabel(activeJacket)}
                </span>
                {activeHotspot && (
                  <div className="absolute bottom-3 left-3 right-3 z-30 p-3 rounded-2xl bg-[#141915]/95 backdrop-blur-md border border-[#d4af37] shadow-2xl">
                    <div className="flex items-center justify-between text-[#d4af37] text-[10px] uppercase tracking-wider font-semibold">
                      <span>{activeHotspot.category}</span><button onClick={() => setActiveHotspot(null)}>✕</button>
                    </div>
                    <h4 className="font-serif text-base text-[#f3ece0] font-semibold mt-1">{activeHotspot.title}</h4>
                    <p className="text-[11px] text-[#b8c5ba] mt-1 leading-relaxed">{activeHotspot.description}</p>
                  </div>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {galleryImages.map((imgUrl, idx) => (
                    <button key={idx} onClick={() => setActiveImage(imgUrl)} className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 ${activeImage === imgUrl ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30' : 'border-[#39483c] opacity-70 hover:opacity-100'}`}>
                      <img src={imgUrl} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Compact horizontal information panel */}
            <div className={`${cardMediaPos === 'right' ? 'lg:col-span-7 lg:order-1' : 'lg:col-span-7'} ${cardStyle.card} rounded-3xl p-5 sm:p-6 flex flex-col justify-between`}>
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#354238] pb-4">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37]">{activeJacket.showcaseEyebrow || activeJacket.category}</span>
                    <h3 className="font-serif text-2xl sm:text-4xl text-[#f3ece0] font-normal mt-1">{displayProductName(activeJacket)}</h3>
                    <p className="text-xs text-[#a8b5a9] mt-1 line-clamp-2">{activeJacket.subTitle || activeJacket.tagline}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3ece0]">{activeJacket.price} {activeJacket.currency}</div>
                    <span className="text-[10px] text-[#8f9f91]">TVA incluse</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#b8c5ba] leading-relaxed py-4 max-w-3xl">{activeJacket.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-[#182019] border border-[#354238] p-3">
                    <span className="text-[9px] uppercase tracking-wider text-[#8f9f91]">Couleur</span>
                    <div className="flex items-center gap-2 mt-2">
                      {activeJacket.colors.map((color) => (
                        <button key={color.name} onClick={() => setSelectedColor(color.name)} title={color.name} style={{ backgroundColor: color.hex }} className={`w-7 h-7 rounded-full border-2 ${selectedColor === color.name ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30' : 'border-[#526355]'}`} />
                      ))}
                      <span className="text-[10px] text-[#c4ceb8] truncate">{selectedColor}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#182019] border border-[#354238] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-[#8f9f91]">Tailles disponibles</span>
                      <span className="text-[9px] text-[#d4af37]">{activeJacket.sizes.length} tailles</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeJacket.sizes.map((size) => (
                        <button key={size} onClick={() => setSelectedSize(size)} className={`px-3 py-1 rounded-lg text-[10px] border ${selectedSize === size ? 'bg-[#d4af37] text-[#121613] border-[#d4af37]' : 'bg-[#202a22] text-[#b8c5ba] border-[#435346]'}`}>{size}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  {([
                    ['Origine', activeJacket.specs.origin],
                    ['Résistance', activeJacket.specs.waterResistance],
                    ['Poids', activeJacket.specs.weight],
                    ['Coupe', activeJacket.specs.fitType],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-[#202a22] border border-[#354238] px-3 py-2">
                      <span className="block text-[8px] uppercase tracking-wider text-[#7f9382]">{label}</span>
                      <span className="block text-[10px] text-[#e2d5c3] truncate mt-0.5">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#354238] flex flex-col sm:flex-row items-center gap-3">
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {activeJacket.fabrics.slice(0, 3).map((fabric) => <span key={fabric} className="px-2.5 py-1 rounded-lg bg-[#28322a] border border-[#435346] text-[9px] text-[#e2d5c3]">{fabric}</span>)}
                </div>
                <button onClick={() => isProductOrderable(activeJacket) && onOpenInquiry(activeJacket.id, selectedColor, selectedSize)} disabled={!isProductOrderable(activeJacket)} style={buttonInlineStyle} className={`shrink-0 px-7 py-3 text-[10px] uppercase tracking-widest ${primaryBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {isProductOrderable(activeJacket) ? `${orderText} / Réserver` : getProductStatusLabel(activeJacket)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 2: MAGAZINE EDITORIAL */}
        {layout === 'magazine-editorial' && (
          <div className="space-y-10 max-w-5xl mx-auto">
            {/* Massive Hero Photo */}
            <div className="relative rounded-3xl overflow-hidden border border-[#3d4c40] bg-[#121613] shadow-2xl h-[480px] sm:h-[600px]">
              <img src={activeImage} alt={displayProductName(activeJacket)} className="w-full h-full object-cover object-center" />
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
              {galleryImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all flex items-center justify-center bg-[#111612] ${
                    activeImage === img ? 'border-[#d4af37] ring-2 ring-[#d4af37]/40' : 'border-[#39483c]'
                  }`}
                  style={{ height: `${Math.min(700, Math.max(220, Number(theme?.lookbookImageFrameHeight ?? 360)))}px` }}
                >
                  <div className="relative h-full flex items-center justify-center overflow-hidden" style={{ width: `${Math.min(100, Math.max(30, Number(theme?.lookbookImageScale ?? 60)))}%` }}>
                    <img
                      data-vce-gallery-thumbnail="true"
                      data-vce-gallery-product-id={activeJacket.id}
                      data-vce-gallery-index={idx}
                      src={img}
                      alt=""
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="absolute bottom-2 left-2 bg-black/70 text-[#d4af37] text-[10px] px-2 py-0.5 rounded font-serif">
                    Angle {idx + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className={`p-6 rounded-2xl ${cardStyle.card} flex flex-col md:flex-row items-center justify-between gap-6`}>
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-[#d4af37]">{activeJacket.category}</span>
                <h3 className="font-serif text-2xl text-[#f3ece0]">{displayProductName(activeJacket)}</h3>
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

        {/* Lightbox Showcase : même comportement d'agrandissement que le Lookbook. */}
        {isImageLightboxOpen && activeImage && typeof document !== 'undefined'
          ? createPortal(
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Vue agrandie de ${displayProductName(activeJacket)}`}
                onClick={() => setIsImageLightboxOpen(false)}
                className="showcase-lightbox fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-zoom-out"
              >
                <div
                  className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl overflow-hidden border border-[#d4af37] bg-[#111612] shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <img
                    src={activeImage}
                    alt={`${displayProductName(activeJacket)} — vue agrandie`}
                    className="block w-full max-h-[88vh] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setIsImageLightboxOpen(false)}
                    className="absolute top-4 right-4 z-10 bg-black/80 text-white px-3 py-2 rounded-full font-bold hover:bg-[#d4af37] hover:text-black transition-colors"
                    aria-label="Fermer l'image agrandie"
                  >
                    ✕
                  </button>
                </div>
              </div>,
              document.body
            )
          : null}
      </div>
    </section>
  );
};
