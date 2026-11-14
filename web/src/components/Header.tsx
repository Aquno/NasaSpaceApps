/**
 * What: Dashboard header: product name, context (lunar south pole, real NASA data), SAMPLE DATA
 *   badge when any file is marked as sample, Roadmap link, language selector and the "About"
 *   dialog (comparison, scope, sources; D50).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSelect } from './LanguageSelect';
import { About, type DataScope } from './About';

interface Props {
  sample: boolean;
  /** Data coverage line shown under the sources (when the data is loaded). */
  dataScope?: DataScope | null;
}

export function Header({ sample, dataScope = null }: Props) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <header className="header">
      <h1>
        <a href="#/">{t('header.title')}</a>
      </h1>
      <span className="context">{t('header.context')}</span>
      {sample && <span className="badge-sample">{t('header.sample')}</span>}
      <span className="spacer" />
      <a className="linkbtn" href="#/roadmap">
        {t('header.roadmap')}
      </a>
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
