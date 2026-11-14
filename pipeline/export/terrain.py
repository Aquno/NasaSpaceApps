"""
What: Export a small south polar height map for the interface's map views (2D shaded map and
    3D view, D28): a north-up grid around the pole, int16 metres, plus a JSON descriptor.
Roadmap stage: 4 — Export (terrain for stage 5) (see docs/ROTEIRO.md)
Inputs: LOLA DEM COG (PGDA product 90) through the stage 2 tile cache (320 m overview).
Outputs: data/app/terrain.bin (int16 little-endian, row-major, row 0 = north edge = +y),
    data/app/terrain.json (grid size, extent, pixel, projection, source).
NASA data source: PGDA product 90, LDEM_80S_20MPP_ADJ.TIF (https://pgda.gsfc.nasa.gov/products/90).

Usage: python -m pipeline.export.terrain
"""

from __future__ import annotations

import json
import sys

import numpy as np

from pipeline import config
from pipeline.export.contract import CONTRACT_VERSION, validate_terrain
from pipeline.horizon.dem_cog import http_tile_fetcher, open_cog, read_window
from pipeline.horizon.geometry import bilinear

APP_DIR = config.REPO_ROOT / "data" / "app"
# Grid approved by the team (D28): 512 x 512 covering about +/-150 km around the pole.
TERRAIN_SIZE_PX = 512
TERRAIN_HALF_EXTENT_M = 150_000.0
# Source level of the COG used for the grid (320 m overview; finer than the ~586 m output).
TERRAIN_SOURCE_PIXEL_M = 320.0
INT16_MIN, INT16_MAX = -32768, 32767


def grid_centres(size: int, half_extent_m: float) -> tuple[np.ndarray, np.ndarray, float]:
    """Map x/y (m) of every pixel centre of a north-up square grid, and the pixel size (m)."""
    pixel = 2 * half_extent_m / size
    coords = -half_extent_m + (np.arange(size) + 0.5) * pixel
    x, y = np.meshgrid(coords, coords[::-1])  # row 0 is the north (+y) edge
    return x, y, pixel


def main() -> int:
    """Write terrain.bin and terrain.json; returns the exit code."""
    import truststore

    truststore.inject_into_ssl()  # use the OS certificate store (see requirements.txt)
    cache = config.RAW_DIR / "pgda90" / "LDEM_80S_20MPP_ADJ"
    dem = open_cog(config.HORIZON_DEM_URL, cache)
    level = next(i for i, lv in enumerate(dem.levels) if lv.pixel_m == TERRAIN_SOURCE_PIXEL_M)
    margin = 2 * TERRAIN_SOURCE_PIXEL_M
    half = TERRAIN_HALF_EXTENT_M + margin
    grid, x_left, y_top, px = read_window(
        dem, level, -half, half, -half, half, http_tile_fetcher(dem, cache)
    )
    x, y, pixel = grid_centres(TERRAIN_SIZE_PX, TERRAIN_HALF_EXTENT_M)
    heights = bilinear(grid, x_left, y_top, px, x, y)
    if not np.all(np.isfinite(heights)):
        print("terrain: grid has cells without data", file=sys.stderr)
        return 2
    metres = np.clip(np.round(heights), INT16_MIN, INT16_MAX).astype("<i2")
    APP_DIR.mkdir(parents=True, exist_ok=True)
    (APP_DIR / "terrain.bin").write_bytes(metres.tobytes())
    descriptor = {
        "contract_version": CONTRACT_VERSION,
        "width": TERRAIN_SIZE_PX,
        "height": TERRAIN_SIZE_PX,
        "pixel_m": pixel,
        "x_min_m": -TERRAIN_HALF_EXTENT_M,
        "x_max_m": TERRAIN_HALF_EXTENT_M,
        "y_min_m": -TERRAIN_HALF_EXTENT_M,
        "y_max_m": TERRAIN_HALF_EXTENT_M,
        "dtype": "int16le",
        "height_unit": "m above the 1737.4 km sphere",
        "row_order": "row 0 = north edge (+y); column 0 = west edge (-x)",
        "projection": (
            "south polar stereographic, sphere 1737400 m, origin -90, central meridian 0, "
            "x = rho sin(lon), y = rho cos(lon)"
        ),
        "sphere_radius_m": dem.sphere_radius_m,
        "min_height_m": int(metres.min()),
        "max_height_m": int(metres.max()),
        "source": f"{config.HORIZON_DEM_PRODUCT}, {TERRAIN_SOURCE_PIXEL_M:g} m overview, bilinear",
    }
    (APP_DIR / "terrain.json").write_text(json.dumps(descriptor, indent=1) + "\n", encoding="utf-8")
    size = (APP_DIR / "terrain.bin").stat().st_size
    errors = validate_terrain(descriptor, size)
    if errors:
        print(" | ".join(errors), file=sys.stderr)
        return 2
    print(
        f"terrain: {TERRAIN_SIZE_PX}x{TERRAIN_SIZE_PX}, {pixel:.1f} m/pixel, heights "
        f"{descriptor['min_height_m']}..{descriptor['max_height_m']} m, {size} bytes"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
