"""
What: Spherical-Moon geometry for the terrain horizon, as pure vectorised functions:
    Moon-centred unit vectors, local east/north/up basis, points along an azimuth,
    elevation angle and azimuth of a target seen from an observer, polar stereographic
    coordinates of directions, horizon dip of a smooth sphere.
Roadmap stage: 2 — Horizon (see docs/ROTEIRO.md)
Inputs: latitude/longitude in degrees (MOON_ME, east-positive), distances and radii in metres.
Outputs: numpy arrays (vectors in metres or unitless, angles in degrees).
NASA data source: none directly; the sphere radius (1737.4 km) is the one used by JPL Horizons
    and by the PGDA LOLA DEM GeoKeys (see pipeline/config.py).

Conventions: Moon-centred frame with +Z toward the north pole, +X toward 0° E, +Y toward 90° E.
Azimuth as in JPL Horizons: degrees clockwise from north (N = 0, E = 90, S = 180, W = 270).
Elevation: degrees above the plane perpendicular to the local zenith (local "up").
"""

from __future__ import annotations

import numpy as np

FULL_TURN_DEG = 360.0


def unit_vector(lat_deg: np.ndarray | float, lon_deg: np.ndarray | float) -> np.ndarray:
    """Unit vector(s) from the Moon's centre toward latitude/longitude (degrees). Shape (..., 3)."""
    lat, lon = np.radians(lat_deg), np.radians(lon_deg)
    return np.stack([np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)], axis=-1)


def enu_basis(lat_deg: float, lon_deg: float) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Local (east, north, up) unit vectors at a surface point.

    North points along the meridian toward the lunar north pole (also at the south pole
    region, where "north" means away from the pole).
    """
    lat, lon = np.radians(lat_deg), np.radians(lon_deg)
    east = np.array([-np.sin(lon), np.cos(lon), 0.0])
    north = np.array([-np.sin(lat) * np.cos(lon), -np.sin(lat) * np.sin(lon), np.cos(lat)])
    up = unit_vector(lat_deg, lon_deg)
    return east, north, up


def points_along_azimuths(
    lat_deg: float, lon_deg: float, azimuth_deg: np.ndarray, distance_m: np.ndarray, radius_m: float
) -> np.ndarray:
    """Unit vectors of surface points reached along great circles from a site.

    Args:
        lat_deg: site latitude, degrees.
        lon_deg: site longitude, degrees east.
        azimuth_deg: (A,) start directions, degrees clockwise from north.
        distance_m: (D,) arc lengths along the sphere surface, metres.
        radius_m: sphere radius, metres.

    Returns:
        (A, D, 3) unit vectors.
    """
    east, north, up = enu_basis(lat_deg, lon_deg)
    az = np.radians(np.asarray(azimuth_deg, dtype=float))[:, None, None]
    delta = (np.asarray(distance_m, dtype=float) / radius_m)[None, :, None]
    heading = np.cos(az) * north + np.sin(az) * east  # (A, 1, 3) tangent direction
    return np.cos(delta) * up + np.sin(delta) * heading


def elevation_deg(observer_m: np.ndarray, target_m: np.ndarray, up: np.ndarray) -> np.ndarray:
    """Elevation angle(s) of target point(s) seen from the observer, degrees.

    Args:
        observer_m: (3,) observer position from the Moon's centre, metres.
        target_m: (..., 3) target positions from the Moon's centre, metres.
        up: (3,) local zenith unit vector at the observer.
    """
    d = target_m - observer_m
    return np.degrees(np.arcsin(np.clip((d @ up) / np.linalg.norm(d, axis=-1), -1.0, 1.0)))


def azimuth_deg(
    observer_m: np.ndarray, target_m: np.ndarray, lat_deg: float, lon_deg: float
) -> np.ndarray:
    """Azimuth(s) of target point(s) seen from an observer at lat/lon, degrees in [0, 360)."""
    east, north, _up = enu_basis(lat_deg, lon_deg)
    d = target_m - observer_m
    az = np.degrees(np.arctan2(d @ east, d @ north)) % FULL_TURN_DEG
    # A tiny negative angle can round to exactly 360.0 after the modulo.
    return np.where(az >= FULL_TURN_DEG, 0.0, az)


def unit_vectors_to_stereo_xy(
    vectors: np.ndarray, radius_m: float
) -> tuple[np.ndarray, np.ndarray]:
    """South polar stereographic map coordinates (metres) of direction vectors.

    Same projection as the PGDA DEMs: sphere of ``radius_m``, origin at -90°, central
    meridian 0°, scale 1 at the pole; x = rho sin(lon), y = rho cos(lon).
    """
    lat = np.arcsin(np.clip(vectors[..., 2], -1.0, 1.0))
    lon = np.arctan2(vectors[..., 1], vectors[..., 0])
    rho = 2.0 * radius_m * np.tan(lat / 2.0 + np.pi / 4.0)
    return rho * np.sin(lon), rho * np.cos(lon)


def smooth_sphere_dip_deg(height_m: float, radius_m: float) -> float:
    """Horizon dip below the local horizontal for an observer ``height_m`` above a smooth sphere.

    Returns a non-positive elevation in degrees: -acos(R / (R + h)).
    """
    return -float(np.degrees(np.arccos(radius_m / (radius_m + height_m))))


def bilinear(
    grid: np.ndarray,
    x_left_m: float,
    y_top_m: float,
    pixel_m: float,
    x_m: np.ndarray,
    y_m: np.ndarray,
) -> np.ndarray:
    """Bilinear interpolation of a north-up grid at map points; NaN outside or near no-data.

    Pixel (r, c) is centred at (x_left + (c + 0.5) px, y_top - (r + 0.5) px).
    """
    col = (np.asarray(x_m) - x_left_m) / pixel_m - 0.5
    row = (y_top_m - np.asarray(y_m)) / pixel_m - 0.5
    c0, r0 = np.floor(col).astype(int), np.floor(row).astype(int)
    inside = (c0 >= 0) & (r0 >= 0) & (c0 + 1 < grid.shape[1]) & (r0 + 1 < grid.shape[0])
    c0s, r0s = np.where(inside, c0, 0), np.where(inside, r0, 0)
    fc, fr = col - c0, row - r0
    value = (
        grid[r0s, c0s] * (1 - fc) * (1 - fr)
        + grid[r0s, c0s + 1] * fc * (1 - fr)
        + grid[r0s + 1, c0s] * (1 - fc) * fr
        + grid[r0s + 1, c0s + 1] * fc * fr
    )
    return np.where(inside, value, np.nan)
