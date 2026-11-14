# Contrato de dados

Formato dos arquivos que a interface (`web/`) lê. Gerados pela etapa 4 (`pipeline/export/`) em `data/app/`. Dados de exemplo para a etapa 5 seguem **exatamente** o mesmo formato, com `meta.sample = true`.

Qualquer mudança neste contrato precisa ser registrada em `DECISOES.md` e refletida no pipeline e na interface ao mesmo tempo.

## Convenções

| Item | Convenção |
|------|-----------|
| Ângulos | graus decimais |
| Azimute | `[0, 360)`. Origem e sentido: **iguais aos do JPL Horizons** — `PENDENTE:` confirmar e escrever aqui |
| Elevação | `[-90, 90]`, graus acima do horizonte ideal (negativo = abaixo) |
| Distâncias | km |
| Tempo | UTC, ISO 8601 com `Z` (ex.: `2027-01-01T00:00:00Z` — data apenas ilustrativa) |
| Coordenadas | latitude/longitude em graus, referencial `PENDENTE:` (MOON_ME esperado) |
| Valor ausente | `null` (nunca `0` ou `-1` para "sem dado") |

## Arquivos

```
data/app/
├── sites.json          lista dos locais
└── sites/
    ├── shackleton-rim.json
    ├── connecting-ridge.json
    ├── de-gerlache-rim.json
    ├── malapert-massif.json
    └── haworth.json
```

## `sites.json`

Lista de locais. Um objeto por local.

| Campo | Tipo | Unidade | Descrição |
|-------|------|---------|-----------|
| `id` | string | — | identificador em kebab-case, igual ao nome do arquivo em `sites/` |
| `name` | string | — | nome para exibição |
| `lat` | number | graus | latitude (referencial: ver convenções) |
| `lon` | number | graus | longitude (referencial: ver convenções; `PENDENTE:` definir 0–360 ou −180–180) |
| `description` | string | — | uma ou duas frases sobre o local, em inglês |
| `psr_distance_km` | number \| null | km | distância até a sombra permanente mais próxima (etapa 3) |
| `nasa_avg_illumination_pct` | number \| null | % | iluminação média oficial (PGDA produto 69), para comparação/validação |

Exemplo de **estrutura** (valores fictícios, só para mostrar o formato):

```json
[
  {
    "id": "shackleton-rim",
    "name": "Shackleton rim",
    "lat": 0.0,
    "lon": 0.0,
    "description": "EXAMPLE — not real data.",
    "psr_distance_km": null,
    "nasa_avg_illumination_pct": null
  }
]
```

## `sites/<id>.json`

Um arquivo por local.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `horizon` | number[360] | elevação do terreno em graus, uma por grau de azimute; `horizon[i]` é o azimute `i°` |
| `series` | object[] | registros horários (ver abaixo), ordenados por `t` |
| `meta` | object | metadados (ver abaixo) |

### `series[]`

| Campo | Tipo | Unidade | Descrição |
|-------|------|---------|-----------|
| `t` | string | UTC ISO 8601 | instante do registro |
| `sun_az` | number | graus | azimute do Sol visto do local |
| `sun_el` | number | graus | elevação do Sol (horizonte ideal) |
| `earth_az` | number | graus | azimute da Terra visto do local |
| `earth_el` | number | graus | elevação da Terra (horizonte ideal) |

### `meta`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sources` | string[] | fontes usadas (nome + URL), ex.: Horizons, PGDA produto 90 |
| `dem_resolution_m` | number \| null | resolução do relevo usado no horizonte, em metros (`null` no plano B) |
| `horizon_method` | string | `"lola"` ou `"flat"` (plano B: horizonte liso) |
| `start` | string | início do intervalo, UTC ISO 8601 |
| `end` | string | fim do intervalo, UTC ISO 8601 |
| `step_minutes` | number | passo da série (60) |
| `sample` | boolean | `true` se for dado de exemplo; a interface **deve** mostrar aviso |
| `generated_at` | string | quando o arquivo foi gerado, UTC ISO 8601 |

Os campos `horizon`, `series`, `meta.sources`, `meta.start`, `meta.end` e `meta.sample` são os mínimos combinados. Os demais campos de `meta` são propostos nesta etapa e podem ser ajustados até a etapa 4 (registrar em `DECISOES.md`).

Exemplo de **estrutura** (valores fictícios):

```json
{
  "horizon": [0.0, 0.0, "... 360 valores ..."],
  "series": [
    { "t": "2027-01-01T00:00:00Z", "sun_az": 0.0, "sun_el": 0.0, "earth_az": 0.0, "earth_el": 0.0 }
  ],
  "meta": {
    "sources": ["EXAMPLE"],
    "dem_resolution_m": null,
    "horizon_method": "flat",
    "start": "2027-01-01T00:00:00Z",
    "end": "2027-01-01T00:00:00Z",
    "step_minutes": 60,
    "sample": true,
    "generated_at": "2026-11-14T00:00:00Z"
  }
}
```

## Regra de visibilidade (para a interface)

```
sun_visible(t)   = sun_el(t)   > horizon[floor(sun_az(t))   mod 360]
earth_visible(t) = earth_el(t) > horizon[floor(earth_az(t)) mod 360]
```

`PENDENTE:` decidir entre arredondar/truncar o azimute ou interpolar entre graus vizinhos; registrar em `DECISOES.md`.

## Tamanho

Um ano em passo horário são cerca de 8.760 registros por local (365 × 24). Se o arquivo ficar grande demais para o site, considerar arredondar valores a 2 casas decimais ou gzip — decisão a registrar.
