/**
 * What: Opening screen: lunar south pole with real NASA data, the problem, the pitch question,
 *   "Today / With this tool", the scope, and the button to enter. (Final design in a later step.)
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { Footer } from '../components/Footer';
import { LanguageSelect } from '../components/LanguageSelect';
import { WhatThisAddsTable } from '../components/WhatThisAdds';
import { WhatThisCovers } from '../components/WhatThisCovers';
import { useI18n } from '../i18n/I18nProvider';

export function Intro() {
  const { t } = useI18n();
  return (
    <main className="app intro">
      <div className="intro-top">
        <p className="caps">{t('intro.kicker')}</p>
        <LanguageSelect />
      </div>
      <h1 className="intro-title">{t('header.title')}</h1>
      <p className="intro-lead">{t('intro.lead')}</p>
      <p className="intro-question">{t('intro.question')}</p>
      <p>
        <a className="linkbtn primary" href="#/mission">
          {t('intro.open')} ▸
        </a>
      </p>
      <h2 className="caps">{t('intro.whatThisAdds')}</h2>
      <WhatThisAddsTable />
      <WhatThisCovers />
      <Footer />
    </main>
  );
}
