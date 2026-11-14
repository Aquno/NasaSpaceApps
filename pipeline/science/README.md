# Etapa 3 — Valor científico

**Status: concluída (2026-11-14).** Relatório: [`data/science/REPORT.md`](../../data/science/REPORT.md).

**O que faz:** para cada local, calcula a distância em km até a borda da região de sombra permanente (PSR) mais próxima com área de pelo menos 1 km² (zero se o local estiver dentro de uma), e informa a área e a identificação dessa região.

```bash
python -m pipeline.science.run_science
```

- **Entra:** `pipeline/sites.json`; shapefile de PSRs com área > 1 km² do PGDA produto 90 (`LPSR_80S_20MPP_ADJ_1km2.SHP` 20 MB e `.DBF`), baixado uma vez para `data/raw/pgda90/psr/`.
- **Sai:** `data/science/psr_distance.json` (por local: `psr_distance_km`, `inside_psr`, ponto mais próximo da borda, `psr_gid`, `psr_name`, `psr_area_km2`) e `data/science/REPORT.md`.
- **Escolhas do time, não critérios da NASA (D21):** proximidade de sombra permanente como indicador de interesse científico; limite de 1 km².

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `psr_files.py` | Lê o shapefile (polígonos, tipo 5) e a tabela DBF; parsing puro, acesso a arquivo/rede isolado. |
| `psr_distance.py` | Geometria pura no plano estereográfico: ponto dentro (regra par-ímpar, com buracos), menor distância às bordas, PSR mais próxima. |
| `run_science.py` | Orquestra: locais → polígonos → distância geodésica → JSON e relatório. |

## Método

1. Local projetado na estereográfica polar sul (esfera de 1737,4 km, a mesma do arquivo `.PRJ`).
2. Se o local está dentro de algum polígono (contando buracos), distância 0.
3. Senão, ponto mais próximo das bordas, buscado no plano (com poda por caixa delimitadora).
4. Distância final: arco de grande círculo na esfera de 1737,4 km entre o local e esse ponto. O fator de escala do plano difere de 1 em menos de 0,2% ao sul de 85°S; o script confere que plano e esfera diferem menos de 1%.
