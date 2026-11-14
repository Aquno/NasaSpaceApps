"""
What: Cross-check site coordinates against the centre of each PGDA product 78 DEM tile.
Roadmap stage: 1 — Ephemeris, site coordinates (see docs/ROTEIRO.md)
Inputs: pipeline/sites.json; GeoTIFF headers of PGDA product 78 (first 64 KB only,
    cached in data/raw/pgda78/).
Outputs: a table printed to stdout (site, published point, tile centre, distance in m).
NASA data source: LOLA 5 m south pole site DEMs, PGDA product 78
    (https://pgda.gsfc.nasa.gov/products/78); README at
    https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README

Usage: python -m pipeline.sites.verify_site_points
"""

from __future__ import annotations

import math

from pipeline import config
from pipeline.sites.geotiff_header import fetch_header_bytes, parse_georef, raster_center_xy
from pipeline.sites.polar_stereo import forward_south_polar, inverse_south_polar
from pipeline.sites.site_list import load_sites

PGDA78_BASE_URL = "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp"
# Tile used for each site; names from the PGDA product 78 README.
SITE_TILES = {
    "shackleton-rim": "Site04",
    "connecting-ridge": "Site01",
    "de-gerlache-rim": "Site11",
    "malapert-massif": "Site23",
    "haworth": "Haworth",
}
# GeoKeys holding the projection parameters (OGC GeoTIFF Standard).
GEOKEY_SEMI_MAJOR_AXIS = 2057
GEOKEY_COORD_TRANS = 3075
GEOKEY_NAT_ORIGIN_LAT = 3081
GEOKEY_STRAIGHT_VERT_POLE_LON = 3095
CT_POLAR_STEREOGRAPHIC = 15
SOUTH_POLE_LAT_DEG = -90.0
M_PER_KM = 1000.0


def tile_url(tile: str) -> str:
    """URL of the surface-height GeoTIFF of a PGDA product 78 tile."""
    return f"{PGDA78_BASE_URL}/{tile}/{tile}_final_adj_5mpp_surf.tif"


def tile_center_latlon(tile: str) -> tuple[float, float]:
    """Latitude/longitude (degrees, MOON_ME, east-positive) of a tile's extent centre.

    Reads only the GeoTIFF header and uses the projection declared in its GeoKeys.
    """
    url = tile_url(tile)
    data = fetch_header_bytes(url, config.RAW_DIR / "pgda78" / f"{tile}_surf_header.bin")
    georef = parse_georef(data, url)
    keys = georef.geokeys
    if keys.get(GEOKEY_COORD_TRANS) != CT_POLAR_STEREOGRAPHIC:
        raise ValueError(f"{url}: projection is not polar stereographic")
    if keys.get(GEOKEY_NAT_ORIGIN_LAT) != SOUTH_POLE_LAT_DEG:
        raise ValueError(f"{url}: projection is not south-polar")
    x_m, y_m = raster_center_xy(georef)
    return inverse_south_polar(
        x_m,
        y_m,
        radius_m=float(keys[GEOKEY_SEMI_MAJOR_AXIS]),
        central_lon_deg=float(keys.get(GEOKEY_STRAIGHT_VERT_POLE_LON, 0.0)),
    )


def planar_distance_m(lat1: float, lon1: float, lat2: float, lon2: float, radius_m: float) -> float:
    """Distance in metres between two points measured on the polar stereographic plane.

    Adequate near the pole (scale factor ~1) for a cross-check of a few metres to km.
    """
    x1, y1 = forward_south_polar(lat1, lon1, radius_m)
    x2, y2 = forward_south_polar(lat2, lon2, radius_m)
    return math.hypot(x1 - x2, y1 - y2)


def main() -> None:
    """Print, for each site, the published point, the tile centre and their distance."""
    import truststore

    truststore.inject_into_ssl()  # use the OS certificate store (see requirements.txt)
    sphere_m = config.LUNAR_SPHERE_RADIUS_KM * M_PER_KM
    print(f"{'site':18} {'tile':8} {'published lat,lon':>24} {'tile centre lat,lon':>24} dist m")
    for site in load_sites(config.SITES_FILE):
        tile = SITE_TILES[site.id]
        lat_c, lon_c = tile_center_latlon(tile)
        dist = planar_distance_m(site.lat, site.lon, lat_c, lon_c, sphere_m)
        print(
            f"{site.id:18} {tile:8} {site.lat:11.4f},{site.lon:11.4f} "
            f"{lat_c:11.4f},{lon_c:11.4f} {dist:8.1f}"
        )


if __name__ == "__main__":
    main()
