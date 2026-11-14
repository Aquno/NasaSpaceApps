"""
What: Orchestrate stage 1: for each site, fetch Sun and Earth observer tables from JPL
    Horizons (sequential, paused, cached, split into chunks if refused), merge them into
    one hourly series, write data/ephemeris/<id>.json and the verification report.
Roadmap stage: 1 — Ephemeris (see docs/ROTEIRO.md)
Inputs: pipeline/sites.json; interval/step/site ids from the command line (defaults: D8).
Outputs: data/ephemeris/<id>.json; data/ephemeris/REPORT.md; raw cache in data/raw/horizons/.
NASA data source: JPL Horizons API (https://ssd-api.jpl.nasa.gov/doc/horizons.html).

Usage:
    python -m pipeline.ephemeris.run_ephemeris                       # all sites, D8 interval
    python -m pipeline.ephemeris.run_ephemeris --sites connecting-ridge
    python -m pipeline.ephemeris.run_ephemeris --start 2027-01-01T00:00:00Z --stop ...
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from pipeline import config
from pipeline.ephemeris.checks import SiteCheck, check_site, expected_epochs, render_report
from pipeline.ephemeris.horizons_client import (
    HorizonsRefusedError,
    build_observer_params,
    fetch_observer_table,
)
from pipeline.ephemeris.horizons_parser import ObserverRow, parse_observer_table
from pipeline.sites.site_list import Site, load_sites

ISO_UTC_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
BODIES = {"sun": config.SUN_ID, "earth": config.EARTH_ID}
PARAMS_HASH_LENGTH = 10
EXIT_CHECK_FAILED = 2


class EphemerisError(RuntimeError):
    """Stage 1 cannot produce a valid series for a site."""


def parse_utc(text: str) -> datetime:
    """Parse "YYYY-MM-DDTHH:MM:SSZ" into an aware UTC datetime."""
    return datetime.strptime(text, ISO_UTC_FORMAT).replace(tzinfo=timezone.utc)


def split_interval(
    start: datetime, stop: datetime, step_minutes: int
) -> tuple[tuple[datetime, datetime], tuple[datetime, datetime]]:
    """Split an inclusive interval into two halves on the step grid, without overlap."""
    step = timedelta(minutes=step_minutes)
    n_steps = int((stop - start) / step)
    mid = start + step * (n_steps // 2)
    return (start, mid), (mid + step, stop)


def fetch_rows(
    site: Site,
    body: str,
    start: datetime,
    stop: datetime,
    step_minutes: int,
    raw_dir: Path,
    pause: list[bool],
) -> tuple[list[ObserverRow], dict[str, str], list[str]]:
    """Rows, header and query times for one body; bisects the interval if refused.

    ``pause`` is a one-element flag shared across calls so that a pause is inserted
    between consecutive real API calls (never before cached reads).
    """
    params = build_observer_params(
        BODIES[body], site.lon, site.lat, site.alt_km, start, stop, step_minutes
    )
    digest = hashlib.sha1(json.dumps(params, sort_keys=True).encode()).hexdigest()
    cache = raw_dir / (
        f"{site.id}_{body}_{start:%Y%m%dT%H%M}_{stop:%Y%m%dT%H%M}_"
        f"{digest[:PARAMS_HASH_LENGTH]}.json"
    )
    if not cache.exists():
        if pause[0]:
            time.sleep(config.REQUEST_PAUSE_S)
        pause[0] = True
        print(f"  querying Horizons: {site.id} {body} {start:%Y-%m-%d} .. {stop:%Y-%m-%d}")
    try:
        raw = fetch_observer_table(params, cache)
    except HorizonsRefusedError as exc:
        if (stop - start) <= timedelta(hours=config.MIN_CHUNK_HOURS):
            raise EphemerisError(
                f"{site.id} {body}: refused even for a small chunk: {exc}"
            ) from exc
        print(f"  refused ({str(exc).splitlines()[0][:120]}); splitting interval")
        first, second = split_interval(start, stop, step_minutes)
        rows_a, header, times_a = fetch_rows(site, body, *first, step_minutes, raw_dir, pause)
        rows_b, _, times_b = fetch_rows(site, body, *second, step_minutes, raw_dir, pause)
        return rows_a + rows_b, header, times_a + times_b
    table = parse_observer_table(raw.text, source=cache.name)
    return table.rows, table.header, [raw.queried_at]


def merge_series(sun: list[ObserverRow], earth: list[ObserverRow], site_id: str) -> list[dict]:
    """Join Sun and Earth rows epoch by epoch; epochs must match exactly."""
    if [r.t for r in sun] != [r.t for r in earth]:
        raise EphemerisError(f"{site_id}: Sun and Earth tables have different epochs")
    return [
        {
            "t": s.t,
            "sun_az": s.az,
            "sun_el": s.el,
            "sun_diam": s.diam,
            "earth_az": e.az,
            "earth_el": e.el,
            "earth_diam": e.diam,
        }
        for s, e in zip(sun, earth, strict=True)
    ]


def squash(text: str) -> str:
    """Collapse runs of whitespace in a Horizons header value."""
    return " ".join(text.split())


def ephemeris_name(target_line: str) -> str:
    """Planetary ephemeris named in a Horizons "Target body name" value ("DE441")."""
    match = re.search(r"source:\s*([A-Za-z0-9_-]+)", target_line)
    if not match:
        raise EphemerisError(f"ephemeris source not found in {target_line!r}")
    return match.group(1)


def build_document(
    site: Site,
    series: list[dict],
    header: dict[str, str],
    queried_at: dict[str, list[str]],
    start: str,
    stop: str,
    step_minutes: int,
) -> dict:
    """Output document for data/ephemeris/<id>.json (format: pipeline/ephemeris/README.md)."""
    return {
        "meta": {
            "site_id": site.id,
            "site_name": site.name,
            "lat": site.lat,
            "lon": site.lon,
            "alt_km": site.alt_km,
            "coordinates_source": site.source_url,
            "coordinates_source_type": site.source_type,
            "frame": "MOON_ME (mean Earth/polar axis of DE421)",
            "horizons_center_frame": squash(header.get("Center pole/equ", "")),
            "horizons_center_radii_km": squash(header.get("Center radii", "")),
            "longitude_convention": "degrees east, [-180, 180)",
            "start": start,
            "end": stop,
            "step_minutes": step_minutes,
            "time_scale": (
                "UTC (Horizons 'UT'). For dates after the last announced leap second, "
                "Horizons holds the last known leap second constant."
            ),
            "azimuth_convention": "degrees, clockwise from north (N=0, E=90, S=180, W=270)",
            "elevation_reference": (
                "degrees above the plane perpendicular to the local zenith "
                "(ideal horizon, no terrain, airless)"
            ),
            "diameter_unit": "degrees (converted from Horizons arcseconds)",
            "queried_at": {body: sorted(times) for body, times in queried_at.items()},
            "api_url": config.HORIZONS_API_URL,
            "api_doc": config.HORIZONS_DOC_URL,
            # e.g. "Sun (10) {source: DE441}" -> "JPL DE441"
            "ephemeris_source": f"JPL {ephemeris_name(header.get('Target body name', ''))}",
            "sample": False,
        },
        "series": series,
    }


def run_site(
    site: Site,
    start: datetime,
    stop: datetime,
    step_minutes: int,
    raw_dir: Path,
    out_dir: Path,
    pause: list[bool],
) -> SiteCheck:
    """Fetch, merge, write and check one site."""
    print(f"{site.id}:")
    rows, headers, times = {}, {}, {}
    for body in BODIES:
        rows[body], headers[body], times[body] = fetch_rows(
            site, body, start, stop, step_minutes, raw_dir, pause
        )
        frame = headers[body].get("Center pole/equ", "")
        if config.EXPECTED_CENTER_FRAME not in frame:
            raise EphemerisError(f"{site.id} {body}: unexpected Horizons frame {frame!r}")

    series = merge_series(rows["sun"], rows["earth"], site.id)
    start_s, stop_s = start.strftime(ISO_UTC_FORMAT), stop.strftime(ISO_UTC_FORMAT)
    document = build_document(site, series, headers["sun"], times, start_s, stop_s, step_minutes)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{site.id}.json"
    out_path.write_text(json.dumps(document, separators=(",", ":")), encoding="utf-8")
    print(f"  wrote {out_path.relative_to(config.REPO_ROOT)} ({len(series)} records)")

    return check_site(
        site.id,
        site.lat,
        squash(headers["sun"].get("Center pole/equ", "")),
        series,
        expected_epochs(start, stop, step_minutes),
        step_minutes,
    )


def main(argv: list[str] | None = None) -> int:
    """Command-line entry point. Returns the process exit code."""
    parser = argparse.ArgumentParser(description="Stage 1: Sun/Earth ephemerides from Horizons.")
    parser.add_argument("--sites", nargs="*", help="site ids (default: all in the sites file)")
    parser.add_argument("--start", default=config.DEFAULT_START_UTC, help="UTC, ISO 8601 with Z")
    parser.add_argument("--stop", default=config.DEFAULT_STOP_UTC, help="UTC, inclusive")
    parser.add_argument("--step-minutes", type=int, default=config.DEFAULT_STEP_MINUTES)
    parser.add_argument("--sites-file", type=Path, default=config.SITES_FILE)
    parser.add_argument("--raw-dir", type=Path, default=config.RAW_DIR / "horizons")
    parser.add_argument("--out-dir", type=Path, default=config.EPHEMERIS_DIR)
    args = parser.parse_args(argv)

    import truststore

    truststore.inject_into_ssl()  # use the OS certificate store (see requirements.txt)

    sites = load_sites(args.sites_file)
    if args.sites:
        unknown = set(args.sites) - {s.id for s in sites}
        if unknown:
            parser.error(f"unknown site ids: {sorted(unknown)}")
        sites = [s for s in sites if s.id in args.sites]

    start, stop = parse_utc(args.start), parse_utc(args.stop)
    checks: list[SiteCheck] = []
    pause = [False]
    exit_code = 0
    for site in sites:
        check = run_site(site, start, stop, args.step_minutes, args.raw_dir, args.out_dir, pause)
        checks.append(check)
        if not check.sun_el_ok:
            print(
                f"STOP: {site.id} max Sun elevation {check.sun_el_max:.3f} deg exceeds "
                f"{check.sun_el_limit:.3f} deg: check coordinates or reference frame.",
                file=sys.stderr,
            )
            exit_code = EXIT_CHECK_FAILED
            break

    report = render_report(checks, args.start, args.stop, args.step_minutes)
    report_path = args.out_dir / "REPORT.md"
    report_path.write_text(report, encoding="utf-8")
    print()
    print(report)
    if exit_code == 0 and not all(c.ok for c in checks):
        exit_code = EXIT_CHECK_FAILED
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
