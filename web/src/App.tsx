/**
 * What: Root component: loads data (loading / error / empty states) and routes by URL hash:
 *   #/ (opening), #/mission (dashboard), #/site/<id> (site detail). Mission inputs live here so
 *   they survive navigation. No calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useEffect, useState } from 'react';
import { useSites } from './data/useSites';
import { useI18n } from './i18n/I18nProvider';
import { Dashboard } from './screens/Dashboard';
import { Intro } from './screens/Intro';
import { useMissionInputs } from './state/useMission';

function useHash(): string {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

export function App() {
  const state = useSites();
  const hash = useHash();
  const { inputs, update } = useMissionInputs();
  const { t } = useI18n();

  if (hash === '#/' || hash === '') return <Intro />;
  if (state.status === 'loading') {
    return (
      <p className="app" role="status">
        {t('app.loading')}
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="app" role="alert">
        <h1>{t('app.dataErrorTitle')}</h1>
        <p>{t('app.dataErrorIntro')}</p>
        <ul className="mono">
          {state.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (state.sites.length === 0) return <p className="app">{t('app.noSites')}</p>;

  const siteMatch = /^#\/site\/(.+)$/.exec(hash);
  if (siteMatch) {
    const site = state.sites.find((s) => s.id === siteMatch[1]);
    return (
      <main className="app">
        <a className="linkbtn" href="#/mission">
          ◂ {t('app.backToDashboard')}
        </a>
        <h1>{site ? site.name : t('app.unknownSite')}</h1>
        <p className="note">{t('app.detailComing')}</p>
      </main>
    );
  }
  return (
    <Dashboard
      sites={state.sites}
      data={state.data}
      terrain={state.terrain}
      inputs={inputs}
      onInputs={update}
      onOpenSite={(id) => {
        window.location.hash = `#/site/${id}`;
      }}
    />
  );
}
