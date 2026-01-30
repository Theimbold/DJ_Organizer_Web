import React, { useMemo, useState } from 'react';

interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    coverUrl?: string;
    className?: string; // Although not used in this specific button's styling, it's good practice to keep it for flexibility.
}

const Button: React.FC<ButtonProps> = ({ children, onClick, coverUrl, className = '' }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Apple-ish: weiche Rundungen, Glassmorphism, feine Border, subtiler Schatten,
  // "Press" Animation, Fokus-Ring, sehr clean.
  const buttonClasses = `
    w-full relative overflow-hidden select-none
    px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em]
    rounded-xl
    transition-all duration-200 ease-out
    active:scale-[0.98]
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
    flex items-center justify-center gap-2
    ${className}
  `;

  const baseStyle = useMemo(() => {
    // Frosted glass look
    const glass = {
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.18)',
      boxShadow:
        '0 10px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
      backdropFilter: 'blur(14px) saturate(140%)',
      WebkitBackdropFilter: 'blur(14px) saturate(140%)',
      color: 'rgba(255,255,255,0.92)',
    };

    // Hover: etwas heller + klarer
    const hoverGlass = {
      background: 'rgba(255,255,255,0.14)',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow:
        '0 14px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.22)',
      color: 'rgba(255,255,255,0.98)',
    };

    // Optional: Cover-Image als “tinted” Hintergrund beim Hover (Apple Music-ish)
    const cover = isHovered && coverUrl
      ? {
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {};

    return {
      ...(isHovered ? hoverGlass : glass),
      ...cover,
    };
  }, [isHovered, coverUrl]);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={buttonClasses}
      style={baseStyle}
    >
      {/* Subtile “Highlight”-Schicht oben, wie iOS Buttons */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 45%, rgba(0,0,0,0.10))',
          opacity: isHovered ? 0.9 : 0.75,
          transition: 'opacity 200ms ease',
        }}
      />

      {/* Sehr feiner “Sheen” beim Hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[40%] translate-x-[-60%] rotate-12"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 200ms ease',
          animation: isHovered ? 'btnSheen 900ms ease-out 1' : 'none',
        }}
      />

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* Keyframes nur in dieser Datei */}
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
