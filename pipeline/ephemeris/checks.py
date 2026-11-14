"""
What: Sanity checks on a site's ephemeris series and the Markdown report. Pure functions.
Roadmap stage: 1 — Ephemeris (see docs/ROTEIRO.md, "Verificações")
Inputs: series records (t in UTC ISO, sun/earth az/el in degrees), site latitude (degrees),
    expected interval and step.
Outputs: SiteCheck results and the text of data/ephemeris/REPORT.md.
NASA data source: values derived from JPL Horizons; reference month length from the
    NSSDCA Moon fact sheet (see pipeline/config.py).
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np

from pipeline import config

ISO_UTC_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
# Zero-padding factor for the FFT so the dominant period is resolved more finely than
# 1/(series length); a sanity estimate only.
FFT_PADDING_FACTOR = 8


@dataclass(frozen=True)
class Coverage:
    """Record count against the expected hourly grid."""

    count: int
    expected: int
    missing: list[str]
    duplicated: list[str]

    @property
    def ok(self) -> bool:
        """True when every expected epoch appears exactly once and nothing else."""
        return self.count == self.expected and not self.missing and not self.duplicated


@dataclass(frozen=True)
class SiteCheck:
    """All checks for one site. Angles in degrees, periods in days."""

    site_id: str
    lat: float
    frame: str
    coverage: Coverage
    sun_el_min: float
    sun_el_max: float
    sun_el_limit: float
    earth_el_min: float
    earth_el_max: float
    sun_az_period_days: float
    earth_el_period_days: float
    out_of_range: int

    @property
    def ranges_ok(self) -> bool:
        """Every azimuth in [0, 360) and every elevation in [-90, 90]."""
        return self.out_of_range == 0

    @property
    def sun_el_ok(self) -> bool:
        """Max Sun elevation within (90 - |lat|) + margin."""
        return self.sun_el_max <= self.sun_el_limit

    @property
    def sun_az_ok(self) -> bool:
        """Sun azimuth turns about once per month."""
        return in_month_band(self.sun_az_period_days)

    @property
    def earth_el_ok(self) -> bool:
        """Earth elevation oscillates with a period close to one month."""
        return in_month_band(self.earth_el_period_days)

    @property
    def ok(self) -> bool:
        """All checks passed."""
        return (
            self.coverage.ok
            and self.ranges_ok
            and self.sun_el_ok
            and self.sun_az_ok
            and self.earth_el_ok
        )


def count_out_of_range(series: list[dict]) -> int:
    """Number of records with an azimuth outside [0, 360) or elevation outside [-90, 90]."""
    bad = 0
    for record in series:
        azimuths = (record["sun_az"], record["earth_az"])
        elevations = (record["sun_el"], record["earth_el"])
        if any(not 0.0 <= az < config.FULL_TURN_DEG for az in azimuths) or any(
            not -90.0 <= el <= 90.0 for el in elevations
        ):
            bad += 1
    return bad


def expected_epochs(start: datetime, stop: datetime, step_minutes: int) -> list[str]:
    """UTC ISO epochs from ``start`` to ``stop`` inclusive, every ``step_minutes``."""
    step = timedelta(minutes=step_minutes)
    epochs, current = [], start
    while current <= stop:
        epochs.append(current.strftime(ISO_UTC_FORMAT))
        current += step
    return epochs


def check_coverage(times: list[str], expected: list[str]) -> Coverage:
    """Compare record epochs with the expected grid (missing, duplicated, count)."""
    counts = Counter(times)
    present = set(times)
    return Coverage(
        count=len(times),
        expected=len(expected),
        missing=[t for t in expected if t not in present],
        duplicated=sorted(t for t, n in counts.items() if n > 1),
    )


def sun_elevation_limit(lat_deg: float) -> float:
    """Upper bound for Sun elevation at latitude ``lat_deg``: (90 - |lat|) + margin, degrees."""
    return 90.0 - abs(lat_deg) + config.SUN_MAX_ELEVATION_MARGIN_DEG


def revolution_period_days(azimuth_deg: list[float], step_hours: float) -> float:
    """Mean time for one full azimuth turn, in days, from an evenly sampled series.

    Azimuth is unwrapped across the 0/360 jump; the sign of the motion is ignored.
    Returns ``inf`` if the azimuth does not move.
    """
    unwrapped = np.unwrap(np.asarray(azimuth_deg, dtype=float), period=config.FULL_TURN_DEG)
    turns = abs(unwrapped[-1] - unwrapped[0]) / config.FULL_TURN_DEG
    duration_days = (len(azimuth_deg) - 1) * step_hours / config.HOURS_PER_DAY
    return duration_days / turns if turns > 0 else float("inf")


def dominant_period_days(values: list[float], step_hours: float) -> float:
    """Period (days) of the strongest oscillation in an evenly sampled series (FFT)."""
    signal = np.asarray(values, dtype=float)
    signal = signal - signal.mean()
    n_fft = len(signal) * FFT_PADDING_FACTOR
    power = np.abs(np.fft.rfft(signal, n=n_fft)) ** 2
    freqs_per_day = np.fft.rfftfreq(n_fft, d=step_hours / config.HOURS_PER_DAY)
    peak = int(np.argmax(power[1:])) + 1  # skip the zero-frequency bin
    return float(1.0 / freqs_per_day[peak])


def in_month_band(period_days: float) -> bool:
    """True if a period is within the configured band around the synodic month."""
    tolerance = config.SYNODIC_MONTH_DAYS * config.MONTH_PERIOD_TOLERANCE_FRACTION
    return abs(period_days - config.SYNODIC_MONTH_DAYS) <= tolerance


def check_site(
    site_id: str,
    lat_deg: float,
    frame: str,
    series: list[dict],
    expected: list[str],
    step_minutes: int,
) -> SiteCheck:
    """Run all stage 1 checks on one site's merged series."""
    step_hours = step_minutes / 60.0
    sun_el = [r["sun_el"] for r in series]
    earth_el = [r["earth_el"] for r in series]
    return SiteCheck(
        site_id=site_id,
        lat=lat_deg,
        frame=frame,
        coverage=check_coverage([r["t"] for r in series], expected),
        sun_el_min=min(sun_el),
        sun_el_max=max(sun_el),
        sun_el_limit=sun_elevation_limit(lat_deg),
        earth_el_min=min(earth_el),
        earth_el_max=max(earth_el),
        sun_az_period_days=revolution_period_days([r["sun_az"] for r in series], step_hours),
        earth_el_period_days=dominant_period_days(earth_el, step_hours),
        out_of_range=count_out_of_range(series),
    )


def render_report(checks: list[SiteCheck], start: str, stop: str, step_minutes: int) -> str:
    """Markdown text of the stage 1 verification report."""
    band = config.SYNODIC_MONTH_DAYS * config.MONTH_PERIOD_TOLERANCE_FRACTION
    lo, hi = config.SYNODIC_MONTH_DAYS - band, config.SYNODIC_MONTH_DAYS + band

    def mark(ok: bool) -> str:
        return "OK" if ok else "FAIL"

    lines = [
        "# Stage 1 - Ephemeris verification report",
        "",
        "Generated by `python -m pipeline.ephemeris.run_ephemeris`. Do not edit by hand.",
        "",
        f"- Interval: {start} to {stop} (UTC, inclusive), step {step_minutes} min",
        "- Source: JPL Horizons API, observer tables, quantities 4 (az/el) and 13 (diameter)",
        "- Angles out of range: azimuth outside [0, 360) or elevation outside [-90, 90].",
        "- Elevations are against the ideal horizon (plane perpendicular to the local zenith); "
        "terrain is stage 2.",
        f"- Sun elevation limit = (90 - |lat|) + {config.SUN_MAX_ELEVATION_MARGIN_DEG} deg.",
        f"- Period checks pass within {lo:.1f}-{hi:.1f} days "
        f"(synodic month {config.SYNODIC_MONTH_DAYS} d +/- "
        f"{config.MONTH_PERIOD_TOLERANCE_FRACTION:.0%}).",
        "",
        "## Coverage",
        "",
        "| Site | Records | Expected | Missing | Duplicated | Angles out of range | Result |",
        "|---|---|---|---|---|---|---|",
    ]
    for c in checks:
        cov = c.coverage
        lines.append(
            f"| {c.site_id} | {cov.count} | {cov.expected} | {len(cov.missing)} | "
            f"{len(cov.duplicated)} | {c.out_of_range} | {mark(cov.ok and c.ranges_ok)} |"
        )
    lines += [
        "",
        "## Elevation ranges (degrees, ideal horizon)",
        "",
        "| Site | Lat | Sun min | Sun max | Sun limit | Sun check | Earth min | Earth max |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for c in checks:
        lines.append(
            f"| {c.site_id} | {c.lat:.4f} | {c.sun_el_min:.3f} | {c.sun_el_max:.3f} | "
            f"{c.sun_el_limit:.3f} | {mark(c.sun_el_ok)} | {c.earth_el_min:.3f} | "
            f"{c.earth_el_max:.3f} |"
        )
    lines += [
        "",
        "## Periods (days)",
        "",
        "| Site | Sun azimuth: one turn every | Check | Earth elevation: dominant period | Check |",
        "|---|---|---|---|---|",
    ]
    for c in checks:
        lines.append(
            f"| {c.site_id} | {c.sun_az_period_days:.2f} | {mark(c.sun_az_ok)} | "
            f"{c.earth_el_period_days:.2f} | {mark(c.earth_el_ok)} |"
        )
    lines += [
        "",
        "## Reference frame",
        "",
        "| Site | Horizons `Center pole/equ` |",
        "|---|---|",
    ]
    for c in checks:
        lines.append(f"| {c.site_id} | `{c.frame}` |")
    lines += [
        "",
        "Horizons interprets surface coordinates on the Moon in the mean-Earth/polar-axis "
        'frame of DE421 (manual: "mean Earth of DE421 for the Moon"). The LOLA products '
        '(PGDA 78 README) use the "MOON_ME reference frame of ephemeris DE421". '
        "The frames coincide according to both sources' documentation.",
        "",
        "## Summary",
        "",
        "All checks passed." if all(c.ok for c in checks) else "**Some checks FAILED.**",
        "",
    ]
    return "\n".join(lines)
