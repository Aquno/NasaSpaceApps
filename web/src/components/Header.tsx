/**
 * What: Dashboard header: product name, context (lunar south pole, real NASA data), SAMPLE DATA
 *   badge when any file is marked as sample, language selector and the "What this adds" dialog.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useRef } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSelect } from './LanguageSelect';
import { WhatThisAddsTable } from './WhatThisAdds';
import { WhatThisCovers } from './WhatThisCovers';

interface Props {
  sample: boolean;
}

export function Header({ sample }: Props) {
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
        {t('header.whatThisAdds')} ▸
      </button>
      <LanguageSelect />
      <dialog ref={dialog} aria-label={t('header.whatThisAdds')}>
        <WhatThisAddsTable />
        <WhatThisCovers />
        <form method="dialog">
          <button className="linkbtn" type="submit">
            {t('header.close')}
          </button>
        </form>
      </dialog>
    </header>
  );
}
