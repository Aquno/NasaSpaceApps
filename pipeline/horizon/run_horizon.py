"""
What: Orchestrate stage 2: for each site, read the LOLA DEM windows (by HTTP range, cached),
    compute the 360-degree terrain horizon, write data/horizon/<id>.json, a check plot with
    one month of stage 1 Sun/Earth positions, and data/horizon/REPORT.md.
Roadmap stage: 2 — Horizon (see docs/ROTEIRO.md)
Inputs: pipeline/sites.json; LOLA DEM COG (PGDA product 90); data/ephemeris/<id>.json (plots only).
Outputs: data/horizon/<id>.json, data/horizon/plots/<id>.png, data/horizon/REPORT.md;
    DEM tile cache in data/raw/pgda90/.
NASA data source: LOLA south polar DEM, PGDA product 90 (https://pgda.gsfc.nasa.gov/products/90).

No visibility or metric is computed here (docs/DECISOES.md D9).

Usage:
    python -m pipeline.horizon.run_horizon
    python -m pipeline.horizon.run_horizon --sites shackleton-rim --mast-m 2 --radius-km 200
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from pipeline import config
from pipeline.horizon.dem_cog import CogDem, http_tile_fetcher, open_cog, read_window
from pipeline.horizon.geometry import bilinear, smooth_sphere_dip_deg
from pipeline.horizon.horizon_profile import Band, HorizonResult, compute_horizon
from pipeline.horizon.report import SiteSummary, render_report, summarize
from pipeline.sites.crest_point import slope_deg
from pipeline.sites.polar_stereo import forward_south_polar
from pipeline.sites.site_list import Site, load_sites

EXIT_CHECK_FAILED = 2
DEG_DECIMALS = 4
KM_DECIMALS = 3
M_PER_KM = 1000.0


class HorizonError(RuntimeError):
    """Stage 2 cannot produce a valid horizon for a site."""


def level_for_pixel(dem: CogDem, pixel_m: float) -> int:
    """Index of the COG level whose pixel size equals ``pixel_m``."""
    for index, level in enumerate(dem.levels):
        if abs(level.pixel_m - pixel_m) < 1e-6:
            return index
    raise HorizonError(f"DEM has no level with {pixel_m} m pixels")


def bands_for_radius(radius_m: float) -> list[Band]:
    """Configured distance bands truncated at the search radius (metres)."""
    bands, inner = [], 0.0
    for edge, pixel in config.HORIZON_BANDS_M:
        if inner >= radius_m:
            break
        bands.append(Band(min(edge, radius_m), pixel))
        inner = edge
    return bands


def load_terrain(dem: CogDem, fetch, site: Site, bands: list[Band]):
    """Read one window per band around the site; return (lookup, site terrain height, levels)."""
    x0, y0 = forward_south_polar(site.lat, site.lon, dem.sphere_radius_m)
    grids, levels = [], []
    for band in bands:
        level = level_for_pixel(dem, band.step_m)
        half = band.max_distance_m + config.HORIZON_WINDOW_MARGIN_M
        grids.append(read_window(dem, level, x0 - half, x0 + half, y0 - half, y0 + half, fetch))
        levels.append(level)

    def lookup(band_index: int, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        grid, x_left, y_top, px = grids[band_index]
        return bilinear(grid, x_left, y_top, px, x, y)

    site_height = float(lookup(0, np.array([x0]), np.array([y0]))[0])
    if not np.isfinite(site_height):
        raise HorizonError(f"{site.id}: no DEM height at the site")
    slope = slope_deg(lambda x, y: lookup(0, x, y), x0, y0, bands[0].step_m)
    return lookup, site_height, slope, levels


def build_document(
    site: Site,
    dem: CogDem,
    result: HorizonResult,
    bands: list[Band],
    levels: list[int],
    terrain_m: float,
    slope: float,
    mast_m: float,
) -> dict:
    """Output document for data/horizon/<id>.json (format: pipeline/horizon/README.md)."""
    observer_m = terrain_m + mast_m

    def rounded(values: np.ndarray, decimals: int, scale: float = 1.0) -> list:
        return [None if np.isnan(v) else round(float(v) / scale, decimals) for v in values]

    return {
        "meta": {
            "site_id": site.id,
            "site_name": site.name,
            "lat": site.lat,
            "lon": site.lon,
            "frame": "MOON_ME (mean Earth/polar axis of DE421)",
            "dem_product": config.HORIZON_DEM_PRODUCT,
            "dem_url": dem.url,
            "dem_reference_surface": (
                f"sphere of {dem.sphere_radius_m / M_PER_KM} km (datum declared in the file; "
                "heights in metres above it)"
            ),
            "bands": [
                {
                    "max_distance_m": b.max_distance_m,
                    "pixel_m": dem.levels[lv].pixel_m,
                    "cog_level": lv,
                }
                for b, lv in zip(bands, levels, strict=True)
            ],
            "search_radius_m": bands[-1].max_distance_m,
            "fine_azimuth_step_deg": result.fine_step_deg,
            "bin_convention": "horizon_deg[i] = max over azimuths in [i - 0.5, i + 0.5) degrees",
            "azimuth_convention": (
                "degrees, clockwise from north (N=0, E=90, S=180, W=270), as Horizons"
            ),
            "terrain_height_m": round(terrain_m, 2),
            "terrain_slope_deg": round(slope, 1),
            "terrain_slope_method": "central differences over one 20 m DEM pixel at the site",
            "mast_height_m": mast_m,
            "observer_height_above_sphere_m": round(observer_m, 2),
            "smooth_sphere_dip_deg": round(
                smooth_sphere_dip_deg(observer_m, dem.sphere_radius_m), 4
            ),
            "method": (
                "3D vectors from the Moon's centre on a sphere; rays along great circles; "
                "elevation angle of each terrain sample above the observer's local horizontal; "
                "maximum per ray, then maximum per whole-degree bin; not clamped at zero"
            ),
            "edge_rule": (
                "a ray stops at the first sample outside the DEM; terrain beyond is unknown "
                "(cut_distance_km records where)"
            ),
            "horizon_method": "lola",
            "computed_on": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "sample": False,
        },
        "horizon_deg": rounded(result.elevation_deg, DEG_DECIMALS),
        "obstacle_distance_km": rounded(result.obstacle_distance_m, KM_DECIMALS, M_PER_KM),
        "cut_distance_km": rounded(result.cut_distance_m, KM_DECIMALS, M_PER_KM),
    }


def plot_site(site: Site, horizon_deg: np.ndarray, ephemeris_path: Path, out_path: Path, days: int):
    """Check plot: horizon contour with `days` of stage 1 Sun/Earth positions (no visibility)."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    series = json.loads(ephemeris_path.read_text(encoding="utf-8"))["series"][: days * 24]
    az = np.arange(360)
    fig, ax = plt.subplots(figsize=(11, 4.2), dpi=110)
    floor = min(np.nanmin(horizon_deg), min(r["sun_el"] for r in series)) - 1.0
    ax.fill_between(
        az, floor, horizon_deg, color="#8a8a8a", alpha=0.55, step="mid", label="terrain (LOLA)"
    )
    ax.plot(az, horizon_deg, color="#333333", lw=1.0, drawstyle="steps-mid")
    ax.scatter(
        [r["sun_az"] for r in series],
        [r["sun_el"] for r in series],
        s=4,
        marker="o",
        color="#e08a00",
        label=f"Sun, hourly, first {days} days (stage 1)",
    )
    ax.scatter(
        [r["earth_az"] for r in series],
        [r["earth_el"] for r in series],
        s=4,
        marker="^",
        color="#1f5fbf",
        label=f"Earth, hourly, first {days} days (stage 1)",
    )
    ax.axhline(0, color="#555555", lw=0.6, ls="--")
    ax.set_xlim(0, 360)
    ax.set_xticks(
        range(0, 361, 45), ["N 0", "45", "E 90", "135", "S 180", "225", "W 270", "315", "N 360"]
    )
    ax.set_xlabel("Azimuth (degrees, clockwise from north)")
    ax.set_ylabel("Elevation (degrees)")
    ax.set_title(
        f"{site.name}: terrain horizon vs. Sun/Earth paths"
        " - visual check only, no visibility computed"
    )
    ax.legend(loc="upper right", fontsize=8)
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path)
    plt.close(fig)


def main(argv: list[str] | None = None) -> int:
    """Command-line entry point. Returns the process exit code."""
    parser = argparse.ArgumentParser(description="Stage 2: terrain horizon from the LOLA DEM.")
    parser.add_argument("--sites", nargs="*", help="site ids (default: all)")
    parser.add_argument("--mast-m", type=float, default=config.HORIZON_MAST_HEIGHT_M)
    parser.add_argument("--radius-km", type=float, default=config.HORIZON_BANDS_M[-1][0] / M_PER_KM)
    parser.add_argument("--fine-step-deg", type=float, default=config.HORIZON_FINE_STEP_DEG)
    parser.add_argument("--out-dir", type=Path, default=config.HORIZON_DIR)
    parser.add_argument(
        "--cache-dir", type=Path, default=config.RAW_DIR / "pgda90" / "LDEM_80S_20MPP_ADJ"
    )
    parser.add_argument("--plot-days", type=int, default=config.HORIZON_PLOT_DAYS)
    args = parser.parse_args(argv)
    if not 0 < args.fine_step_deg < 1:
        parser.error("--fine-step-deg must be between 0 and 1")

    import truststore

    truststore.inject_into_ssl()  # use the OS certificate store (see requirements.txt)

    bands = bands_for_radius(args.radius_km * M_PER_KM)

    sites = load_sites(config.SITES_FILE)
    if args.sites:
        sites = [s for s in sites if s.id in args.sites]
    dem = open_cog(config.HORIZON_DEM_URL, args.cache_dir)
    fetch = http_tile_fetcher(dem, args.cache_dir)

    summaries: list[SiteSummary] = []
    exit_code = 0
    for site in sites:
        print(f"{site.id}: reading DEM windows and computing horizon ...")
        lookup, terrain_m, slope, levels = load_terrain(dem, fetch, site, bands)
        result = compute_horizon(
            site.lat,
            site.lon,
            terrain_m + args.mast_m,
            dem.sphere_radius_m,
            bands,
            lookup,
            args.fine_step_deg,
        )
        doc = build_document(site, dem, result, bands, levels, terrain_m, slope, args.mast_m)
        args.out_dir.mkdir(parents=True, exist_ok=True)
        (args.out_dir / f"{site.id}.json").write_text(json.dumps(doc, indent=1), encoding="utf-8")

        ephemeris = config.EPHEMERIS_DIR / f"{site.id}.json"
        if ephemeris.exists():
            plot_site(
                site,
                result.elevation_deg,
                ephemeris,
                args.out_dir / "plots" / f"{site.id}.png",
                args.plot_days,
            )
        else:
            print(f"  no stage 1 file {ephemeris.name}; plot skipped")

        summary = summarize(site.id, terrain_m, slope, args.mast_m, dem.sphere_radius_m, result)
        summaries.append(summary)
        print(
            f"  horizon {summary.min_deg:.2f} .. {summary.max_deg:.2f} deg; "
            f"cut {summary.cut_fraction:.1%}"
        )
        if not summary.sane:
            print(f"STOP: {site.id}: {summary.sanity_message}", file=sys.stderr)
            exit_code = EXIT_CHECK_FAILED
            break

    report = render_report(summaries, bands, dem, args.mast_m, args.fine_step_deg)
    (args.out_dir / "REPORT.md").write_text(report, encoding="utf-8")
    print()
    print(report)
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
