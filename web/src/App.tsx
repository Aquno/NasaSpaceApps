/**
 * What: Root component. Step 1 shell: shows loading, error (file + field) or a data summary.
 *   Screens are added in later steps (see web/README.md).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { useSites } from './data/useSites';

export function App() {
  const state = useSites();
  if (state.status === 'loading') return <p role="status">Loading site data…</p>;
  if (state.status === 'error') {
    return (
      <div role="alert">
        <h1>Data error</h1>
        <ul>
          {state.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (state.sites.length === 0) return <p>No sites in sites.json.</p>;
  return (
    <main>
      <h1>Lunar Site Navigator</h1>
      <ul>
        {state.sites.map((s) => (
          <li key={s.id}>
            {s.name}: {state.data.get(s.id)?.meta.count} hourly records
          </li>
        ))}
      </ul>
    </main>
  );
}
