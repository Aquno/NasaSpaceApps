"""
What: Build the interface files (docs/CONTRATO_DE_DADOS.md, version 2) from the outputs of
    stages 1, 2, 3 and 6 (data part). Pure functions: inputs are already-loaded documents.
Roadmap stage: 4 — Export (see docs/ROTEIRO.md)
Inputs: site entry from pipeline/sites.json; data/ephemeris/<id>.json; data/horizon/<id>.json;
    rows of data/science/psr_distance.json and data/validation/nasa_reference.json.
Outputs: the sites.json entry and the sites/<id>.json document (dicts).
NASA data source: JPL Horizons, PGDA products 90 and 69 (through the stage outputs).

No visibility or metric is computed here (docs/DECISOES.md D9).
"""

from __future__ import annotations

from pipeline.export.contract import CONTRACT_VERSION, SERIES_COLUMNS

ANGLE_DECIMALS = 3
DISTANCE_DECIMALS = 3
HEIGHT_DECIMALS = 1
SLOPE_DECIMALS = 1
M_PER_KM = 1000.0
FULL_TURN_DEG = 360.0


def round_angle(value: float) -> float:
    """Round an angle to the contract precision (degrees, 3 decimals)."""
    return round(float(value), ANGLE_DECIMALS)


def round_azimuth(value: float) -> float:
    """Round an azimuth and keep it in [0, 360) (359.9996 would round to 360.0)."""
    v = round(float(value), ANGLE_DECIMALS)
    return 0.0 if v >= FULL_TURN_DEG else v


def build_site_entry(
    site: dict, horizon_meta: dict, science: dict | None, reference: dict | None
) -> dict:
    """One object of sites.json.

    Args:
        site: entry from pipeline/sites.json.
        horizon_meta: "meta" of data/horizon/<id>.json (heights in m, slope in degrees).
        science: row of data/science/psr_distance.json for this site, or None.
        reference: row of data/validation/nasa_reference.json for this site, or None.
    """
    return {
        "id": site["id"],
        "name": site["name"],
        "lat": site["lat"],
        "lon": site["lon"],
        "description": site["description"],
        "source_type": site["source_type"],
        "purpose": site.get("purpose"),
        "terrain_height_m": round(horizon_meta["terrain_height_m"], HEIGHT_DECIMALS),
        "terrain_slope_deg": round(horizon_meta["terrain_slope_deg"], SLOPE_DECIMALS),
        "observer_height_m": round(horizon_meta["observer_height_above_sphere_m"], HEIGHT_DECIMALS),
        "psr_distance_km": science["psr_distance_km"] if science else None,
        "psr_area_km2": science["psr_area_km2"] if science else None,
        "psr_name": science["psr_name"] if science else None,
        "nasa_avg_illumination_pct": reference["nasa_avg_illumination_pct"] if reference else None,
        "nasa_avg_earth_visibility_pct": (
            reference["nasa_avg_earth_visibility_pct"] if reference else None
        ),
    }


def build_site_file(ephemeris: dict, horizon: dict, sources: list[str], generated_at: str) -> dict:
    """The sites/<id>.json document: horizon arrays, columnar series and meta.

    Args:
        ephemeris: data/ephemeris/<id>.json (series of records, meta with start/end/step).
        horizon: data/horizon/<id>.json (horizon_deg, obstacle and cut distances, meta).
        sources: source names and URLs.
        generated_at: UTC date "YYYY-MM-DD".
    """
    em, hm = ephemeris["meta"], horizon["meta"]
    if em["site_id"] != hm["site_id"]:
        raise ValueError(f"site mismatch: ephemeris {em['site_id']} vs horizon {hm['site_id']}")
    records = ephemeris["series"]
    series = {}
    for column in SERIES_COLUMNS:
        rounder = round_azimuth if column.endswith("_az") else round_angle
        series[column] = [rounder(r[column]) for r in records]
    return {
        "horizon": [round_angle(v) for v in horizon["horizon_deg"]],
        "horizon_obstacle_km": [
            round(float(v), DISTANCE_DECIMALS) for v in horizon["obstacle_distance_km"]
        ],
        "horizon_cut_km": [
            None if v is None else round(float(v), DISTANCE_DECIMALS)
            for v in horizon["cut_distance_km"]
        ],
        "series": series,
        "meta": {
            "contract_version": CONTRACT_VERSION,
            "site_id": em["site_id"],
            "sources": sources,
            "dem_resolution_m": hm["bands"][0]["pixel_m"],
            "horizon_bands": [
                {"max_distance_km": b["max_distance_m"] / M_PER_KM, "pixel_m": b["pixel_m"]}
                for b in hm["bands"]
            ],
            "horizon_method": hm["horizon_method"],
            "terrain_height_m": round(hm["terrain_height_m"], HEIGHT_DECIMALS),
            "mast_height_m": hm["mast_height_m"],
            "observer_height_m": round(hm["observer_height_above_sphere_m"], HEIGHT_DECIMALS),
            "start": em["start"],
            "end": em["end"],
            "step_minutes": em["step_minutes"],
            "count": len(records),
            "sample": False,
            "generated_at": generated_at,
        },
    }
