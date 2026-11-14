"""
What: Read the PGDA permanently shadowed region (PSR) polygons: ESRI shapefile (.SHP, polygon
    type 5) and its attribute table (.DBF, dBase III). Parsing is pure; file access is isolated.
Roadmap stage: 3 — Science value (see docs/ROTEIRO.md)
Inputs: LPSR_80S_20MPP_ADJ_1km2.SHP / .DBF (downloaded to data/raw/pgda90/psr/).
Outputs: list of PsrPolygon (id, name, area in km2, rings in polar stereographic metres, bbox).
NASA data source: PGDA product 90, "Only PSRs with area > 1 km2 (N=1531)"
    (https://pgda.gsfc.nasa.gov/products/90); projection "Stereographic_South_Pole" on a
    1737400 m sphere (.PRJ).
"""

from __future__ import annotations

import struct
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import requests

SHP_FILE_CODE = 9994  # ESRI Shapefile Technical Description (1998)
SHP_HEADER_BYTES = 100
SHP_RECORD_HEADER_BYTES = 8
SHAPE_POLYGON = 5
SHAPE_NULL = 0
DBF_HEADER_TERMINATOR = 0x0D
DBF_FIELD_DESCRIPTOR_BYTES = 32
DBF_DELETED_FLAG = ord("*")
HTTP_TIMEOUT_S = 300


class PsrFileError(ValueError):
    """Raised when the shapefile or attribute table has an unexpected layout."""


@dataclass(frozen=True)
class PsrPolygon:
    """One PSR outline.

    Attributes:
        gid: identifier from the attribute table ("gid").
        name: name from the attribute table ("name"), as published.
        area_km2: area from the attribute table ("area_km2"), km2.
        rings: closed rings, each an (N, 2) array of polar stereographic x/y in metres.
        bbox: (x_min, y_min, x_max, y_max) in metres.
    """

    gid: int
    name: str
    area_km2: float
    rings: tuple[np.ndarray, ...]
    bbox: tuple[float, float, float, float]


def parse_shp_polygons(data: bytes, source: str = "<shp>") -> list[tuple[tuple, list[np.ndarray]]]:
    """Parse polygon records of a .SHP file. Pure function.

    Returns:
        One (bbox, rings) per record, in file order; null shapes give an empty ring list.

    Raises:
        PsrFileError: on a wrong file code, shape type or truncated record.
    """
    if len(data) < SHP_HEADER_BYTES or struct.unpack(">i", data[0:4])[0] != SHP_FILE_CODE:
        raise PsrFileError(f"{source}: not an ESRI shapefile")
    if struct.unpack("<i", data[32:36])[0] != SHAPE_POLYGON:
        raise PsrFileError(f"{source}: shapefile is not of polygon type")
    records, pos = [], SHP_HEADER_BYTES
    while pos + SHP_RECORD_HEADER_BYTES <= len(data):
        content_words = struct.unpack(">i", data[pos + 4 : pos + 8])[0]
        start, end = (
            pos + SHP_RECORD_HEADER_BYTES,
            pos + SHP_RECORD_HEADER_BYTES + 2 * content_words,
        )
        if end > len(data):
            raise PsrFileError(f"{source}: truncated record at byte {pos}")
        shape_type = struct.unpack("<i", data[start : start + 4])[0]
        if shape_type == SHAPE_NULL:
            records.append(((np.nan,) * 4, []))
        elif shape_type == SHAPE_POLYGON:
            bbox = struct.unpack("<4d", data[start + 4 : start + 36])
            n_parts, n_points = struct.unpack("<2i", data[start + 36 : start + 44])
            parts = struct.unpack(f"<{n_parts}i", data[start + 44 : start + 44 + 4 * n_parts])
            pts_at = start + 44 + 4 * n_parts
            points = np.frombuffer(data, "<f8", 2 * n_points, pts_at).reshape(n_points, 2)
            bounds = list(parts) + [n_points]
            rings = [points[bounds[i] : bounds[i + 1]].copy() for i in range(n_parts)]
            records.append((bbox, rings))
        else:
            raise PsrFileError(f"{source}: unexpected shape type {shape_type} at byte {pos}")
        pos = end
    return records


def parse_dbf(data: bytes, source: str = "<dbf>") -> list[dict[str, str]]:
    """Parse a dBase III table into a list of {field: text} records (deleted rows skipped)."""
    n_records = struct.unpack("<I", data[4:8])[0]
    header_len, record_len = struct.unpack("<HH", data[8:12])
    fields, pos = [], 32
    while data[pos] != DBF_HEADER_TERMINATOR:
        name = data[pos : pos + 11].split(b"\0")[0].decode("ascii")
        fields.append((name, data[pos + 16]))
        pos += DBF_FIELD_DESCRIPTOR_BYTES
    rows = []
    for index in range(n_records):
        record = data[header_len + index * record_len : header_len + (index + 1) * record_len]
        if len(record) < record_len:
            raise PsrFileError(f"{source}: truncated record {index}")
        if record[0] == DBF_DELETED_FLAG:
            continue
        row, offset = {}, 1
        for name, length in fields:
            row[name] = record[offset : offset + length].decode("utf-8", "replace").strip()
            offset += length
        rows.append(row)
    return rows


def combine(records: list, rows: list[dict[str, str]], source: str) -> list[PsrPolygon]:
    """Join shapes and attributes (same order) into PsrPolygon objects. Pure function."""
    if len(records) != len(rows):
        raise PsrFileError(f"{source}: {len(records)} shapes but {len(rows)} attribute rows")
    out = []
    for (bbox, rings), row in zip(records, rows, strict=True):
        if not rings:
            continue
        try:
            out.append(
                PsrPolygon(
                    gid=int(row["gid"]),
                    name=row["name"].strip('"'),
                    area_km2=float(row["area_km2"]),
                    rings=tuple(rings),
                    bbox=tuple(float(v) for v in bbox),
                )
            )
        except (KeyError, ValueError) as exc:
            raise PsrFileError(f"{source}: bad attribute row {row}") from exc
    return out


# ---- I/O ---------------------------------------------------------------------------------


def download_if_missing(url: str, path: Path) -> Path:
    """Download ``url`` to ``path`` unless it already exists; return the path."""
    if not path.exists():
        response = requests.get(url, timeout=HTTP_TIMEOUT_S)
        response.raise_for_status()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(response.content)
    return path


def load_psr_polygons(shp_path: Path, dbf_path: Path) -> list[PsrPolygon]:
    """Read and join the PSR shapefile and attribute table."""
    records = parse_shp_polygons(shp_path.read_bytes(), shp_path.name)
    rows = parse_dbf(dbf_path.read_bytes(), dbf_path.name)
    return combine(records, rows, shp_path.name)
