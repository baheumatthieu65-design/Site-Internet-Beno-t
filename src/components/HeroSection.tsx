import React from 'react';
import { BrandConfig } from '../types';
import { CreationTypeTabs } from './CreationTypeTabs';
import { getCatalogCategories, getCategoryLabel } from '../utils/catalogCategories';
import { Mountain, ArrowDown, Sparkles, Shield, Compass, ChevronRight, Edit3, Layers, Plus } from 'lucide-react';
import { getProductAvailabilityStatus, getProductStatusLabel } from '../utils/productStatus';
import { sortProductsByAvailability } from '../utils/productOrdering';
import {
  getButtonClasses,
  getButtonInlineStyle,
  getCardClasses,
  getTextAlignClass,
  getButtonAlignClass,
  getContentPaddingClass,
  getContainerWidthClass,
} from '../utils/themeStyles';

interface HeroSectionProps {
  brandData: BrandConfig;
  isAdminLoggedIn?: boolean;
  onOpenEditorSection?: (tab: 'brand' | 'j1' | 'j2' | 'theme' | 'layouts' | 'labels' | 'security') => void;
  onSelectJacket: (jacketId: string) => void;
  selectedCategory: string;
  onSelectCategory: (typeId: string) => void;
  onOpenInquiry: (jacketId?: string) => void;
  sectionBackgroundImage?: string;
  sectionBackgroundOpacity?: number;
  sectionBackgroundMediaType?: 'image' | 'video' | 'gif';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  brandData,
  isAdminLoggedIn,
  onOpenEditorSection,
  onSelectJacket,
  selectedCategory,
  onSelectCategory,
  onOpenInquiry,
  sectionBackgroundImage,
  sectionBackgroundOpacity = 100,
  sectionBackgroundMediaType,
}) => {
  const allJackets = brandData.jackets && brandData.jackets.length > 0 ? brandData.jackets : [];
  const categories = getCatalogCategories(allJackets, brandData.theme?.catalogCategories || []);
  const activeCategory = categories.some((type) => type.id === selectedCategory)
    ? selectedCategory
    : categories[0]?.id || '';
  const counts = categories.reduce<Record<string, number>>((acc, type) => {
    acc[type.id] = allJackets.filter((product) => String(product.category || '').trim() === type.id && getProductAvailabilityStatus(product) !== 'sold-out').length;
    return acc;
  }, {});
  // Le Hero suit le même ordre commercial que les autres modules :
  // En vente → Bientôt disponible → Épuisé. Les trois statuts restent visibles.
  const jackets = sortProductsByAvailability(allJackets)
    .filter((j) => String(j.category || '').trim() === activeCategory)
    .filter((j) => getProductAvailabilityStatus(j) !== 'sold-out');
  const theme = brandData.theme;

  // Le Hero utilise exactement la même source que le Lookbook :
  // heroImage est l'image principale de l'article.
  // La galerie ne doit jamais remplacer cette image.
  const getHeroProductImage = (jacket: typeof jackets[number]) =>
    String(jacket.heroImage || '').trim();

  const layout = theme?.heroLayout || 'split-cards';
  const cardStyle = getCardClasses(theme);
  const primaryBtnClass = getButtonClasses(theme, 'primary', 'hero-order');
  const buttonInlineStyle = getButtonInlineStyle(theme, 'hero-order');
  const discoverButtonInlineStyle = getButtonInlineStyle(theme, 'hero-discover');
  const secondaryBtnClass = getButtonClasses(theme, 'secondary', 'hero-discover');

  const textAlignClass = getTextAlignClass(theme);
  const buttonAlignClass = getButtonAlignClass(theme);
  const containerWidthClass = getContainerWidthClass(theme);
  const contentPaddingClass = getContentPaddingClass(theme);

  const badgePosition = theme?.heroBadgePosition || 'top';
  const cardMediaPos = theme?.cardMediaPosition || 'left';

  const scrollToCollection = () => {
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const badgeText = theme?.heroBadgeText || 'Édition Limitée des Pyrénées';
  const titlePrefix = theme?.heroTitlePrefix || 'Thème Champêtre & Élégance';
  const orderText = theme?.orderButtonText || 'Commander';
  const discoverText = theme?.discoverButtonText || 'Découvrir';

  const renderBadge = () => {
    if (badgePosition === 'hidden') return null;
    return (
      <div className={`flex ${textAlignClass === 'text-left' ? 'justify-start' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-center'} mb-6`}>
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#273229]/80 backdrop-blur-md border border-[#4d5e50] text-[#d4af37] text-xs font-serif tracking-widest uppercase shadow-xl">
          <Mountain className="w-3.5 h-3.5 text-[#d4af37]" />
          <span data-vce-id="hero-designer-location">{brandData.designerLocation}</span>
          <span className="text-[#627666]">|</span>
          <span data-vce-id="hero-badge-text" className="text-[#e2d5c3]">{badgeText}</span>
        </div>
      </div>
    );
  };

  /**
   * Titre Hero : les deux lignes sont des éléments DOM indépendants.
   * L'éditeur visuel peut donc sélectionner et modifier chaque ligne
   * sans sélectionner le <h1> parent.
   */
  const renderHeroTitle = (
    prefixClass: string,
    brandClass: string
  ) => (
    <h1
      className="font-serif tracking-tight leading-tight"
      data-vce-title-wrapper="hero-title"
    >
      {titlePrefix && (
        <span
          data-vce-editable="true"
          data-vce-role="hero-line-1"
          data-vce-hero-line="1"
          data-vce-id="hero-title-prefix"
          className={`block ${prefixClass}`}
        >
          {titlePrefix}
        </span>
      )}

      <span
        data-vce-editable="true"
        data-vce-role="hero-line-2"
        data-vce-hero-line="2"
        data-vce-id="hero-brand-name"
        className={`block ${brandClass}`}
      >
        {brandData.brandName}
      </span>
    </h1>
  );

  return (
    <section
      id="hero-section"
      className={`relative min-h-screen flex flex-col justify-between pt-28 pb-12 overflow-hidden ${sectionBackgroundImage || sectionBackgroundMediaType ? 'bg-transparent' : 'bg-[#121613]'} group/hero ${contentPaddingClass}`}
    >
      {/* Background media: le fond personnalisé est porté par le wrapper App. */}
      {!sectionBackgroundImage && !sectionBackgroundMediaType && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {brandData.heroBackground?.type === 'video' && (
            <video
              data-vce-id="hero-background-media"
              src={brandData.heroBackground.url}
              poster={brandData.heroBackground.poster}
              autoPlay muted loop playsInline
              aria-label="Vidéo de présentation des Pyrénées"
              className="w-full h-full object-cover scale-105"
              style={{ objectPosition: `${brandData.heroBackground.positionX ?? 50}% ${brandData.heroBackground.positionY ?? 50}%` }}
            />
          )}
          {brandData.heroBackground && typeof brandData.heroBackground.overlay === 'number' && (
            <div className="absolute inset-0 bg-black" style={{ opacity: brandData.heroBackground.overlay }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121613] via-[#121613]/70 to-black/60" />
          <div className="absolute inset-0 bg-radial-vignette opacity-80" />
        </div>
      )}

      {/* Admin Quick Edit Trigger */}
      {isAdminLoggedIn && onOpenEditorSection && (
        <div className="absolute top-24 right-6 z-30 opacity-90 hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2 bg-[#1b241d]/90 backdrop-blur-md border border-[#d4af37]/60 px-3 py-1.5 rounded-full shadow-2xl text-xs text-[#f3ece0]">
            <span className="text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider">Accueil</span>
            <button
              onClick={() => onOpenEditorSection('layouts')}
              className="px-2 py-0.5 rounded bg-[#28362b] hover:bg-[#344638] text-[#d4af37] flex items-center space-x-1"
              title="Changer l'alignement et les dispositions"
            >
              <Layers className="w-3 h-3" />
              <span>Agencement</span>
            </button>
            <button
              onClick={() => onOpenEditorSection('j1')}
              className="px-2 py-0.5 rounded bg-[#28362b] hover:bg-[#344638] text-white flex items-center space-x-1"
              title="Ajouter ou modifier des articles"
            >
              <Plus className="w-3 h-3 text-[#d4af37]" />
              <span>Articles ({jackets.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className={`relative z-10 ${containerWidthClass} px-4 sm:px-6 lg:px-8 pt-8 md:pt-14 flex-1 flex flex-col justify-center`}>
        {/* Top Heritage Badge */}
        {badgePosition === 'top' && renderBadge()}

        {/* LAYOUT VARIANT: CENTERED MINIMAL */}
        {layout === 'centered-minimal' ? (
          <div className={`${textAlignClass} max-w-4xl mx-auto space-y-6`}>
            {renderHeroTitle(
              'font-serif italic text-[#c2a26d] font-normal text-3xl sm:text-5xl md:text-6xl mb-2',
              'font-serif text-4xl sm:text-6xl md:text-7xl font-light text-[#f5eedf]'
            )}

            {badgePosition === 'below-title' && renderBadge()}

            {brandData.tagline && (
              <p data-vce-id="hero-tagline" className="text-xl sm:text-3xl text-[#d0c5b4] font-serif font-light max-w-2xl mx-auto italic">
                "{brandData.tagline}"
              </p>
            )}

            {brandData.subtitle && (
              <p data-vce-id="hero-subtitle" className="text-sm sm:text-base text-[#a3b0a2] max-w-2xl mx-auto leading-relaxed font-sans pt-2">
                {brandData.subtitle}
              </p>
            )}

            <div className="mt-6 sm:mt-8">
              <CreationTypeTabs
                types={categories}
                selectedCategory={activeCategory}
                onSelect={onSelectCategory}
                counts={counts}
              />
            </div>

            {/* CTA Buttons */}
            <div className={`pt-6 flex flex-wrap items-center ${buttonAlignClass} gap-4`}>
              <button
                onClick={() => onOpenInquiry()}
                style={buttonInlineStyle}
                className={`px-8 py-3.5 text-sm uppercase tracking-widest flex items-center space-x-2 ${primaryBtnClass}`}
              >
                <Sparkles className="w-4 h-4" />
                <span data-vce-id="hero-order-button-text">{orderText}</span>
              </button>

              <button
                onClick={scrollToCollection}
                style={discoverButtonInlineStyle}
                className={`px-7 py-3.5 text-sm uppercase tracking-widest flex items-center space-x-2 ${secondaryBtnClass}`}
              >
                <span data-vce-id="hero-discover-button-text">{discoverText} la collection ({jackets.length} {jackets.length > 1 ? 'créations' : 'création'} {getCategoryLabel(activeCategory)})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dynamic Pills for all jacket models */}
            <div className="pt-8 flex flex-wrap justify-center gap-3">
              {jackets.map((j, idx) => (
                <button
                  key={j.id}
                  onClick={() => onSelectJacket(j.id)}
                  className="px-4 py-2 rounded-xl bg-[#1b221d]/80 border border-[#38473b] hover:border-[#d4af37] text-xs text-[#e2d5c3] flex items-center space-x-2 transition-all hover:scale-105"
                >
                  <span className="text-[#d4af37] font-serif font-bold">N°{idx + 1}</span>
                  <span
                    aria-label={getProductStatusLabel(j)}
                    title={getProductStatusLabel(j)}
                    className={`w-2.5 h-2.5 rounded-full border border-white/60 shadow-sm shrink-0 ${
                      getProductAvailabilityStatus(j) === 'on-sale'
                        ? 'bg-emerald-500'
                        : getProductAvailabilityStatus(j) === 'sold-out'
                          ? 'bg-red-500'
                          : 'bg-amber-400'
                    }`}
                  />
                  <span>{j.name} — {j.price} {j.currency}</span>
                </button>
              ))}
            </div>
          </div>
        ) : layout === 'side-by-side' ? (
          /* LAYOUT VARIANT: SIDE BY SIDE PANORAMA */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto">
            <div className={`lg:col-span-6 space-y-5 ${textAlignClass === 'text-right' ? 'text-right' : 'text-left'}`}>
              {renderHeroTitle(
                'font-serif italic text-[#c2a26d] font-normal text-2xl sm:text-3xl mb-1',
                'font-serif text-4xl sm:text-5xl md:text-6xl font-light text-[#f5eedf]'
              )}

              {badgePosition === 'below-title' && renderBadge()}

              {brandData.tagline && (
                <p data-vce-id="hero-tagline" className="text-lg sm:text-xl text-[#d0c5b4] font-serif font-light italic">
                  "{brandData.tagline}"
                </p>
              )}

              {brandData.subtitle && (
                <p data-vce-id="hero-subtitle" className="text-sm text-[#a3b0a2] leading-relaxed font-sans">
                  {brandData.subtitle}
                </p>
              )}

              <div className="mt-6 sm:mt-8">
                <CreationTypeTabs
                  types={categories}
                  selectedCategory={activeCategory}
                  onSelect={onSelectCategory}
                  counts={counts}
                />
              </div>

              <div className={`pt-3 flex flex-wrap items-center gap-3 ${buttonAlignClass}`}>
                <button
                  onClick={() => onOpenInquiry()}
                style={buttonInlineStyle}
                  className={`px-6 py-3 text-xs uppercase tracking-widest flex items-center space-x-2 ${primaryBtnClass}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span data-vce-id="hero-order-button-text">{orderText}</span>
                </button>
                <button
                  onClick={scrollToCollection}
                style={discoverButtonInlineStyle}
                  className={`px-5 py-3 text-xs uppercase tracking-widest flex items-center space-x-1.5 ${secondaryBtnClass}`}
                >
                  <span data-vce-id="hero-discover-button-text">{discoverText} la collection ({jackets.length} {jackets.length > 1 ? 'créations' : 'création'} {getCategoryLabel(activeCategory)})</span>
                </button>
              </div>
            </div>

            {/* Right Cards */}
            <div className="lg:col-span-6 space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {jackets.map((j, idx) => (
                <div
                  key={j.id}
                  onClick={() => onSelectJacket(j.id)}
                  className={`p-4 rounded-2xl cursor-pointer flex items-center space-x-4 ${cardStyle.card}`}
                >
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-black/40 flex-shrink-0">
                    <img
                      data-vce-id={`hero-product-image-${j.id}`}
                      data-vce-product-id={j.id}
                      src={getHeroProductImage(j)}
                      alt={j.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      aria-label={getProductStatusLabel(j)}
                      title={getProductStatusLabel(j)}
                      className={`absolute top-2 right-2 z-10 w-3.5 h-3.5 rounded-full border-2 border-white/70 shadow-lg ${
                        getProductStatusLabel(j) === 'En vente'
                          ? 'bg-emerald-500'
                          : getProductStatusLabel(j) === 'Épuisé'
                            ? 'bg-red-500'
                            : 'bg-amber-400'
                      }`}
                    />
                    <span className="absolute top-1 left-1 bg-black/80 text-[#d4af37] text-[9px] px-1.5 py-0.5 rounded font-serif">
                      N°{idx + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-widest text-[#a3b1a5]">
                      {j.category}
                    </span>
                    <h3 className="font-serif text-lg text-[#f3ece0] font-semibold truncate">
                      {j.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-serif text-sm font-semibold text-[#c2a26d]">
                        {j.price} {j.currency}
                      </span>
                      <span className="text-xs text-[#d4af37] inline-flex items-center space-x-1 font-medium">
                        <span>Sélectionner</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* DEFAULT LAYOUT VARIANT: SPLIT CARDS */
          <>
            {/* Title & Taglines */}
            <div className={`${textAlignClass} max-w-4xl mx-auto space-y-4`}>
              {renderHeroTitle(
                'font-serif italic text-[#c2a26d] font-normal text-3xl sm:text-5xl md:text-6xl mb-1',
                'font-serif text-4xl sm:text-6xl md:text-7xl font-light text-[#f5eedf]'
              )}

              {badgePosition === 'below-title' && renderBadge()}

              {brandData.tagline && (
                <p data-vce-id="hero-tagline" className="text-lg sm:text-2xl text-[#d0c5b4] font-serif font-light max-w-2xl mx-auto italic">
                  "{brandData.tagline}"
                </p>
              )}

              {brandData.subtitle && (
                <p data-vce-id="hero-subtitle" className="text-sm sm:text-base text-[#a3b0a2] max-w-xl mx-auto leading-relaxed font-sans pt-2">
                  {brandData.subtitle}
                </p>
              )}

            <div className="mt-6 sm:mt-8">
              <CreationTypeTabs
                types={categories}
                selectedCategory={activeCategory}
                onSelect={onSelectCategory}
                counts={counts}
              />
            </div>

            </div>

            {/* Dynamic Jackets Display Cards in Hero */}
            <div className={`mt-10 md:mt-14 grid grid-cols-1 ${jackets.length === 1 ? 'max-w-md' : jackets.length === 2 ? 'md:grid-cols-2 max-w-4xl' : 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl'} gap-6 mx-auto w-full`}>
              {jackets.map((j, idx) => {
                const isMediaTop = cardMediaPos === 'top';
                const isMediaRight = cardMediaPos === 'right';

                return (
                  <div
                    key={j.id}
                    onClick={() => onSelectJacket(j.id)}
                    className={`group relative cursor-pointer rounded-2xl p-4 transition-all duration-300 ${
                      isMediaTop
                        ? 'flex flex-col space-y-3'
                        : isMediaRight
                        ? 'flex flex-row-reverse space-x-reverse space-x-4 items-center'
                        : 'flex items-center space-x-4'
                    } ${cardStyle.card}`}
                  >
                    <div
                      className={`relative rounded-xl overflow-hidden bg-black/40 flex-shrink-0 ${
                        isMediaTop ? 'w-full h-48' : 'w-24 h-28 sm:w-28 sm:h-32'
                      }`}
                    >
                      <img
                        data-vce-id={`hero-product-image-${j.id}`}
                        data-vce-product-id={j.id}
                        src={getHeroProductImage(j)}
                        alt={j.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        aria-label={getProductStatusLabel(j)}
                        title={getProductStatusLabel(j)}
                        className={`absolute top-2 right-2 z-10 w-3.5 h-3.5 rounded-full border-2 border-white/70 shadow-lg ${
                          getProductStatusLabel(j) === 'En vente'
                            ? 'bg-emerald-500'
                            : getProductStatusLabel(j) === 'Épuisé'
                              ? 'bg-red-500'
                              : 'bg-amber-400'
                        }`}
                      />
                      <span className="absolute top-2 left-2 bg-[#121613]/90 text-[#d4af37] text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-serif border border-[#3d4c40]">
                        N°{idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span data-vce-id={`product-${j.id}-category`} className="text-[11px] uppercase tracking-widest text-[#a3b1a5] font-medium block">
                        {j.category}
                      </span>
                      <h3 data-vce-id={`product-${j.id}-name`} className="font-serif text-lg sm:text-xl text-[#f3ece0] font-semibold truncate group-hover:text-[#d4af37] transition-colors">
                        {j.name}
                      </h3>
                      <p data-vce-id={`product-${j.id}-description`} className="text-xs text-[#a8b5a9] line-clamp-2 mt-1">
                        {j.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span data-vce-id={`product-${j.id}-price`} className="font-serif text-base font-semibold text-[#c2a26d]">
                          {j.price} {j.currency}
                        </span>
                        <span className="text-xs text-[#d4af37] group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1 font-medium">
                          <span data-vce-id={`product-${j.id}-discover`}>{discoverText}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Feature Badges below */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs uppercase tracking-widest text-[#a3b0a2]">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#c2a26d]" />
            <span>Matières 100% Nobles</span>
          </div>
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#c2a26d]" />
            <span>Conçu dans les Pyrénées</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#c2a26d]" />
            <span>{jackets.length} Pièces {getCategoryLabel(activeCategory)}</span>
          </div>
        </div>
      </div>

      {/* Down Arrow */}
      <div className="relative z-10 text-center pt-8">
        <button
          onClick={scrollToCollection}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#a3b0a2] hover:text-[#d4af37] transition-colors group"
        >
          <span>Découvrir la collection en détails</span>
          <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform text-[#d4af37]" />
        </button>
      </div>
    </section>
  );
};
