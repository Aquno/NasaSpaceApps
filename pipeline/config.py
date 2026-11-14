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

# ---- Stage 2: terrain horizon (docs/DECISOES.md D16-D18) ------------------------------------
HORIZON_DIR = REPO_ROOT / "data" / "horizon"
# LOLA south polar DEM, PGDA product 90 (https://pgda.gsfc.nasa.gov/products/90):
# cloud-optimized GeoTIFF, 20 m/pixel, 80 S to the pole, heights in metres.
HORIZON_DEM_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF"
HORIZON_DEM_PRODUCT = "NASA GSFC PGDA product 90, LOLA south polar DEM (LDEM_80S_20MPP_ADJ)"
# Distance bands (outer edge in metres, DEM pixel size in metres = sample step); approved
# by the team on 2026-11-14: full 20 m resolution near the site, COG overviews farther out.
HORIZON_BANDS_M = ((5_000.0, 20.0), (40_000.0, 80.0), (200_000.0, 320.0))
# Extra map margin around each band's window so bilinear samples never fall off the window.
HORIZON_WINDOW_MARGIN_M = 2_000.0
# Fine azimuth step before taking the per-degree maximum (must be < 1 degree).
HORIZON_FINE_STEP_DEG = 0.1
# Observer mast height above the DEM terrain: a team choice, not a NASA requirement (D18).
HORIZON_MAST_HEIGHT_M = 2.0
# Sanity bounds for the contour (stage 2 brief): outside them the run stops for review.
HORIZON_SANITY_MIN_DEG = -10.0
HORIZON_SANITY_MAX_DEG = 35.0
# Days of stage 1 ephemeris overlaid on the check plots (from the start of the series).
HORIZON_PLOT_DAYS = 30

# ---- Site point review (docs/DECISOES.md D20) -------------------------------------------------
# Radius within which a pixel must be the highest to count as a crest local maximum (team choice).
CREST_LOCAL_MAX_RADIUS_M = 250.0
