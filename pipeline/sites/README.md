# pipeline/sites/ — Locais

Lista de locais em `pipeline/sites.json` e código para lê-la e conferi-la.

| Arquivo | Responsabilidade |
|---|---|
| `../sites.json` | Lista de locais: campos do contrato (`id`, `name`, `lat`, `lon`, `description`, `psr_distance_km`, `nasa_avg_illumination_pct`) mais origem (`source_type`, `source`, `cross_check`). |
| `site_list.py` | Lê e valida `sites.json` (erros dizem arquivo, local e campo). |
| `polar_stereo.py` | Projeção estereográfica polar sul em esfera, ida e volta (funções puras, testadas). |
| `geotiff_header.py` | Lê o georreferenciamento de um GeoTIFF só pelos primeiros 64 KB (requisição HTTP com `Range`). |
| `verify_site_points.py` | Compara cada coordenada com o centro do recorte do PGDA produto 78 correspondente. |
| `crest_point.py` | Regra pura do ponto na crista (D20) e inclinação local. |
| `derive_crest_point.py` | Aplica a regra ao Site04 e imprime a inclinação de cada local (`python -m pipeline.sites.derive_crest_point`). |

```bash
python -m pipeline.sites.verify_site_points
```

## Convenções

- Pontos de **referência regionais**, não locais de pouso designados pela NASA. Seis locais: os cinco do desafio e `shackleton-inner-wall` (demonstração de sensibilidade, D20).
- Latitude e longitude em graus, referencial MOON_ME (mean Earth/polar axis do DE421), longitude **leste positiva em [-180, 180)**. O Horizons recebe a longitude em [0, 360).
- `source_type`: `published_point` (ponto publicado em documento da NASA), `derived_tile_center` (centro de recorte derivado do GeoTIFF), `unverified`.
- Altitude `alt_km = 0` sobre a esfera de 1737,4 km na etapa 1 (ver `docs/DADOS.md`).

Origem de cada coordenada: `docs/DADOS.md`.
