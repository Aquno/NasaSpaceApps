# Lunar Landing Site Navigator

> NASA Space Apps Challenge 2026 — challenge: **Lunar Landing Site Navigator**
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

A small Python pipeline precomputes these files; a static site (Vite + React + TypeScript) reads them. No server.

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

Shackleton rim · Connecting ridge · de Gerlache rim · Malapert massif · Haworth

> **[PLACEHOLDER — coordinates and sources will be listed here once confirmed]**

## Running locally

> **[PLACEHOLDER — instructions will be added as each stage is implemented]**

```bash
# Data pipeline (Python 3.10+)
python -m venv .venv
.venv/Scripts/activate        # Windows; use `source .venv/bin/activate` on Linux/macOS
pip install -r pipeline/requirements.txt
# stage scripts: TBD

# Web interface
cd web
# npm install && npm run dev   — TBD (stage 5)
```

## Limits (declared)

- **Terrain resolution:** the horizon is computed from a downsampled LOLA product; small nearby obstacles may be missed. Exact resolution: **[PLACEHOLDER]**.
- **Closed list of sites:** only the five sites above.
- **Date range:** one year at one-hour steps. Exact interval: **[PLACEHOLDER]**.
- **Sample data:** while the pipeline is incomplete, the interface may use sample files in the final format. These are always flagged as **sample** in the UI.
- **No AI in the calculations:** all numbers come from NASA data or from fixed, verifiable code.

## Disclaimer

This is an independent project built for the NASA Space Apps Challenge. It is **not a NASA product**, is not endorsed by NASA, and **must not be used for real mission planning**. It is a decision-support demonstration.

## Team

> **[PLACEHOLDER — team members]**

## License

> **[PLACEHOLDER — license to be defined]**
