"""
What: Compute a site's terrain horizon: for many fine azimuths, walk the terrain outward,
    take the maximum elevation angle seen from the observer (spherical Moon, 3D vectors),
    stop at the edge of the DEM, then keep the maximum per whole degree. Pure functions.
Roadmap stage: 2 — Horizon (see docs/ROTEIRO.md)
Inputs: site lat/lon (degrees, MOON_ME), observer height above the sphere (m), sample bands,
    and a terrain lookup function (injected; returns heights in metres or NaN = no data).
Outputs: HorizonResult with 360 elevations (degrees), obstacle distances and cut distances (m).
NASA data source: heights from the LOLA DEM (PGDA product 90) supplied by the caller.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

import numpy as np

from pipeline.horizon.geometry import (
    elevation_deg,
    enu_basis,
    points_along_azimuths,
    unit_vectors_to_stereo_xy,
)

DEGREES_PER_TURN = 360

TerrainLookup = Callable[[int, np.ndarray, np.ndarray], np.ndarray]
"""(band_index, x_m, y_m) -> terrain height in metres above the sphere (NaN = no data)."""


@dataclass(frozen=True)
class Band:
    """A distance band sampled at a fixed step from one DEM level.

    Attributes:
        max_distance_m: outer edge of the band (arc length from the site), metres.
        step_m: sample spacing along the ray, metres (equal to the DEM pixel size).
    """

    max_distance_m: float
    step_m: float


@dataclass(frozen=True)
class HorizonResult:
    """Horizon of one site, one value per whole degree of azimuth (index = azimuth in degrees).

    Attributes:
        elevation_deg: max terrain elevation angle per degree bin, degrees (NaN if no data).
        obstacle_distance_m: distance of the point that sets that maximum, metres.
        cut_distance_m: for bins where the ray left the DEM before the search radius, the
            shortest distance reached (metres); NaN where the full radius was searched.
        fine_step_deg: azimuth step used before taking the per-degree maximum.
    """

    elevation_deg: np.ndarray
    obstacle_distance_m: np.ndarray
    cut_distance_m: np.ndarray
    fine_step_deg: float


def sample_distances(bands: list[Band]) -> tuple[np.ndarray, np.ndarray]:
    """Distances (m) along a ray and the band index of each sample, finest band first."""
    distances, band_index, start = [], [], 0.0
    for index, band in enumerate(bands):
        d = np.arange(start + band.step_m, band.max_distance_m + band.step_m / 2, band.step_m)
        distances.append(d)
        band_index.append(np.full(d.size, index))
        start = band.max_distance_m
    return np.concatenate(distances), np.concatenate(band_index)


def fine_azimuths(step_deg: float) -> np.ndarray:
    """Fine azimuths (degrees), centred in steps so each whole-degree bin gets equal samples."""
    n = int(round(DEGREES_PER_TURN / step_deg))
    return (np.arange(n) + 0.5) * step_deg


def degree_bin(azimuth_deg: np.ndarray) -> np.ndarray:
    """Whole-degree bin of each azimuth: bin i holds azimuths in [i - 0.5, i + 0.5)."""
    return np.floor(np.asarray(azimuth_deg) + 0.5).astype(int) % DEGREES_PER_TURN


def compute_horizon(
    lat_deg: float,
    lon_deg: float,
    observer_height_m: float,
    radius_m: float,
    bands: list[Band],
    terrain: TerrainLookup,
    fine_step_deg: float,
    batch: int = 360,
) -> HorizonResult:
    """Terrain horizon of a site.

    Args:
        lat_deg: site latitude, degrees (MOON_ME).
        lon_deg: site longitude, degrees east (MOON_ME).
        observer_height_m: observer height above the reference sphere (terrain + mast), m.
        radius_m: reference sphere radius, metres.
        bands: distance bands, finest first; the last band's edge is the search radius.
        terrain: height lookup (injected); NaN means outside the DEM.
        fine_step_deg: azimuth step (< 1 degree) before taking the per-degree maximum.
        batch: azimuths processed per vectorised batch (memory control only).

    Along each ray the search stops at the first sample without data (edge of the DEM);
    nothing beyond it is assumed.
    """
    _east, _north, up = enu_basis(lat_deg, lon_deg)
    observer = (radius_m + observer_height_m) * up
    distances, band_of_sample = sample_distances(bands)
    azimuths = fine_azimuths(fine_step_deg)

    fine_el = np.full(azimuths.size, np.nan)
    fine_dist = np.full(azimuths.size, np.nan)
    fine_cut = np.full(azimuths.size, np.nan)
    for start in range(0, azimuths.size, batch):
        az = azimuths[start : start + batch]
        dirs = points_along_azimuths(lat_deg, lon_deg, az, distances, radius_m)  # (A, D, 3)
        x, y = unit_vectors_to_stereo_xy(dirs, radius_m)
        heights = np.full(x.shape, np.nan)
        for index in range(len(bands)):
            cols = band_of_sample == index
            heights[:, cols] = terrain(index, x[:, cols], y[:, cols])

        missing = np.isnan(heights)
        first_missing = np.where(missing.any(axis=1), missing.argmax(axis=1), distances.size)
        valid = np.arange(distances.size)[None, :] < first_missing[:, None]
        targets = (radius_m + np.where(valid, heights, 0.0))[..., None] * dirs
        elev = np.where(valid, elevation_deg(observer, targets, up), -np.inf)
        best = elev.argmax(axis=1)
        rows = np.arange(az.size)
        has_any = valid.any(axis=1)
        fine_el[start : start + az.size] = np.where(has_any, elev[rows, best], np.nan)
        fine_dist[start : start + az.size] = np.where(has_any, distances[best], np.nan)
        cut = first_missing < distances.size
        last_valid = distances[np.maximum(first_missing - 1, 0)]
        fine_cut[start : start + az.size] = np.where(cut, last_valid, np.nan)

    return _per_degree(azimuths, fine_el, fine_dist, fine_cut, fine_step_deg)


def _per_degree(
    azimuths: np.ndarray, el: np.ndarray, dist: np.ndarray, cut: np.ndarray, step: float
) -> HorizonResult:
    bins = degree_bin(azimuths)
    out_el = np.full(DEGREES_PER_TURN, np.nan)
    out_dist = np.full(DEGREES_PER_TURN, np.nan)
    out_cut = np.full(DEGREES_PER_TURN, np.nan)
    for b in range(DEGREES_PER_TURN):
        members = bins == b
        e = el[members]
        if np.all(np.isnan(e)):
            continue
        k = int(np.nanargmax(e))
        out_el[b] = e[k]
        out_dist[b] = dist[members][k]
        c = cut[members]
        if not np.all(np.isnan(c)):
            out_cut[b] = np.nanmin(c)
    return HorizonResult(out_el, out_dist, out_cut, step)
