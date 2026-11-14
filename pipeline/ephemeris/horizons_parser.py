"""
What: Interpret the text of a JPL Horizons observer table (CSV mode, quantities 4 and 13).
    Pure functions: no network, no files.
Roadmap stage: 1 — Ephemeris (see docs/ROTEIRO.md)
Inputs: table text as returned by the API "result" field.
Outputs: ObserverTable with header fields and hourly rows (UTC ISO time, azimuth and
    elevation in degrees, angular diameter converted from arcseconds to degrees).
NASA data source: JPL Horizons (column meanings quoted from the response footer:
    "Azimuth is measured clockwise from north: North(0) -> East(90) -> South(180) ->
    West(270)"; "Elevation angle is with respect to a plane perpendicular to the reference
    surface local zenith direction"; Ang-diam "Units: ARCSECONDS").
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from pipeline import config

START_MARKER = "$$SOE"
END_MARKER = "$$EOE"
DATE_COLUMN_PREFIX = "Date__(UT)"
AZIMUTH_COLUMN = "Azimuth_(a-app)"
ELEVATION_COLUMN = "Elevation_(a-app)"
DIAMETER_COLUMN = "Ang-diam"
# Header lines look like "Center pole/equ : MEAN_ME ..." or "Atmos refraction: NO ...".
HEADER_LINE = re.compile(r"^([A-Za-z][A-Za-z ./-]*?)\s*:\s+(.*)$")
NOT_AVAILABLE = "n.a."
# English month abbreviations used by Horizons ("2027-Jan-01 00:00"); parsed without
# the locale-dependent %b so the result does not depend on the machine's language.
MONTHS = {
    name: number
    for number, name in enumerate(
        ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
        start=1,
    )
}


class HorizonsParseError(ValueError):
    """Raised when the table text does not have the expected layout."""


@dataclass(frozen=True)
class ObserverRow:
    """One table record.

    Attributes:
        t: epoch, UTC, ISO 8601 ("2027-01-01T00:00:00Z"). Horizons labels it UT.
        az: apparent airless azimuth, degrees, clockwise from north, [0, 360).
        el: apparent airless elevation, degrees, above the plane perpendicular to the
            local zenith (ideal horizon, no terrain).
        diam: target angular diameter, degrees.
    """

    t: str
    az: float
    el: float
    diam: float


@dataclass(frozen=True)
class ObserverTable:
    """Parsed table: header fields (e.g. "Center pole/equ") and rows in file order."""

    header: dict[str, str]
    rows: list[ObserverRow]


def parse_observer_table(text: str, source: str = "<text>") -> ObserverTable:
    """Parse a Horizons observer table in CSV mode with quantities 4 and 13.

    Args:
        text: raw table text.
        source: name used in error messages.

    Raises:
        HorizonsParseError: missing markers/columns, "n.a." values or malformed lines.
    """
    lines = text.splitlines()
    try:
        start = next(i for i, line in enumerate(lines) if line.strip() == START_MARKER)
        end = next(i for i, line in enumerate(lines) if line.strip() == END_MARKER)
    except StopIteration as exc:
        raise HorizonsParseError(f"{source}: missing {START_MARKER}/{END_MARKER}") from exc

    header = parse_header(lines[:start])
    columns = _column_index(lines[:start], source)
    rows = [_parse_row(line, columns, source) for line in lines[start + 1 : end] if line.strip()]
    if not rows:
        raise HorizonsParseError(f"{source}: table has no rows")
    return ObserverTable(header=header, rows=rows)


def parse_header(lines: list[str]) -> dict[str, str]:
    """Collect "Key : value" header lines (e.g. "Center pole/equ : MEAN_ME ...")."""
    header: dict[str, str] = {}
    for line in lines:
        match = HEADER_LINE.match(line)
        if match:
            header.setdefault(match.group(1).strip(), match.group(2).strip())
    return header


def horizons_time_to_iso(stamp: str) -> str:
    """Convert "2027-Jan-01 00:00" (Horizons UT) to "2027-01-01T00:00:00Z" (UTC)."""
    try:
        date_part, time_part = stamp.strip().split()
        year, month_name, day = date_part.split("-")
        hour, minute = time_part.split(":")[:2]
        month = MONTHS[month_name]
    except (ValueError, KeyError) as exc:
        raise HorizonsParseError(f"unexpected time stamp {stamp!r}") from exc
    return f"{int(year):04d}-{month:02d}-{int(day):02d}T{int(hour):02d}:{int(minute):02d}:00Z"


def _column_index(header_lines: list[str], source: str) -> dict[str, int]:
    names_line = next(
        (ln for ln in header_lines if ln.strip().startswith(DATE_COLUMN_PREFIX)), None
    )
    if names_line is None:
        raise HorizonsParseError(f"{source}: column header line not found")
    names = [name.strip() for name in names_line.split(",")]
    index = {}
    for wanted in (AZIMUTH_COLUMN, ELEVATION_COLUMN, DIAMETER_COLUMN):
        if wanted not in names:
            raise HorizonsParseError(f"{source}: column {wanted!r} not in {names}")
        index[wanted] = names.index(wanted)
    return index


def _parse_row(line: str, columns: dict[str, int], source: str) -> ObserverRow:
    fields = [field.strip() for field in line.split(",")]
    try:
        values = {name: fields[i] for name, i in columns.items()}
    except IndexError as exc:
        raise HorizonsParseError(f"{source}: short line {line!r}") from exc
    if NOT_AVAILABLE in values.values():
        raise HorizonsParseError(f"{source}: value not available in line {line!r}")
    try:
        return ObserverRow(
            t=horizons_time_to_iso(fields[0]),
            az=float(values[AZIMUTH_COLUMN]),
            el=float(values[ELEVATION_COLUMN]),
            diam=float(values[DIAMETER_COLUMN]) / config.ARCSEC_PER_DEG,
        )
    except ValueError as exc:
        raise HorizonsParseError(f"{source}: bad number in line {line!r}") from exc
