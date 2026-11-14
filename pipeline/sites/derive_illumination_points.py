"""
What: Apply the D30 rule to the five challenge regions: inside each NASA region (PGDA product 78
    tile), the reference point is the pixel with the highest NASA average solar illumination
    (PGDA product 69, 85S at 60 m, the finest map covering all regions), ties broken by the
    distance to the published region centre. Optionally writes the points to pipeline/sites.json.
Roadmap stage: 5 — fair site points (docs/DECISOES.md D30) (see docs/ROTEIRO.md)
Inputs: PGDA 78 tile headers (region bounds); PGDA 69 IMG lines (HTTP range, cached);
    published centres from NASA M2M-30044 Table A2.1-1.
Outputs: printed table; with --write, updated entries in pipeline/sites.json.
NASA data source: PGDA products 69 and 78; NASA M2M-30044 Lunar Surface Data Book.

Usage: python -m pipeline.sites.derive_illumination_points [--write]
"""

from __future__ import annotations

import argparse
import json

import numpy as np

from pipeline import config
from pipeline.sites.derive_crest_point import region_bounds
from pipeline.sites.illumination_point import brightest_pixel
from pipeline.sites.polar_stereo import forward_south_polar, inverse_south_polar
from pipeline.validation.pds_img import (
    fetch_text,
    parse_label,
    pixel_centre_xy,
    pixel_of,
    read_lines,
    scale_dn,
)

M_PER_KM = 1000.0
PERCENT = 100.0
DATA_BOOK_URL = (
    "https://ntrs.nasa.gov/api/citations/20250002845/downloads/"
    "M2M-30044%20Lunar%20Surface%20Data%20Book%20Baseline_Final.pdf"
)
# Published region centres, NASA M2M-30044 (2025), Table A2.1-1, page 75 (verbatim rows in
# docs/DADOS.md): site id -> (PGDA 78 tile, centre lat, centre lon, table row).
REGIONS = {
    "shackleton-rim": (
        "Site04",
        -89.7668,
        -171.87,
        "R04 or Site04 Shackleton Rim -89.7668 -171.87",
    ),
    "connecting-ridge": (
        "Site01",
        -89.4632,
        -137.49,
        "R01 or Site01 Connecting Ridge -89.4632 -137.49",
    ),
    "de-gerlache-rim": (
        "Site11",
        -88.6834,
        -67.9321,
        "R11 or Site11 de Gerlache Rim 1 -88.6834 -67.9321",
    ),
    "malapert-massif": (
        "Site23",
        -85.9948,
        -0.23578,
        "R23 or Site23 Malapert Massif -85.9948 -0.23578",
    ),
    "haworth": ("Haworth", -86.7639, -22.777, "Haworth (Haworth is its name) -86.7639 -22.777"),
}
# Margin (lines) read around each region so its edge pixels are included.
LINE_MARGIN = 2


def derive(site_id: str) -> dict:
    """Derived point and provenance for one region."""
    tile, c_lat, c_lon, quote = REGIONS[site_id]
    radius = config.LUNAR_SPHERE_RADIUS_KM * M_PER_KM
    cache = config.RAW_DIR / "pgda69"
    product = config.NASA_SUN_PRODUCT
    url = f"{config.NASA_ILLUM_BASE_URL}{product}"
    image = parse_label(fetch_text(f"{url}.LBL", cache / f"{product}.LBL"), product)

    x_min, x_max, y_min, y_max = region_bounds(tile)
    line_top, _ = pixel_of(image, x_min, y_max)
    line_bottom, _ = pixel_of(image, x_min, y_min)
    first = min(line_top, line_bottom) - LINE_MARGIN
    count = abs(line_bottom - line_top) + 1 + 2 * LINE_MARGIN
    dn = read_lines(image, f"{url}.IMG", first, count, cache)
    rows, cols = np.indices(dn.shape)
    xs, ys = pixel_centre_xy(image, rows + first, cols)
    values = scale_dn(image, dn)

    cx, cy = forward_south_polar(c_lat, c_lon, radius)
    best = brightest_pixel(values, xs, ys, (x_min, x_max, y_min, y_max), (cx, cy))
    lat, lon = inverse_south_polar(best.x_m, best.y_m, radius)
    return {
        "site_id": site_id,
        "tile": tile,
        "lat": round(lat, 6),
        "lon": round(lon, 6),
        "illumination_pct": round(best.value * PERCENT, 2),
        "distance_to_centre_m": round(best.distance_to_centre_m, 1),
        "tied_pixels": best.tied_pixels,
        "published_centre": {"lat": c_lat, "lon": c_lon, "quote": quote},
        "region_bounds_m": [x_min, x_max, y_min, y_max],
    }


def update_sites_file(points: list[dict]) -> None:
    """Write the derived points into pipeline/sites.json (other sites untouched)."""
    doc = json.loads(config.SITES_FILE.read_text(encoding="utf-8"))
    by_id = {p["site_id"]: p for p in points}
    for site in doc["sites"]:
        p = by_id.get(site["id"])
        if p is None:
            continue
        site["lat"], site["lon"] = p["lat"], p["lon"]
        site["source_type"] = "derived_point"
        site["point_role"] = "regional_reference_point"
        site["description"] = (
            f"Regional reference point: the pixel with the highest NASA average solar illumination "
            f"(LOLA 60 m map) inside the NASA region '{site['name']}' ({p['tile']}). "
            "Not a NASA-designated landing site."
        )
        site["published_centre"] = {
            "lat": p["published_centre"]["lat"],
            "lon": p["published_centre"]["lon"],
            "distance_m": p["distance_to_centre_m"],
        }
        site["derived_point_nasa_avg_illumination_pct"] = p["illumination_pct"]
        site["source"] = {
            "document": (
                "Derived by this project (docs/DECISOES.md D30). Region: PGDA product 78 tile "
                f"{p['tile']}; published centre: NASA M2M-30044 Moon to Mars Lunar Surface "
                "Data Book (2025), Table A2.1-1, page 75; illumination: PGDA product 69 "
                f"{config.NASA_SUN_PRODUCT} (60 m)."
            ),
            "url": DATA_BOOK_URL,
            "location": (
                "Rule: inside the region, the pixel with the highest NASA average solar "
                "illumination; ties: nearest to the published centre "
                "(python -m pipeline.sites.derive_illumination_points)"
            ),
            "quote": p["published_centre"]["quote"],
        }
        site["cross_check"] = (
            f"{p['distance_to_centre_m']:.0f} m from the published centre; NASA average "
            f"illumination {p['illumination_pct']:.2f}% at the point; {p['tied_pixels']} pixel(s) "
            "shared the maximum."
        )
    config.SITES_FILE.write_text(
        json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> None:
    """Print the derived points; with --write, store them in pipeline/sites.json."""
    parser = argparse.ArgumentParser(description="D30: brightest pixel in each NASA region.")
    parser.add_argument("--write", action="store_true", help="update pipeline/sites.json")
    args = parser.parse_args()
    points = [derive(site_id) for site_id in REGIONS]
    print(f"{'site':18} {'tile':8} {'lat':>11} {'lon':>12} {'illum %':>8} {'to centre m':>12} ties")
    for p in points:
        print(
            f"{p['site_id']:18} {p['tile']:8} {p['lat']:11.6f} {p['lon']:12.6f} "
            f"{p['illumination_pct']:8.2f} {p['distance_to_centre_m']:12.1f} {p['tied_pixels']}"
        )
    if args.write:
        update_sites_file(points)
        print(f"updated {config.SITES_FILE}")


if __name__ == "__main__":
    main()
