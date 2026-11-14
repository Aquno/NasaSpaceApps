# pipeline/

Pipeline Python **offline** que transforma dados da NASA nos arquivos que a interface lê. Uma pasta por etapa do roteiro (`docs/ROTEIRO.md`).

| Pasta | Etapa | Entra | Sai |
|-------|-------|-------|-----|
| `sites.json`, `sites/` | 1 — Locais | Data Book da NASA, cabeçalhos PGDA 78 | lista de locais validada |
| `ephemeris/` | 1 — Efemérides (**concluída**) | `sites.json`, intervalo D8 | `data/ephemeris/` |
| `horizon/` | 2 — Horizonte (**concluída**) | LDEM 20 m do PGDA 90 (por partes) | `data/horizon/` |
| `science/` | 3 — Valor científico (**concluída**) | shapefile de PSRs ≥ 1 km² do PGDA 90 | `data/science/` |
| `export/` | 4 — Exportação (**concluída**) | saídas das etapas 1–3 e 6 (dados) | `data/app/` |
| `validation/` | 6 — Validação (parte de dados **concluída**) | mapas de iluminação do PGDA 69 | `data/validation/` |
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
python -m pipeline.horizon.run_horizon         # etapa 2
python -m pipeline.science.run_science         # etapa 3
python -m pipeline.validation.run_reference    # etapa 6, parte de dados (referência NASA)
python -m pipeline.export.run_export           # etapa 4 (depois das etapas 1, 2, 3 e 6)
```
