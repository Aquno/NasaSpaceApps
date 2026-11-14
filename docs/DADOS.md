# Fontes de dados

Cada fonte com o que fornece, endereço, formato, resolução, limites e pendências. Marque com `PENDENTE:` tudo que ainda não foi confirmado. **Não preencha números sem fonte.**

## Pendências gerais

- `PENDENTE:` **Referencial.** Confirmar que as coordenadas enviadas ao Horizons usam o mesmo referencial dos dados de relevo (MOON_ME). Se houver diferença, documentar a conversão ou a magnitude do erro.
- `PENDENTE:` **Coordenadas dos locais.** Definir latitude/longitude dos cinco locais (Shackleton rim, Connecting ridge, de Gerlache rim, Malapert massif, Haworth), com fonte citada para cada uma, e registrar na tabela abaixo.
- `PENDENTE:` **Intervalo de datas.** Definir o ano exato (início e fim, UTC) usado nas efemérides.
- `PENDENTE:` **Convenção de azimute.** Confirmar origem e sentido do azimute no Horizons e usar a mesma no horizonte do LOLA.

## Locais

| id | Nome | Latitude (°) | Longitude (°) | Referencial | Fonte |
|----|------|--------------|---------------|-------------|-------|
| `shackleton-rim` | Shackleton rim | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| `connecting-ridge` | Connecting ridge | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| `de-gerlache-rim` | de Gerlache rim | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| `malapert-massif` | Malapert massif | PENDENTE | PENDENTE | PENDENTE | PENDENTE |
| `haworth` | Haworth | PENDENTE | PENDENTE | PENDENTE | PENDENTE |

---

## 1. JPL Horizons

- **Fornece:** azimute e elevação aparentes do Sol e da Terra vistos de um ponto na superfície lunar, hora a hora (etapa 1).
- **Endereço:** https://ssd.jpl.nasa.gov/horizons/
- **API:** https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **Formato:** resposta da API em texto/JSON; nós salvamos um arquivo por local em `data/ephemeris/` (formato a definir na etapa 1).
- **Resolução:** passo de 1 hora (escolha nossa).
- **Limites:**
  - A elevação é contra um **horizonte ideal, sem relevo**. O relevo entra pela etapa 2.
  - `PENDENTE:` limites de uso da API (tamanho de resposta, taxa de requisições).
- **Pendências:**
  - `PENDENTE:` parâmetros exatos da consulta (centro na Lua com coordenadas do local, quantidades de azimute/elevação, correções de refração — a Lua não tem atmosfera).
  - `PENDENTE:` referencial das coordenadas de superfície usado pelo Horizons vs. MOON_ME.

## 2. Relevo e sombra permanente do LOLA (PGDA produto 90)

- **Fornece:** modelo de elevação do polo sul (para o horizonte, etapa 2) e mapa de sombra permanente (para o valor científico, etapa 3).
- **Endereço:** https://pgda.gsfc.nasa.gov/products/90
- **Formato:** `PENDENTE:` confirmar (provavelmente raster georreferenciado; verificar na página).
- **Resolução:** `PENDENTE:` listar as resoluções disponíveis e qual versão leve usaremos.
- **Projeção / referencial:** `PENDENTE:` confirmar projeção (estereográfica polar?) e referencial (MOON_ME?).
- **Limites:** uma versão leve (reduzida) perde obstáculos pequenos e próximos; o erro será declarado.
- **Pendências:**
  - `PENDENTE:` escolher o arquivo exato e registrar nome, tamanho e data de download.
  - `PENDENTE:` raio de busca do horizonte (até que distância o terreno é considerado).

## 3. Recortes de 5 m do LOLA (PGDA produto 78)

- **Fornece:** relevo de alta resolução em recortes ao redor de locais do polo sul.
- **Endereço:** https://pgda.gsfc.nasa.gov/products/78
- **Formato:** `PENDENTE:` confirmar.
- **Resolução:** 5 m (segundo o título do produto; `PENDENTE:` confirmar cobertura dos cinco locais).
- **Uso:** opcional, se houver tempo — refinar o horizonte próximo. Fora do caminho crítico.

## 4. Iluminação média (PGDA produto 69)

- **Fornece:** iluminação média oficial para pontos do polo sul, usada para **validar** nosso cálculo (etapa 6).
- **Endereço:** https://pgda.gsfc.nasa.gov/products/69
- **Formato:** `PENDENTE:` confirmar.
- **Resolução / período de média:** `PENDENTE:` confirmar. O período da média oficial provavelmente difere do nosso intervalo de um ano; isso deve ser considerado ao comparar.
- **Uso:** preenche `nasa_avg_illumination_pct` em `sites.json` e serve de referência na validação.

## 5. Apoio visual

- **LROC Quickmap:** https://quickmap.lroc.asu.edu/ — conferência visual de locais, relevo e iluminação.
- **Moon Trek:** https://trek.nasa.gov/moon/ — contexto visual e conferência.
- Não são fonte de números exibidos na ferramenta, salvo decisão registrada em `DECISOES.md`.

---

## Histórico de downloads

| Data | Fonte | Arquivo | Tamanho | Onde está | Observação |
|------|-------|---------|---------|-----------|------------|
| | | | | | |
