"""Tests for stage 4: building and validating the interface files (contract version 2)."""

import copy

import pytest

from pipeline.export.build import build_site_entry, build_site_file, round_azimuth
from pipeline.export.contract import validate_site_file, validate_sites

N = 3


def ephemeris_doc():
    rows = [
        {
            "t": f"2027-01-01T0{i}:00:00Z",
            "sun_az": 359.99961,
            "sun_el": 1.23456,
            "sun_diam": 0.5423,
            "earth_az": 10.0,
            "earth_el": -3.0,
            "earth_diam": 1.87,
        }
        for i in range(N)
    ]
    return {
        "meta": {
            "site_id": "x-site",
            "start": "2027-01-01T00:00:00Z",
            "end": "2027-01-01T02:00:00Z",
            "step_minutes": 60,
        },
        "series": rows,
    }


def horizon_doc():
    return {
        "meta": {
            "site_id": "x-site",
            "terrain_height_m": 100.04,
            "terrain_slope_deg": 2.34,
            "observer_height_above_sphere_m": 102.04,
            "mast_height_m": 2.0,
            "horizon_method": "lola",
            "bands": [{"max_distance_m": 5000.0, "pixel_m": 20.0, "cog_level": 0}],
        },
        "horizon_deg": [1.23456] * 360,
        "obstacle_distance_km": [1.5] * 360,
        "cut_distance_km": [None] * 359 + [180.25],
    }


SITE = {
    "id": "x-site",
    "name": "X",
    "lat": -89.0,
    "lon": 10.0,
    "description": "d",
    "source_type": "published_point",
}


def built():
    return build_site_file(ephemeris_doc(), horizon_doc(), ["src"], "2026-11-14")


def test_built_file_is_valid_and_columnar():
    doc = built()
    assert validate_site_file(doc, "x.json", "x-site") == []
    assert doc["series"]["sun_el"] == [1.235] * N
    assert doc["series"]["sun_az"] == [0.0] * N  # 359.9996 rounds to 360 -> wrapped to 0
    assert "t" not in doc["series"] and doc["meta"]["count"] == N
    assert doc["horizon_cut_km"][-1] == 180.25 and doc["horizon_cut_km"][0] is None


def test_round_azimuth_wraps():
    assert round_azimuth(359.9996) == 0.0 and round_azimuth(359.9994) == 359.999


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda d: d["horizon"].pop(), "'horizon' must be an array of 360"),
        (lambda d: d["series"]["sun_el"].pop(), "series.sun_el has 2 values"),
        (lambda d: d["meta"].pop("sample"), "missing field 'sample'"),
        (
            lambda d: d["series"]["earth_az"].__setitem__(0, 360.0),
            "series.earth_az outside [0, 360)",
        ),
        (lambda d: d["meta"].__setitem__("end", "2027-01-01T05:00:00Z"), "start + (count - 1)"),
        (lambda d: d["meta"].__setitem__("contract_version", 1), "contract_version must be 2"),
    ],
)
def test_validator_names_file_and_field(mutate, message):
    doc = copy.deepcopy(built())
    mutate(doc)
    errors = validate_site_file(doc, "sites/x-site.json", "x-site")
    assert any(message in e and e.startswith("sites/x-site.json") for e in errors), errors


def test_sites_entry_and_validation():
    entry = build_site_entry(SITE, horizon_doc()["meta"], None, None)
    assert entry["terrain_height_m"] == 100.0 and entry["psr_distance_km"] is None
    assert validate_sites([entry]) == []
    bad = dict(entry, lon=180.0, source_type="guess")
    errors = validate_sites([bad])
    assert any("'lon'" in e for e in errors) and any("'source_type'" in e for e in errors)
