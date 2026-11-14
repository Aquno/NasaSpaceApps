"""
What: Validate the files the interface reads against docs/CONTRATO_DE_DADOS.md (version 2).
    Pure functions returning error messages that name the file and the field.
Roadmap stage: 4 — Export (see docs/ROTEIRO.md)
Inputs: parsed JSON documents (sites.json and sites/<id>.json) and the file names.
Outputs: list of error strings (empty = valid).
NASA data source: none directly (format only).
"""

from __future__ import annotations

import math
import re
from datetime import datetime, timedelta, timezone

CONTRACT_VERSION = 2
HORIZON_LENGTH = 360
SERIES_COLUMNS = ("sun_az", "sun_el", "sun_diam", "earth_az", "earth_el", "earth_diam")
SOURCE_TYPES = ("published_point", "derived_point")
PURPOSES = (None, "sensitivity_demo")
ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
ISO_UTC = "%Y-%m-%dT%H:%M:%SZ"
ISO_DATE = "%Y-%m-%d"

# field -> (types, nullable)
SITE_FIELDS = {
    "id": (str, False),
    "name": (str, False),
    "lat": ((int, float), False),
    "lon": ((int, float), False),
    "description": (str, False),
    "source_type": (str, False),
    "purpose": (str, True),
    "terrain_height_m": ((int, float), False),
    "terrain_slope_deg": ((int, float), False),
    "observer_height_m": ((int, float), False),
    "psr_distance_km": ((int, float), True),
    "psr_area_km2": ((int, float), True),
    "psr_name": (str, True),
    "nasa_avg_illumination_pct": ((int, float), True),
    "nasa_avg_earth_visibility_pct": ((int, float), True),
}
META_FIELDS = {
    "contract_version": (int, False),
    "site_id": (str, False),
    "sources": (list, False),
    "dem_resolution_m": ((int, float), True),
    "horizon_bands": (list, False),
    "horizon_method": (str, False),
    "terrain_height_m": ((int, float), False),
    "mast_height_m": ((int, float), False),
    "observer_height_m": ((int, float), False),
    "start": (str, False),
    "end": (str, False),
    "step_minutes": (int, False),
    "count": (int, False),
    "sample": (bool, False),
    "generated_at": (str, False),
}


def _check_fields(obj: dict, spec: dict, where: str) -> list[str]:
    errors = []
    for field, (types, nullable) in spec.items():
        if field not in obj:
            errors.append(f"{where}: missing field '{field}'")
            continue
        value = obj[field]
        if value is None:
            if not nullable:
                errors.append(f"{where}: field '{field}' must not be null")
            continue
        if isinstance(value, bool) and types is not bool:
            errors.append(f"{where}: field '{field}' must not be boolean")
        elif not isinstance(value, types):
            errors.append(f"{where}: field '{field}' has type {type(value).__name__}")
        elif isinstance(value, float) and not math.isfinite(value):
            errors.append(f"{where}: field '{field}' is not finite")
    return errors


def validate_sites(doc, file: str = "sites.json") -> list[str]:
    """Errors in sites.json (list of site objects)."""
    if not isinstance(doc, list) or not doc:
        return [f"{file}: must be a non-empty array"]
    errors, seen = [], set()
    for index, site in enumerate(doc):
        where = f"{file}[{index}]"
        if not isinstance(site, dict):
            errors.append(f"{where}: must be an object")
            continue
        errors += _check_fields(site, SITE_FIELDS, where)
        sid = site.get("id")
        if isinstance(sid, str) and not ID_PATTERN.match(sid):
            errors.append(f"{where}: 'id' is not kebab-case")
        if sid in seen:
            errors.append(f"{where}: duplicate id '{sid}'")
        seen.add(sid)
        if isinstance(site.get("lat"), (int, float)) and not -90 <= site["lat"] <= 90:
            errors.append(f"{where}: 'lat' out of range")
        if isinstance(site.get("lon"), (int, float)) and not -180 <= site["lon"] < 180:
            errors.append(f"{where}: 'lon' out of [-180, 180)")
        if site.get("source_type") not in SOURCE_TYPES:
            errors.append(f"{where}: 'source_type' must be one of {SOURCE_TYPES}")
        if site.get("purpose") not in PURPOSES:
            errors.append(f"{where}: 'purpose' must be one of {PURPOSES}")
        for pct in ("nasa_avg_illumination_pct", "nasa_avg_earth_visibility_pct"):
            v = site.get(pct)
            if isinstance(v, (int, float)) and not 0 <= v <= 100:
                errors.append(f"{where}: '{pct}' out of [0, 100]")
        if isinstance(site.get("psr_distance_km"), (int, float)) and site["psr_distance_km"] < 0:
            errors.append(f"{where}: 'psr_distance_km' is negative")
    return errors


def validate_site_file(doc, file: str, expected_id: str | None = None) -> list[str]:
    """Errors in one sites/<id>.json document."""
    if not isinstance(doc, dict):
        return [f"{file}: must be an object"]
    errors = []
    meta = doc.get("meta")
    if not isinstance(meta, dict):
        return [f"{file}: missing object 'meta'"]
    errors += _check_fields(meta, META_FIELDS, f"{file}: meta")
    if meta.get("contract_version") != CONTRACT_VERSION:
        errors.append(f"{file}: meta.contract_version must be {CONTRACT_VERSION}")
    if expected_id is not None and meta.get("site_id") != expected_id:
        errors.append(f"{file}: meta.site_id '{meta.get('site_id')}' != '{expected_id}'")

    for field in ("horizon", "horizon_obstacle_km", "horizon_cut_km"):
        values = doc.get(field)
        if not isinstance(values, list) or len(values) != HORIZON_LENGTH:
            errors.append(f"{file}: '{field}' must be an array of {HORIZON_LENGTH} values")
            continue
        nullable = field == "horizon_cut_km"
        bad = [
            i
            for i, v in enumerate(values)
            if not ((v is None and nullable) or (isinstance(v, (int, float)) and math.isfinite(v)))
        ]
        if bad:
            errors.append(f"{file}: '{field}' has invalid values at indices {bad[:5]}")
    horizon = doc.get("horizon")
    if isinstance(horizon, list) and all(isinstance(v, (int, float)) for v in horizon):
        if any(not -90 <= v <= 90 for v in horizon):
            errors.append(f"{file}: 'horizon' has values outside [-90, 90]")

    series = doc.get("series")
    count = meta.get("count")
    if not isinstance(series, dict):
        errors.append(f"{file}: 'series' must be an object of columns")
    else:
        for column in SERIES_COLUMNS:
            values = series.get(column)
            if not isinstance(values, list):
                errors.append(f"{file}: series.{column} missing")
                continue
            if len(values) != count:
                errors.append(
                    f"{file}: series.{column} has {len(values)} values, meta.count={count}"
                )
            if any(not isinstance(v, (int, float)) or not math.isfinite(v) for v in values):
                errors.append(f"{file}: series.{column} has non-numeric values")
                continue
            if column.endswith("_az") and any(not 0 <= v < 360 for v in values):
                errors.append(f"{file}: series.{column} outside [0, 360)")
            if column.endswith("_el") and any(not -90 <= v <= 90 for v in values):
                errors.append(f"{file}: series.{column} outside [-90, 90]")
            if column.endswith("_diam") and any(v <= 0 for v in values):
                errors.append(f"{file}: series.{column} must be positive")
        extra = set(series) - set(SERIES_COLUMNS)
        if extra:
            errors.append(f"{file}: unexpected series columns {sorted(extra)}")

    errors += _check_time_axis(meta, file)
    return errors


def _check_time_axis(meta: dict, file: str) -> list[str]:
    try:
        start = datetime.strptime(meta["start"], ISO_UTC).replace(tzinfo=timezone.utc)
        end = datetime.strptime(meta["end"], ISO_UTC).replace(tzinfo=timezone.utc)
        datetime.strptime(meta["generated_at"], ISO_DATE)
    except (KeyError, TypeError, ValueError):
        return [f"{file}: meta.start/end must be ISO UTC with Z and generated_at YYYY-MM-DD"]
    step, count = meta.get("step_minutes"), meta.get("count")
    if not isinstance(step, int) or step <= 0 or not isinstance(count, int):
        return []
    if start + timedelta(minutes=step * (count - 1)) != end:
        return [f"{file}: meta.start + (count - 1) * step_minutes != meta.end"]
    return []
