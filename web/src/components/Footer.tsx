/**
 * What: Footer: sources, nature of the site points and the independent-project notice.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md).
 */
export function Footer() {
  return (
    <footer className="footer">
      <p>
        Sources: JPL Horizons (Sun and Earth positions); LRO LOLA topography, illumination and
        permanent-shadow products, NASA Goddard PGDA (products 69, 78, 90); NASA Lunar Surface Data
        Book (site regions).
      </p>
      <p>
        <strong>Regional reference points, not NASA-designated landing sites.</strong>{' '}
        <strong>Independent hackathon project, not a NASA product.</strong> NASA Space Apps
        Challenge 2026.
      </p>
    </footer>
  );
}
