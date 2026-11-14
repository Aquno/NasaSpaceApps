# pipeline/

Pipeline Python **offline** que transforma dados da NASA nos arquivos que a interface lê. Uma pasta por etapa do roteiro (`docs/ROTEIRO.md`).

| Pasta | Etapa | Entra | Sai |
|-------|-------|-------|-----|
| `sites.json`, `sites/` | 1 — Locais | Data Book da NASA, cabeçalhos PGDA 78 | lista de locais validada |
| `ephemeris/` | 1 — Efemérides (**concluída**) | `sites.json`, intervalo D8 | `data/ephemeris/` |
| `horizon/` | 2 — Horizonte | relevo LOLA (`data/raw/`) | `data/horizon/` |
| `science/` | 3 — Valor científico | mapa de sombra permanente (`data/raw/`) | distância por local |
| `export/` | 4 — Exportação | saídas das etapas 1–3 | `data/app/` |
| `tests/` | — | — | testes automáticos (pytest) |

Constantes nomeadas, com origem citada, ficam em `pipeline/config.py`. Convenções: `docs/BOAS_PRATICAS.md`.

## Ambiente

```bash
python -m venv .venv
.venv/Scripts/activate          # Windows; Linux/macOS: source .venv/bin/activate
pip install -r pipeline/requirements.txt
ruff check . && ruff format --check . && pytest
```

Se o `pip` falhar com `CERTIFICATE_VERIFY_FAILED` (rede com inspeção de TLS), instale antes o `truststore` e use `pip install --use-feature=truststore -r pipeline/requirements.txt`.

## Comandos por etapa

Rodar sempre a partir da raiz do repositório, como módulos:

```bash
python -m pipeline.ephemeris.run_ephemeris     # etapa 1
python -m pipeline.sites.verify_site_points    # conferência das coordenadas
```

Etapas 2–4: a definir.
