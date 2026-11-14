"""
What: Read the georeferencing tags of a GeoTIFF from its first bytes only (no full download).
Roadmap stage: 1 (site coordinates) and 2 (horizon DEM) (see docs/ROTEIRO.md)
Inputs: URL of a GeoTIFF that supports HTTP range requests; or the raw header bytes.
Outputs: GeoTiffGeoref with raster size, pixel scale, tie point and GeoKeys.
NASA data source: LOLA DEM GeoTIFFs, PGDA products 78 and 90
    (https://pgda.gsfc.nasa.gov/products/78, https://pgda.gsfc.nasa.gov/products/90).

Only the tags needed to locate the raster are decoded
(TIFF 6.0 and OGC GeoTIFF Standard, OGC 19-008r4).
Fetching (network/disk) and parsing (pure) are kept in separate functions.
"""

from __future__ import annotations

import struct
from dataclasses import dataclass
from pathlib import Path

import requests

# TIFF tag ids (TIFF 6.0; OGC GeoTIFF Standard).
TAG_IMAGE_WIDTH = 256
TAG_IMAGE_LENGTH = 257
TAG_MODEL_PIXEL_SCALE = 33550
TAG_MODEL_TIEPOINT = 33922
TAG_GEO_KEY_DIRECTORY = 34735
TAG_GEO_DOUBLE_PARAMS = 34736
TAG_GEO_ASCII_PARAMS = 34737

# TIFF field types -> (struct code, size in bytes) (TIFF 6.0; BigTIFF adds LONG8).
FIELD_TYPES = {
    1: ("B", 1),  # BYTE
    2: ("c", 1),  # ASCII
    3: ("H", 2),  # SHORT
    4: ("I", 4),  # LONG
    11: ("f", 4),  # FLOAT
    12: ("d", 8),  # DOUBLE
    16: ("Q", 8),  # LONG8 (BigTIFF)
}

CLASSIC_TIFF_MAGIC = 42
BIG_TIFF_MAGIC = 43

# GeoKey ids used downstream (OGC GeoTIFF Standard).
GEOKEY_RASTER_TYPE = 1025  # 1 = PixelIsArea, 2 = PixelIsPoint
RASTER_PIXEL_IS_AREA = 1
RASTER_PIXEL_IS_POINT = 2

# How many bytes to fetch by default; geo tags of the PGDA files sit well inside this.
DEFAULT_HEADER_BYTES = 65536

HTTP_TIMEOUT_S = 60


class GeoTiffHeaderError(ValueError):
    """Raised when the header cannot be decoded from the bytes available."""


@dataclass(frozen=True)
class GeoTiffGeoref:
    """Georeferencing of a GeoTIFF raster.

    Attributes:
        width: raster width in pixels.
        height: raster height in pixels.
        pixel_scale: (sx, sy, sz) in map units per pixel (metres for PGDA product 78).
        tiepoint: (i, j, k, x, y, z) raster point (i, j) tied to map point (x, y).
        geokeys: GeoKey id -> value (int, float or str).
    """

    width: int
    height: int
    pixel_scale: tuple[float, ...]
    tiepoint: tuple[float, ...]
    geokeys: dict[int, int | float | str]


def fetch_header_bytes(url: str, cache_path: Path, n_bytes: int = DEFAULT_HEADER_BYTES) -> bytes:
    """Return the first ``n_bytes`` of a remote file, using a local cache when present.

    Args:
        url: HTTP(S) URL of the file; the server must honour ``Range`` requests.
        cache_path: local file where the bytes are stored / reused.
        n_bytes: number of bytes to fetch from the start of the file.

    Raises:
        GeoTiffHeaderError: if the server ignores the range request.
    """
    if cache_path.exists():
        return cache_path.read_bytes()
    response = requests.get(
        url, headers={"Range": f"bytes=0-{n_bytes - 1}"}, timeout=HTTP_TIMEOUT_S, stream=True
    )
    response.raise_for_status()
    if response.status_code != 206:  # 206 Partial Content
        response.close()
        raise GeoTiffHeaderError(f"{url}: server did not honour the Range request")
    data = response.content
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(data)
    return data


def read_ifds(data: bytes, source: str = "<bytes>") -> tuple[str, list[dict[int, tuple]]]:
    """Decode every image file directory (IFD) whose entries lie inside ``data``.

    Works for classic TIFF and BigTIFF. Tag values located beyond ``data`` are left out
    (callers that need them raise a clear error).

    Args:
        data: leading bytes of the file.
        source: name used in error messages.

    Returns:
        (endian, ifds): struct byte-order prefix ("<" or ">") and one dict per IFD mapping
        tag id -> tuple of values (ASCII tags as a 1-tuple holding the string).

    Raises:
        GeoTiffHeaderError: on an invalid TIFF or if IFD0 is not inside ``data``.
    """
    if data[:2] == b"II":
        endian = "<"
    elif data[:2] == b"MM":
        endian = ">"
    else:
        raise GeoTiffHeaderError(f"{source}: not a TIFF file (bad byte order mark)")

    (magic,) = struct.unpack_from(endian + "H", data, 2)
    if magic == CLASSIC_TIFF_MAGIC:
        (ifd_offset,) = struct.unpack_from(endian + "I", data, 4)
        count_fmt, entry_fmt, entry_size, inline_size, next_fmt = "H", "HHII", 12, 4, "I"
    elif magic == BIG_TIFF_MAGIC:
        (ifd_offset,) = struct.unpack_from(endian + "Q", data, 8)
        count_fmt, entry_fmt, entry_size, inline_size, next_fmt = "Q", "HHQQ", 20, 8, "Q"
    else:
        raise GeoTiffHeaderError(f"{source}: unknown TIFF magic number {magic}")

    _require(data, ifd_offset + 8, source, "IFD0")
    ifds: list[dict[int, tuple]] = []
    while ifd_offset and ifd_offset + 8 <= len(data):
        (n_entries,) = struct.unpack_from(endian + count_fmt, data, ifd_offset)
        first_entry = ifd_offset + struct.calcsize(count_fmt)
        next_pos = first_entry + n_entries * entry_size
        if next_pos + struct.calcsize(next_fmt) > len(data):
            break
        tags: dict[int, tuple] = {}
        for index in range(n_entries):
            pos = first_entry + index * entry_size
            tag, field_type, count, raw_value = struct.unpack_from(endian + entry_fmt, data, pos)
            if field_type not in FIELD_TYPES:
                continue
            code, size = FIELD_TYPES[field_type]
            total = size * count
            value_pos = pos + struct.calcsize(endian + "HH" + entry_fmt[2])
            start = value_pos if total <= inline_size else raw_value
            if start + total > len(data):
                continue
            if field_type == 2:
                tags[tag] = (data[start : start + total].decode("ascii", "replace"),)
            else:
                tags[tag] = struct.unpack_from(f"{endian}{count}{code}", data, start)
        ifds.append(tags)
        (ifd_offset,) = struct.unpack_from(endian + next_fmt, data, next_pos)
    return endian, ifds


def parse_georef(data: bytes, source: str = "<bytes>") -> GeoTiffGeoref:
    """Decode raster size and GeoTIFF georeferencing from the first bytes of a TIFF file.

    Args:
        data: leading bytes of the file (must include IFD0 and its tag values).
        source: name used in error messages (file or URL).

    Raises:
        GeoTiffHeaderError: on invalid TIFF or tags located beyond ``data``.
    """
    _endian, ifds = read_ifds(data, source)
    tags = ifds[0]
    for needed in (TAG_IMAGE_WIDTH, TAG_IMAGE_LENGTH, TAG_MODEL_PIXEL_SCALE, TAG_MODEL_TIEPOINT):
        if needed not in tags:
            raise GeoTiffHeaderError(
                f"{source}: TIFF tag {needed} missing or beyond the {len(data)} bytes read"
            )

    return GeoTiffGeoref(
        width=int(tags[TAG_IMAGE_WIDTH][0]),
        height=int(tags[TAG_IMAGE_LENGTH][0]),
        pixel_scale=tuple(float(v) for v in tags[TAG_MODEL_PIXEL_SCALE]),
        tiepoint=tuple(float(v) for v in tags[TAG_MODEL_TIEPOINT][:6]),
        geokeys=_decode_geokeys(tags, source),
    )


def raster_center_xy(georef: GeoTiffGeoref) -> tuple[float, float]:
    """Map coordinates (x, y) of the geometric centre of the raster extent.

    Handles both GeoTIFF raster types: for PixelIsArea the tie point is the corner of
    pixel (0, 0); for PixelIsPoint it is the centre of pixel (0, 0).

    Returns:
        (x, y) in the raster's map units (metres, polar stereographic for product 78).
    """
    i0, j0, _k, x0, y0, _z = georef.tiepoint
    sx, sy = georef.pixel_scale[0], georef.pixel_scale[1]
    raster_type = georef.geokeys.get(GEOKEY_RASTER_TYPE, RASTER_PIXEL_IS_AREA)
    if raster_type == RASTER_PIXEL_IS_POINT:
        center_i, center_j = (georef.width - 1) / 2.0, (georef.height - 1) / 2.0
    else:
        center_i, center_j = georef.width / 2.0, georef.height / 2.0
    # Map y decreases as the row index grows (north-up raster convention).
    return x0 + (center_i - i0) * sx, y0 - (center_j - j0) * sy


def _require(data: bytes, end: int, source: str, what: str) -> None:
    if end > len(data):
        raise GeoTiffHeaderError(
            f"{source}: {what} lies beyond the {len(data)} header bytes read; fetch more bytes"
        )


def _decode_geokeys(tags: dict[int, tuple], source: str) -> dict[int, int | float | str]:
    """Decode the GeoKeyDirectory (OGC GeoTIFF Standard)."""
    directory = tags.get(TAG_GEO_KEY_DIRECTORY)
    if directory is None:
        raise GeoTiffHeaderError(f"{source}: missing GeoKeyDirectory tag")
    doubles = tags.get(TAG_GEO_DOUBLE_PARAMS, ())
    ascii_params = tags.get(TAG_GEO_ASCII_PARAMS, ("",))[0]
    n_keys = directory[3]
    keys: dict[int, int | float | str] = {}
    for index in range(n_keys):
        key_id, location, count, offset = directory[4 + 4 * index : 8 + 4 * index]
        if location == 0:
            keys[key_id] = offset
        elif location == TAG_GEO_DOUBLE_PARAMS:
            keys[key_id] = (
                doubles[offset] if count == 1 else tuple(doubles[offset : offset + count])
            )
        elif location == TAG_GEO_ASCII_PARAMS:
            keys[key_id] = ascii_params[offset : offset + count].rstrip("|\x00")
    return keys
