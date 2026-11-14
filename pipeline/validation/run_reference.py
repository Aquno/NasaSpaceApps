"""
What: Stage 6 data part: read NASA average solar illumination and average Earth visibility at
    each site from the LOLA polar illumination maps, after content checks; write JSON and a
    report. No comparison with our own computation here (that is the rest of stage 6, D9).
Roadmap stage: 6 — Validation, data part (see docs/ROTEIRO.md)
Inputs: pipeline/sites.json; PDS3 labels and IMG maps (85S, 60 m) read by HTTP range;
    PSR polygons from stage 3 (for the orientation check).
Outputs: data/validation/nasa_reference.json; data/validation/REPORT.md.
NASA data source: PGDA product 69 (https://pgda.gsfc.nasa.gov/products/69), files on
    http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/.

Usage: python -m pipeline.validation.run_reference
"""

from __future__ import annotations

import json
import sys

import numpy as np

from pipeline import config
from pipeline.science.psr_distance import point_in_rings
from pipeline.science.psr_files import load_psr_polygons
from pipeline.sites.polar_stereo import forward_south_polar
from pipeline.sites.site_list import load_sites
from pipeline.validation.pds_img import PdsImage, fetch_text, parse_label, value_at

M_PER_KM = 1000.0
PERCENT = 100.0
NEAR_SIDE_LONS = (-20.0, 0.0, 20.0)
FAR_SIDE_LONS = (160.0, 180.0, 200.0)
NEIGHBOURHOOD = 1  # 3 x 3 pixels around the site, for context only
PSR_SEARCH_RADIUS_M = 150_000.0
EXIT_CHECK_FAILED = 2


def psr_check_points(n: int) -> list[tuple[float, float]]:
    """Up to n map points (m) inside the largest PSRs: their bounding-box centres when inside."""
    raw = config.RAW_DIR / "pgda90" / "psr"
    polys = load_psr_polygons(
        raw / "LPSR_80S_20MPP_ADJ_1km2.SHP", raw / "LPSR_80S_20MPP_ADJ_1km2.DBF"
    )
    points = []
    for p in sorted(polys, key=lambda q: -q.area_km2):
        x, y = (p.bbox[0] + p.bbox[2]) / 2, (p.bbox[1] + p.bbox[3]) / 2
        if np.hypot(x, y) < PSR_SEARCH_RADIUS_M and point_in_rings(x, y, p.rings):
            points.append((x, y))
        if len(points) >= n:
            break
    return points


def content_checks(at, radius_m: float) -> dict:
    """Orientation and identity checks of the two maps (see pipeline/config.py)."""
    points = psr_check_points(config.REFERENCE_CHECK_PSR_SAMPLES)
    psr_vals = np.array([float(at("sun", x, y)[0, 0]) for x, y in points])
    zero_fraction = float(np.mean(psr_vals == 0))
    ring = {}
    for key in ("sun", "earth"):
        means = []
        for lons in (NEAR_SIDE_LONS, FAR_SIDE_LONS):
            xy = [
                forward_south_polar(config.REFERENCE_CHECK_LATITUDE_DEG, lon, radius_m)
                for lon in lons
            ]
            means.append(float(np.mean([at(key, x, y)[0, 0] for x, y in xy])))
        ring[key] = means
    return {
        "sun_zero_in_psr_fraction": zero_fraction,
        "sun_zero_in_psr_ok": zero_fraction >= config.REFERENCE_CHECK_MIN_ZERO_FRACTION,
        "earth_near_side_mean": ring["earth"][0],
        "earth_far_side_mean": ring["earth"][1],
        "earth_near_far_ok": ring["earth"][0] - ring["earth"][1]
        >= config.REFERENCE_CHECK_MIN_NEAR_FAR_GAP,
        "sun_near_side_mean": ring["sun"][0],
        "sun_far_side_mean": ring["sun"][1],
    }


def main() -> int:
    """Command-line entry point. Returns the process exit code."""
    cache = config.RAW_DIR / "pgda69"
    radius_m = config.LUNAR_SPHERE_RADIUS_KM * M_PER_KM
    maps: dict[str, tuple[PdsImage, str]] = {}
    for key, product in (("sun", config.NASA_SUN_PRODUCT), ("earth", config.NASA_EARTH_PRODUCT)):
        url = f"{config.NASA_ILLUM_BASE_URL}{product}"
        label = parse_label(fetch_text(f"{url}.LBL", cache / f"{product}.LBL"), product)
        if label.product_id != product:
            print(f"label PRODUCT_ID {label.product_id} does not match {product}", file=sys.stderr)
            return EXIT_CHECK_FAILED
        maps[key] = (label, f"{url}.IMG")

    def at(key, x, y, window=0):
        return value_at(*maps[key], x, y, cache, window)

    checks = content_checks(at, radius_m)
    trusted = checks["sun_zero_in_psr_ok"] and checks["earth_near_far_ok"]

    results = []
    for site in load_sites(config.SITES_FILE):
        x, y = forward_south_polar(site.lat, site.lon, radius_m)
        row = {"site_id": site.id}
        for key, name in (("sun", "illumination"), ("earth", "earth_visibility")):
            block = at(key, x, y, NEIGHBOURHOOD)
            centre = float(block[NEIGHBOURHOOD, NEIGHBOURHOOD])
            row[f"nasa_avg_{name}_pct"] = round(centre * PERCENT, 2) if trusted else None
            row[f"nasa_avg_{name}_3x3_min_pct"] = (
                round(float(block.min()) * PERCENT, 2) if trusted else None
            )
            row[f"nasa_avg_{name}_3x3_max_pct"] = (
                round(float(block.max()) * PERCENT, 2) if trusted else None
            )
        results.append(row)

    sun_label, earth_label = maps["sun"][0], maps["earth"][0]
    out = {
        "meta": {
            "source": "NASA GSFC PGDA product 69 (LOLA polar illumination), LOLA PDS data node",
            "files": {k: v[1] for k, v in maps.items()},
            "labels": {k: v[1].replace(".IMG", ".LBL") for k, v in maps.items()},
            "resolution_m": sun_label.map_scale_m,
            "coverage": "85 S to 90 S (map corners to about 82.9 S)",
            "averaging_period": (
                "hourly timesteps spanning 18.6 years (a lunar nutation cycle), per the "
                "product page"
            ),
            "lola_data_span": f"{sun_label.start_time} to {sun_label.stop_time} (label)",
            "sun_definition": sun_label.description,
            "earth_definition": earth_label.description,
            "earth_note_from_page": (
                "the Earth is considered visible if any part of its disc is not obscured"
            ),
            "height_above_surface": (
                "not stated in the labels or on the page; the page says the effect of height "
                "above the surface needs further analysis"
            ),
            "scaling": f"value = DN * {sun_label.scaling_factor} + {sun_label.offset}, in percent",
            "pixel_rule": "pixel containing the site (no interpolation); 3x3 min/max for context",
            "coordinate_system": sun_label.coordinate_system,
            "content_checks": checks,
            "trusted": trusted,
        },
        "sites": results,
    }
    config.VALIDATION_DIR.mkdir(parents=True, exist_ok=True)
    (config.VALIDATION_DIR / "nasa_reference.json").write_text(
        json.dumps(out, indent=1), encoding="utf-8"
    )
    report = render_report(out)
    (config.VALIDATION_DIR / "REPORT.md").write_text(report, encoding="utf-8")
    print(report)
    return 0 if trusted else EXIT_CHECK_FAILED


def render_report(out: dict) -> str:
    """Markdown text of the stage 6 data report."""
    m, c = out["meta"], out["meta"]["content_checks"]

    def ok(flag: bool) -> str:
        return "OK" if flag else "FAIL"

    def fmt(v) -> str:
        return "null" if v is None else f"{v:.2f}"

    lines = [
        "# Stage 6 (data part) - NASA reference illumination",
        "",
        "Generated by `python -m pipeline.validation.run_reference`. Do not edit by hand.",
        "",
        f"- Source: {m['source']}; {m['resolution_m']:g} m/pixel, {m['coverage']}.",
        f"- Averaging: {m['averaging_period']}. LOLA data span: {m['lola_data_span']}.",
        "- Sun: fraction of timesteps lit by any fraction of the solar disc. "
        "Earth: visible if any part of its disc is not obscured.",
        f"- Height above surface: {m['height_above_surface']}.",
        f"- Scaling: {m['scaling']}. Pixel: {m['pixel_rule']}.",
        "",
        "## Content checks",
        "",
        f"- Sun map is 0 at {c['sun_zero_in_psr_fraction']:.0%} of points inside PSRs "
        f"(need >= {config.REFERENCE_CHECK_MIN_ZERO_FRACTION:.0%}): {ok(c['sun_zero_in_psr_ok'])}",
        f"- Earth map at {config.REFERENCE_CHECK_LATITUDE_DEG} deg latitude: near side "
        f"{c['earth_near_side_mean']:.3f}, far side {c['earth_far_side_mean']:.3f} "
        f"(gap >= {config.REFERENCE_CHECK_MIN_NEAR_FAR_GAP}): {ok(c['earth_near_far_ok'])}",
        f"- Sun map, same ring: near {c['sun_near_side_mean']:.3f}, far "
        f"{c['sun_far_side_mean']:.3f} (no near/far pattern expected).",
        "",
        "## Values at the sites (percent)",
        "",
        "| Site | Avg solar illumination | 3x3 range | Avg Earth visibility | 3x3 range |",
        "|---|---|---|---|---|",
    ]
    for r in out["sites"]:
        lines.append(
            f"| {r['site_id']} | {fmt(r['nasa_avg_illumination_pct'])} | "
            f"{fmt(r['nasa_avg_illumination_3x3_min_pct'])}-"
            f"{fmt(r['nasa_avg_illumination_3x3_max_pct'])} | "
            f"{fmt(r['nasa_avg_earth_visibility_pct'])} | "
            f"{fmt(r['nasa_avg_earth_visibility_3x3_min_pct'])}-"
            f"{fmt(r['nasa_avg_earth_visibility_3x3_max_pct'])} |"
        )
    summary = "Files trusted." if m["trusted"] else "**Checks failed: values left null.**"
    lines += ["", "## Summary", "", summary, ""]
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
