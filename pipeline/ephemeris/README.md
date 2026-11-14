# Etapa 1 — Efemérides

**Status: concluída (2026-11-14).** Relatório de verificações: [`data/ephemeris/REPORT.md`](../../data/ephemeris/REPORT.md).

**O que faz:** consulta o JPL Horizons e obtém, para cada local, azimute, elevação e diâmetro angular do Sol e da Terra, hora a hora, de 2027-01-01T00:00Z a 2027-12-31T23:00Z (D8): 8.760 registros por local.

## Como rodar

```bash
python -m pipeline.ephemeris.run_ephemeris                          # todos os locais, intervalo D8
python -m pipeline.ephemeris.run_ephemeris --sites connecting-ridge # só alguns locais
python -m pipeline.ephemeris.run_ephemeris --start 2027-03-01T00:00:00Z --stop 2027-03-31T23:00:00Z --step-minutes 60
```

- Consultas em sequência, com pausa de 2 s entre chamadas reais à API.
- Resposta bruta guardada em `data/raw/horizons/` (fora do git). Se o arquivo já existe, é reutilizado; o nome inclui um hash dos parâmetros, então mudar coordenadas ou intervalo gera nova consulta.
- Se a API recusar o intervalo, ele é dividido ao meio repetidamente (mínimo 24 h) e os blocos são juntados. Na prática a API aceitou o ano inteiro numa consulta.
- Rodar de novo a partir do cache gera arquivos idênticos (verificado).
- Código de saída `2` se alguma verificação falhar. Se a elevação máxima do Sol passar do limite, o script **para** (indica erro de coordenada ou de referencial).

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `horizons_client.py` | Monta a consulta, chama a API, guarda/reutiliza o cache, devolve o texto bruto. Única parte com rede. |
| `horizons_parser.py` | Interpreta o texto da tabela (função pura, testada com resposta real em `pipeline/tests/fixtures/`). |
| `checks.py` | Verificações de sanidade e texto do relatório (funções puras). |
| `run_ephemeris.py` | Orquestra: locais → consultas → junção Sol/Terra → arquivo de saída → verificações → relatório. |

Constantes em `pipeline/config.py`. Locais em `pipeline/sites.json` (ver `pipeline/sites/README.md`).

## Consulta ao Horizons

| Parâmetro | Valor | Por quê |
|---|---|---|
| `CENTER` | `'coord@301'` | observador na superfície da Lua |
| `COORD_TYPE` / `SITE_COORD` | `GEODETIC` / `'E-lon,lat,alt'` | longitude leste em [0, 360), graus; altitude em km |
| `COMMAND` | `'10'` (Sol), `'399'` (Terra) | centros dos corpos |
| `QUANTITIES` | `'4,13'` | 4 = azimute/elevação aparentes; 13 = diâmetro angular |
| `CSV_FORMAT`, `ANG_FORMAT`, `TIME_TYPE`, `EXTRA_PREC` | `YES`, `DEG`, `UT`, `YES` | tabela legível por máquina, graus, UTC, mais casas decimais |

## Formato de saída — `data/ephemeris/<id>.json`

```json
{
  "meta": {
    "site_id": "...", "site_name": "...", "lat": -89.468, "lon": -137.4, "alt_km": 0.0,
    "coordinates_source": "<URL>", "coordinates_source_type": "published_point",
    "frame": "MOON_ME (mean Earth/polar axis of DE421)",
    "horizons_center_frame": "MEAN_ME (high precision) {East-longitude positive}",
    "horizons_center_radii_km": "1737.4, 1737.4, 1737.4 km {Equator_a, b, pole_c}",
    "longitude_convention": "degrees east, [-180, 180)",
    "start": "2027-01-01T00:00:00Z", "end": "2027-12-31T23:00:00Z", "step_minutes": 60,
    "time_scale": "...", "azimuth_convention": "...", "elevation_reference": "...",
    "diameter_unit": "degrees (converted from Horizons arcseconds)",
    "queried_at": {"sun": ["<UTC>"], "earth": ["<UTC>"]},
    "api_url": "https://ssd.jpl.nasa.gov/api/horizons.api",
    "api_doc": "https://ssd-api.jpl.nasa.gov/doc/horizons.html",
    "ephemeris_source": "JPL DE441", "sample": false
  },
  "series": [
    {"t": "2027-01-01T00:00:00Z", "sun_az": 0.0, "sun_el": 0.0, "sun_diam": 0.0,
     "earth_az": 0.0, "earth_el": 0.0, "earth_diam": 0.0}
  ]
}
```

(valores da série acima são só ilustração de formato)

| Campo da série | Unidade | Significado |
|---|---|---|
| `t` | UTC ISO 8601 | instante (Horizons rotula como UT) |
| `sun_az`, `earth_az` | graus | azimute, a partir do norte no sentido horário (N=0, L=90, S=180, O=270) |
| `sun_el`, `earth_el` | graus | elevação acima do plano perpendicular ao zênite local (horizonte ideal, sem relevo, sem atmosfera) |
| `sun_diam`, `earth_diam` | graus | diâmetro angular do disco |

Este é um arquivo intermediário. O formato que a interface lê é o de `docs/CONTRATO_DE_DADOS.md` (gerado na etapa 4).

## Verificações (relatório em `data/ephemeris/REPORT.md`)

- 8.760 registros por local, sem horas faltando nem repetidas.
- Elevação mínima e máxima do Sol e da Terra.
- Sol: elevação máxima ≤ (90 − |lat|) + 1,6°.
- Sol: uma volta de azimute por mês (período médio dentro de 29,53 d ± 15%).
- Terra: período dominante da elevação próximo de um mês (mesma faixa).
- Referencial declarado pelo Horizons (`Center pole/equ`) deve conter `MEAN_ME`.

## Limites

- Elevações contra o horizonte ideal; o relevo entra na etapa 2.
- Altitude do observador 0 km sobre a esfera de 1737,4 km; na etapa 2 a altura virá do DEM.
- Para 2027 o Horizons usa o último segundo bissexto conhecido como constante; um segundo bissexto futuro, se anunciado, deslocaria os tempos em 1 s.
- Coordenadas são pontos de referência regionais, não locais de pouso designados pela NASA.
