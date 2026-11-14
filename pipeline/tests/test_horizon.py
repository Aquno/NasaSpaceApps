"""Tests for stage 2: geometry, horizon computation on synthetic terrain, COG tile decoding."""

import math
import zlib

import numpy as np
import pytest

from pipeline.horizon.dem_cog import CogLevel, decode_tile
from pipeline.horizon.geometry import (
    azimuth_deg,
    bilinear,
    points_along_azimuths,
    smooth_sphere_dip_deg,
    unit_vector,
    unit_vectors_to_stereo_xy,
)
from pipeline.horizon.horizon_profile import (
    Band,
    compute_horizon,
    degree_bin,
    sample_distances,
)
from pipeline.sites.polar_stereo import forward_south_polar, inverse_south_polar

R = 1737400.0
SITE = (-89.5, 30.0)


def flat_terrain(_band, x, y):
    return np.zeros(np.shape(x))


def xy_to_unit(x, y):
    lat = np.degrees(2 * np.arctan(np.hypot(x, y) / (2 * R))) - 90.0
    lon = np.degrees(np.arctan2(x, y))
    return unit_vector(lat, lon)


# ---- azimuth convention ----------------------------------------------------------------


def angle_diff(a, b):
    """Smallest absolute difference between two azimuths, degrees."""
    return abs((a - b + 180.0) % 360.0 - 180.0)


def az_from_site(lat, lon):
    obs = R * unit_vector(*SITE)
    return float(azimuth_deg(obs, R * unit_vector(lat, lon), *SITE))


def test_target_north_on_same_meridian_is_azimuth_0():
    assert angle_diff(az_from_site(-89.4, 30.0), 0.0) < 1e-6


def test_target_east_is_azimuth_90():
    # Same latitude, slightly larger longitude: east (great-circle bearing ~90 deg).
    assert az_from_site(-89.5, 30.5) == pytest.approx(90.0, abs=0.5)


def test_north_in_stereographic_grid_is_away_from_pole():
    # Moving radially away from the pole on the polar stereographic grid is north.
    x, y = forward_south_polar(*SITE, R)
    lat, lon = inverse_south_polar(x * 1.001, y * 1.001, R)
    assert angle_diff(az_from_site(lat, lon), 0.0) < 1e-6


@pytest.mark.parametrize("az", [0.0, 45.0, 90.0, 180.0, 270.0, 359.0])
def test_points_along_azimuth_round_trip(az):
    obs = R * unit_vector(*SITE)
    p = R * points_along_azimuths(*SITE, np.array([az]), np.array([1000.0]), R)[0, 0]
    result = float(azimuth_deg(obs, p, *SITE))
    assert 0.0 <= result < 360.0
    assert angle_diff(result, az) < 1e-6


def test_ray_north_increases_stereo_radius():
    d = np.array([1000.0, 2000.0])
    x, y = unit_vectors_to_stereo_xy(points_along_azimuths(*SITE, np.array([0.0]), d, R), R)
    rho = np.hypot(x, y)[0]
    x0, y0 = forward_south_polar(*SITE, R)
    assert math.hypot(x0, y0) < rho[0] < rho[1]


# ---- horizon on synthetic terrain ----------------------------------------------------------


def test_smooth_sphere_gives_geometric_dip_everywhere():
    h = 100.0
    bands = [Band(5000.0, 20.0), Band(40000.0, 80.0)]
    result = compute_horizon(*SITE, h, R, bands, flat_terrain, fine_step_deg=1.0)
    expected = smooth_sphere_dip_deg(h, R)
    assert np.allclose(result.elevation_deg, expected, atol=2e-3)
    assert np.ptp(result.elevation_deg) < 1e-3
    assert np.all(np.isnan(result.cut_distance_m))


def test_wall_at_known_distance_and_height():
    obs_h, wall_h = 2.0, 500.0
    wall_from, wall_to = 9990.0, 10100.0
    bands = [Band(5000.0, 20.0), Band(20000.0, 40.0)]
    obs = (R + obs_h) * unit_vector(*SITE)

    def wall_terrain(_band, x, y):
        u = xy_to_unit(np.asarray(x), np.asarray(y))
        dist = R * np.arccos(np.clip(u @ unit_vector(*SITE), -1, 1))
        az = azimuth_deg(obs, R * u, *SITE)
        in_wall = (np.abs(az - 90.0) < 5.0) & (dist >= wall_from) & (dist <= wall_to)
        return np.where(in_wall, wall_h, 0.0)

    result = compute_horizon(*SITE, obs_h, R, bands, wall_terrain, fine_step_deg=0.5)
    distances, _ = sample_distances(bands)
    d = distances[distances >= wall_from][0]
    delta = d / R
    expected = math.degrees(
        math.atan2((R + wall_h) * math.cos(delta) - (R + obs_h), (R + wall_h) * math.sin(delta))
    )
    assert result.elevation_deg[90] == pytest.approx(expected, abs=1e-6)
    assert result.obstacle_distance_m[90] == pytest.approx(d)
    assert result.elevation_deg[270] == pytest.approx(smooth_sphere_dip_deg(obs_h, R), abs=2e-3)


def test_search_stops_at_dem_edge_without_assuming_terrain():
    bands = [Band(5000.0, 20.0), Band(20000.0, 80.0)]
    x0, _y0 = forward_south_polar(*SITE, R)

    def half_dem(_band, x, y):
        # No data beyond 8 km east of the site in map x; a tall cliff would be just past it.
        return np.where(np.asarray(x) > x0 + 8000.0, np.nan, 0.0)

    result = compute_horizon(*SITE, 2.0, R, bands, half_dem, fine_step_deg=1.0)
    cut = result.cut_distance_m
    assert np.any(~np.isnan(cut)) and np.any(np.isnan(cut))
    assert np.nanmax(cut) <= 20000.0
    assert np.all(np.isfinite(result.elevation_deg))


def test_degree_bins_are_centred_on_whole_degrees():
    assert list(degree_bin(np.array([359.6, 0.4, 0.5, 89.5, 90.49]))) == [0, 0, 1, 90, 90]


def test_sample_distances_bands():
    d, b = sample_distances([Band(100.0, 20.0), Band(300.0, 100.0)])
    assert list(d) == [20.0, 40.0, 60.0, 80.0, 100.0, 200.0, 300.0]
    assert list(b) == [0, 0, 0, 0, 0, 1, 1]


def test_bilinear_and_outside_is_nan():
    grid = np.array([[0.0, 10.0], [20.0, 30.0]])
    # Pixel centres at x = 0.5, 1.5 and y = -0.5, -1.5 with x_left = 0, y_top = 0, px = 1.
    v = bilinear(grid, 0.0, 0.0, 1.0, np.array([1.0, 5.0]), np.array([-1.0, -1.0]))
    assert v[0] == pytest.approx(15.0)
    assert np.isnan(v[1])


def test_smooth_sphere_dip_value():
    # Small-angle check: dip ~ sqrt(2h/R) radians.
    assert smooth_sphere_dip_deg(2.0, R) == pytest.approx(
        -math.degrees(math.sqrt(4.0 / R)), rel=1e-3
    )


# ---- COG tile decoding ---------------------------------------------------------------


def encode_float_predictor(values: np.ndarray) -> bytes:
    """Reference encoder (Adobe TIFF Technical Note 3) used only to test the decoder."""
    rows, cols = values.shape
    be = values.astype(">f4").view(np.uint8).reshape(rows, cols, 4)
    planes = be.transpose(0, 2, 1).reshape(rows, cols * 4)
    diff = np.diff(planes, axis=1, prepend=0).astype(np.uint8)
    return zlib.compress(diff.tobytes())


def test_decode_tile_floating_point_predictor():
    level = CogLevel(4, 3, 20.0, 4, 3, (0,), (0,))
    values = np.array([[1.5, -2.25, 1000.0, 7027.2], [0, 1, 2, 3], [-7296.8, 5, 6, np.nan]])
    out = decode_tile(encode_float_predictor(values), level, 3, "<")
    assert np.allclose(out[~np.isnan(values)], values[~np.isnan(values)].astype(np.float32))
    assert np.isnan(out[2, 3])
