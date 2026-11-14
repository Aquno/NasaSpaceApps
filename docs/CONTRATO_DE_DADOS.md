# Contrato de dados

**Este documento é a fonte única do formato** (D10). Formato dos arquivos que a interface (`web/`) lê. Gerados pela etapa 4 (`pipeline/export/`) em `data/app/` e copiados para `web/public/data/` por `npm run sync-data` antes do dev e do build. Dados de exemplo para a etapa 5 seguem **exatamente** o mesmo formato, com `meta.sample = true`.

O pipeline exporta **apenas** o contorno do horizonte e as séries do Sol e da Terra; visibilidade e métricas são calculadas na interface (D9).

Qualquer mudança neste contrato precisa ser registrada em `DECISOES.md` e refletida no pipeline e na interface ao mesmo tempo.

## Convenções

| Item | Convenção |
|------|-----------|
| Ângulos | graus decimais |
| Azimute | `[0, 360)`, a partir do **norte**, crescendo no sentido **horário** (N=0, L=90, S=180, O=270) — convenção do JPL Horizons, confirmada na etapa 1 |
| Elevação | `[-90, 90]`, graus acima do horizonte ideal (negativo = abaixo) |
| Distâncias | km |
| Tempo | UTC, ISO 8601 com `Z` (ex.: `2027-01-01T00:00:00Z`) |
| Intervalo | `2027-01-01T00:00:00Z` a `2027-12-31T23:00:00Z`, passo de 60 min, 8.760 registros (D8) |
| Coordenadas | latitude/longitude em graus, referencial MOON_ME (mean Earth/polar axis do DE421, D14) |
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
    └── haworth.json
```

## `sites.json`

Lista de locais. Um objeto por local.

| Campo | Tipo | Unidade | Descrição |
|-------|------|---------|-----------|
| `id` | string | — | identificador em kebab-case, igual ao nome do arquivo em `sites/` |
| `name` | string | — | nome para exibição |
| `lat` | number | graus | latitude (referencial: ver convenções) |
| `lon` | number | graus | longitude leste, intervalo [-180, 180) (D12) |
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

Todos os campos de `meta` acima foram aprovados na revisão da etapa 0 (D7). Mudanças passam por `DECISOES.md`.

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
    "end": "2027-12-31T23:00:00Z",
    "step_minutes": 60,
    "sample": true,
    "generated_at": "2026-11-14T00:00:00Z"
  }
}
```

## Regra de visibilidade (implementada só na interface)

Implementada em **um único módulo TypeScript** de funções puras com testes (D9); não é exportada pelo pipeline. A validação da etapa 6 usa o mesmo módulo. Forma conceitual:

```
sun_visible(t)   = sun_el(t)   > horizon[floor(sun_az(t))   mod 360]
earth_visible(t) = earth_el(t) > horizon[floor(earth_az(t)) mod 360]
```

`PENDENTE:` decidir, na etapa 5, entre truncar/arredondar o azimute ou interpolar entre graus vizinhos; registrar em `DECISOES.md` e cobrir com testes no módulo de visibilidade.

## Tamanho

2027 em passo horário são 8.760 registros por local (365 × 24). Se o arquivo ficar grande demais para o site, considerar arredondar valores a 2 casas decimais ou gzip — decisão a registrar.
