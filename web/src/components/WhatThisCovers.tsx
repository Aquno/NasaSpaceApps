/**
 * What: "What this tool covers" block: scope of the planning tool (static text).
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
export function WhatThisCovers() {
  return (
    <section aria-label="What this tool covers">
      <h2 className="caps">What this tool covers</h2>
      <p className="note">
        A planning tool, used on Earth before launch. Verdicts come from fixed decision rules and
        scoring, shown on screen.
      </p>
      <p className="note">
        <strong>Best case per region, not a landing area:</strong> each site point is the
        most-illuminated 60 m pixel of its NASA region on NASA&apos;s average-illumination map;
        neighbouring pixels can get much less light.
      </p>
      <div className="covers">
        <div>
          <strong>Covers</strong>
          <ul>
            <li>Sunlight at the site (power)</li>
            <li>Direct line of sight to Earth (communication)</li>
            <li>Terrain slope at the site</li>
            <li>Proximity to permanently shadowed regions (science)</li>
          </ul>
        </div>
        <div>
          <strong>Does not cover</strong>
          <ul>
            <li>Trajectory and propellant</li>
            <li>Thermal environment</li>
            <li>Obstacles on the ground (rocks, craters below the map resolution)</li>
            <li>Relay satellite networks</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
