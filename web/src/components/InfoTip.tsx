/**
 * What: Information icon (ⓘ) whose explanation shows on mouse hover or keyboard focus (D50).
 *   Keeps explanations out of the layout; the text is linked to the button for screen readers.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useId, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider';

interface Props {
  children: ReactNode;
  /** Opens toward the left when the icon sits near the right edge. */
  align?: 'left' | 'right';
}

export function InfoTip({ children, align = 'left' }: Props) {
  const { t } = useI18n();
  const id = useId();
  return (
    <span className={`infotip ${align}`}>
      <button
        type="button"
        className="infotip-btn"
        aria-label={t('info.label')}
        aria-describedby={id}
        // Inside a <summary>, a click must not open or close the section.
        onClick={(e) => e.preventDefault()}
      >
        ⓘ
      </button>
      <span role="tooltip" id={id} className="infotip-text">
        {children}
      </span>
    </span>
  );
}
