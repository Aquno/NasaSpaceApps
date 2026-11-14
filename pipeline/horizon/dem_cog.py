"""
What: Read parts of a tiled, cloud-optimized LOLA DEM GeoTIFF (COG) over HTTP range requests:
    header, overview levels, single tiles, and windows assembled from tiles.
Roadmap stage: 2 — Horizon (see docs/ROTEIRO.md)
Inputs: COG URL (server must honour HTTP Range); map window in polar stereographic metres.
Outputs: CogDem (levels and georeferencing); float64 height arrays in metres (NaN = no data).
NASA data source: LOLA south polar DEM, PGDA product 90 (https://pgda.gsfc.nasa.gov/products/90),
    file LDEM_80S_20MPP_ADJ.TIF: "cloud-optimized GeoTiffs ... south polar stereographic X/Y
    coordinates in meters and in the MOON_ME reference frame of the JPL DE421 ephemeris".

Network/disk access is limited to `fetch_bytes` / `TileFetcher`; parsing and decoding are pure.
"""

from __future__ import annotations

import zlib
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import requests

from pipeline.sites.geotiff_header import GeoTiffHeaderError, parse_georef, read_ifds

# TIFF tags (TIFF 6.0 and its Technical Notes for tiles/predictor).
TAG_IMAGE_WIDTH = 256
TAG_IMAGE_LENGTH = 257
TAG_BITS_PER_SAMPLE = 258
TAG_COMPRESSION = 259
TAG_PREDICTOR = 317
TAG_TILE_WIDTH = 322
TAG_TILE_LENGTH = 323
TAG_TILE_OFFSETS = 324
TAG_TILE_BYTE_COUNTS = 325
TAG_SAMPLE_FORMAT = 339

COMPRESSION_DEFLATE = 8  # Adobe Deflate (zlib)
PREDICTOR_NONE = 1
PREDICTOR_FLOATING_POINT = 3
SAMPLE_FORMAT_FLOAT = 3
FLOAT32_BITS = 32
FLOAT32_BYTES = 4

# GeoKeys checked before trusting the map coordinates (OGC GeoTIFF Standard).
GEOKEY_COORD_TRANS = 3075
GEOKEY_NAT_ORIGIN_LAT = 3081
GEOKEY_SEMI_MAJOR_AXIS = 2057
CT_POLAR_STEREOGRAPHIC = 15
SOUTH_POLE_LAT_DEG = -90.0

# The PGDA product 90 COG header and tile index fit well inside the first megabyte.
HEADER_BYTES = 1 << 20
HTTP_TIMEOUT_S = 120


class DemReadError(RuntimeError):
    """Raised when the DEM cannot be read or does not have the expected layout."""


@dataclass(frozen=True)
class CogLevel:
    """One resolution level of the COG (level 0 = full resolution).

    Attributes:
        width, height: raster size in pixels.
        pixel_m: pixel size in metres.
        tile_w, tile_h: tile size in pixels.
        offsets, byte_counts: byte position and size of each tile, row-major.
    """

    width: int
    height: int
    pixel_m: float
    tile_w: int
    tile_h: int
    offsets: tuple[int, ...]
    byte_counts: tuple[int, ...]

    @property
    def tiles_across(self) -> int:
        """Number of tile columns."""
        return -(-self.width // self.tile_w)

    @property
    def tiles_down(self) -> int:
        """Number of tile rows."""
        return -(-self.height // self.tile_h)


@dataclass(frozen=True)
class CogDem:
    """Layout of a south polar stereographic DEM COG.

    Attributes:
        url: source URL.
        endian: struct byte-order prefix of the file.
        x_left_m, y_top_m: map coordinates of the outer corner of pixel (0, 0), metres.
        sphere_radius_m: radius of the reference sphere declared in the GeoKeys.
        levels: resolution levels, finest first.
        predictor: TIFF predictor (3 = floating point).
    """

    url: str
    endian: str
    x_left_m: float
    y_top_m: float
    sphere_radius_m: float
    levels: tuple[CogLevel, ...]
    predictor: int


def parse_cog(header: bytes, url: str) -> CogDem:
    """Describe a tiled float32 DEFLATE COG from its leading bytes. Pure function.

    Raises:
        DemReadError: if the file is not a south polar stereographic float32 tiled COG.
    """
    try:
        georef = parse_georef(header, url)
        endian, ifds = read_ifds(header, url)
    except GeoTiffHeaderError as exc:
        raise DemReadError(str(exc)) from exc
    keys = georef.geokeys
    if keys.get(GEOKEY_COORD_TRANS) != CT_POLAR_STEREOGRAPHIC:
        raise DemReadError(f"{url}: projection is not polar stereographic")
    if keys.get(GEOKEY_NAT_ORIGIN_LAT) != SOUTH_POLE_LAT_DEG:
        raise DemReadError(f"{url}: projection is not south polar")

    full_width = georef.width * georef.pixel_scale[0]
    levels = []
    predictors = set()
    for index, tags in enumerate(ifds):
        for tag in (TAG_TILE_WIDTH, TAG_TILE_OFFSETS, TAG_TILE_BYTE_COUNTS):
            if tag not in tags:
                raise DemReadError(f"{url}: IFD{index} lacks tile tag {tag} in the header bytes")
        if tags.get(TAG_COMPRESSION, (None,))[0] != COMPRESSION_DEFLATE:
            raise DemReadError(f"{url}: IFD{index} is not DEFLATE-compressed")
        if (
            tags.get(TAG_SAMPLE_FORMAT, (None,))[0] != SAMPLE_FORMAT_FLOAT
            or tags.get(TAG_BITS_PER_SAMPLE, (None,))[0] != FLOAT32_BITS
        ):
            raise DemReadError(f"{url}: IFD{index} is not float32")
        predictors.add(tags.get(TAG_PREDICTOR, (PREDICTOR_NONE,))[0])
        width = int(tags[TAG_IMAGE_WIDTH][0])
        levels.append(
            CogLevel(
                width=width,
                height=int(tags[TAG_IMAGE_LENGTH][0]),
                pixel_m=full_width / width,
                tile_w=int(tags[TAG_TILE_WIDTH][0]),
                tile_h=int(tags[TAG_TILE_LENGTH][0]),
                offsets=tuple(int(v) for v in tags[TAG_TILE_OFFSETS]),
                byte_counts=tuple(int(v) for v in tags[TAG_TILE_BYTE_COUNTS]),
            )
        )
    if len(predictors) != 1:
        raise DemReadError(f"{url}: mixed predictors {predictors}")
    _i0, _j0, _k, x0, y0, _z = georef.tiepoint
    return CogDem(
        url=url,
        endian=endian,
        x_left_m=x0,
        y_top_m=y0,
        sphere_radius_m=float(keys[GEOKEY_SEMI_MAJOR_AXIS]),
        levels=tuple(sorted(levels, key=lambda lv: lv.pixel_m)),
        predictor=predictors.pop(),
    )


def decode_tile(raw: bytes, level: CogLevel, predictor: int, endian: str) -> np.ndarray:
    """Decompress one tile into a (tile_h, tile_w) float64 array of heights. Pure function.

    The floating-point predictor (Adobe TIFF Technical Note 3) stores each row as byte
    planes (most significant byte first) with horizontal byte differencing.
    """
    data = np.frombuffer(zlib.decompress(raw), dtype=np.uint8)
    rows, cols = level.tile_h, level.tile_w
    if data.size != rows * cols * FLOAT32_BYTES:
        raise DemReadError(f"tile decompressed to {data.size} bytes, expected {rows * cols * 4}")
    if predictor == PREDICTOR_FLOATING_POINT:
        planes = np.cumsum(data.reshape(rows, cols * FLOAT32_BYTES), axis=1, dtype=np.uint8)
        # Byte planes [b0 (MSB) .. b3 (LSB)] per row -> big-endian float32 values.
        values = planes.reshape(rows, FLOAT32_BYTES, cols).transpose(0, 2, 1).copy()
        return values.view(">f4").reshape(rows, cols).astype(np.float64)
    if predictor == PREDICTOR_NONE:
        return data.view(endian + "f4").reshape(rows, cols).astype(np.float64)
    raise DemReadError(f"unsupported TIFF predictor {predictor}")


TileFetcher = Callable[[int, int, int], bytes]
"""(level_index, tile_row, tile_col) -> compressed tile bytes."""


def read_window(
    dem: CogDem,
    level_index: int,
    x_min_m: float,
    x_max_m: float,
    y_min_m: float,
    y_max_m: float,
    fetch_tile: TileFetcher,
) -> tuple[np.ndarray, float, float, float]:
    """Assemble the tiles covering a map window at one level.

    Args:
        dem: COG layout.
        level_index: index into ``dem.levels`` (0 = finest).
        x_min_m: window west edge, polar stereographic metres.
        x_max_m: window east edge, metres.
        y_min_m: window south edge (map y), metres.
        y_max_m: window north edge (map y), metres.
        fetch_tile: returns compressed tile bytes (I/O is injected by the caller).

    Returns:
        (heights_m, x_left_m, y_top_m, pixel_m): array covering whole tiles (NaN outside
        the raster), and the map coordinates of its outer top-left corner and pixel size.
    """
    level = dem.levels[level_index]
    px = level.pixel_m
    col0 = max(0, int((x_min_m - dem.x_left_m) // px) // level.tile_w)
    col1 = min(level.tiles_across - 1, int((x_max_m - dem.x_left_m) // px) // level.tile_w)
    row0 = max(0, int((dem.y_top_m - y_max_m) // px) // level.tile_h)
    row1 = min(level.tiles_down - 1, int((dem.y_top_m - y_min_m) // px) // level.tile_h)
    if col1 < col0 or row1 < row0:
        raise DemReadError("window lies outside the DEM")
    out = np.full(((row1 - row0 + 1) * level.tile_h, (col1 - col0 + 1) * level.tile_w), np.nan)
    for row in range(row0, row1 + 1):
        for col in range(col0, col1 + 1):
            raw = fetch_tile(level_index, row, col)
            tile = decode_tile(raw, level, dem.predictor, dem.endian)
            r, c = (row - row0) * level.tile_h, (col - col0) * level.tile_w
            out[r : r + level.tile_h, c : c + level.tile_w] = tile
    # Crop the padding of edge tiles that extends beyond the raster.
    valid_rows = min(out.shape[0], level.height - row0 * level.tile_h)
    valid_cols = min(out.shape[1], level.width - col0 * level.tile_w)
    out[valid_rows:, :] = np.nan
    out[:, valid_cols:] = np.nan
    x_left = dem.x_left_m + col0 * level.tile_w * px
    y_top = dem.y_top_m - row0 * level.tile_h * px
    return out, x_left, y_top, px


# ---- I/O ---------------------------------------------------------------------------------


def fetch_bytes(url: str, start: int, length: int, cache_path: Path) -> bytes:
    """Bytes ``[start, start + length)`` of a remote file, cached on disk.

    Raises:
        DemReadError: if the server does not honour the range request.
    """
    if cache_path.exists():
        return cache_path.read_bytes()
    response = requests.get(
        url, headers={"Range": f"bytes={start}-{start + length - 1}"}, timeout=HTTP_TIMEOUT_S
    )
    response.raise_for_status()
    if response.status_code != 206 or len(response.content) != length:  # 206 Partial Content
        raise DemReadError(f"{url}: range request for {length} bytes at {start} failed")
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(response.content)
    return response.content


def open_cog(url: str, cache_dir: Path) -> CogDem:
    """Read (or reuse) the COG header and describe the file."""
    return parse_cog(fetch_bytes(url, 0, HEADER_BYTES, cache_dir / "header.bin"), url)


def http_tile_fetcher(dem: CogDem, cache_dir: Path) -> TileFetcher:
    """Tile fetcher that reads tiles by HTTP range and caches each one under ``cache_dir``."""

    def fetch(level_index: int, row: int, col: int) -> bytes:
        level = dem.levels[level_index]
        index = row * level.tiles_across + col
        path = cache_dir / f"L{level_index}" / f"r{row:03d}_c{col:03d}.bin"
        return fetch_bytes(dem.url, level.offsets[index], level.byte_counts[index], path)

    return fetch
