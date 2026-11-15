/**
 * What: Root component: loads data (loading / error / partial / empty states, with retry) and
 *   routes by URL hash: #/ (opening), #/mission (dashboard), #/site/<id> (site detail),
 *   #/roadmap, and "not found" for anything else (D53). Mission inputs live here so they survive
 *   navigation. No calculation.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useEffect, useState } from 'react';
import { DataErrorView } from './components/DataErrorView';
import { Header } from './components/Header';
import { Loading } from './components/Loading';
import { useSites } from './data/useSites';
import { useI18n } from './i18n/I18nProvider';
import { Dashboard } from './screens/Dashboard';
import { Intro } from './screens/Intro';
import { NotFound } from './screens/NotFound';
import { Roadmap } from './screens/Roadmap';
import { SiteDetail } from './screens/SiteDetail';
import { useMissionInputs } from './state/useMission';
import { parseRoute } from './ui/route';

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
  const { state, retry } = useSites();
  const route = parseRoute(useHash());
  const { inputs, update } = useMissionInputs();
  const { t } = useI18n();

  if (route.name === 'intro') {
    return (
      <Intro
        ready={
          state.status === 'ready'
            ? { sites: state.sites, data: state.data, sphereRadiusM: state.terrain.sphereRadiusM }
            : null
        }
        error={state.status === 'error' ? { problems: state.problems, onRetry: retry } : null}
      />
    );
  }
  if (route.name === 'roadmap') {
    const sample = state.status === 'ready' && [...state.data.values()].some((d) => d.meta.sample);
    return <Roadmap sample={sample} />;
  }
  if (route.name === 'notFound') return <NotFound />;

  const current = route.name === 'mission' ? 'mission' : null;
  if (state.status === 'loading') {
    // Header stays visible; a discreet indicator sits in the content area (D52).
    return (
      <div className="app">
        <Header sample={false} current={current} />
        <div className="loading-area">
          <Loading text={t('app.loading')} />
        </div>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="app">
        <Header sample={false} current={current} />
        <div className="loading-area">
          <DataErrorView problems={state.problems} onRetry={retry} />
        </div>
      </div>
    );
  }
  if (state.sites.length === 0) return <NotFound title="app.noSitesTitle" text="app.noSites" />;

  if (route.name === 'site') {
    const site = state.sites.find((s) => s.id === route.id);
    if (!site) return <NotFound title="notFound.siteTitle" text="notFound.siteText" />;
    const data = state.data.get(site.id);
    if (!data) {
      return (
        <NotFound title="unavailable.title" text="unavailable.text" params={{ site: site.name }} />
      );
    }
    return <SiteDetail site={site} data={data} inputs={inputs} />;
  }
  return (
    <Dashboard
      sites={state.sites}
      data={state.data}
      unavailable={[...state.unavailable.keys()]}
      terrain={state.terrain}
      inputs={inputs}
      onInputs={update}
      onOpenSite={(id) => {
        window.location.hash = `#/site/${id}`;
      }}
    />
  );
}
