/**
 * What: Opening screen: title, one sentence, the pitch question, the Moon globe with the south
 *   polar cap highlighted, and the button to enter; below, "What this adds" and the scope.
 *   (Final opening design in a later step.)
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { lazy, Suspense } from 'react';
import { Footer } from '../components/Footer';
import { LanguageSelect } from '../components/LanguageSelect';
import { WhatThisAddsTable } from '../components/WhatThisAdds';
import { WhatThisCovers } from '../components/WhatThisCovers';
import { useI18n } from '../i18n/I18nProvider';

// three.js loads only with the globe, keeping the first paint light.
const MoonGlobe = lazy(() => import('../components/MoonGlobe'));
const INTRO_GLOBE_PX = 320;

export function Intro() {
  const { t } = useI18n();
  return (
    <main className="app intro">
      <div className="intro-top">
        <p className="caps">{t('intro.kicker')}</p>
        <LanguageSelect />
      </div>
      <div className="intro-hero">
        <div>
          <h1 className="intro-title">{t('header.title')}</h1>
          <p className="intro-lead">{t('intro.lead')}</p>
          <p className="intro-question">{t('intro.question')}</p>
          <p>
            <a className="linkbtn primary" href="#/mission">
              {t('intro.open')} ▸
            </a>
          </p>
        </div>
        <Suspense fallback={<div style={{ width: INTRO_GLOBE_PX }} />}>
          <MoonGlobe size={INTRO_GLOBE_PX} spin />
        </Suspense>
      </div>
      <h2 className="caps">{t('intro.whatThisAdds')}</h2>
      <WhatThisAddsTable />
      <WhatThisCovers />
      <Footer />
    </main>
  );
}
