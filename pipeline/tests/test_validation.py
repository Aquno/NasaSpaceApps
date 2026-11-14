"""Tests for stage 6 (data part): PDS3 label parsing and pixel mapping."""

import numpy as np
import pytest

from pipeline.validation.pds_img import PdsReadError, parse_label, pixel_of, scale_dn

LABEL = """PDS_VERSION_ID            = "PDS3"
PRODUCT_ID                = "AVGVISIB_TEST"
START_TIME                = 2009-07-13T17:33:17.246
STOP_TIME                 = 2013-07-18T14:12:13
DESCRIPTION               = "Average illumination
   test map."
RECORD_BYTES              = 8
  OBJECT                  = IMAGE
    LINES                 = 4
    LINE_SAMPLES          = 4
    SAMPLE_TYPE           = LSB_INTEGER
    SAMPLE_BITS           = 16
    SCALING_FACTOR        = 0.00004
    OFFSET                = 0.0
  END_OBJECT              = IMAGE
OBJECT                    = IMAGE_MAP_PROJECTION
 MAP_PROJECTION_TYPE          = "POLAR STEREOGRAPHIC"
 CENTER_LATITUDE              = -90 <deg>
 MAP_SCALE                    = 60 <m/pix>
 COORDINATE_SYSTEM_NAME       = "MEAN EARTH/POLAR AXIS OF DE421"
END_OBJECT
"""


def test_parse_label():
    img = parse_label(LABEL)
    assert (img.product_id, img.lines, img.record_bytes, img.map_scale_m) == (
        "AVGVISIB_TEST",
        4,
        8,
        60.0,
    )
    assert img.scaling_factor == 4e-05 and img.center_latitude == -90.0
    assert img.description == "Average illumination test map."
    assert img.coordinate_system == "MEAN EARTH/POLAR AXIS OF DE421"


def test_pixel_mapping_south_orientation():
    img = parse_label(LABEL)
    # 4 x 4 map, 60 m pixels, centre between pixels 1 and 2. Longitude 0 (y > 0) is up
    # (smaller line); 90 E (x > 0) is to the right (larger sample).
    assert pixel_of(img, 30.0, 30.0) == (1, 2)
    assert pixel_of(img, -30.0, -30.0) == (2, 1)
    assert pixel_of(img, 0.1, 100.0) == (0, 2)
    with pytest.raises(PdsReadError):
        pixel_of(img, 500.0, 0.0)


def test_scaling():
    img = parse_label(LABEL)
    assert np.allclose(scale_dn(img, np.array([0, 25000])), [0.0, 1.0])


def test_rejects_non_int16():
    with pytest.raises(PdsReadError):
        parse_label(LABEL.replace("SAMPLE_BITS           = 16", "SAMPLE_BITS           = 8"))
