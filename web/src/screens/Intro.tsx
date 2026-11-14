/**
 * What: Opening screen: lunar south pole with real NASA data, the problem, the pitch question,
 *   "Today / With this tool", the scope, and the button to enter. (Final design in step 7.)
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
import { Footer } from '../components/Footer';
import { WhatThisAddsTable } from '../components/WhatThisAdds';
import { WhatThisCovers } from '../components/WhatThisCovers';

export function Intro() {
  return (
    <main className="app" style={{ maxWidth: 900 }}>
      <p className="caps">Lunar south pole · real NASA data</p>
      <h1 style={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>Lunar Site Navigator</h1>
      <p style={{ fontSize: '1.25rem', lineHeight: 1.45 }}>
        At the Moon&apos;s south pole, the Sun and the Earth sit right on the horizon. One ridge can
        leave a lander without power or contact. See, for each site and date, whether it will have
        sunlight and a link to Earth, and which site still works when the launch slips.
      </p>
      <p style={{ fontSize: '1.5rem', lineHeight: 1.3 }}>
        Your launch just slipped three weeks. Which site still works for science and engineering?
      </p>
      <p>
        <a className="linkbtn" href="#/mission" style={{ fontSize: '1.2rem', padding: '8px 18px' }}>
          Open the mission dashboard ▸
        </a>
      </p>
      <h2 className="caps">What this adds</h2>
      <WhatThisAddsTable />
      <WhatThisCovers />
      <Footer />
    </main>
  );
}
