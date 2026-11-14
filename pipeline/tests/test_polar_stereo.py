"""Tests for pipeline/sites/polar_stereo.py and the tile-centre computation."""

import pytest

from pipeline.sites.geotiff_header import GeoTiffGeoref, raster_center_xy
from pipeline.sites.polar_stereo import (
    forward_south_polar,
    inverse_south_polar,
    normalize_lon_180,
    normalize_lon_360,
)

R_MOON_M = 1737400.0


def test_origin_is_south_pole():
    lat, _lon = inverse_south_polar(0.0, 0.0, R_MOON_M)
    assert lat == pytest.approx(-90.0)


def test_positive_y_axis_is_central_meridian():
    _lat, lon = inverse_south_polar(0.0, 10000.0, R_MOON_M)
    assert lon == pytest.approx(0.0)


def test_positive_x_axis_is_90_east():
    _lat, lon = inverse_south_polar(10000.0, 0.0, R_MOON_M)
    assert lon == pytest.approx(90.0)


@pytest.mark.parametrize(("lat", "lon"), [(-89.5, -137.4), (-86.0, 0.3), (-88.2, 120.0)])
def test_round_trip(lat, lon):
    x, y = forward_south_polar(lat, lon, R_MOON_M)
    lat2, lon2 = inverse_south_polar(x, y, R_MOON_M)
    assert lat2 == pytest.approx(lat, abs=1e-9)
    assert lon2 == pytest.approx(lon, abs=1e-9)


def test_site04_tile_centre_matches_published_point():
    # Site04 header (PGDA 78): 3200 x 3200 px, 5 m, tie point (0,0) -> (-9000, 1000) m,
    # PixelIsArea. Published centre in M2M-30044 Table A2.1-1: -89.7668, -171.87.
    georef = GeoTiffGeoref(
        width=3200,
        height=3200,
        pixel_scale=(5.0, 5.0, 0.0),
        tiepoint=(0.0, 0.0, 0.0, -9000.0, 1000.0, 0.0),
        geokeys={1025: 1},
    )
    x, y = raster_center_xy(georef)
    assert (x, y) == (-1000.0, -7000.0)
    lat, lon = inverse_south_polar(x, y, R_MOON_M)
    assert lat == pytest.approx(-89.7668, abs=5e-5)
    assert lon == pytest.approx(-171.87, abs=5e-3)


def test_pixel_is_point_centre():
    georef = GeoTiffGeoref(
        width=3,
        height=3,
        pixel_scale=(5.0, 5.0, 0.0),
        tiepoint=(0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
        geokeys={1025: 2},
    )
    assert raster_center_xy(georef) == (5.0, -5.0)


@pytest.mark.parametrize(("lon", "expected"), [(222.6, -137.4), (-180.0, -180.0), (180.0, -180.0)])
def test_normalize_180(lon, expected):
    assert normalize_lon_180(lon) == pytest.approx(expected)


def test_normalize_360():
    assert normalize_lon_360(-137.4) == pytest.approx(222.6)
