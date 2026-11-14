"""
What: Load and validate the pipeline site list (pipeline/sites.json).
Roadmap stage: 1 — Ephemeris (used again by stages 2-4) (see docs/ROTEIRO.md)
Inputs: path to pipeline/sites.json.
Outputs: list of Site records.
NASA data source: coordinates from the NASA Lunar Surface Data Book (see each site's
    "source" field and docs/DADOS.md).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

LAT_RANGE_DEG = (-90.0, 90.0)
LON_RANGE_DEG = (-180.0, 180.0)  # east-positive, [-180, 180)
REQUIRED_FIELDS = ("id", "name", "lat", "lon", "alt_km", "description", "source_type", "source")
ALLOWED_SOURCE_TYPES = ("published_point", "derived_tile_center", "unverified")


class SiteFileError(ValueError):
    """Raised when the site file does not follow the expected format."""


@dataclass(frozen=True)
class Site:
    """A candidate site.

    Attributes:
        id: kebab-case identifier (also the output file name).
        name: display name.
        lat: latitude in degrees, MOON_ME frame (negative = south).
        lon: longitude in degrees east, MOON_ME frame, [-180, 180).
        alt_km: observer altitude in km above the 1737.4 km reference sphere.
        source_type: published_point | derived_tile_center | unverified.
        source_url: URL of the document the coordinates come from.
    """

    id: str
    name: str
    lat: float
    lon: float
    alt_km: float
    source_type: str
    source_url: str


def load_sites(path: Path) -> list[Site]:
    """Read and validate the site list.

    Raises:
        SiteFileError: naming the file, site and field that failed.
    """
    raw = json.loads(path.read_text(encoding="utf-8"))
    entries = raw.get("sites")
    if not isinstance(entries, list) or not entries:
        raise SiteFileError(f"{path}: field 'sites' must be a non-empty list")
    sites = [_parse_site(entry, index, path) for index, entry in enumerate(entries)]
    ids = [site.id for site in sites]
    if len(set(ids)) != len(ids):
        raise SiteFileError(f"{path}: duplicate site ids in {ids}")
    return sites


def _parse_site(entry: dict, index: int, path: Path) -> Site:
    where = f"{path}: sites[{index}]"
    for field in REQUIRED_FIELDS:
        if field not in entry:
            raise SiteFileError(f"{where}: missing field '{field}'")
    lat, lon = entry["lat"], entry["lon"]
    if not isinstance(lat, (int, float)) or not LAT_RANGE_DEG[0] <= lat <= LAT_RANGE_DEG[1]:
        raise SiteFileError(f"{where} ({entry['id']}): 'lat' must be a number in [-90, 90]")
    if not isinstance(lon, (int, float)) or not LON_RANGE_DEG[0] <= lon < LON_RANGE_DEG[1]:
        raise SiteFileError(f"{where} ({entry['id']}): 'lon' must be a number in [-180, 180)")
    if entry["source_type"] not in ALLOWED_SOURCE_TYPES:
        raise SiteFileError(f"{where} ({entry['id']}): unknown 'source_type'")
    source_url = entry["source"].get("url") if isinstance(entry["source"], dict) else None
    if not source_url:
        raise SiteFileError(f"{where} ({entry['id']}): 'source.url' is required")
    return Site(
        id=entry["id"],
        name=entry["name"],
        lat=float(lat),
        lon=float(lon),
        alt_km=float(entry["alt_km"]),
        source_type=entry["source_type"],
        source_url=source_url,
    )
