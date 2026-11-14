# Referências

Lista de fontes para a página de submissão. **Toda fonte externa usada no projeto (dados, artigos, bibliotecas, imagens) entra aqui.** Para cada uma: nome, endereço, para que usamos e data de acesso.

## Dados da NASA

| # | Fonte | Endereço | Uso | Acesso |
|---|-------|----------|-----|--------|
| 1 | JPL Horizons System | https://ssd.jpl.nasa.gov/horizons/ | Efemérides do Sol e da Terra | 2026-11-14 |
| 2 | JPL Horizons API — documentação | https://ssd-api.jpl.nasa.gov/doc/horizons.html | Consulta automatizada (endpoint https://ssd.jpl.nasa.gov/api/horizons.api) | 2026-11-14 |
| 2a | JPL Horizons — manual | https://ssd.jpl.nasa.gov/horizons/manual.html | Observador na superfície, referencial, convenções | 2026-11-14 |
| 3 | NASA Goddard PGDA — produto 90 (relevo polar e sombra permanente do LOLA); arquivo `LDEM_80S_20MPP_ADJ.TIF` | https://pgda.gsfc.nasa.gov/products/90 · https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LDEM_80S_20MPP_ADJ.TIF | Horizonte (etapa 2) | 2026-11-14 |
| 3a | NASA Goddard PGDA — produto 90, PSRs com área > 1 km² (`LPSR_80S_20MPP_ADJ_1km2` .SHP/.DBF/.PRJ) | https://pgda.gsfc.nasa.gov/data/LOLA_20mpp/LPSR_80S_20MPP_ADJ_1km2.SHP | Distância à sombra permanente (etapa 3) | 2026-11-14 |
| 4 | NASA Goddard PGDA — produto 78 (recortes de 5 m do LOLA) e README | https://pgda.gsfc.nasa.gov/products/78 · https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README | Conferência das coordenadas; referencial; relevo de alta resolução (opcional) | 2026-11-14 |
| 5 | NASA Goddard PGDA — produto 69 (iluminação média) | https://pgda.gsfc.nasa.gov/products/69 | Validação da iluminação calculada | 2026-11-14 |
| 5a | LOLA PDS data node — `AVGVISIB_85S_060M_201608` e `AVGVISIB_85S_060M_201608_EARTH` (.IMG/.LBL) | http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/ | Iluminação solar e visibilidade da Terra médias oficiais | 2026-11-14 |
| 5b | LOLA PDS — `DSMAP_POLAR.CAT` (projeção polar) | http://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT | Conversão pixel ↔ coordenadas | 2026-11-14 |

## Ferramentas de apoio

| # | Fonte | Endereço | Uso | Acesso |
|---|-------|----------|-----|--------|
| 6 | LROC Quickmap | https://quickmap.lroc.asu.edu/ | Conferência visual | |
| 7 | NASA Moon Trek | https://trek.nasa.gov/moon/ | Contexto e conferência visual | |

## Desafio

| # | Fonte | Endereço | Uso | Acesso |
|---|-------|----------|-----|--------|
| 8 | NASA Space Apps Challenge 2026 — "Lunar Landing Site Navigator" | https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ | Enunciado | |

## Coordenadas dos locais

| # | Fonte | Endereço | Uso | Acesso |
|---|-------|----------|-----|--------|
| 9 | NASA M2M-30044 Moon to Mars Lunar Surface Data Book, Baseline, 2025-03-18 (NASA/TP-20250002845), Tabela A2.1-1, p. 75 | https://ntrs.nasa.gov/api/citations/20250002845/downloads/M2M-30044%20Lunar%20Surface%20Data%20Book%20Baseline_Final.pdf | Coordenadas de Shackleton rim, de Gerlache rim, Malapert massif, Haworth | 2026-11-14 |
| 10 | NASA ACD-50044 Lunar Surface Data Book, Initial Release, 2022-10-06, p. 26 (figura) e p. 32 (seção 7.3.3) | https://ntrs.nasa.gov/api/citations/20220015275/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book_100622.pdf | Ponto CR1 do Connecting ridge | 2026-11-14 |
| 11 | NASA ACD-50044 Lunar Surface Data Book, Rev A, 2023 (mesma tabela, p. 57) | https://ntrs.nasa.gov/api/citations/20230007818/downloads/ACD-50044%20Lunar%20Surface%20Data%20Book%20Rev%20A.pdf | Conferência | 2026-11-14 |

## Outras fontes de referência

| # | Fonte | Endereço | Uso | Acesso |
|---|-------|----------|-----|--------|
| 12 | NASA NSSDCA — Moon Fact Sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | Período sinódico (29,53 d) nas verificações | 2026-11-14 |
| 13 | Snyder, J. P., *Map Projections — A Working Manual*, USGS Professional Paper 1395, 1987 | https://doi.org/10.3133/pp1395 | Fórmulas da estereográfica polar | — |
| 14 | OGC GeoTIFF Standard (OGC 19-008r4) | https://docs.ogc.org/is/19-008r4/19-008r4.html | Leitura do cabeçalho dos GeoTIFFs | — |
| 15 | Mazarico, E. et al., "Illumination conditions of the lunar polar regions using LOLA topography", Icarus 211 (2011) 1066–1081 | https://doi.org/10.1016/j.icarus.2010.10.030 | Numeração dos locais (citada pelo PGDA 78) | — |
| 16 | Barker, M. K. et al., "Improved LOLA Elevation Maps for South Pole Landing Sites", Planetary & Space Science 203 (2021) 105119 | https://doi.org/10.1016/j.pss.2020.105119 | Referência do PGDA produto 78 | — |
| 18 | ESRI Shapefile Technical Description (1998) | — | Leitura do shapefile de PSRs | — |
| 19 | NASA Scientific Visualization Studio — CGI Moon Kit (LRO LROC color, `lroc_color_poles_1k.jpg`) | https://svs.gsfc.nasa.gov/4720 | Textura do globo de orientação (só visual; crédito no rodapé) | 2026-11-14 |
| 17 | Adobe Photoshop TIFF Technical Note 3 (preditor de ponto flutuante, `Predictor = 3`) | — | Decodificação dos blocos do COG | — |

## Bibliotecas de software

Python (`pipeline/requirements.txt`): requests (HTTP), numpy (cálculo numérico), truststore (certificados do sistema operacional), matplotlib (figuras de conferência da etapa 2), ruff (lint), pytest (testes). Web: `PENDENTE:` (etapa 5).

## Artigos

`PENDENTE:` listar artigos citados (ex.: os artigos de referência dos produtos PGDA).
