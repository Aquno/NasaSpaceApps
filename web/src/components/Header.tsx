/**
 * What: Dashboard header: product name, context (lunar south pole, real NASA data), SAMPLE DATA
 *   badge when any file is marked as sample, navigation (mission panel, Roadmap) with the current
 *   screen marked (D52), language selector and the "About" dialog (comparison, scope, sources;
 *   D50).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSelect } from './LanguageSelect';
import { About, type DataScope } from './About';

/** Screens reachable from the header navigation. */
export type HeaderScreen = 'mission' | 'roadmap';

interface Props {
  sample: boolean;
  /** Screen being shown, marked in the navigation (none on the site detail). */
  current?: HeaderScreen | null;
  /** Data coverage line shown under the sources (when the data is loaded). */
  dataScope?: DataScope | null;
}

export function Header({ sample, current = null, dataScope = null }: Props) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <header className="header">
      <h1>
        <a href="#/">{t('header.title')}</a>{' '}
        <span className="header-tagline">{t('header.tagline')}</span>
      </h1>
      <span className="context">{t('header.context')}</span>
      {sample && <span className="badge-sample">{t('header.sample')}</span>}
      <span className="spacer" />
      <nav className="header-nav" aria-label={t('header.nav')}>
        <a
          className={`linkbtn${current === 'mission' ? ' current' : ''}`}
          href="#/mission"
          aria-current={current === 'mission' ? 'page' : undefined}
        >
          {t('header.mission')}
        </a>
        <a
          className={`linkbtn${current === 'roadmap' ? ' current' : ''}`}
          href="#/roadmap"
          aria-current={current === 'roadmap' ? 'page' : undefined}
        >
          {t('header.roadmap')}
        </a>
      </nav>
      <button type="button" className="linkbtn" onClick={() => dialog.current?.showModal()}>
        {t('header.whatThisAdds')}
      </button>
      <LanguageSelect />
      <dialog ref={dialog} aria-label={t('header.whatThisAdds')}>
        <h2>{t('about.title')}</h2>
        <About dataScope={dataScope} />
        <form method="dialog">
          <button className="linkbtn" type="submit">
            {t('header.close')}
          </button>
        </form>
      </dialog>
    </header>
  );
}
