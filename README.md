# Lunar Landing Site Navigator

> NASA Space Apps Challenge 2026 — challenge: **[Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)**
> Status: early development (hackathon, November 14–15, 2026). See [`docs/ROTEIRO.md`](docs/ROTEIRO.md) for current progress (team docs are in Portuguese).

**"Your launch just slipped three weeks. Which site still works for science and engineering?"**

A lightweight, static web tool that lets mission planners, educators and the public compare candidate landing sites and dates near the lunar south pole — showing, for each site and time, whether the **Sun** (power) and the **Earth** (direct-to-Earth communication) are above the real terrain horizon.

> 🖼️ **[PLACEHOLDER — screenshot of the mission panel]**
>
> 🔗 **[PLACEHOLDER — live demo link]**
>
> 🎬 **[PLACEHOLDER — demo video link]**

---

## The problem

At the lunar south pole the Sun and the Earth stay very low on the horizon. Whether a lander gets sunlight for power, or a line of sight to Earth for communication, is decided by the surrounding terrain — a crater rim or a mountain a few kilometres away can block them for days.

The data needed to answer this already exists (JPL Horizons ephemerides, LOLA topography, LROC Quickmap, Moon Trek), but it is scattered across specialist tools. When a mission schedule slips, there is no quick way to compare the alternatives.

## Our angle: science vs. engineering

- **Science** wants to land close to permanently shadowed regions (PSRs), where water ice may be trapped.
- **Engineering** wants sunlight and a direct line of sight to Earth.

The tool shows both sides on the same screen — illumination and Earth visibility next to distance to the nearest permanent shadow — and highlights the best compromise for the chosen dates.

## How it works

Everything is converted to a single point of view: **the sky as seen from the landing site**, described by **azimuth** (direction) and **elevation** (height above the horizon).

1. **Ephemerides** — JPL Horizons gives the azimuth and elevation of the Sun and the Earth, hour by hour, from each site (against an ideal, flat horizon).
2. **Terrain horizon** — LOLA topography (NASA Goddard PGDA) is turned into a 360° horizon profile: for each azimuth degree, the elevation angle of the terrain.
3. **Visibility rule** — a body is visible when its elevation is greater than the terrain elevation in the same direction.
4. **Science value** — the PGDA permanent-shadow map gives each site's distance to the nearest permanently shadowed region.

A small Python pipeline precomputes the terrain horizon and the Sun/Earth series; a static site (Vite + React + TypeScript) reads them. The visibility rule and all metrics live in a single tested TypeScript module in the web app — the same code is used to validate our results against NASA's published illumination. No server.

Architecture details: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md). Data format: [`docs/CONTRATO_DE_DADOS.md`](docs/CONTRATO_DE_DADOS.md).

## NASA data used

| Source | What we use it for |
|--------|--------------------|
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) ([API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)) | Sun and Earth azimuth/elevation from each site |
| [LOLA polar topography and PSR map — PGDA product 90](https://pgda.gsfc.nasa.gov/products/90) | Terrain horizon; distance to permanent shadow |
| [LOLA 5 m site tiles — PGDA product 78](https://pgda.gsfc.nasa.gov/products/78) | Higher-resolution terrain near sites (if time allows) |
| [Average illumination — PGDA product 69](https://pgda.gsfc.nasa.gov/products/69) | Validation of our computed illumination |
| [LROC Quickmap](https://quickmap.lroc.asu.edu/), [Moon Trek](https://trek.nasa.gov/moon/) | Visual cross-checks and context |

Full list: [`docs/REFERENCIAS.md`](docs/REFERENCIAS.md).

## Candidate sites (fixed list)

Shackleton rim · Connecting ridge · de Gerlache rim · Malapert massif · Haworth · plus *Shackleton inner wall* (sensitivity demo)

These are **regional reference points**, not NASA-designated landing sites. Latitude/longitude in degrees, lunar mean-Earth frame (MOON_ME, DE421), east-positive longitude.

| Site | Lat | Lon | Source |
|---|---|---|---|
| Shackleton rim | -89.780445 | -156.168582 | Point derived on the rim crest inside the NASA region Site04 (M2M-30044 Lunar Surface Data Book, 2025, Table A2.1-1; rule in docs/DECISOES.md D20) |
| Connecting ridge | -89.468 | -137.4 (222.6° E) | NASA ACD-50044 Lunar Surface Data Book (2022), point CR1 |
| de Gerlache rim | -88.6834 | -67.9321 | NASA M2M-30044 (2025), Table A2.1-1 ("de Gerlache Rim 1") |
| Malapert massif | -85.9948 | -0.23578 | NASA M2M-30044 (2025), Table A2.1-1 |
| Haworth | -86.7639 | -22.777 | NASA M2M-30044 (2025), Table A2.1-1 |
| Shackleton inner wall (Site04 center) | -89.7668 | -171.87 | NASA M2M-30044 (2025), Table A2.1-1 — published region centre on the crater's inner wall, kept to show sensitivity to position |

Published region centres were independently cross-checked against the extents of the LOLA 5 m DEM tiles (PGDA product 78): agreement within 1.3 m.

## Running locally

> **[PLACEHOLDER — instructions will be added as each stage is implemented]**

```bash
# Data pipeline (Python 3.10+)
python -m venv .venv
.venv/Scripts/activate        # Windows; use `source .venv/bin/activate` on Linux/macOS
pip install -r pipeline/requirements.txt
python -m pipeline.ephemeris.run_ephemeris     # stage 1: Sun/Earth ephemerides from JPL Horizons
python -m pipeline.horizon.run_horizon         # stage 2: 360-degree terrain horizon from LOLA (PGDA 90)
python -m pipeline.science.run_science         # stage 3: distance to nearest permanently shadowed region
python -m pipeline.sites.verify_site_points    # cross-check site coordinates against PGDA tiles
ruff check . && pytest                          # lint and tests
# later stages: TBD

# Web interface
cd web
# npm install && npm run dev   — TBD (stage 5)
# `npm run sync-data` copies data/app/ into web/public/data/ and runs before dev and build
```

## Limits (declared)

- **Terrain resolution:** the horizon uses the LOLA 20 m south polar DEM (PGDA product 90) at 20 m up to 5 km from the site, and its 80 m and 320 m overviews up to 40 km and 200 km. Obstacles smaller than those pixels may be missed, and how the overviews were generated is not documented (distant peaks may be slightly lowered).
- **Search radius and DEM edge:** 200 km. Where a ray leaves the DEM (a ±304 km square), terrain beyond is treated as unknown; this affects 13.9% of directions at Malapert massif.
- **Observer:** DEM terrain height plus a 2 m mast (a team choice, not a NASA requirement). Heights are taken as metres above the 1737.4 km sphere, inferred from the datum declared in the DEM file.
- **Shackleton rim reference point:** the NASA-published Site04 centre lies on the crater's inner wall (31° slope). The "Shackleton rim" site uses a point derived on the rim crest (3.6° slope, rule in docs/DECISOES.md D20); the published centre is kept as "Shackleton inner wall" to show how much the exact position matters.
- **Closed list of sites:** only the five sites above.
- **Date range:** January 1 to December 31, 2027 (UTC), one-hour steps. Launch-slip comparisons only work within this year.
- **Observer height:** ephemerides use an observer at 0 km above the 1737.4 km reference sphere; the effect on Sun/Earth angles is negligible.
- **Leap seconds:** for 2027 JPL Horizons holds the last known leap second constant (possible 1 s offset).
- **Science indicator:** distance to the nearest permanently shadowed region of at least 1 km² (PGDA product 90). Using proximity to permanent shadow as a science indicator, and the 1 km² bound, are our team's choices, not NASA criteria.
- **Sample data:** while the pipeline is incomplete, the interface may use sample files in the final format. These are always flagged as **sample** in the UI.
- **No AI in the calculations:** all numbers come from NASA data or from fixed, verifiable code.

## Disclaimer

This is an independent project built for the NASA Space Apps Challenge. It is **not a NASA product**, is not endorsed by NASA, and **must not be used for real mission planning**. It is a decision-support demonstration.

## Team

> **[PLACEHOLDER — team members]**

## License

> **[PLACEHOLDER — license to be defined]**
