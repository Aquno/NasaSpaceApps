"""Tests for pipeline/ephemeris/checks.py and the pure helpers of run_ephemeris.py."""

import math
from datetime import datetime, timezone

import pytest

from pipeline.ephemeris.checks import (
    check_coverage,
    count_out_of_range,
    dominant_period_days,
    expected_epochs,
    in_month_band,
    revolution_period_days,
    sun_elevation_limit,
)
from pipeline.ephemeris.horizons_parser import ObserverRow
from pipeline.ephemeris.run_ephemeris import EphemerisError, merge_series, split_interval

UTC = timezone.utc


def test_expected_epochs_full_year_2027():
    epochs = expected_epochs(
        datetime(2027, 1, 1, tzinfo=UTC), datetime(2027, 12, 31, 23, tzinfo=UTC), 60
    )
    assert len(epochs) == 8760
    assert epochs[0] == "2027-01-01T00:00:00Z"
    assert epochs[-1] == "2027-12-31T23:00:00Z"


def test_coverage_detects_missing_and_duplicates():
    expected = ["a", "b", "c"]
    cov = check_coverage(["a", "a", "c"], expected)
    assert cov.missing == ["b"]
    assert cov.duplicated == ["a"]
    assert not cov.ok
    assert check_coverage(["a", "b", "c"], expected).ok


def test_sun_elevation_limit():
    assert sun_elevation_limit(-89.0) == pytest.approx(2.6)
    assert sun_elevation_limit(-86.0) == pytest.approx(5.6)


def test_revolution_period_with_wraparound():
    # Azimuth decreasing one full turn every 30 days, hourly samples over 90 days.
    hours = range(90 * 24 + 1)
    az = [(100.0 - 360.0 * h / (30 * 24)) % 360.0 for h in hours]
    assert revolution_period_days(az, 1.0) == pytest.approx(30.0, rel=1e-6)


def test_revolution_period_static_is_infinite():
    assert revolution_period_days([10.0] * 100, 1.0) == math.inf


def test_dominant_period_of_sine():
    period = 27.3
    values = [5.0 * math.sin(2 * math.pi * (h / 24) / period) for h in range(365 * 24)]
    assert dominant_period_days(values, 1.0) == pytest.approx(period, rel=0.02)


@pytest.mark.parametrize(("days", "ok"), [(29.53, True), (27.3, True), (14.8, False), (365, False)])
def test_month_band(days, ok):
    assert in_month_band(days) is ok


def test_split_interval_has_no_overlap():
    start = datetime(2027, 1, 1, tzinfo=UTC)
    stop = datetime(2027, 1, 1, 9, tzinfo=UTC)
    (a0, a1), (b0, b1) = split_interval(start, stop, 60)
    assert (a0, b1) == (start, stop)
    assert (b0 - a1).total_seconds() == 3600


def test_merge_requires_identical_epochs():
    sun = [ObserverRow("t1", 1.0, 2.0, 0.5)]
    earth = [ObserverRow("t2", 3.0, 4.0, 1.9)]
    with pytest.raises(EphemerisError):
        merge_series(sun, earth, "x")
    merged = merge_series(sun, [ObserverRow("t1", 3.0, 4.0, 1.9)], "x")
    assert merged == [
        {
            "t": "t1",
            "sun_az": 1.0,
            "sun_el": 2.0,
            "sun_diam": 0.5,
            "earth_az": 3.0,
            "earth_el": 4.0,
            "earth_diam": 1.9,
        }
    ]


def test_count_out_of_range():
    good = {"sun_az": 0.0, "sun_el": -90.0, "earth_az": 359.9, "earth_el": 90.0}
    bad_az = {"sun_az": 360.0, "sun_el": 1.0, "earth_az": 10.0, "earth_el": 1.0}
    bad_el = {"sun_az": 1.0, "sun_el": 1.0, "earth_az": 10.0, "earth_el": -90.5}
    assert count_out_of_range([good]) == 0
    assert count_out_of_range([good, bad_az, bad_el]) == 2
