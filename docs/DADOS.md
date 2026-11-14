# Fontes de dados

Cada fonte com o que fornece, endereço, formato, resolução, limites e pendências. Marque com `PENDENTE:` tudo que ainda não foi confirmado. **Não preencha números sem fonte.**

## Pendências gerais

- ✅ **Referencial** (resolvido, D14): coincidente segundo a documentação — mean Earth/polar axis do DE421 nos dois lados.
  - Horizons, manual (https://ssd.jpl.nasa.gov/horizons/manual.html): "For other bodies, Horizons uses planetodetic/geodetic IAU coordinates (or mean Earth of DE421 for the Moon)". A resposta declara `Center pole/equ : MEAN_ME (high precision)`.
  - LOLA, README do PGDA produto 78 (https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README): "south polar stereographic X/Y coords in meters, MOON_ME reference frame of ephemeris DE421".
- ✅ **Coordenadas dos locais** (resolvido, D12): ver tabela abaixo.
- ✅ **Intervalo de datas** (resolvido, D8): 2027-01-01T00:00:00Z a 2027-12-31T23:00:00Z, passo de 1 hora, 8.760 registros por local.
- ✅ **Convenção de azimute** (resolvida): Horizons mede o azimute "clockwise from north: North(0) -> East(90) -> South(180) -> West(270)" (rodapé da resposta). A etapa 2 deve usar a mesma convenção no horizonte do LOLA. No polo sul, "norte" é a direção do meridiano local rumo ao polo norte lunar.

## Locais

Pontos de **referência regionais**, não locais de pouso designados pela NASA. Latitude/longitude em graus, MOON_ME (DE421), longitude leste positiva em [-180, 180). Altitude 0 km sobre a esfera de 1737,4 km (ver limites do Horizons). Arquivo: `pipeline/sites.json`.

| id | Nome | Lat (°) | Lon (°) | Tipo de fonte | Fonte |
|----|------|---------|---------|---------------|-------|
| `shackleton-rim` | Shackleton rim | -89.7668 | -171.87 | ponto publicado (centro da região Site04) | [1] Tab. A2.1-1, p. 75 |
| `connecting-ridge` | Connecting ridge | -89.468 | -137.4 (= 222.6° E) | ponto publicado (CR1/C1) | [2] p. 26 (figura) e p. 32 (seção 7.3.3) |
| `de-gerlache-rim` | de Gerlache rim | -88.6834 | -67.9321 | ponto publicado (centro da região Site11, "de Gerlache Rim 1") | [1] Tab. A2.1-1, p. 75 |
| `malapert-massif` | Malapert massif | -85.9948 | -0.23578 | ponto publicado (centro da região Site23) | [1] Tab. A2.1-1, p. 75 |
| `haworth` | Haworth | -86.7639 | -22.777 | ponto publicado (centro da região Haworth) | [1] Tab. A2.1-1, p. 75 |

Fontes:
1. NASA **M2M-30044 Moon to Mars Lunar Surface Data Book**, Baseline, 2025-03-18 (NASA/TP-20250002845), Apêndice A2.1, "Table A2.1-1 Lunar South Pole Features", página 75 de 93. https://ntrs.nasa.gov/api/citations/20250002845/downloads/M2M-30044%20Lunar%20Surface%20Data%20Book%20Baseline_Final.pdf — o texto da tabela diz: "Coordinates have been generated from the DEM files on the PGDA website (South Pole LOLA DEM), so the center points of the original polygons are accurate to 5 to 10 meters." A mesma tabela está na ACD-50044 Rev A (2023), p. 57.
2. NASA **ACD-50044 Lunar Surface Data Book**, Initial Release, 2022-10-06. https://ntrs.nasa.gov/api/citations/20220015275/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book_100622.pdf — "Traverse between two points C1 (89.468° S, 222.6° E) and C2 (89.500° S, 222.1° E) on the Shackleton - de Gerlache connecting ridge" e "a landing at the CR1 (89.468° S, 222.6° E) location". Repetido na M2M-30044, figura 7.3.2.7-1, p. 54.

Conferência independente (`python -m pipeline.sites.verify_site_points`): o centro de cada GeoTIFF do PGDA produto 78 (`<tile>_final_adj_5mpp_surf.tif`; só o cabeçalho é lido, por requisição HTTP com `Range`), convertido de estereográfica polar sul (esfera de 1.737.400 m, origem -90°, meridiano central 0°, escala 1, declarados nas GeoKeys do arquivo) para latitude/longitude:

| Local | Recorte | Distância ao ponto publicado |
|---|---|---|
| Shackleton rim | Site04 | 0,3 m |
| Connecting ridge | Site01 | 148,9 m (CR1 não é o centro do recorte; o centro publicado do Site01 é -89.4632, -137.49) |
| de Gerlache rim | Site11 | 0,6 m |
| Malapert massif | Site23 | 0,5 m |
| Haworth | Haworth | 1,3 m |

Observações: o README do produto 78 chama o Site11 de "de Gerlache rim"; a tabela da NASA chama de "de Gerlache Rim 1" (há também "de Gerlache Rim 2", recorte SL2, que não usamos). O ponto do Connecting ridge é o CR1, mantido por decisão do time (D12).

---

## 1. JPL Horizons

- **Fornece:** azimute e elevação aparentes e diâmetro angular do Sol e da Terra vistos de um ponto na superfície lunar, hora a hora (etapa 1).
- **Endereço:** https://ssd.jpl.nasa.gov/horizons/
- **API:** endpoint `https://ssd.jpl.nasa.gov/api/horizons.api`; documentação https://ssd-api.jpl.nasa.gov/doc/horizons.html; manual https://ssd.jpl.nasa.gov/horizons/manual.html
- **Consulta:** observador `CENTER='coord@301'`, `COORD_TYPE=GEODETIC`, `SITE_COORD='E-lon,lat,alt_km'`; alvos `10` (Sol) e `399` (Terra); `QUANTITIES='4,13'`; CSV; graus; `TIME_TYPE=UT`. Detalhes em `pipeline/ephemeris/README.md`.
- **Formato:** JSON com o texto da tabela no campo `result`; resposta bruta em `data/raw/horizons/`; saída em `data/ephemeris/<id>.json`.
- **Resolução:** passo de 1 hora, de 2027-01-01 a 2027-12-31 UTC (D8). Efeméride planetária usada: DE441 (cabeçalho da resposta).
- **Referencial:** coordenadas de superfície em MEAN_ME (mean Earth do DE421), longitude leste positiva; superfície de referência: esfera de 1737,4 km (`Center radii : 1737.4, 1737.4, 1737.4 km`).
- **Convenções:** azimute a partir do norte, sentido horário; elevação acima do plano perpendicular ao zênite local; sem refração fora da Terra (`Atmos refraction: NO (AIRLESS)`); diâmetro angular em segundos de arco, convertido por nós para graus.
- **Limites:**
  - A elevação é contra um **horizonte ideal, sem relevo**. O relevo entra pela etapa 2.
  - **Altitude do observador:** 0 km sobre a esfera de 1737,4 km (D13). Na etapa 2 a altura do observador virá do DEM. O efeito em azimute e elevação do Sol e da Terra é desprezível (paralaxe da ordem de altitude/distância).
  - **Segundo bissexto:** o Horizons diz que a conversão para UTC "has not been determined for UTC times after the next July or January 1st. Therefore, the last known leap-second is used as a constant over future intervals." Se um segundo bissexto for anunciado para 2027, os tempos ficam deslocados em 1 s — irrelevante para passo horário.
  - Tempo rotulado UT pelo Horizons; tratamos como UTC (o rodapé diz "Times AFTER 1962 are in UTC").
  - A documentação não declara limite de linhas nem de taxa. O ano inteiro (8.760 linhas) foi aceito numa consulta; o código divide em blocos se houver recusa. Pausa de 2 s entre chamadas.
- **Verificações:** `data/ephemeris/REPORT.md` — todas passaram em 2026-11-14.

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

- **Fornece:** relevo de alta resolução em recortes ao redor de locais do polo sul. Na etapa 1, usado só para conferir as coordenadas (centro de cada recorte).
- **Endereço:** https://pgda.gsfc.nasa.gov/products/78 ; README: https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README
- **Formato:** GeoTIFF, "5 m/pix GeoTiffs with south polar stereographic X/Y coords in meters, MOON_ME reference frame of ephemeris DE421" (README). Arquivos `<recorte>/<recorte>_final_adj_5mpp_surf.tif` (altura em metros), mais declividade, incertezas e nuvens de pontos.
- **Projeção (lida das GeoKeys, etapa 1):** estereográfica polar, latitude de origem -90°, meridiano central 0°, escala 1, esfera a = b = 1.737.400 m; `PixelIsArea`.
- **Recortes dos nossos locais:** Site01 (Connecting ridge), Site04 (Shackleton rim), Site11 (de Gerlache rim), Site23 (Malapert massif), Haworth. Site01/04/11: 3200 × 3200 px (16 km); Site23: 4200 × 4200 px (21 km); Haworth: 5960 × 5960 px (29,8 km).
- **Tamanho:** 41 MB (Site01/04/11), 71 MB (Site23), 142 MB (Haworth) por arquivo de superfície. O servidor aceita requisições com `Range`.
- **Uso na etapa 2:** candidato para o relevo próximo e para a altura do observador (`PENDENTE:` decidir na etapa 2).

## 4. Iluminação média (PGDA produto 69)

- **Fornece:** iluminação média oficial para pontos do polo sul, usada para **validar** nosso cálculo (etapa 6).
- **Endereço:** https://pgda.gsfc.nasa.gov/products/69
- **Formato:** `PENDENTE:` confirmar.
- **Resolução / período de média:** `PENDENTE:` confirmar. O período da média oficial provavelmente difere do nosso intervalo (ano de 2027, D8); isso deve ser considerado ao comparar.
- **Uso:** preenche `nasa_avg_illumination_pct` em `sites.json` e serve de referência na validação.

## 5. Apoio visual

- **LROC Quickmap:** https://quickmap.lroc.asu.edu/ — conferência visual de locais, relevo e iluminação.
- **Moon Trek:** https://trek.nasa.gov/moon/ — contexto visual e conferência.
- Não são fonte de números exibidos na ferramenta, salvo decisão registrada em `DECISOES.md`.

---

## Histórico de downloads

| Data | Fonte | Arquivo | Tamanho | Onde está | Observação |
|------|-------|---------|---------|-----------|------------|
| 2026-11-14 | PGDA produto 78 | cabeçalhos (64 KB) de `Site01/04/11/23` e `Haworth` `_surf.tif` | 64 KB cada | `data/raw/pgda78/` | só georreferenciamento, conferência de coordenadas |
| 2026-11-14 | JPL Horizons API | tabelas de observador Sol e Terra, 5 locais, 2027 | ~640 KB cada | `data/raw/horizons/` | etapa 1 |
