# pipeline/

Pipeline Python **offline** que transforma dados da NASA nos arquivos que a interface lê. Uma pasta por etapa do roteiro (`docs/ROTEIRO.md`).

| Pasta | Etapa | Entra | Sai |
|-------|-------|-------|-----|
| `ephemeris/` | 1 — Efemérides | coordenadas dos locais, intervalo de datas | `data/ephemeris/` |
| `horizon/` | 2 — Horizonte | relevo LOLA (`data/raw/`) | `data/horizon/` |
| `science/` | 3 — Valor científico | mapa de sombra permanente (`data/raw/`) | distância por local |
| `export/` | 4 — Exportação | saídas das etapas 1–3 | `data/app/` |
| `tests/` | — | — | testes automáticos (pytest) |

Constantes nomeadas, com origem citada, ficam em `pipeline/config.py` (a criar na etapa 1). Convenções: `docs/BOAS_PRATICAS.md`.

## Ambiente

```bash
python -m venv .venv
.venv/Scripts/activate          # Windows; Linux/macOS: source .venv/bin/activate
pip install -r pipeline/requirements.txt
ruff check . && ruff format --check . && pytest
```

Comandos para rodar cada etapa: `PENDENTE:` serão adicionados conforme cada etapa for implementada.
