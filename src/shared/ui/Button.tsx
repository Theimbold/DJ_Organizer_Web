import React, { useMemo, useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  coverUrl?: string;
  className?: string;
  variant?: 'dark' | 'light';
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  coverUrl,
  className = '',
  variant = 'dark',
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Änderung: gleiche “Haptik” wie Genre/Mood (Höhe + Radius + Padding)
  const buttonClasses = `
    w-full relative overflow-hidden select-none
    min-h-[64px] px-5 py-4
    text-[14px] font-semibold tracking-[-0.01em]
    rounded-[18px]
    transition-all duration-200 ease-out
    ${disabled ? '' : 'active:scale-[0.98]'}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
    flex items-center justify-center gap-2
    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  // Änderung: EIN useMemo, keine Verschachtelung
  const baseStyle = useMemo<React.CSSProperties>(() => {
    const isLight = variant === 'light';

    const glass: React.CSSProperties = isLight
      ? {
          background: 'rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.55)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          color: 'rgba(0,0,0,0.84)',
        }
      : {
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
          backdropFilter: 'blur(14px) saturate(140%)',
          WebkitBackdropFilter: 'blur(14px) saturate(140%)',
          color: 'rgba(255,255,255,0.92)',
        };

    const hoverGlass: React.CSSProperties = {
      background: 'rgba(255,255,255,0.14)',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow:
        '0 14px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.22)',
      color: 'rgba(255,255,255,0.98)',
    };

    const cover: React.CSSProperties =
      !disabled && isHovered && coverUrl
        ? {
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(${coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : {};

    // Änderung: korrektes Object-Literal
    const current: React.CSSProperties = {
      ...(isHovered && !disabled ? hoverGlass : glass),
      ...cover,
    };

    if (disabled) {
      return {
        ...current,
        opacity: 0.55,
        filter: 'saturate(0.9)',
      };
    }

    return current;
  }, [isHovered, coverUrl, variant, disabled]);

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={buttonClasses}
      style={baseStyle}
    >
      {/* Highlight-Layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.10))',
          opacity: disabled ? 0.35 : isHovered ? 0.9 : 0.75,
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[40%] translate-x-[-60%] rotate-12"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
          opacity: !disabled && isHovered ? 1 : 0,
          transition: 'opacity 200ms ease',
          animation: !disabled && isHovered ? 'btnSheen 900ms ease-out 1' : 'none',
        }}
      />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      <style>{`
        @keyframes btnSheen {
          0% { transform: translateX(-60%) rotate(12deg); }
          100% { transform: translateX(120%) rotate(12deg); }
        }
      `}</style>
    </button>
  );
};

export default Button;
