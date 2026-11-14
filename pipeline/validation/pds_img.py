"""
What: Read single pixels of a PDS3 polar stereographic IMG map (LOLA illumination products)
    over HTTP range requests, using its detached PDS3 label for layout and scaling.
Roadmap stage: 6 — Validation, data part (see docs/ROTEIRO.md)
Inputs: label (.LBL) text and the IMG URL; map x/y in polar stereographic metres.
Outputs: PdsImage layout; scaled pixel values (fraction 0-1 for AVGVISIB products).
NASA data source: LOLA polar illumination products, PGDA product 69
    (https://pgda.gsfc.nasa.gov/products/69), files on the LOLA PDS data node
    (http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/).

Pixel mapping from DSMAP_POLAR.CAT (http://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT):
    X = (I - N/2 - 0.5) * MAP_SCALE,  Y = (J - N/2 - 0.5) * MAP_SCALE * NS  (NS = -1 south),
    LON = ATAN2(X, Y); I = sample, J = line (1-based). In the south "Longitude 0 extends
    straight up from the center, and Longitude 90 East extends to the right". This is the same
    x/y as the PGDA GeoTIFFs (x = rho sin lon, y = rho cos lon, y up). The catalogue's inverse
    formula (lat/lon -> line/sample) has the opposite X sign for the south and contradicts the
    text, so it is not used; the orientation is checked against PSR outlines (run script).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import requests

HTTP_TIMEOUT_S = 120
SOUTH = -1
INT16_LSB = "LSB_INTEGER"


class PdsReadError(RuntimeError):
    """Raised when a label or image does not have the expected layout."""


@dataclass(frozen=True)
class PdsImage:
    """Layout of a square polar stereographic PDS3 image.

    Attributes:
        product_id: PRODUCT_ID from the label.
        lines: number of lines (= samples, square image).
        record_bytes: bytes per line.
        map_scale_m: metres per pixel.
        scaling_factor, offset: value = DN * scaling_factor + offset.
        center_latitude: -90 (south) or 90 (north).
        start_time, stop_time: LOLA data span quoted in the label.
        description: label DESCRIPTION text (whitespace collapsed).
        coordinate_system: COORDINATE_SYSTEM_NAME from the label.
    """

    product_id: str
    lines: int
    record_bytes: int
    map_scale_m: float
    scaling_factor: float
    offset: float
    center_latitude: float
    start_time: str
    stop_time: str
    description: str
    coordinate_system: str


def parse_label(text: str, source: str = "<label>") -> PdsImage:
    """Parse the keywords needed from a PDS3 label (the first occurrence of each). Pure."""

    def value(key: str) -> str:
        m = re.search(rf"^\s*{key}\s*=\s*(.+?)\s*$", text, re.MULTILINE)
        if not m:
            raise PdsReadError(f"{source}: keyword {key} not found")
        return m.group(1).strip().strip('"')

    def number(key: str) -> float:
        return float(re.match(r"[-+0-9.eE]+", value(key)).group(0))

    desc = re.search(r'^DESCRIPTION\s*=\s*"(.*?)"', text, re.MULTILINE | re.DOTALL)
    if value("SAMPLE_TYPE") != INT16_LSB or int(number("SAMPLE_BITS")) != 16:
        raise PdsReadError(f"{source}: expected 16-bit LSB integers")
    if int(number("LINES")) != int(number("LINE_SAMPLES")):
        raise PdsReadError(f"{source}: image is not square")
    if value("MAP_PROJECTION_TYPE") != "POLAR STEREOGRAPHIC":
        raise PdsReadError(f"{source}: not polar stereographic")
    return PdsImage(
        product_id=value("PRODUCT_ID"),
        lines=int(number("LINES")),
        record_bytes=int(number("RECORD_BYTES")),
        map_scale_m=number("MAP_SCALE"),
        scaling_factor=number("SCALING_FACTOR"),
        offset=number("OFFSET"),
        center_latitude=number("CENTER_LATITUDE"),
        start_time=value("START_TIME"),
        stop_time=value("STOP_TIME"),
        description=" ".join(desc.group(1).split()) if desc else "",
        coordinate_system=value("COORDINATE_SYSTEM_NAME"),
    )


def pixel_of(image: PdsImage, x_m: float, y_m: float) -> tuple[int, int]:
    """0-based (line, sample) of the pixel containing map point (x, y) in metres.

    Inverts X = (I - N/2 - 0.5) * scale, Y = (J - N/2 - 0.5) * scale * NS (DSMAP_POLAR.CAT).
    """
    ns = SOUTH if image.center_latitude < 0 else 1
    half = image.lines / 2.0
    sample = int(np.floor(x_m / image.map_scale_m + half))  # = I - 1
    line = int(np.floor(y_m / (image.map_scale_m * ns) + half))  # = J - 1
    if not (0 <= line < image.lines and 0 <= sample < image.lines):
        raise PdsReadError(f"{image.product_id}: point ({x_m:.0f}, {y_m:.0f}) m is outside the map")
    return line, sample


def scale_dn(image: PdsImage, dn: np.ndarray) -> np.ndarray:
    """Physical value = DN * SCALING_FACTOR + OFFSET (label NOTE)."""
    return np.asarray(dn, dtype=float) * image.scaling_factor + image.offset


# ---- I/O ---------------------------------------------------------------------------------


def fetch_text(url: str, cache_path: Path) -> str:
    """Download a small text file once (cached)."""
    if not cache_path.exists():
        response = requests.get(url, timeout=HTTP_TIMEOUT_S)
        response.raise_for_status()
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(response.content)
    return cache_path.read_text(encoding="ascii", errors="replace")


def read_line(image: PdsImage, url: str, line: int, cache_dir: Path) -> np.ndarray:
    """Raw DN values of one image line, read by HTTP range and cached."""
    path = cache_dir / f"{image.product_id}_line{line:05d}.bin"
    if not path.exists():
        start = line * image.record_bytes
        response = requests.get(
            url,
            headers={"Range": f"bytes={start}-{start + image.record_bytes - 1}"},
            timeout=HTTP_TIMEOUT_S,
        )
        response.raise_for_status()
        if response.status_code != 206 or len(response.content) != image.record_bytes:
            raise PdsReadError(f"{url}: range read of line {line} failed")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(response.content)
    return np.frombuffer(path.read_bytes(), dtype="<i2")


def value_at(image: PdsImage, url: str, x_m: float, y_m: float, cache_dir: Path, window: int = 0):
    """Scaled values of the (2*window+1)^2 pixels centred on the pixel containing (x, y)."""
    line, sample = pixel_of(image, x_m, y_m)
    rows = [read_line(image, url, ln, cache_dir) for ln in range(line - window, line + window + 1)]
    block = np.array([r[sample - window : sample + window + 1] for r in rows])
    return scale_dn(image, block)
