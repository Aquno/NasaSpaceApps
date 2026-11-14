# Etapa 2 — Horizonte

**Status: concluída (2026-11-14).** Relatório: [`data/horizon/REPORT.md`](../../data/horizon/REPORT.md). Figuras: [`data/horizon/plots/`](../../data/horizon/plots/).

**O que faz:** para cada local, calcula o contorno do horizonte: a elevação do terreno, em graus, vista do local, para cada grau de azimute (360 valores), a partir do relevo do LOLA.

## Como rodar

```bash
python -m pipeline.horizon.run_horizon                                   # cinco locais, padrões abaixo
python -m pipeline.horizon.run_horizon --sites haworth --mast-m 2 --radius-km 200 --fine-step-deg 0.1
```

Blocos do DEM lidos por requisição HTTP com `Range` e guardados em `data/raw/pgda90/` (fora do git, ~41 MB para os cinco locais). Rodar de novo a partir do cache gera arquivos idênticos (no mesmo dia; `computed_on` registra a data).

## Fonte

- PGDA produto 90, `LDEM_80S_20MPP_ADJ.TIF` (https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF), COG de 2,7 GB lido por partes.
- Estereográfica polar sul, esfera de 1.737.400 m, MOON_ME (DE421). Altura em metros sobre essa esfera (D16).

## Método

| Item | Escolha |
|---|---|
| Observador | altura do terreno no DEM de 20 m (bilinear) + mastro de 2 m (escolha do time, D18) |
| Faixas | 20 m até 5 km (resolução cheia), 80 m até 40 km, 320 m até 200 km (visões reduzidas do COG); passo ao longo do raio = tamanho do pixel |
| Raio | 200 km (D17) |
| Geometria | vetores 3D a partir do centro da Lua, esfera de 1737,4 km; raios ao longo de grandes círculos; elevação = ângulo acima do plano horizontal local do observador |
| Valor por direção | maior ângulo ao longo do raio; **sem limitar a zero** |
| Azimute | igual ao Horizons: 0 = norte, 90 = leste, sentido horário |
| Passo fino | 0,1°; `horizon_deg[i]` = máximo dos azimutes em [i − 0,5, i + 0,5) (D19) |
| Borda do DEM | o raio para no primeiro ponto fora do DEM; o que fica além é **desconhecido** (nem liso nem zero); a distância de corte fica em `cut_distance_km` |

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `dem_cog.py` | Lê o COG: cabeçalho, níveis, blocos por faixa de bytes (com cache), decodificação DEFLATE + preditor de ponto flutuante (pura), montagem de janelas. Único acesso a rede/disco do DEM. |
| `geometry.py` | Funções puras: vetores, base leste/norte/zênite, pontos ao longo de um azimute, elevação, azimute, projeção estereográfica, depressão do horizonte, interpolação bilinear. |
| `horizon_profile.py` | Cálculo do horizonte (puro; o terreno é uma função injetada). |
| `report.py` | Resumo por local, sanidade e texto do relatório (puro). |
| `run_horizon.py` | Orquestra: locais → janelas do DEM → horizonte → JSON, figura e relatório. |

Testes em `pipeline/tests/test_horizon.py`: esfera lisa (depressão geométrica igual em todas as direções), parede a distância e altura conhecidas, convenção de azimute (norte no mesmo meridiano = 0°, leste = 90°, "norte" na grade estereográfica = para longe do polo), corte na borda, decodificação de bloco.

## Saída — `data/horizon/<id>.json`

```json
{
  "meta": {
    "site_id": "...", "site_name": "...", "lat": 0.0, "lon": 0.0, "frame": "MOON_ME ...",
    "dem_product": "...", "dem_url": "...", "dem_reference_surface": "sphere of 1737.4 km ...",
    "bands": [{"max_distance_m": 5000.0, "pixel_m": 20.0, "cog_level": 0}, "..."],
    "search_radius_m": 200000.0, "fine_azimuth_step_deg": 0.1,
    "bin_convention": "horizon_deg[i] = max over azimuths in [i - 0.5, i + 0.5) degrees",
    "azimuth_convention": "...", "terrain_height_m": 0.0, "mast_height_m": 2.0,
    "observer_height_above_sphere_m": 0.0, "smooth_sphere_dip_deg": 0.0,
    "method": "...", "edge_rule": "...", "horizon_method": "lola",
    "computed_on": "YYYY-MM-DD", "sample": false
  },
  "horizon_deg": ["360 valores, graus"],
  "obstacle_distance_km": ["360 valores, km até o ponto que define o horizonte"],
  "cut_distance_km": ["360 valores: km onde o raio saiu do DEM, ou null"]
}
```

## Verificações (relatório)

Por local: mínimo, máximo e média do contorno; direção e distância do maior obstáculo; depressão geométrica da esfera lisa (altura do observador e só o mastro); fração de azimutes cortados pela borda e distâncias de corte. O script **para** (código 2) se algum contorno sair de [−10°, +35°], for constante ou tiver direções sem dado.

## Limites

- Visões reduzidas do COG: não se sabe como foram geradas; picos distantes podem estar um pouco rebaixados.
- Superfície de referência da altura inferida do datum declarado no arquivo.
- Obstáculos menores que o pixel da faixa (20/80/320 m) podem ser perdidos.
- Além da borda do DEM (quadrado de ±304 km), o horizonte é desconhecido: afeta 13,9% das direções do Malapert massif.
- Plano B (horizonte liso) não foi necessário.
