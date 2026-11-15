/**
 * What: Root component: loads data (loading / error / empty states) and routes by URL hash:
 *   #/ (opening), #/mission (dashboard), #/site/<id> (site detail). Mission inputs live here so
 *   they survive navigation. No calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Loading } from './components/Loading';
import { useSites } from './data/useSites';
import { useI18n } from './i18n/I18nProvider';
import { Dashboard } from './screens/Dashboard';
import { Intro } from './screens/Intro';
import { Roadmap } from './screens/Roadmap';
import { SiteDetail } from './screens/SiteDetail';
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

  if (hash === '#/' || hash === '') {
    return (
      <Intro
        ready={
          state.status === 'ready'
            ? { sites: state.sites, data: state.data, sphereRadiusM: state.terrain.sphereRadiusM }
            : null
        }
      />
    );
  }
  if (hash === '#/roadmap') {
    const sample = state.status === 'ready' && [...state.data.values()].some((d) => d.meta.sample);
    return <Roadmap sample={sample} />;
  }
  if (state.status === 'loading') {
    // Header stays visible; a discreet indicator sits in the content area (D52).
    return (
      <div className="app">
        <Header sample={false} current={hash === '#/mission' ? 'mission' : null} />
        <div className="loading-area">
          <Loading text={t('app.loading')} />
        </div>
      </div>
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
    const data = site ? state.data.get(site.id) : undefined;
    if (!site || !data) {
      return (
        <main className="app">
          <a className="linkbtn" href="#/mission">
            ◂ {t('app.backToDashboard')}
          </a>
          <p>{t('detail.notFound')}</p>
        </main>
      );
    }
    return <SiteDetail site={site} data={data} inputs={inputs} />;
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
