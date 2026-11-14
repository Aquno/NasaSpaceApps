"""
What: Named constants for the data pipeline, each with its origin.
Roadmap stage: shared by stages 1-4 (see docs/ROTEIRO.md)
Inputs: none.
Outputs: constants imported by pipeline modules.
NASA data source: JPL Horizons (API docs and manual), NSSDCA Moon fact sheet,
    decisions in docs/DECISOES.md.
"""

from __future__ import annotations

from pathlib import Path

# ---- Paths --------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
SITES_FILE = REPO_ROOT / "pipeline" / "sites.json"
RAW_DIR = REPO_ROOT / "data" / "raw"
EPHEMERIS_DIR = REPO_ROOT / "data" / "ephemeris"

# ---- Time interval (docs/DECISOES.md D8) -----------------------------------------------
DEFAULT_START_UTC = "2027-01-01T00:00:00Z"
DEFAULT_STOP_UTC = "2027-12-31T23:00:00Z"  # inclusive: 8,760 hourly records
DEFAULT_STEP_MINUTES = 60

# ---- JPL Horizons API ---------------------------------------------------------------
# Endpoint as given in https://ssd-api.jpl.nasa.gov/doc/horizons.html
HORIZONS_API_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
HORIZONS_DOC_URL = "https://ssd-api.jpl.nasa.gov/doc/horizons.html"
# Body ids (Horizons manual): 10 = Sun centre, 399 = Earth centre, 301 = Moon centre.
SUN_ID = "10"
EARTH_ID = "399"
MOON_ID = "301"
# Observer-table quantities (Horizons manual): 4 = apparent azimuth & elevation,
# 13 = target angular diameter (arcseconds).
HORIZONS_QUANTITIES = "4,13"
# Courtesy pause between sequential requests (the manual asks e-mail users for 1-2 s
# between requests; the API docs state no rate limit, so we reuse that figure).
REQUEST_PAUSE_S = 2.0
HTTP_TIMEOUT_S = 120
# Smallest chunk when bisecting an interval the API refuses as too large.
MIN_CHUNK_HOURS = 24

# ---- Units --------------------------------------------------------------------------
ARCSEC_PER_DEG = 3600.0
FULL_TURN_DEG = 360.0
HOURS_PER_DAY = 24.0

# ---- Observer surface ---------------------------------------------------------------
# Horizons models the Moon as a 1737.4 km sphere for surface sites
# (response header "Center radii : 1737.4, 1737.4, 1737.4 km").
# PGDA product 78 GeoTIFFs use the same sphere (GeoKey 2057 = 1737400 m).
# Stage 1 uses altitude 0 km over this sphere (approved; see docs/DADOS.md).
LUNAR_SPHERE_RADIUS_KM = 1737.4
OBSERVER_ALTITUDE_KM = 0.0
# Horizons response header that names the lunar body-fixed frame; must contain this text.
EXPECTED_CENTER_FRAME = "MEAN_ME"

# ---- Sanity checks (stage 1 brief, docs/ROTEIRO.md) ---------------------------------------
# Max Sun elevation at a site must not exceed (90 - |lat|) + this margin, in degrees.
# Value given in the stage 1 brief ("cerca de 1,6 grau").
SUN_MAX_ELEVATION_MARGIN_DEG = 1.6
# Synodic month in days: NSSDCA Moon fact sheet, "Synodic period (days) 29.53"
# (https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html).
SYNODIC_MONTH_DAYS = 29.53
# Coarse "close to one month" band for the period checks (fraction of the synodic month).
# A sanity bound only, not a measurement.
MONTH_PERIOD_TOLERANCE_FRACTION = 0.15
