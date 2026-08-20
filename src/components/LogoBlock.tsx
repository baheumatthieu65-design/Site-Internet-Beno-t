import React from 'react';
import { BrandConfig } from '../types';

export interface LogoBlockConfig {
  imageUrl: string;
  text: string;
  secondaryText: string;
  fontFamily: 'serif' | 'sans' | 'display';
  textColor: string;
  textSize: string;
  imageSize: number;
  gap: number;
  showText?: boolean;
}

export type LogoKind = 'boutique' | 'gite';

const DEFAULT_LOGOS: Record<LogoKind, LogoBlockConfig> = {
  boutique: {
    imageUrl: '',
    text: 'MAISON DES\nPYRÉNÉES',
    secondaryText: 'ÉDITION LIMITÉE DES PYRÉNÉES',
    fontFamily: 'serif',
    textColor: '#f3ece0',
    textSize: '24px',
    imageSize: 58,
    gap: 12,
    showText: true,
  },
  gite: {
    imageUrl: '',
    text: 'GÎTE DES\nPYRÉNÉES',
    secondaryText: '',
    fontFamily: 'sans',
    textColor: '#f3ece0',
    textSize: '21px',
    imageSize: 58,
    gap: 12,
    showText: true,
  },
};

export const getLogoConfig = (brandData: BrandConfig, kind: LogoKind): LogoBlockConfig => {
  const configured = ((brandData as BrandConfig & { logos?: Partial<Record<LogoKind, Partial<LogoBlockConfig>>> }).logos?.[kind]) || {};
  if (kind === 'boutique') {
    return {
      ...DEFAULT_LOGOS.boutique,
      imageUrl: brandData.logoUrl || DEFAULT_LOGOS.boutique.imageUrl,
      text: brandData.brandName || DEFAULT_LOGOS.boutique.text,
      ...configured,
    };
  }
  return {
    ...DEFAULT_LOGOS.gite,
    imageUrl: brandData.logoUrl || DEFAULT_LOGOS.gite.imageUrl,
    ...configured,
  };
};

interface LogoBlockProps {
  brandData: BrandConfig;
  kind: LogoKind;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

export const LogoBlock: React.FC<LogoBlockProps> = ({ brandData, kind, onClick, compact = false, className = '' }) => {
  const logo = getLogoConfig(brandData, kind);
  const imageSize = compact ? Math.min(logo.imageSize, 48) : logo.imageSize;
  const textSize = compact ? `clamp(15px, 1.8vw, ${logo.textSize})` : logo.textSize;
  const content = (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: logo.gap }}
    >
      <div
        className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: imageSize,
          height: imageSize,
          border: '1px solid rgba(212,175,55,.65)',
          background: '#202922',
        }}
      >
        {logo.imageUrl ? (
          <img
            data-vce-id={`logo-${kind}-image`}
            src={logo.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-serif font-bold text-[#d4af37]">MP</span>
        )}
      </div>
      {logo.showText !== false && (
        <span
          data-vce-id={`logo-${kind}-name`}
          style={{
            color: logo.textColor,
            fontSize: textSize,
            fontFamily: logo.fontFamily === 'sans' ? 'inherit' : 'Georgia, serif',
            lineHeight: 1.05,
          }}
          className="font-semibold tracking-[.06em] min-w-0 max-w-[260px]"
        >
          <span className="block whitespace-pre-line">{logo.text}</span>
          {logo.secondaryText && (
            <span data-vce-id={`logo-${kind}-secondary`} className="block mt-1 text-[.48em] sm:text-[.42em] font-normal tracking-[.12em] uppercase opacity-80 whitespace-pre-line">
              {logo.secondaryText}
            </span>
          )}
        </span>
      )}
    </div>
  );

  if (!onClick) return content;
  return (
    <button type="button" onClick={onClick} className="text-left group cursor-pointer hover:opacity-95 transition-opacity">
      {content}
    </button>
  );
};
