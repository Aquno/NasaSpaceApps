"""
What: Derive a crest point near a published region centre: the nearest local height maximum
    that is higher than the centre, inside the region. Also the local terrain slope at a point.
    Pure functions on a height grid.
Roadmap stage: 2 — Horizon (site point review, docs/DECISOES.md D20) (see docs/ROTEIRO.md)
Inputs: north-up height grid (metres) with its map corner and pixel size (polar stereographic
    metres), the published centre (map metres), the region bounds, the local-maximum radius.
Outputs: CrestPoint (map x/y in metres, height in metres, distance to the centre in metres);
    slope in degrees.
NASA data source: heights from the LOLA 20 m DEM (PGDA product 90); region = PGDA product 78
    tile Site04 ("Shackleton rim"); centre = NASA M2M-30044 Lunar Surface Data Book, Table A2.1-1.

Rule (reproducible): among the grid pixels inside the region whose height is (1) the maximum
within `radius_m` of the pixel and (2) higher than the height at the published centre, take
the one closest to the centre.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class CrestPoint:
    """Derived point. Map coordinates in metres (polar stereographic), height in metres."""

    x_m: float
    y_m: float
    height_m: float
    distance_to_centre_m: float


def pixel_centres(shape: tuple[int, int], x_left_m: float, y_top_m: float, pixel_m: float):
    """Map x and y (metres) of every pixel centre of a north-up grid."""
    rows, cols = np.indices(shape)
    return x_left_m + (cols + 0.5) * pixel_m, y_top_m - (rows + 0.5) * pixel_m


def local_maxima(grid: np.ndarray, radius_px: int) -> np.ndarray:
    """Boolean mask of pixels equal to the maximum of the disc of ``radius_px`` around them.

    Pixels whose disc reaches outside the grid or touches no-data are not local maxima.
    """
    rows, cols = grid.shape
    filled = np.where(np.isfinite(grid), grid, np.inf)  # no-data never loses the comparison
    best = np.full(grid.shape, -np.inf)
    pad = np.pad(filled, radius_px, constant_values=np.inf)
    for dr in range(-radius_px, radius_px + 1):
        for dc in range(-radius_px, radius_px + 1):
            if dr * dr + dc * dc > radius_px * radius_px:
                continue
            window = pad[
                radius_px + dr : radius_px + dr + rows, radius_px + dc : radius_px + dc + cols
            ]
            best = np.maximum(best, window)
    return np.isfinite(grid) & (grid >= best)


def nearest_crest_maximum(
    grid: np.ndarray,
    x_left_m: float,
    y_top_m: float,
    pixel_m: float,
    centre_xy_m: tuple[float, float],
    centre_height_m: float,
    region_xy_m: tuple[float, float, float, float],
    radius_m: float,
) -> CrestPoint:
    """Apply the crest rule (module docstring) and return the derived point.

    Args:
        grid: heights in metres, north-up.
        x_left_m: map x of the grid's left edge.
        y_top_m: map y of the grid's top edge.
        pixel_m: pixel size in metres.
        centre_xy_m: published centre (x, y), metres.
        centre_height_m: terrain height at the centre, metres.
        region_xy_m: region bounds (x_min, x_max, y_min, y_max), metres.
        radius_m: local-maximum radius, metres.

    Raises:
        ValueError: if no pixel satisfies the rule.
    """
    x, y = pixel_centres(grid.shape, x_left_m, y_top_m, pixel_m)
    x_min, x_max, y_min, y_max = region_xy_m
    candidates = (
        local_maxima(grid, int(round(radius_m / pixel_m)))
        & (grid > centre_height_m)
        & (x >= x_min)
        & (x <= x_max)
        & (y >= y_min)
        & (y <= y_max)
    )
    if not candidates.any():
        raise ValueError("no local maximum above the centre height inside the region")
    distance = np.hypot(x - centre_xy_m[0], y - centre_xy_m[1])
    distance = np.where(candidates, distance, np.inf)
    r, c = np.unravel_index(int(np.argmin(distance)), grid.shape)
    return CrestPoint(float(x[r, c]), float(y[r, c]), float(grid[r, c]), float(distance[r, c]))


def slope_deg(height_at, x_m: float, y_m: float, step_m: float) -> float:
    """Terrain slope (degrees) at a map point from central differences over ``step_m``.

    Args:
        height_at: function (x array, y array) -> heights in metres.
        x_m: map x of the point, metres.
        y_m: map y of the point, metres.
        step_m: half-baseline of the differences, metres (one DEM pixel).
    """
    xs = np.array([x_m + step_m, x_m - step_m, x_m, x_m])
    ys = np.array([y_m, y_m, y_m + step_m, y_m - step_m])
    h = height_at(xs, ys)
    dzdx = (h[0] - h[1]) / (2 * step_m)
    dzdy = (h[2] - h[3]) / (2 * step_m)
    return float(np.degrees(np.arctan(np.hypot(dzdx, dzdy))))
