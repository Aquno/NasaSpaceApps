# Etapa 4 — Exportação

**Status: concluída (2026-11-14).** Relatório: [`data/app/REPORT.md`](../../data/app/REPORT.md).

**O que faz:** junta as saídas das etapas 1, 2, 3 e 6 (parte de dados) nos arquivos que a interface lê, no formato de `docs/CONTRATO_DE_DADOS.md` (versão 2, D23), valida cada arquivo e informa os tamanhos.

```bash
python -m pipeline.export.run_export
```

- **Não faz:** não calcula visibilidade nem métricas; isso fica no módulo TypeScript da interface (D9).
- **Entra:** `pipeline/sites.json`, `data/ephemeris/<id>.json`, `data/horizon/<id>.json`, `data/science/psr_distance.json`, `data/validation/nasa_reference.json`.
- **Sai:** `data/app/sites.json`, `data/app/sites/<id>.json` (versionados, D7) e `data/app/REPORT.md`.
- **Validação:** cada arquivo contra o contrato (campos, tipos, faixas, 360 valores de horizonte, colunas com `meta.count` valores, `start + (count − 1) × passo = end`) e contra as etapas anteriores (8.760 registros como no relatório da etapa 1; valores iguais às fontes dentro do arredondamento de 3 casas). Código de saída 2 se algo falhar.
- **Reprodutível:** rodar de novo no mesmo dia gera arquivos idênticos (`generated_at` guarda só a data).

| Arquivo | Responsabilidade |
|---|---|
| `contract.py` | Validador puro do contrato v2; erros dizem arquivo e campo. |
| `build.py` | Monta os documentos (puro): arredonda ângulos a 3 casas, série em colunas. |
| `run_export.py` | Lê as saídas das etapas, monta, valida, confere contra as fontes, grava e informa tamanhos. |
