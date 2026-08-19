import React from 'react';

interface AdminSheepButtonProps {
  loggedIn?: boolean;
  onClick: () => void;
  onLogout?: () => void;
  className?: string;
}

/**
 * Petit bouton d'accès admin en forme de mouton.
 * Le PNG transparent sert de masque : la zone cliquable suit la silhouette.
 */
export const AdminSheepButton: React.FC<AdminSheepButtonProps> = ({
  loggedIn = false,
  onClick,
  onLogout,
  className = '',
}) => {
  const action = loggedIn && onLogout ? onLogout : onClick;

  return (
    <button
      type="button"
      aria-label={loggedIn ? 'Se déconnecter' : 'Espace administrateur'}
      title={loggedIn ? 'Se déconnecter' : 'Espace administrateur'}
      onClick={action}
      className={`group relative inline-flex items-center justify-center w-14 h-12 shrink-0 bg-[#151b17] hover:bg-[#263229] transition-colors ${className}`}
      style={{
        WebkitMaskImage: "url('/src/assets/admin-sheep.png')",
        maskImage: "url('/src/assets/admin-sheep.png')",
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    >
      <span
        className="absolute inset-0 rounded-full border border-[#d4af37]/60"
        aria-hidden="true"
      />
      <span className="relative z-10 text-[#d4af37] text-lg leading-none">
        {loggedIn ? '×' : '•'}
      </span>
    </button>
  );
};
