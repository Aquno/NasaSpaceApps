"""
What: Orchestrate stage 4: join the outputs of stages 1, 2, 3 and 6 (data part) into the files
    the interface reads (data/app/), validate them against the contract and against the earlier
    reports, and print each file size.
Roadmap stage: 4 — Export (see docs/ROTEIRO.md)
Inputs: pipeline/sites.json; data/ephemeris/<id>.json; data/horizon/<id>.json;
    data/science/psr_distance.json; data/validation/nasa_reference.json.
Outputs: data/app/sites.json; data/app/sites/<id>.json; data/app/REPORT.md.
NASA data source: JPL Horizons; PGDA products 90 and 69 (through the stage outputs).

Usage: python -m pipeline.export.run_export
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from pipeline import config
from pipeline.ephemeris.checks import expected_epochs
from pipeline.ephemeris.run_ephemeris import parse_utc
from pipeline.export.build import build_site_entry, build_site_file
from pipeline.export.contract import HORIZON_LENGTH, validate_site_file, validate_sites

APP_DIR = config.REPO_ROOT / "data" / "app"
EXIT_INVALID = 2
# Largest allowed difference between an exported value and its source (rounding to 3 decimals).
ROUNDING_TOLERANCE = 0.0005 + 1e-9
SOURCES = [
    "JPL Horizons API, observer tables (https://ssd-api.jpl.nasa.gov/doc/horizons.html)",
    "LOLA south polar DEM, PGDA product 90 (https://pgda.gsfc.nasa.gov/products/90)",
    "Site coordinates: NASA Lunar Surface Data Book (M2M-30044, 2025; ACD-50044, 2022)",
]


def load_json(path: Path):
    """Read a JSON file."""
    return json.loads(path.read_text(encoding="utf-8"))


def by_site(path: Path) -> dict:
    """Rows of a stage output keyed by site_id (empty if the file is missing)."""
    if not path.exists():
        return {}
    return {row["site_id"]: row for row in load_json(path)["sites"]}


def cross_check(
    site_id: str, doc: dict, ephemeris: dict, horizon: dict, expected_count: int
) -> list[str]:
    """Compare an exported document with its sources and with the stage 1/2 expectations."""
    errors = []
    where = f"sites/{site_id}.json"
    if doc["meta"]["count"] != expected_count:
        errors.append(f"{where}: count {doc['meta']['count']} != {expected_count} (stage 1 report)")
    if len(doc["horizon"]) != HORIZON_LENGTH:
        errors.append(f"{where}: horizon has {len(doc['horizon'])} values (stage 2: 360)")
    for column, values in doc["series"].items():
        source = [r[column] for r in ephemeris["series"]]
        worst = max(_angle_diff(a, b, column) for a, b in zip(values, source, strict=True))
        if worst > ROUNDING_TOLERANCE:
            errors.append(f"{where}: series.{column} differs from stage 1 by {worst}")
    worst = max(abs(a - b) for a, b in zip(doc["horizon"], horizon["horizon_deg"], strict=True))
    if worst > ROUNDING_TOLERANCE:
        errors.append(f"{where}: horizon differs from stage 2 by {worst}")
    return errors


def _angle_diff(a: float, b: float, column: str) -> float:
    d = abs(a - b)
    return min(d, 360.0 - d) if column.endswith("_az") else d


def main() -> int:
    """Command-line entry point. Returns the process exit code."""
    sites = load_json(config.SITES_FILE)["sites"]
    science = by_site(config.SCIENCE_DIR / "psr_distance.json")
    reference = by_site(config.VALIDATION_DIR / "nasa_reference.json")
    sources = (
        SOURCES
        + (["Permanently shadowed regions >= 1 km2, PGDA product 90"] if science else [])
        + (
            ["Average illumination / Earth visibility, PGDA product 69 (LOLA PDS)"]
            if reference
            else []
        )
    )
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    expected_count = len(
        expected_epochs(
            parse_utc(config.DEFAULT_START_UTC),
            parse_utc(config.DEFAULT_STOP_UTC),
            config.DEFAULT_STEP_MINUTES,
        )
    )

    (APP_DIR / "sites").mkdir(parents=True, exist_ok=True)
    entries, errors, sizes = [], [], {}
    for site in sites:
        sid = site["id"]
        ephemeris = load_json(config.EPHEMERIS_DIR / f"{sid}.json")
        horizon = load_json(config.HORIZON_DIR / f"{sid}.json")
        entries.append(
            build_site_entry(site, horizon["meta"], science.get(sid), reference.get(sid))
        )
        doc = build_site_file(ephemeris, horizon, sources, generated_at)
        errors += validate_site_file(doc, f"sites/{sid}.json", sid)
        errors += cross_check(sid, doc, ephemeris, horizon, expected_count)
        path = APP_DIR / "sites" / f"{sid}.json"
        path.write_text(json.dumps(doc, separators=(",", ":")), encoding="utf-8")
        sizes[f"sites/{sid}.json"] = path.stat().st_size

    errors += validate_sites(entries)
    path = APP_DIR / "sites.json"
    path.write_text(json.dumps(entries, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    sizes["sites.json"] = path.stat().st_size

    report = render_report(entries, sizes, errors)
    (APP_DIR / "REPORT.md").write_text(report, encoding="utf-8")
    print(report)
    return EXIT_INVALID if errors else 0


def render_report(entries: list[dict], sizes: dict[str, int], errors: list[str]) -> str:
    """Markdown text of the stage 4 report."""

    def fmt(v, spec=".2f"):
        return "null" if v is None else format(v, spec)

    lines = [
        "# Stage 4 - Export report",
        "",
        "Generated by `python -m pipeline.export.run_export`. Do not edit by hand.",
        "Format: docs/CONTRATO_DE_DADOS.md (version 2). No visibility or metric computed (D9).",
        "",
        "## Sites",
        "",
        "| id | lat | lon | source | purpose | terrain (m) | slope (deg) | PSR dist (km) "
        "| PSR area (km2) | NASA sun (%) | NASA Earth (%) |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for e in entries:
        lines.append(
            f"| {e['id']} | {e['lat']} | {e['lon']} | {e['source_type']} | {e['purpose'] or '-'} | "
            f"{e['terrain_height_m']:.1f} | {e['terrain_slope_deg']:.1f} | "
            f"{fmt(e['psr_distance_km'], '.3f')} | "
            f"{fmt(e['psr_area_km2'], '.3f')} | {fmt(e['nasa_avg_illumination_pct'])} | "
            f"{fmt(e['nasa_avg_earth_visibility_pct'])} |"
        )
    lines += ["", "## File sizes", "", "| File | Bytes | KB |", "|---|---|---|"]
    for name, size in sizes.items():
        lines.append(f"| `data/app/{name}` | {size} | {size / 1024:.0f} |")
    lines += ["", "## Validation", ""]
    lines += (
        [f"- {e}" for e in errors]
        if errors
        else [
            "All files valid against the contract; 8,760 values per series column and 360 horizon "
            "values per site; exported values within rounding of stages 1 and 2."
        ]
    )
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    sys.exit(main())
