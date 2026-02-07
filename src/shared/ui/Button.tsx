import React, { useMemo, useState } from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  coverUrl?: string;
  className?: string;
  variant?: "dark" | "light";
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  coverUrl,
  className = '',
  variant = "dark",
  disabled = false,
}) => {

  const [isHovered, setIsHovered] = useState(false);

  // Wichtig: active:scale nur wenn nicht disabled
  const buttonClasses = `
    w-full relative overflow-hidden select-none
    px-4 py-2.5 text-[13px] font-medium tracking-[-0.01em]
    rounded-xl
    transition-all duration-200 ease-out
    ${disabled ? '' : 'active:scale-[0.98]'}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
    flex items-center justify-center gap-2
    ${className}
  `;

const baseStyle = useMemo(() => {
  const isLight = variant === "light";

  const glass = isLight
    ? {
        background: "rgba(0,0,0,0.06)",
        border: "1px solid rgba(0,0,0,0.12)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.55)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        color: "rgba(0,0,0,0.84)",
      }
    : {
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        color: "rgba(255,255,255,0.92)",
      };

    // Hover: etwas heller + klarer
    const hoverGlass = {
      background: 'rgba(255,255,255,0.14)',
      border: '1px solid rgba(255,255,255,0.22)',
      boxShadow:
        '0 14px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.22)',
      color: 'rgba(255,255,255,0.98)',
    };

    const cover = 
    !disabled && isHovered && coverUrl
      ? {
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55)), url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {};

    const current = {
      ...(isHovered && !disabled ? hoverGlass : glass),
      ...cover,
    };

    // Disabled-Look
    if (disabled) {
      return {
        ...current,
        opacity: 0.55,
        cursor: 'not-allowed',
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
      {/* Subtile “Highlight”-Schicht oben, wie iOS Buttons */}
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

      {/* Sehr feiner “Sheen” beim Hover */}
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
