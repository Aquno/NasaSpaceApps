# data/

| Pasta | O que guarda | Quem gera | No git? |
|-------|--------------|-----------|---------|
| `raw/` | Downloads brutos e cache das respostas de API (relevo LOLA, mapas PGDA, respostas do Horizons) | etapas 1–3 | **Não** (grande; baixável de novo) |
| `ephemeris/` | Efemérides por local: azimute/elevação do Sol e da Terra, hora a hora | etapa 1 | **Não** (regenerável) |
| `horizon/` | Horizonte por local: 360 elevações do terreno | etapa 2 | **Não** (regenerável) |
| `science/` | Distância à sombra permanente por local (`REPORT.md` versionado) | etapa 3 | Só o relatório |
| `validation/` | Valores oficiais de iluminação/visibilidade da Terra (`REPORT.md` versionado) | etapa 6 (dados) | Só o relatório |
| `app/` | Arquivos que a interface lê (`sites.json`, `sites/<id>.json`, `REPORT.md`) | etapa 4 | **Sim** (~2,1 MB no total; o site publica) |

- Formato de `app/`: `docs/CONTRATO_DE_DADOS.md`.
- `app/` é copiado para `web/public/data/` por `npm run sync-data` (D10). A origem é sempre `app/`.
- Origem de cada download: registrar em `docs/DADOS.md` (histórico de downloads).
- O pipeline deve poder recriar `ephemeris/`, `horizon/` e `app/` do zero (reprodutibilidade).
- Dados de exemplo, se ficarem em `app/`, levam `meta.sample = true`.
- Decisão correspondente: `docs/DECISOES.md` (D7).
