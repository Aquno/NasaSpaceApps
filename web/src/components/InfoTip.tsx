/**
 * What: Information icon (ⓘ) whose explanation shows on mouse hover or keyboard focus (D50).
 *   The bubble is drawn on top of the page (portal to <body>), placed inside the window and
 *   flipped above the icon when there is no room below; Esc closes it; while closed it takes no
 *   space, so it never widens the page (D53). The text stays linked to the button for screen
 *   readers through a hidden copy.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nProvider';
import { placeTip } from '../ui/tipPosition';

interface Props {
  children: ReactNode;
  /** Preferred side: starts at the icon's left edge ('left') or ends at its right edge. */
  align?: 'left' | 'right';
}

export function InfoTip({ children, align = 'left' }: Props) {
  const { t } = useI18n();
  const id = useId();
  const btn = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const b = btn.current?.getBoundingClientRect();
    const el = bubble.current;
    if (!open || !b || !el) return;
    setPos(
      placeTip(
        b,
        { w: el.offsetWidth, h: el.offsetHeight },
        { w: document.documentElement.clientWidth, h: window.innerHeight },
        align,
      ),
    );
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    // The bubble is placed for the current scroll position; close it when the page moves.
    const onScroll = () => setOpen(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const show = () => {
    setPos(null);
    setOpen(true);
  };
  return (
    <span className="infotip" onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <button
        ref={btn}
        type="button"
        className="infotip-btn"
        aria-label={t('info.label')}
        aria-describedby={id}
        aria-expanded={open}
        onFocus={show}
        onBlur={() => setOpen(false)}
        // Inside a <summary>, a click must not open or close the section.
        onClick={(e) => {
          e.preventDefault();
          if (!open) show();
        }}
      >
        ⓘ
      </button>
      <span id={id} className="visually-hidden">
        {children}
      </span>
      {open &&
        createPortal(
          <span
            ref={bubble}
            className="infotip-text"
            aria-hidden="true"
            style={
              pos
                ? { left: pos.left, top: pos.top, visibility: 'visible' }
                : { left: 0, top: 0, visibility: 'hidden' }
            }
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  );
}
