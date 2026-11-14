"""
What: Pick the reference point of a region: the pixel with the highest NASA average solar
    illumination inside the region, ties broken by the distance to the published centre.
    Pure function.
Roadmap stage: 5 — fair site points (docs/DECISOES.md D30) (see docs/ROTEIRO.md)
Inputs: illumination block (fraction 0-1) with the map x/y (m) of each pixel centre, region
    bounds (m), published centre (m).
Outputs: BrightestPixel (block row/column, value, map x/y, distance to the centre in m).
NASA data source: PGDA product 69 average illumination (85S, 60 m); regions = PGDA product 78
    tiles; centres = NASA M2M-30044 Lunar Surface Data Book, Table A2.1-1.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class BrightestPixel:
    """Selected pixel. Map coordinates and distance in metres; value is a fraction 0-1."""

    row: int
    col: int
    value: float
    x_m: float
    y_m: float
    distance_to_centre_m: float
    tied_pixels: int


def brightest_pixel(
    values: np.ndarray,
    x_m: np.ndarray,
    y_m: np.ndarray,
    region_xy_m: tuple[float, float, float, float],
    centre_xy_m: tuple[float, float],
) -> BrightestPixel:
    """Highest value inside the region; among equal maxima, the one nearest the centre.

    Args:
        values: illumination per pixel (fraction 0-1), shape (rows, cols).
        x_m: map x of each pixel centre, same shape.
        y_m: map y of each pixel centre, same shape.
        region_xy_m: (x_min, x_max, y_min, y_max) in metres; pixel centres must lie inside.
        centre_xy_m: published centre (x, y) in metres.

    Raises:
        ValueError: if no pixel lies inside the region.
    """
    x_min, x_max, y_min, y_max = region_xy_m
    inside = (x_m >= x_min) & (x_m <= x_max) & (y_m >= y_min) & (y_m <= y_max)
    if not inside.any():
        raise ValueError("no pixel inside the region")
    best = values[inside].max()
    candidates = inside & (values == best)
    distance = np.hypot(x_m - centre_xy_m[0], y_m - centre_xy_m[1])
    distance = np.where(candidates, distance, np.inf)
    r, c = np.unravel_index(int(np.argmin(distance)), values.shape)
    return BrightestPixel(
        row=int(r),
        col=int(c),
        value=float(values[r, c]),
        x_m=float(x_m[r, c]),
        y_m=float(y_m[r, c]),
        distance_to_centre_m=float(distance[r, c]),
        tied_pixels=int(candidates.sum()),
    )
