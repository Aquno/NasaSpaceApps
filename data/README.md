# data/

| Pasta | O que guarda | Quem gera | No git? |
|-------|--------------|-----------|---------|
| `raw/` | Downloads brutos e cache das respostas de API (relevo LOLA, mapas PGDA, respostas do Horizons) | etapas 1–3 | **Não** (grande; baixável de novo) |
| `ephemeris/` | Efemérides por local: azimute/elevação do Sol e da Terra, hora a hora | etapa 1 | **Não** (regenerável) |
| `horizon/` | Horizonte por local: 360 elevações do terreno | etapa 2 | **Não** (regenerável) |
| `app/` | Arquivos que a interface lê (`sites.json`, `sites/<id>.json`) | etapa 4 | **Sim** (pequenos; o site publica) |

- Formato de `app/`: `docs/CONTRATO_DE_DADOS.md`.
- Origem de cada download: registrar em `docs/DADOS.md` (histórico de downloads).
- O pipeline deve poder recriar `ephemeris/`, `horizon/` e `app/` do zero (reprodutibilidade).
- Dados de exemplo, se ficarem em `app/`, levam `meta.sample = true`.
- Decisão correspondente: `docs/DECISOES.md` (D7).
