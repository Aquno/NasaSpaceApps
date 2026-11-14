"""Tests for stage 3: PSR shapefile/DBF parsing and distance to the nearest PSR."""

import struct
from dataclasses import dataclass

import numpy as np
import pytest

from pipeline.science.psr_distance import nearest_psr, point_in_rings
from pipeline.science.psr_files import combine, parse_dbf, parse_shp_polygons


@dataclass
class Poly:
    rings: tuple
    bbox: tuple


def square(x0, y0, size):
    return np.array(
        [[x0, y0], [x0, y0 + size], [x0 + size, y0 + size], [x0 + size, y0], [x0, y0]], float
    )


def poly(*rings):
    allp = np.vstack(rings)
    return Poly(
        tuple(rings), (allp[:, 0].min(), allp[:, 1].min(), allp[:, 0].max(), allp[:, 1].max())
    )


def test_inside_gives_zero():
    r = nearest_psr(5.0, 5.0, [poly(square(0, 0, 10))])
    assert r.inside and r.planar_distance_m == 0.0


def test_outside_distance_to_edge_and_corner():
    polys = [poly(square(0, 0, 10)), poly(square(100, 0, 10))]
    r = nearest_psr(13.0, 5.0, polys)
    assert (r.index, r.planar_distance_m, r.inside) == (0, 3.0, False)
    assert r.nearest_xy_m == (10.0, 5.0)
    corner = nearest_psr(13.0, 14.0, polys)
    assert corner.planar_distance_m == pytest.approx(5.0)


def test_hole_is_outside():
    outer, hole = square(0, 0, 10), square(4, 4, 2)[::-1]
    p = poly(outer, hole)
    assert point_in_rings(5.0, 5.0, p.rings) is False
    r = nearest_psr(5.0, 5.0, [p])
    assert not r.inside and r.planar_distance_m == pytest.approx(1.0)


def shp_bytes(rings):
    pts = np.vstack(rings)
    parts = np.cumsum([0] + [len(r) for r in rings[:-1]])
    content = struct.pack(
        "<i4d2i",
        5,
        pts[:, 0].min(),
        pts[:, 1].min(),
        pts[:, 0].max(),
        pts[:, 1].max(),
        len(rings),
        len(pts),
    )
    content += struct.pack(f"<{len(rings)}i", *parts) + pts.astype("<f8").tobytes()
    record = struct.pack(">2i", 1, len(content) // 2) + content
    header = struct.pack(">7i", 9994, 0, 0, 0, 0, 0, (100 + len(record)) // 2) + struct.pack(
        "<2i4d4d", 1000, 5, 0, 0, 0, 0, 0, 0, 0, 0
    )
    return header + record


def dbf_bytes(rows):
    fields = [("gid", 5), ("area_km2", 10), ("name", 12)]
    header_len = 32 + 32 * len(fields) + 1
    record_len = 1 + sum(n for _, n in fields)
    head = struct.pack("<4BIHH20x", 3, 26, 11, 14, len(rows), header_len, record_len)
    desc = b"".join(
        name.encode().ljust(11, b"\0") + b"C" + b"\0" * 4 + bytes([n, 0]) + b"\0" * 14
        for name, n in fields
    )
    body = b"".join(b" " + b"".join(str(r[k]).encode().ljust(n) for (k, n) in fields) for r in rows)
    return head + desc + b"\r" + body + b"\x1a"


def test_parse_synthetic_shapefile_and_dbf():
    rings = [square(0, 0, 10), square(4, 4, 2)[::-1]]
    records = parse_shp_polygons(shp_bytes(rings))
    assert len(records) == 1 and len(records[0][1]) == 2
    assert np.allclose(records[0][1][0], rings[0])
    rows = parse_dbf(dbf_bytes([{"gid": 7, "area_km2": "1.234", "name": '"PSR_A"'}]))
    assert rows == [{"gid": "7", "area_km2": "1.234", "name": '"PSR_A"'}]
    polys = combine(records, rows, "test")
    assert (polys[0].gid, polys[0].name, polys[0].area_km2) == (7, "PSR_A", 1.234)
