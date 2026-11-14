# Etapa 2 — Horizonte

**O que faz:** calcula o contorno do horizonte de 360° de cada local a partir de uma versão leve do relevo do LOLA: para cada grau de azimute, a elevação angular do terreno vista do local.

- **Entra:** coordenadas dos locais; modelo de elevação do LOLA (PGDA produto 90; opcionalmente recortes de 5 m do produto 78) baixado em `data/raw/` (fora do git).
- **Fontes:** https://pgda.gsfc.nasa.gov/products/90 · https://pgda.gsfc.nasa.gov/products/78
- **Sai:** `data/horizon/<id>.json` com 360 elevações em graus (índice = azimute em graus, mesma convenção do Horizons).
- **Pronto quando:** houver 360 valores por local, com a resolução do relevo registrada em `docs/DADOS.md`.
- **Plano B:** horizonte liso (360 zeros, `horizon_method = "flat"`), com o limite declarado no README e na interface. Decidir até o fim de sábado. O horizonte liso e o com relevo são intercambiáveis (mesmo formato).
