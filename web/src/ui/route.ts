/**
 * What: Hash route parsing (D53): the opening, the mission panel, the roadmap, a site detail, or
 *   "not found" for any other address. Pure function. Presentation only.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
export type Route =
  | { name: 'intro' }
  | { name: 'mission' }
  | { name: 'roadmap' }
  | { name: 'site'; id: string }
  | { name: 'notFound' };

const SITE_ROUTE = /^#\/site\/([^/]+)$/;

/** Route for a location hash such as "#/site/haworth" (exact match, case-sensitive). */
export function parseRoute(hash: string): Route {
  if (hash === '' || hash === '#' || hash === '#/') return { name: 'intro' };
  if (hash === '#/mission') return { name: 'mission' };
  if (hash === '#/roadmap') return { name: 'roadmap' };
  const site = SITE_ROUTE.exec(hash);
  if (site?.[1]) {
    try {
      return { name: 'site', id: decodeURIComponent(site[1]) };
    } catch {
      return { name: 'notFound' };
    }
  }
  return { name: 'notFound' };
}
