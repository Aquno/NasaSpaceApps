"""
What: Derive the "Shackleton rim" crest point from the published Site04 centre (rule in
    pipeline/sites/crest_point.py) and print the local terrain slope at every site.
Roadmap stage: 2 — Horizon (site point review, D20; superseded by D30, kept to measure slopes)
Inputs: pipeline/sites.json; LOLA 20 m DEM (PGDA product 90, read by HTTP range, cached);
    PGDA product 78 Site04 GeoTIFF header (region bounds).
Outputs: printed derived point (lat/lon degrees MOON_ME, height m, distance m) and slopes.
NASA data source: PGDA products 90 and 78; NASA M2M-30044 Lunar Surface Data Book.

Usage: python -m pipeline.sites.derive_crest_point
"""

from __future__ import annotations

import numpy as np

from pipeline import config
from pipeline.horizon.dem_cog import http_tile_fetcher, open_cog, read_window
from pipeline.horizon.geometry import bilinear
from pipeline.sites.crest_point import nearest_crest_maximum, slope_deg
from pipeline.sites.geotiff_header import fetch_header_bytes, parse_georef
from pipeline.sites.polar_stereo import forward_south_polar, inverse_south_polar
from pipeline.sites.site_list import load_sites
from pipeline.sites.verify_site_points import tile_url

PUBLISHED_CENTRE = (-89.7668, -171.87)  # Site04 centre, M2M-30044 Table A2.1-1
REGION_TILE = "Site04"
FULL_RES_LEVEL = 0  # 20 m


def region_bounds(tile: str) -> tuple[float, float, float, float]:
    """(x_min, x_max, y_min, y_max) in metres of a PGDA product 78 tile."""
    url = tile_url(tile)
    g = parse_georef(fetch_header_bytes(url, config.RAW_DIR / "pgda78" / f"{tile}_surf_header.bin"))
    x0, y0 = g.tiepoint[3], g.tiepoint[4]
    return x0, x0 + g.width * g.pixel_scale[0], y0 - g.height * g.pixel_scale[1], y0


def main() -> None:
    """Print the derived crest point and the slope at each site."""
    import truststore

    truststore.inject_into_ssl()  # use the OS certificate store (see requirements.txt)
    cache = config.RAW_DIR / "pgda90" / "LDEM_80S_20MPP_ADJ"
    dem = open_cog(config.HORIZON_DEM_URL, cache)
    fetch = http_tile_fetcher(dem, cache)
    radius = dem.sphere_radius_m
    pixel = dem.levels[FULL_RES_LEVEL].pixel_m

    x_min, x_max, y_min, y_max = region_bounds(REGION_TILE)
    grid, x_left, y_top, px = read_window(dem, FULL_RES_LEVEL, x_min, x_max, y_min, y_max, fetch)

    def height_at(x, y):
        return bilinear(grid, x_left, y_top, px, np.asarray(x, float), np.asarray(y, float))

    cx, cy = forward_south_polar(*PUBLISHED_CENTRE, radius)
    ch = float(height_at([cx], [cy])[0])
    p = nearest_crest_maximum(
        grid,
        x_left,
        y_top,
        px,
        (cx, cy),
        ch,
        (x_min, x_max, y_min, y_max),
        config.CREST_LOCAL_MAX_RADIUS_M,
    )
    lat, lon = inverse_south_polar(p.x_m, p.y_m, radius)
    print(f"region {REGION_TILE}: x {x_min:.0f}..{x_max:.0f} m, y {y_min:.0f}..{y_max:.0f} m")
    print(f"published centre: x {cx:.1f} y {cy:.1f} m, height {ch:.1f} m")
    print(
        f"derived crest point: lat {lat:.6f} lon {lon:.6f} (x {p.x_m:.1f}, y {p.y_m:.1f} m), "
        f"height {p.height_m:.1f} m, {p.distance_to_centre_m:.1f} m from the centre"
    )
    print(f"slope at derived point: {slope_deg(height_at, p.x_m, p.y_m, pixel):.1f} deg")

    print("\nslope at each site (central differences over one 20 m pixel):")
    for site in load_sites(config.SITES_FILE):
        sx, sy = forward_south_polar(site.lat, site.lon, radius)
        win = read_window(dem, FULL_RES_LEVEL, sx - 100, sx + 100, sy - 100, sy + 100, fetch)

        def at(x, y, w=win):
            return bilinear(w[0], w[1], w[2], w[3], np.asarray(x, float), np.asarray(y, float))

        print(f"  {site.id:24} {slope_deg(at, sx, sy, pixel):5.1f} deg")


if __name__ == "__main__":
    main()
