# Etapa 4 — Exportação

**O que faz:** junta as saídas das etapas 1 a 3 nos arquivos que a interface lê.

- **Não faz:** não calcula visibilidade nem métricas; isso fica no módulo TypeScript da interface (D9).
- **Entra:** `data/ephemeris/`, `data/horizon/`, distâncias da etapa 3, metadados dos locais.
- **Sai:** `data/app/sites.json` e `data/app/sites/<id>.json`, exatamente no formato de `docs/CONTRATO_DE_DADOS.md`.
- **Pronto quando:** os arquivos forem gerados para os cinco locais, passarem na validação automática do contrato (campos, tipos, 360 valores de horizonte) e tiverem `meta.sample = false`.
