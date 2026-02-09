// src/features/player/SelectionOverlay.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface SelectionOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  options: string[];
  onSelect: (option: string) => void;
  title: string;
}

const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ isOpen, onClose, options, onSelect, title }) => {
  // Änderung 1: "Active/Focused" State für große Listen (man sieht immer, welche Auswahl gerade aktiv ist)
  const [activeIndex, setActiveIndex] = useState(0);

  // Änderung 2: Hover ist optional, aber bleibt für Maus-UX (zusätzlich zum activeIndex)
  const [hovered, setHovered] = useState<number | null>(null);

  // Änderung 3: Refs auf List-Buttons, damit wir bei Arrow-Nav sauber scrollIntoView machen können
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Änderung 4: Beim Öffnen initialisieren wir den aktiven Index (0 oder "letzter" – hier 0)
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(0);
    setHovered(null);
  }, [isOpen, options.length]);

  // Änderung 5: ESC schließen + ArrowUp/Down + Enter auswählen (gute UX bei vielen Einträgen)
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (!options.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, options.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const option = options[activeIndex];
        if (option) {
          onSelect(option);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, options, activeIndex, onClose, onSelect]);

  // Änderung 6: Wenn activeIndex sich ändert, stellen wir sicher, dass der aktive Eintrag sichtbar ist
  useEffect(() => {
    if (!isOpen) return;
    const el = itemRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  // Änderung 7: Scroll im Hintergrund sperren, solange Overlay offen ist (kein scroll bleed)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Änderung 8: Wichtigster Fix aus deinen Screenshots:
  // -> Backdrop wird "fixed" statt "absolute" => kein Clipping im Player, immer sauber zentriert.
  const styles = useMemo(() => {
    const backdrop: React.CSSProperties = {
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    };

    const panel: React.CSSProperties = {
      width: 'min(560px, 92vw)',
      maxHeight: 'min(640px, 86vh)',
      borderRadius: 18,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.14)',
      background: 'rgba(18,18,18,0.78)',
      boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    };

    // Änderung 9: Header ist sticky => Title & Close bleiben immer sichtbar, auch bei langen Listen
    const header: React.CSSProperties = {
      position: 'sticky',
      top: 0,
      zIndex: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '14px 14px 10px 16px',
      background: 'linear-gradient(180deg, rgba(18,18,18,0.95), rgba(18,18,18,0.78))',
      borderBottom: '1px solid rgba(255,255,255,0.10)',
    };

    const titleStyle: React.CSSProperties = {
      margin: 0,
      fontSize: 16,
      fontWeight: 800,
      letterSpacing: '-0.01em',
      color: 'rgba(255,255,255,0.92)',
    };

    const closeBtn: React.CSSProperties = {
      width: 38,
      height: 38,
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'rgba(255,255,255,0.08)',
      color: 'rgba(255,255,255,0.85)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 180ms ease, transform 120ms ease',
      userSelect: 'none',
      flex: '0 0 auto',
    };

    // Änderung 10: Hint ist ebenfalls sticky, bleibt oben sichtbar, hilft bei UX
    const hint: React.CSSProperties = {
      position: 'sticky',
      top: 58, // ungefähr Headerhöhe
      zIndex: 2,
      padding: '10px 16px 12px 16px',
      color: 'rgba(255,255,255,0.65)',
      fontSize: 12,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      background: 'linear-gradient(180deg, rgba(18,18,18,0.78), rgba(18,18,18,0.60))',
    };

    // Änderung 11: Liste ist der einzige scrollende Bereich (fixe Struktur: Header+Hint oben, Liste scrollt)
    const list: React.CSSProperties = {
      listStyle: 'none',
      margin: 0,
      padding: 10,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1,
    };

    const itemBase: React.CSSProperties = {
      width: '100%',
      textAlign: 'left',
      padding: '12px 12px',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.10)',
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.92)',
      cursor: 'pointer',
      transition: 'background-color 180ms ease, border-color 180ms ease, transform 120ms ease',
      fontSize: 14,
      fontWeight: 650,
      letterSpacing: '-0.01em',
      outline: 'none',
    };

    // Änderung 12: “Active” State (Keyboard) – man sieht immer, was gerade gewählt würde
    const itemActive: React.CSSProperties = {
      background: 'rgba(255,255,255,0.14)',
      borderColor: 'rgba(255,255,255,0.22)',
      boxShadow: '0 0 0 2px rgba(168,175,236,0.35)',
    };

    // Änderung 13: Hover bleibt dezent (Maus-Nutzer)
    const itemHover: React.CSSProperties = {
      background: 'rgba(255,255,255,0.10)',
      borderColor: 'rgba(255,255,255,0.16)',
      transform: 'translateY(-1px)',
    };

    // Änderung 14: Kleine Fade-Overlays oben/unten, damit man “Scrollbarkeit” visuell erkennt
    const fadeTop: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 18,
      pointerEvents: 'none',
      background: 'linear-gradient(180deg, rgba(18,18,18,0.65), rgba(18,18,18,0))',
      zIndex: 3,
    };

    const fadeBottom: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 18,
      pointerEvents: 'none',
      background: 'linear-gradient(0deg, rgba(18,18,18,0.65), rgba(18,18,18,0))',
      zIndex: 3,
    };

    return { backdrop, panel, header, titleStyle, closeBtn, hint, list, itemBase, itemHover, itemActive, fadeTop, fadeBottom };
  }, []);

  // Änderung 15: Wenn Overlay zu -> nicht rendern
  if (!isOpen) return null;

  // Änderung 16: Zentraler Choose-Handler
  const handleChoose = (option: string) => {
    onSelect(option);
    onClose();
  };

  return (
    // Änderung 17: Backdrop-Klick schließt, Panel-Klick stoppt Propagation
    <div style={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      {/* Änderung 18: Lokale Scrollbar-Styles (Pseudo-Elemente gehen nicht via Inline, daher minimaler <style>-Block) */}
      <style>{`
        .selectionOverlay__list::-webkit-scrollbar { width: 10px; }
        .selectionOverlay__list::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); border-radius: 999px; }
        .selectionOverlay__list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 999px; border: 2px solid rgba(0,0,0,0); background-clip: padding-box; }
        .selectionOverlay__list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }

        /* Firefox */
        .selectionOverlay__list { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) rgba(255,255,255,0.06); }
      `}</style>

      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.fadeTop} />
        <div style={styles.fadeBottom} />

        <div style={styles.header}>
          <h3 style={styles.titleStyle}>{title}</h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={styles.closeBtn}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
          >
            ✕
          </button>
        </div>

        <div style={styles.hint}>Tipp: ESC schließen • ↑/↓ navigieren • Enter auswählen</div>

        <ul style={styles.list} className="selectionOverlay__list">
          {options.map((option, idx) => {
            const isHover = hovered === idx;
            const isActive = activeIndex === idx;

            return (
              <li key={option}>
                <button
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => handleChoose(option)}
                  // Änderung 19: Active+Hover zusammenführen (damit man IMMER sieht, was gewählt wird)
                  style={{
                    ...styles.itemBase,
                    ...(isActive ? styles.itemActive : {}),
                    ...(!isActive && isHover ? styles.itemHover : {}),
                  }}
                  onMouseEnter={() => {
                    setHovered(idx);
                    setActiveIndex(idx); // Maus bewegt => aktiver Eintrag folgt (damit Enter/UX konsistent bleibt)
                  }}
                  onMouseLeave={() => setHovered(null)}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default SelectionOverlay;
