"""Tests for pipeline/ephemeris/horizons_parser.py using real Horizons responses.

Fixtures: test query of 2026-11-14, Connecting ridge CR1 (222.6 E, -89.468, 0 km),
2027-01-01 00:00 to 2027-01-02 23:00 UT, 1 h step, quantities 4 and 13.
"""

from pathlib import Path

import pytest

from pipeline.ephemeris.horizons_parser import (
    HorizonsParseError,
    horizons_time_to_iso,
    parse_observer_table,
)

FIXTURES = Path(__file__).parent / "fixtures"
SUN = FIXTURES / "horizons_connecting_ridge_sun_2027-01-01_2d.txt"
EARTH = FIXTURES / "horizons_connecting_ridge_earth_2027-01-01_2d.txt"


def load(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def test_sun_table_rows_and_values():
    table = parse_observer_table(load(SUN))
    assert len(table.rows) == 48
    first, last = table.rows[0], table.rows[-1]
    assert first.t == "2027-01-01T00:00:00Z"
    assert first.az == pytest.approx(40.523012549)
    assert first.el == pytest.approx(1.418332985)
    assert first.diam == pytest.approx(1952.231 / 3600.0)
    assert last.t == "2027-01-02T23:00:00Z"
    assert last.az == pytest.approx(16.686783167)


def test_earth_table_values():
    table = parse_observer_table(load(EARTH))
    first = table.rows[0]
    assert first.az == pytest.approx(144.551983223)
    assert first.el == pytest.approx(-6.681506446)
    assert first.diam == pytest.approx(6716.990 / 3600.0)


def test_header_fields():
    header = parse_observer_table(load(SUN)).header
    assert header["Center pole/equ"].startswith("MEAN_ME")
    assert header["Center radii"].startswith("1737.4, 1737.4, 1737.4")
    assert header["Center geodetic"].startswith("222.6, -89.468, 0.0")
    assert header["Atmos refraction"].startswith("NO (AIRLESS)")


def test_hourly_epochs_are_consecutive():
    times = [row.t for row in parse_observer_table(load(SUN)).rows]
    assert times[:3] == ["2027-01-01T00:00:00Z", "2027-01-01T01:00:00Z", "2027-01-01T02:00:00Z"]
    assert len(set(times)) == len(times)


@pytest.mark.parametrize(
    ("stamp", "iso"),
    [
        ("2027-Jan-01 00:00", "2027-01-01T00:00:00Z"),
        ("2027-Dec-31 23:00", "2027-12-31T23:00:00Z"),
        (" 2027-May-05 12:30", "2027-05-05T12:30:00Z"),
    ],
)
def test_time_conversion(stamp, iso):
    assert horizons_time_to_iso(stamp) == iso


def test_missing_markers_raise():
    with pytest.raises(HorizonsParseError):
        parse_observer_table("no table here")


def test_not_available_value_raises():
    text = load(SUN).replace("1952.231", "n.a.", 1)
    with pytest.raises(HorizonsParseError, match="not available"):
        parse_observer_table(text)


def test_missing_column_raises():
    text = load(SUN).replace("Ang-diam", "Other", 1)
    with pytest.raises(HorizonsParseError, match="Ang-diam"):
        parse_observer_table(text)
