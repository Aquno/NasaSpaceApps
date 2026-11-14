"""
What: South polar stereographic projection on a sphere (forward and inverse), pure functions.
Roadmap stage: 1 — Ephemeris, cross-check of site coordinates (see docs/ROTEIRO.md)
Inputs: map x/y in metres, or latitude/longitude in degrees; sphere radius in metres.
Outputs: latitude/longitude in degrees (east-positive, [-180, 180)), or map x/y in metres.
NASA data source: projection parameters declared in the GeoTIFF keys of PGDA product 78
    (polar stereographic, latitude of origin -90, central meridian 0, scale 1,
    sphere a = b = 1737400 m); frame MOON_ME (DE421) per the product README.

Formulas: Snyder, "Map Projections - A Working Manual", USGS PP 1395 (1987),
stereographic projection, polar aspect, sphere, scale 1 at the pole
"""

from __future__ import annotations

import math

QUARTER_TURN_RAD = math.pi / 2.0
FULL_TURN_DEG = 360.0
HALF_TURN_DEG = 180.0


def inverse_south_polar(
    x_m: float, y_m: float, radius_m: float, central_lon_deg: float = 0.0
) -> tuple[float, float]:
    """Convert south polar stereographic map coordinates to latitude/longitude.

    Args:
        x_m: map easting in metres.
        y_m: map northing in metres.
        radius_m: sphere radius in metres (1737400 for PGDA product 78).
        central_lon_deg: longitude of the projection's central meridian, degrees east.

    Returns:
        (lat_deg, lon_deg): latitude in degrees (negative = south), longitude in degrees
        east-positive normalised to [-180, 180). Same frame as the map (MOON_ME for PGDA).
    """
    rho = math.hypot(x_m, y_m)
    lat_rad = 2.0 * math.atan(rho / (2.0 * radius_m)) - QUARTER_TURN_RAD
    lon_deg = central_lon_deg + math.degrees(math.atan2(x_m, y_m))
    return math.degrees(lat_rad), normalize_lon_180(lon_deg)


def forward_south_polar(
    lat_deg: float, lon_deg: float, radius_m: float, central_lon_deg: float = 0.0
) -> tuple[float, float]:
    """Convert latitude/longitude to south polar stereographic map coordinates.

    Args:
        lat_deg: latitude in degrees (negative = south).
        lon_deg: longitude in degrees east.
        radius_m: sphere radius in metres.
        central_lon_deg: longitude of the projection's central meridian, degrees east.

    Returns:
        (x_m, y_m): easting and northing in metres.
    """
    rho = 2.0 * radius_m * math.tan(math.radians(lat_deg) / 2.0 + math.pi / 4.0)
    dlon = math.radians(lon_deg - central_lon_deg)
    return rho * math.sin(dlon), rho * math.cos(dlon)


def normalize_lon_180(lon_deg: float) -> float:
    """Normalise a longitude in degrees to the range [-180, 180)."""
    return (lon_deg + HALF_TURN_DEG) % FULL_TURN_DEG - HALF_TURN_DEG


def normalize_lon_360(lon_deg: float) -> float:
    """Normalise a longitude in degrees to the range [0, 360) (Horizons SITE_COORD form)."""
    return lon_deg % FULL_TURN_DEG
