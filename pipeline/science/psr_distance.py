"""
What: Distance from a site to the nearest permanently shadowed region (PSR) boundary, zero
    when the site is inside one. Pure planar geometry on polar stereographic coordinates.
Roadmap stage: 3 — Science value (see docs/ROTEIRO.md)
Inputs: site x/y (polar stereographic metres) and PSR polygons (rings in the same metres).
Outputs: NearestPsr (polygon index, planar distance in m, nearest boundary point, inside flag).
NASA data source: PSR outlines from PGDA product 90 (supplied by the caller).

The nearest point is found on the map plane (scale factor within 0.2% of 1 south of 85 S);
the caller converts it to a great-circle distance on the sphere.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class NearestPsr:
    """Nearest PSR to a point. Distances in metres on the map plane."""

    index: int
    planar_distance_m: float
    nearest_xy_m: tuple[float, float]
    inside: bool


def point_in_rings(x: float, y: float, rings) -> bool:
    """Even-odd rule over all rings (outer rings and holes) of one polygon."""
    inside = False
    for ring in rings:
        x0, y0 = ring[:, 0], ring[:, 1]
        x1, y1 = np.roll(x0, -1), np.roll(y0, -1)
        crosses = (y0 > y) != (y1 > y)
        with np.errstate(divide="ignore", invalid="ignore"):
            x_at = x0 + (y - y0) * (x1 - x0) / (y1 - y0)
        inside ^= bool(np.count_nonzero(crosses & (x < x_at)) % 2)
    return inside


def nearest_on_rings(x: float, y: float, rings) -> tuple[float, tuple[float, float]]:
    """Shortest planar distance (m) from (x, y) to any ring edge, and the closest point."""
    best_d, best_p = np.inf, (np.nan, np.nan)
    for ring in rings:
        a = ring
        b = np.roll(ring, -1, axis=0)
        ab = b - a
        length2 = np.einsum("ij,ij->i", ab, ab)
        dot = (x - a[:, 0]) * ab[:, 0] + (y - a[:, 1]) * ab[:, 1]
        t = np.divide(dot, length2, out=np.zeros_like(dot), where=length2 > 0)
        t = np.clip(t, 0.0, 1.0)
        px, py = a[:, 0] + t * ab[:, 0], a[:, 1] + t * ab[:, 1]
        d = np.hypot(px - x, py - y)
        k = int(np.argmin(d))
        if d[k] < best_d:
            best_d, best_p = float(d[k]), (float(px[k]), float(py[k]))
    return best_d, best_p


def bbox_distance(x: float, y: float, bbox: tuple[float, float, float, float]) -> float:
    """Lower bound (m) of the distance from (x, y) to anything inside a bounding box."""
    x_min, y_min, x_max, y_max = bbox
    dx = max(x_min - x, 0.0, x - x_max)
    dy = max(y_min - y, 0.0, y - y_max)
    return float(np.hypot(dx, dy))


def nearest_psr(x: float, y: float, polygons) -> NearestPsr:
    """Nearest PSR polygon to (x, y): zero distance if inside, else distance to its boundary.

    Args:
        x: site map x, metres.
        y: site map y, metres.
        polygons: sequence of objects with ``rings`` and ``bbox`` (see psr_files.PsrPolygon).
    """
    order = sorted(range(len(polygons)), key=lambda i: bbox_distance(x, y, polygons[i].bbox))
    best: NearestPsr | None = None
    for i in order:
        if best is not None and bbox_distance(x, y, polygons[i].bbox) > best.planar_distance_m:
            break
        rings = polygons[i].rings
        if point_in_rings(x, y, rings):
            return NearestPsr(i, 0.0, (x, y), True)
        d, p = nearest_on_rings(x, y, rings)
        if best is None or d < best.planar_distance_m:
            best = NearestPsr(i, d, p, False)
    if best is None:
        raise ValueError("no PSR polygons given")
    return best
