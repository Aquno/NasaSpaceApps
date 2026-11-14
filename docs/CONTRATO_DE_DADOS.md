# Contrato de dados

**Este documento é a fonte única do formato** (D10). Formato dos arquivos que a interface (`web/`) lê. Gerados pela etapa 4 (`pipeline/export/`) em `data/app/` e copiados para `web/public/data/` por `npm run sync-data` antes do dev e do build. Dados de exemplo para a etapa 5 seguem **exatamente** o mesmo formato, com `meta.sample = true`.

O pipeline exporta **apenas** o contorno do horizonte, as séries do Sol e da Terra e dados de referência; visibilidade e métricas são calculadas na interface (D9).

Qualquer mudança neste contrato precisa ser registrada em `DECISOES.md` e refletida no pipeline e na interface ao mesmo tempo. **Versão atual: 2** (D23: série em colunas, campos de locais e de horizonte acrescentados). O validador do pipeline está em `pipeline/export/contract.py`.

## Convenções

| Item | Convenção |
|------|-----------|
| Ângulos | graus decimais, **arredondados a 3 casas** |
| Azimute | `[0, 360)`, a partir do **norte**, crescendo no sentido **horário** (N=0, L=90, S=180, O=270) — convenção do JPL Horizons, confirmada na etapa 1 |
| Elevação | `[-90, 90]`, graus acima do horizonte ideal (plano perpendicular ao zênite local; negativo = abaixo) |
| Distâncias | km, 3 casas |
| Alturas | metros, 1 casa |
| Tempo | UTC, ISO 8601 com `Z` (ex.: `2027-01-01T00:00:00Z`) |
| Intervalo | `2027-01-01T00:00:00Z` a `2027-12-31T23:00:00Z`, passo de 60 min, 8.760 registros (D8) |
| Coordenadas | latitude/longitude em graus, referencial MOON_ME (mean Earth/polar axis do DE421, D14), longitude leste em [-180, 180) |
| Valor ausente | `null` (nunca `0` ou `-1` para "sem dado") |

## Arquivos

Mesma estrutura em `data/app/` (origem, gerada pelo pipeline) e em `web/public/data/` (cópia lida pela interface, URL `/data/...`).

```
data/app/
├── sites.json          lista dos locais
└── sites/
    ├── shackleton-rim.json
    ├── connecting-ridge.json
    ├── de-gerlache-rim.json
    ├── malapert-massif.json
    ├── haworth.json
    └── shackleton-inner-wall.json
```

## `sites.json`

Lista (array JSON) de locais, um objeto por local, na ordem de exibição.

| Campo | Tipo | Unidade | Descrição |
|-------|------|---------|-----------|
| `id` | string | — | identificador em kebab-case, igual ao nome do arquivo em `sites/` |
| `name` | string | — | nome para exibição |
| `lat` | number | graus | latitude (MOON_ME) |
| `lon` | number | graus | longitude leste, [-180, 180) (D12) |
| `description` | string | — | uma ou duas frases sobre o local, em inglês |
| `source_type` | string | — | `published_point` (ponto publicado pela NASA) ou `derived_point` (derivado por nós de região da NASA, D20) — *v2* |
| `purpose` | string \| null | — | `null` para os locais do desafio; `"sensitivity_demo"` para o ponto que só demonstra a sensibilidade à posição (D20) — *v2* |
| `terrain_height_m` | number | m | altura do terreno no local, sobre a esfera de 1737,4 km (DEM de 20 m) — *v2* |
| `terrain_slope_deg` | number | graus | inclinação local do terreno (DEM de 20 m) — *v2* |
| `observer_height_m` | number | m | altura do observador sobre a esfera de 1737,4 km (terreno + mastro) — *v2* |
| `psr_distance_km` | number \| null | km | distância até a borda da sombra permanente (≥ 1 km²) mais próxima; 0 se dentro (etapa 3) |
| `psr_area_km2` | number \| null | km² | área dessa sombra permanente — *v2* |
| `psr_name` | string \| null | — | identificação publicada dessa sombra permanente (PGDA 90) — *v2* |
| `nasa_avg_illumination_pct` | number \| null | % | iluminação solar média oficial (PGDA produto 69, 18,6 anos), para comparação/validação |
| `nasa_avg_earth_visibility_pct` | number \| null | % | visibilidade média oficial da Terra (PGDA produto 69, 18,6 anos) — *v2* |

Exemplo de **estrutura** (valores fictícios, só para mostrar o formato):

```json
[
  {
    "id": "example-site",
    "name": "Example site",
    "lat": -89.0,
    "lon": 0.0,
    "description": "EXAMPLE - not real data.",
    "source_type": "published_point",
    "purpose": null,
    "terrain_height_m": 0.0,
    "terrain_slope_deg": 0.0,
    "observer_height_m": 2.0,
    "psr_distance_km": null,
    "psr_area_km2": null,
    "psr_name": null,
    "nasa_avg_illumination_pct": null,
    "nasa_avg_earth_visibility_pct": null
  }
]
```

## `sites/<id>.json`

Um arquivo por local.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `horizon` | number[360] | elevação do terreno em graus, uma por grau de azimute; `horizon[i]` é o **máximo** do terreno nos azimutes [i − 0,5°, i + 0,5°) (D19); pode ser negativo |
| `horizon_obstacle_km` | number[360] | distância (km) ao ponto do terreno que define `horizon[i]` — *v2* |
| `horizon_cut_km` | (number \| null)[360] | onde o raio de busca saiu do DEM antes do raio máximo (km); `null` se não saiu. Além disso o terreno é desconhecido — *v2* |
| `series` | object | série horária **em colunas** (ver abaixo) — *v2* |
| `meta` | object | metadados (ver abaixo) |

### `series` (em colunas, v2)

Cada campo é um array com `meta.count` valores, todos na mesma ordem. O instante do registro `i` é **implícito**: `t_i = meta.start + i × meta.step_minutes` (UTC). Não há campo `t`.

| Campo | Tipo | Unidade | Descrição |
|-------|------|---------|-----------|
| `sun_az` | number[] | graus | azimute do Sol visto do local |
| `sun_el` | number[] | graus | elevação do Sol (horizonte ideal) |
| `sun_diam` | number[] | graus | diâmetro angular do Sol — *v2* |
| `earth_az` | number[] | graus | azimute da Terra visto do local |
| `earth_el` | number[] | graus | elevação da Terra (horizonte ideal) |
| `earth_diam` | number[] | graus | diâmetro angular da Terra — *v2* |

### `meta`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `contract_version` | number | `2` — *v2* |
| `site_id` | string | igual ao `id` em `sites.json` — *v2* |
| `sources` | string[] | fontes usadas (nome + URL) |
| `dem_resolution_m` | number \| null | resolução do relevo perto do local (20 m), em metros (`null` no plano B) |
| `horizon_bands` | object[] | faixas do horizonte: `{max_distance_km, pixel_m}` — *v2* |
| `horizon_method` | string | `"lola"` ou `"flat"` (plano B: horizonte liso) |
| `terrain_height_m` | number | altura do terreno no local (m sobre a esfera de 1737,4 km) — *v2* |
| `mast_height_m` | number | altura do mastro sobre o terreno (m; escolha do time, D18) — *v2* |
| `observer_height_m` | number | `terrain_height_m + mast_height_m` — *v2* |
| `start` | string | início do intervalo, UTC ISO 8601 |
| `end` | string | fim do intervalo (inclusive), UTC ISO 8601 |
| `step_minutes` | number | passo da série (60) |
| `count` | number | número de valores de cada coluna da série (8.760) — *v2* |
| `sample` | boolean | `true` se for dado de exemplo; a interface **deve** mostrar aviso |
| `generated_at` | string | data de geração, UTC, ISO 8601 (`YYYY-MM-DD`; só a data, para que rodar de novo no mesmo dia gere arquivos idênticos) — *v2: só data* |

Exemplo de **estrutura** (valores fictícios):

```json
{
  "horizon": [0.0, 0.0, "... 360 valores ..."],
  "horizon_obstacle_km": [0.0, "... 360 valores ..."],
  "horizon_cut_km": [null, "... 360 valores ..."],
  "series": {
    "sun_az": [0.0, "... 8760 valores ..."],
    "sun_el": [0.0], "sun_diam": [0.533],
    "earth_az": [0.0], "earth_el": [0.0], "earth_diam": [1.9]
  },
  "meta": {
    "contract_version": 2,
    "site_id": "example-site",
    "sources": ["EXAMPLE"],
    "dem_resolution_m": null,
    "horizon_bands": [],
    "horizon_method": "flat",
    "terrain_height_m": 0.0,
    "mast_height_m": 2.0,
    "observer_height_m": 2.0,
    "start": "2027-01-01T00:00:00Z",
    "end": "2027-12-31T23:00:00Z",
    "step_minutes": 60,
    "count": 8760,
    "sample": true,
    "generated_at": "2026-11-14"
  }
}
```

## Regra de visibilidade (implementada só na interface)

Implementada em **um único módulo TypeScript** de funções puras com testes (D9); não é exportada pelo pipeline. A validação da etapa 6 usa o mesmo módulo. Forma conceitual:

```
sun_visible(i)   = sun_el[i]   > horizon[round(sun_az[i])   mod 360]
earth_visible(i) = earth_el[i] > horizon[round(earth_az[i]) mod 360]
```

Arredondar casa com a discretização do horizonte (cada `horizon[i]` cobre [i − 0,5°, i + 0,5°), D19). `PENDENTE:` confirmar na etapa 5 (ou trocar por interpolação, ou considerar o disco do astro com `*_diam`), registrar em `DECISOES.md` e cobrir com testes no módulo de visibilidade. A NASA (produto 69) conta o astro como visível se **qualquer parte** do disco aparece.

## Tamanho

2027 em passo horário são 8.760 registros por local. Com colunas e 3 casas decimais, cada arquivo de local fica em torno de 0,4 MB (tamanhos reais no `ROTEIRO.md`, registro da etapa 4).
