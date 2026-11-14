# Etapa 3 — Valor científico

**O que faz:** calcula a distância de cada local até a região de sombra permanente (PSR) mais próxima.

- **Entra:** coordenadas dos locais; mapa de sombra permanente do PGDA (produto 90) em `data/raw/`.
- **Fonte:** https://pgda.gsfc.nasa.gov/products/90
- **Sai:** `psr_distance_km` por local (km), consumido pela etapa 4.
- **Pronto quando:** houver a distância para os cinco locais, com o método de cálculo documentado no cabeçalho do módulo e o produto usado registrado em `docs/DADOS.md`.
