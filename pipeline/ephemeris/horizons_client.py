"""
What: Isolated access to the JPL Horizons API: builds an observer-table query for a site
    on the Moon, calls the API and returns the raw ephemeris text, with an on-disk cache.
Roadmap stage: 1 — Ephemeris (see docs/ROTEIRO.md)
Inputs: target body id, site coordinates (degrees, MOON_ME, east-positive), altitude (km),
    UTC interval and step (minutes); cache file path.
Outputs: RawEphemeris (raw table text + query time). Cache files in data/raw/horizons/
    hold the verbatim API response body plus the query parameters and time.
NASA data source: JPL Horizons API (https://ssd-api.jpl.nasa.gov/doc/horizons.html).

No parsing happens here (see horizons_parser.py); no file other than the cache is written.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import requests

from pipeline import config

# Text that marks the start of a returned table (Horizons manual: "$$SOE Start of ephemeris").
START_OF_EPHEMERIS = "$$SOE"
ISO_UTC_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
HORIZONS_TIME_FORMAT = "%Y-%m-%d %H:%M"


class HorizonsRefusedError(RuntimeError):
    """The API answered but returned no ephemeris table (error or refusal message)."""


@dataclass(frozen=True)
class RawEphemeris:
    """Raw Horizons observer table.

    Attributes:
        text: the table text exactly as returned in the API "result" field.
        queried_at: UTC time of the API call (ISO 8601), from the cache when reused.
        cache_path: file holding the verbatim response.
    """

    text: str
    queried_at: str
    cache_path: Path


def build_observer_params(
    target_id: str,
    lon_east_deg: float,
    lat_deg: float,
    alt_km: float,
    start_utc: datetime,
    stop_utc: datetime,
    step_minutes: int,
) -> dict[str, str]:
    """Build API parameters for an observer table seen from a site on the Moon.

    Args:
        target_id: Horizons body id ("10" Sun, "399" Earth).
        lon_east_deg: site longitude, degrees east (any range; sent as [0, 360)).
        lat_deg: site latitude, degrees (negative = south).
        alt_km: site altitude in km above the 1737.4 km reference sphere.
        start_utc: first epoch, UTC (timezone-aware).
        stop_utc: last epoch, UTC, inclusive.
        step_minutes: table step in minutes.

    Returns:
        Query parameters. Coordinates are interpreted by Horizons in the Moon's mean-Earth
        frame of DE421 (MEAN_ME), east-positive longitude (Horizons manual).
    """
    return {
        "format": "json",
        "COMMAND": f"'{target_id}'",
        "OBJ_DATA": "NO",
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "OBSERVER",
        "CENTER": f"'coord@{config.MOON_ID}'",
        "COORD_TYPE": "GEODETIC",
        "SITE_COORD": f"'{lon_east_deg % 360.0:.6f},{lat_deg:.6f},{alt_km:.6f}'",
        "START_TIME": f"'{start_utc.strftime(HORIZONS_TIME_FORMAT)}'",
        "STOP_TIME": f"'{stop_utc.strftime(HORIZONS_TIME_FORMAT)}'",
        "STEP_SIZE": f"'{step_minutes}m'",
        "QUANTITIES": f"'{config.HORIZONS_QUANTITIES}'",
        "CSV_FORMAT": "YES",
        "ANG_FORMAT": "DEG",
        "TIME_TYPE": "UT",
        "EXTRA_PREC": "YES",
    }


def fetch_observer_table(params: dict[str, str], cache_path: Path) -> RawEphemeris:
    """Return the raw observer table for ``params``, calling the API only on a cache miss.

    Only responses that contain a table are cached, so a refused query is retried later.

    Raises:
        HorizonsRefusedError: if the API returns an error or no table.
        requests.HTTPError: on HTTP failure.
    """
    if cache_path.exists():
        cached = json.loads(cache_path.read_text(encoding="utf-8"))
        return RawEphemeris(
            text=_result_text(cached["response_body"], cache_path.name),
            queried_at=cached["queried_at"],
            cache_path=cache_path,
        )

    queried_at = datetime.now(timezone.utc).strftime(ISO_UTC_FORMAT)
    response = requests.get(config.HORIZONS_API_URL, params=params, timeout=config.HTTP_TIMEOUT_S)
    response.raise_for_status()
    text = _result_text(response.text, response.url)

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(
        json.dumps(
            {
                "queried_at": queried_at,
                "api_url": config.HORIZONS_API_URL,
                "params": params,
                "response_body": response.text,
            },
            indent=1,
        ),
        encoding="utf-8",
    )
    return RawEphemeris(text=text, queried_at=queried_at, cache_path=cache_path)


def _result_text(body: str, where: str) -> str:
    """Extract the table text from a JSON API response body."""
    try:
        payload = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HorizonsRefusedError(f"{where}: response is not JSON") from exc
    if "error" in payload:
        raise HorizonsRefusedError(f"{where}: Horizons error: {payload['error']}")
    text = payload.get("result", "")
    if START_OF_EPHEMERIS not in text:
        raise HorizonsRefusedError(f"{where}: no ephemeris table in response:\n{text[-2000:]}")
    return text
