# Registro de decisões

Formato: data, decisão, motivo, consequências. Decisões novas vão no fim. Não apague decisões antigas; se mudar de ideia, registre uma nova decisão que substitui a anterior.

---

### D1 — 2026-11-14 — Desafio escolhido
- **Decisão:** participar do desafio "Lunar Landing Site Navigator" do NASA Space Apps Challenge 2026.
- **Motivo:** problema concreto (luz e comunicação no polo sul), dados públicos da NASA disponíveis, bom potencial visual.

### D2 — 2026-11-14 — Ângulo: ciência contra engenharia
- **Decisão:** a ferramenta mostra na mesma tela o lado da ciência (distância à sombra permanente) e o da engenharia (luz e contato com a Terra) e aponta o melhor compromisso.
- **Motivo:** dá uma história clara para o pitch ("Your launch just slipped three weeks. Which site still works for science and engineering?") e diferencia de um simples visualizador de efemérides.

### D3 — 2026-11-14 — MVP leve com dados reais
- **Decisão:** demonstração com dados reais da NASA, volume pequeno e visual forte. Dados de exemplo só para desenvolver a interface em paralelo, sempre marcados como exemplo.
- **Motivo:** cabe em um fim de semana sem abrir mão da credibilidade dos números.

### D4 — 2026-11-14 — IA fora dos cálculos
- **Decisão:** todos os cálculos são código fixo e verificável. Nenhuma IA faz ou escolhe cálculos.
- **Motivo:** confiabilidade e rastreabilidade de cada número exibido.

### D5 — 2026-11-14 — Lista fechada de cinco locais
- **Decisão:** Shackleton rim, Connecting ridge, de Gerlache rim, Malapert massif, Haworth.
- **Motivo:** permite pré-calcular tudo e manter os arquivos pequenos. O limite é declarado no README.
- **Pendência:** coordenadas e fontes de cada local (ver `DADOS.md`).

### D6 — 2026-11-14 — Site estático, sem servidor
- **Decisão:** pipeline Python offline gera JSON; interface Vite + React + TypeScript lê esses arquivos.
- **Motivo:** simples de publicar, sem custo, sem ponto de falha durante a apresentação.

### D7 — 2026-11-14 — O que vai para o git em `data/`
- **Decisão:** `data/raw/`, `data/ephemeris/` e `data/horizon/` ficam fora do git (grandes ou regeneráveis pelo pipeline); `data/app/` é versionado (pequeno, é o que o site publica).
- **Motivo:** repositório leve sem perder os arquivos que a demonstração precisa.
- **Revisão:** aprovada na revisão da etapa 0 (2026-11-14), junto com os campos extras de `meta` (`horizon_method`, `dem_resolution_m`, `step_minutes`, `generated_at`).

### D8 — 2026-11-14 — Intervalo de datas
- **Decisão:** efemérides de **2027-01-01 a 2027-12-31, passo de 1 hora**, em UTC. Primeiro registro `2027-01-01T00:00:00Z`, último `2027-12-31T23:00:00Z`: 8.760 registros por local (2027 não é bissexto).
- **Motivo:** um ano completo cobre todas as estações do polo sul e as variações de libração, e fica no futuro próximo de missões planejadas.
- **Consequências:** `meta.start`, `meta.end` e `meta.step_minutes = 60` fixos; o controle de atraso da interface só desloca janelas dentro desse ano.

### D9 — 2026-11-14 — Regra de visibilidade na interface
- **Decisão:** a regra de visibilidade fica na **interface**, em **um único módulo TypeScript de funções puras com testes**. O pipeline exporta apenas o contorno do horizonte e as séries do Sol e da Terra; **não calcula visibilidade nem métricas**. O número de validação da etapa 6 usa **essa mesma função**.
- **Motivo:** a regra existe em um só lugar (sem duplicação de regra de negócio); a interface pode recalcular métricas para qualquer janela de datas e atraso sem regerar dados.
- **Consequências:** a etapa 6 roda como script/teste TypeScript que importa o módulo de visibilidade e lê `data/app/`; o método de arredondamento/interpolação de azimute é decidido e testado nesse módulo.

### D10 — 2026-11-14 — Dados no site
- **Decisão:** a interface lê de **`web/public/data/`**, que é uma **cópia de `data/app/`** feita por um script (`npm run sync-data`), executado **antes do dev e do build**. Caminhos e campos seguem `docs/CONTRATO_DE_DADOS.md`, que é a **fonte única do formato**.
- **Motivo:** o pipeline continua dono de `data/app/`; o Vite serve `public/` sem configuração extra.
- **Consequências:** `web/public/data/` fica fora do git (é cópia); quem edita dados edita `data/app/` (via pipeline), nunca a cópia.

### D11 — 2026-11-14 — Página do desafio
- **Decisão:** a referência oficial do enunciado é https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/
- **Consequências:** citada em `REFERENCIAS.md` e no `README.md`.

### D12 — 2026-11-14 — Coordenadas dos locais e convenção de longitude
- **Decisão:** Shackleton rim, de Gerlache rim, Malapert massif e Haworth usam os centros de região publicados na NASA M2M-30044 Lunar Surface Data Book (2025), Tabela A2.1-1. Connecting ridge usa o ponto CR1 (ACD-50044, 2022). Os pontos são descritos como **pontos de referência regionais**, não locais de pouso designados pela NASA, e cada local registra o tipo de fonte (`published_point`, `derived_tile_center`, `unverified`).
- **Ordem seguida:** (a) edição recente do Data Book — encontrada; (b) derivação do centro do GeoTIFF do PGDA produto 78 — usada como **conferência independente** (diferença ≤ 1,3 m para os quatro centros; CR1 a 149 m do centro do Site01); (c) LROC — não foi necessário.
- **Longitude:** graus leste, intervalo [-180, 180), como publicado na tabela da NASA. Enviada ao Horizons em [0, 360).
- **Detalhes:** `docs/DADOS.md`, seção Locais.

### D13 — 2026-11-14 — Altitude do observador na etapa 1
- **Decisão:** altitude 0 km sobre a esfera de 1737,4 km usada pelo Horizons, com o limite declarado. Na etapa 2 a altura do observador virá do DEM.
- **Motivo:** nenhuma fonte publica a altitude dos pontos; o efeito em azimute/elevação do Sol e da Terra é desprezível.

### D14 — 2026-11-14 — Referencial coincidente
- **Decisão:** o referencial do Horizons e o do relevo LOLA são considerados **coincidentes segundo a documentação**: mean Earth/polar axis do DE421 nos dois lados. Pendência encerrada.
- **Fontes:** manual do Horizons ("mean Earth of DE421 for the Moon"; resposta: `Center pole/equ : MEAN_ME`) e README do PGDA produto 78 ("MOON_ME reference frame of ephemeris DE421").

### D15 — 2026-11-14 — Leitura da resposta do Horizons
- **Decisão:** diâmetro angular convertido de segundos de arco para graus; tempo "UT" do Horizons tratado como UTC; colunas de presença solar/de corpo interferente (`*`, `i`) ignoradas, pois usam o horizonte ideal (visibilidade é da interface, D9).
- **Limite registrado:** para 2027 o Horizons mantém constante o último segundo bissexto conhecido (deslocamento possível de 1 s).

### D16 — 2026-11-14 — Fonte do relevo do horizonte
- **Decisão:** PGDA produto 90, `LDEM_80S_20MPP_ADJ.TIF` (COG de 20 m, 80°S ao polo), **lido por partes** com requisições HTTP `Range` (opção a do plano; b e c não foram necessárias). Altura interpretada como metros sobre a esfera de 1737,4 km (datum declarado no arquivo, a mesma esfera do Horizons).
- **Motivo:** dado oficial de alta resolução sem baixar 2,7 GB; georreferenciamento conferido contra o produto 78 (≤ 1,2 m de diferença nas alturas dos locais).

### D17 — 2026-11-14 — Raio de busca, resolução por faixa e borda
- **Decisão:** raio de 200 km; 20 m até 5 km, 80 m até 40 km, 320 m até 200 km (visões reduzidas do COG). Quando o raio sai do DEM, a busca para naquele azimute e o trecho além é tratado como **desconhecido** (nem liso nem altura zero); a fração de azimutes cortados e as distâncias de corte ficam registradas por local.

### D18 — 2026-11-14 — Altura do observador
- **Decisão:** terreno do DEM de 20 m no local + **mastro de 2 m**. O mastro é uma **escolha do time**, não um requisito da NASA; configurável (`--mast-m`).

### D19 — 2026-11-14 — Discretização do contorno
- **Decisão:** cálculo a cada 0,1° de azimute; `horizon[i]` guarda o **máximo** dos azimutes em [i − 0,5, i + 0,5). Contorno não limitado a zero.
- **Consequência para a etapa 5:** a regra de visibilidade deve usar o azimute **arredondado** ao grau mais próximo (`round(az) mod 360`) para casar com essa convenção. Decisão final do método fica para a etapa 5 (pendência em `CONTRATO_DE_DADOS.md`).

### D20 — 2026-11-14 — Shackleton rim: ponto derivado na crista (altera a D12)
- **Problema:** o centro publicado da região Site04 (−89,7668; −171,87) fica na parede interna da cratera (inclinação 31,4°); horizonte de até 31,9°.
- **Decisão:** o local `shackleton-rim` passa a usar um **ponto derivado** na crista, tipo de fonte `derived_point`, citando a região Site04 e o Data Book (M2M-30044, Tab. A2.1-1).
- **Regra reproduzível** (`pipeline/sites/crest_point.py`, `python -m pipeline.sites.derive_crest_point`): no DEM de 20 m do PGDA 90, dentro dos limites do recorte Site04 do PGDA 78 (x −9000 a 7000 m, y −15000 a 1000 m), entre os pixels que (1) são o ponto mais alto num raio de 250 m e (2) são mais altos que o terreno no centro publicado, escolher o mais próximo do centro publicado. O raio de 250 m é escolha do time.
- **Resultado:** lat −89,780445°, lon −156,168582° (x −2690, y −6090 m), altura 1738,4 m (centro: 770,9 m), a 1919,6 m do centro publicado, inclinação local 3,6°.
- **Centro publicado mantido** como sexto local, `shackleton-inner-wall`, "Shackleton inner wall (Site04 center)", tipo `published_point`, marcado `purpose = sensitivity_demo` (mostra a sensibilidade à posição).
- **Outros quatro pontos verificados** (inclinação por diferenças centrais em um pixel de 20 m): Connecting ridge 0,7°, de Gerlache rim 1,3°, Malapert massif 4,3°, Haworth 4,5°. Nenhum alterado.

### D21 — 2026-11-14 — Valor científico: distância à sombra permanente
- **Decisão:** o valor científico de cada local é a distância (km) até a borda da PSR mais próxima com área ≥ 1 km², zero se dentro; com a área e a identificação (`gid`, `name`) dessa PSR.
- **Fonte:** PGDA produto 90, `LPSR_80S_20MPP_ADJ_1km2` (vetorial já filtrado por área > 1 km²), preferido ao mapa raster.
- **Escolhas do time, não critérios da NASA:** usar a proximidade de sombra permanente como indicador de interesse científico; o limite de 1 km².
- **Distância:** arco de grande círculo na esfera de 1737,4 km até o ponto mais próximo da borda (buscado no plano estereográfico).

### D22 — 2026-11-14 — Referência oficial de iluminação (etapa 6, parte de dados)
- **Decisão:** usar os mapas `AVGVISIB_85S_060M_201608` (Sol) e `..._EARTH` (Terra) do PGDA produto 69, 60 m/pixel, lidos por faixa de bytes do nó PDS do LOLA; valor do pixel que contém o local, em %, com mínimo/máximo 3 × 3 como contexto.
- **Conferência obrigatória do conteúdo** antes de usar (a página avisa sobre links trocados): Sol = 0 dentro de PSRs; Terra maior no lado próximo que no oculto. Se falhar, valores nulos.
- **Limites registrados:** média de 18,6 anos; "qualquer parte do disco"; altura não declarada; DEM de 60 m (ver `DADOS.md`).

### D23 — 2026-11-14 — Contrato de dados versão 2
- **Decisão:** acréscimos mínimos ao contrato para a etapa 4:
  - `sites.json`: `source_type`, `purpose` (`null` ou `"sensitivity_demo"`), `terrain_height_m`, `terrain_slope_deg`, `observer_height_m`, `psr_area_km2`, `psr_name`, `nasa_avg_earth_visibility_pct`.
  - `sites/<id>.json`: `horizon_obstacle_km`, `horizon_cut_km`; `series` **em colunas** (`sun_az`, `sun_el`, `sun_diam`, `earth_az`, `earth_el`, `earth_diam`) com o tempo **implícito** (`t_i = start + i × step_minutes`, sem campo `t`); `meta` ganha `contract_version`, `site_id`, `horizon_bands`, `terrain_height_m`, `mast_height_m`, `observer_height_m`, `count`; `generated_at` passa a ser só a data.
  - Ângulos arredondados a 3 casas decimais.
- **Motivo:** levar à interface tudo o que a decisão precisa (tipo de fonte, ponto de demonstração, referência oficial, distâncias do horizonte) com arquivos pequenos (~350 KB por local, sem chaves repetidas).
- **Consequência:** dados de exemplo da etapa 5 e os tipos TypeScript seguem a versão 2.

### D24 — 2026-11-14 — Regra de visibilidade com o disco do astro
- **Decisão:** no módulo único de visibilidade da interface (`web/src/calc/visibility.ts`, D9), o azimute do astro é arredondado ao grau (coerente com D19) e o contorno não é limitado a zero. Usa-se o diâmetro angular dos dados:
  - **alguma parte visível** se `el + diam/2 > horizon[round(az)]` — mesma convenção dos mapas oficiais da NASA ("any fraction of the disc"); é a base das **métricas principais**;
  - **disco inteiro visível** se `el − diam/2 > horizon[round(az)]` — mostrado como número secundário.
- **Simplificação declarada:** usa-se só o horizonte no azimute do centro do disco (a Terra tem ~1,9° de largura).

### D25 — 2026-11-14 — Notas, veredito e melhor compromisso (escolhas do time)
- **Nota de engenharia (0–100):** 35% fração da missão com Sol + 25% luz contínua a partir do pouso (fração da missão) + 25% fração com a Terra visível + 15% (1 − maior intervalo sem contato / duração).
- **Nota de ciência (0–100):** 100 com a sombra permanente (≥ 1 km²) a até 1 km; cai linearmente até 0 a 15 km.
- **Veredito (revisado em 2026-11-14, substitui a regra das 24 h de Sol contínuo após o pouso):** regras em `web/src/config/scoring.ts` (`DEFAULT_RULES`), ajustáveis na tela no bloco "Mission rules":
  - *not viable* se: o Sol não está visível no pouso; **ou** a maior escuridão contínua da missão é ≥ 24 h (limite de sobrevivência); **ou** a fração de horas com Sol é < 50%;
  - *marginal* se: Sol entre 50% e 70% da missão; **ou** nota de engenharia < 60 (a comunicação entra pela nota); **ou** nota de ciência < 40;
  - *viable* caso contrário.
  - O motivo cita a regra que decidiu e o valor medido (ex.: "Longest darkness 37 h exceeds the 24 h survival limit.").
  - Efeito com os pontos da D30 e a regra de inclinação da D31 (missão de 14 dias, pouso 00:00 UTC, 352 dias com dados completos; `npm run report:census`): viáveis / marginais / inviáveis — Shackleton rim 182 / 15 / 155; Connecting ridge 219 / 0 / 133; de Gerlache rim 200 / 1 / 151; Malapert massif 0 / 233 / 119; Haworth 0 / 117 / 235. Melhor compromisso por dia: Shackleton rim 159, Connecting ridge 68, de Gerlache rim 25, Malapert 16, Haworth 7, nenhum 77. Com +21 dias, 105 datas trocam o melhor compromisso de um local para outro, e em 139 datas outro local reabre antes do Shackleton rim (`npm run report:delay`). (Antes da D30, com centros de região, o Shackleton rim era o melhor em todos os 208 dias qualificados.)
- **Melhor compromisso:** entre os locais que não são *not viable*, o de maior `min(engenharia, ciência)` (o lado mais fraco decide); empate pela maior soma.
- **Missões fora do intervalo de dados** (2027) não são calculadas; a interface avisa.
- Pesos, limites, a altura de 2 m do observador e a sombra permanente como indicador científico são **escolhas do time, não requisitos da NASA**; ficam em `web/src/config/scoring.ts` e a tela mostra como cada nota é formada.

### D26 — 2026-11-14 — Usuário único: o planejador de missão
- **Decisão:** a interface tem um único usuário-alvo, o planejador de missão. Nenhum modo ou texto voltado a educadores ou ao público. A versão educacional aparece só como possível evolução futura, em uma linha (README/rodapé).
- **Altera:** `VISAO.md` (seção Usuários).

### D27 — 2026-11-14 — Hierarquia da primeira impressão
- **Decisão:** quem abre a plataforma entende, nesta ordem: (a) é sobre o polo sul da Lua, com dados reais da NASA; (b) o que a plataforma acrescenta às ferramentas existentes.
- **Como:** comparação curta "Today / With this tool" na abertura e acessível no topo do painel: um cenário por vez → vários lado a lado; dados brutos → veredito com motivo; três interfaces → uma tela; só engenharia → ciência e engenharia; refazer tudo quando a data muda → controle de atraso. Texto factual; Quickmap, Moon Trek e JPL Horizons são citados como as fontes e ferramentas de análise detalhada, sem diminuí-los.

### D28 — 2026-11-14 — Visualização 3D do polo sul
- **Decisão:** novo passo da etapa 5, depois do painel de missão e antes do detalhe do local: modelo 3D do terreno a partir do relevo do LOLA já em cache (mapa de alturas pequeno exportado pelo pipeline; formato a aprovar e a registrar no contrato), seis locais clicáveis, luz na direção real do Sol no instante escolhido (sombras mudam com data e atraso), direção da Terra indicada, exagero vertical configurável e declarado, aviso de que o modelo é visualização e os números vêm do cálculo com o contorno do horizonte.
- **Tecnologia:** three.js (motivo a registrar no `web/README.md`).
- **Plano B:** se em 90 minutos de trabalho não estiver estável, mapa 2D sombreado do mesmo relevo.
- **Status (2026-11-14): implementado** no painel, no lugar do mapa 2D (que continua como plano B automático se o WebGL falhar, e por um botão "Show 2D map").
  - Malha 512 × 512 do `terrain.bin` (v3, D29), ±150 km, ≈ 586 m/pixel, com **curvatura** (cada vértice rebaixado em R(1 − cos(s/R)), s = arco até o polo, sujeito ao exagero).
  - **Exagero vertical** de 1× a 10× (padrão 3×), declarado na tela; a **tangente da elevação da luz é multiplicada pelo mesmo fator**, de modo que a sombra cai no mesmo lugar em 1× e 3× (teste automático em `web/src/calc/scene3d.test.ts`).
  - **Luz:** direção real do Sol vista do local selecionado (ou do melhor compromisso) no instante do pouso com atraso, convertida para o referencial do polo; seta da Terra. Sombras com mapa de sombras de 2048 px (≈ 160 m por texel).
  - **Enquadramento:** do lado da Terra (+y), câmera a ~60°, mirando o meio da faixa dos locais; arrastar gira, roda dá zoom, teclado (setas, +/−, R) e "Reset view".
  - **Aviso na tela:** "visual only" — os números vêm do cálculo com o contorno do horizonte, não das sombras.
  - **Limite:** o painel é largo e baixo (para os cinco cartões caberem sem rolagem em 1920 × 1080), então o terreno visto do lado da Terra ocupa cerca de um terço da largura.
  - three.js é carregado sob demanda (chunk separado de ~140 kB gzip).

### D29 — 2026-11-14 — Contrato v3: mapa de alturas para as vistas de mapa
- **Decisão:** o pipeline exporta `data/app/terrain.bin` (512 × 512, int16 little-endian, metros sobre a esfera de 1737,4 km, linha 0 ao norte) e `terrain.json` (descritor), cobrindo ±150 km em torno do polo (≈ 586 m/pixel), a partir da visão de 320 m do LDEM (`python -m pipeline.export.terrain`). Todos os arquivos passam a `contract_version = 3`.
- **Uso:** só visualização (mapa 2D sombreado provisório no painel; vista 3D, D28). Nenhum número exibido vem dele.
- **Tamanho:** 512 KB.

### D30 — 2026-11-14 — Comparação justa: mesma regra de ponto para as cinco regiões (altera D12 e D20)
- **Problema:** só o Shackleton rim tinha ponto escolhido (na crista, D20); os demais eram centros de região ou o CR1, o que enviesava o ranking.
- **Decisão:** em **cada uma das cinco regiões**, dentro do recorte da NASA (produto 78: Site04, Site01, Site11, Site23, Haworth), o ponto de referência é o **pixel de maior iluminação solar média** do mapa oficial (produto 69, `AVGVISIB_85S_060M_201608`, 60 m — a maior resolução que cobre todas as regiões); desempate pelo mais próximo do **centro publicado** (M2M-30044, Tab. A2.1-1, p. 75 — inclusive o Site01 para o Connecting ridge, no lugar do CR1). Tipo de fonte: `derived_point` para todos. `pipeline/sites.json` guarda o centro publicado, a distância até ele e o valor oficial de iluminação no ponto.
- **Regra reproduzível:** `python -m pipeline.sites.derive_illumination_points --write` (`pipeline/sites/illumination_point.py`, testada). Nenhum empate ocorreu (1 pixel com o máximo em cada região).
- **Demonstração:** a parede interna do Shackleton (centro publicado do Site04) continua como sexto local, `purpose = sensitivity_demo`.
- **Substitui:** o ponto na crista da D20 (a regra da crista fica no código só para medir inclinações) e as coordenadas da D12 para os cinco locais.
- **Inclinações nos pontos novos** (DEM de 20 m): todas baixas (1,6° a 7,4°); nenhuma correção necessária.
- **Resultado:**

| Local | Lat | Lon | Tipo | Altura (m) | Inclinação | Dist. ao centro publicado | Dist. à PSR (área) | Iluminação NASA | Terra NASA |
|---|---|---|---|---|---|---|---|---|---|
| Shackleton rim (Site04) | −89,686429 | −162,937143 | derivado (D30) | 1729,3 | 1,6° | 2,75 km | 2,657 km (1,96 km²) | 87,06% | 53,75% |
| Connecting ridge (Site01) | −89,474851 | −137,443138 | derivado (D30) | 1947,5 | 3,4° | 0,35 km | 5,827 km (1,96 km²) | 88,44% | 58,08% |
| de Gerlache rim (Site11) | −88,664627 | −68,395645 | derivado (D30) | 1815,2 | 1,6° | 0,66 km | 6,873 km (3,49 km²) | 82,69% | 61,42% |
| Malapert massif (Site23) | −86,001142 | 2,055017 | derivado (D30) | 5156,7 | 7,4° | 4,86 km | 10,202 km (1,37 km²) | 81,89% | 58,70% |
| Haworth | −86,368514 | −23,276449 | derivado (D30) | 2836,2 | 3,8° | 12,04 km | 9,402 km (3,63 km²) | 70,49% | 60,10% |
| Shackleton inner wall (demonstração) | −89,7668 | −171,87 | publicado (centro do Site04) | 770,9 | 31,4° | 0 | 0,780 km (233,4 km²) | 10,96% | 11,07% |

- **Observação:** como o ponto é o pixel mais iluminado de 60 m, os vizinhos 3 × 3 chegam a ter só 20–52% (ver `data/validation/REPORT.md`): a iluminação varia muito em poucas dezenas de metros.

### D31 — 2026-11-14 — Inclinação, próxima janela viável e textos de escopo (ajustes de mentores)
- **Inclinação:** nova regra em `MissionRules` (`maxSlopeDeg`, padrão **10°**, escolha do time, não requisito da NASA; ajustável em "Mission rules"): inclinação do terreno no local (DEM de 20 m) acima do limite **rebaixa o veredito em um nível** (viable → marginal → not viable), com motivo "Terrain slope X° exceeds the Y° limit". A inclinação aparece no cartão.
- **Próxima janela viável:** `web/src/calc/nextViable.ts` procura, dia a dia (mesmo horário do pouso), a próxima data de pouso viável com as regras atuais e o tamanho da janela de dias viáveis consecutivos; o cartão mostra "Next viable landing: …" quando o veredito não é viável, e o painel mostra "Earliest viable site after the slip".
- **Comunicação:** onde a Terra não está visível no pouso, o cartão mostra "No direct link: relay satellite required". `PENDENTE:` (detalhe do local) nota de que o sinal leva cerca de 1,3 s em cada sentido e de que a ferramenta avalia só a linha direta, não redes de retransmissão.
- **Escopo:** bloco "What this tool covers" (cobre: luz solar, linha direta com a Terra, inclinação, proximidade de sombra permanente; não cobre: trajetória e combustível, ambiente térmico, obstáculos no solo, redes de retransmissão; ferramenta de planejamento, usada na Terra antes do lançamento) na abertura e no diálogo "What this adds · scope".
- **Texto da abertura** atualizado; nenhuma parte do cálculo é descrita como inteligência artificial ("decision rules", "scoring").

### D32 — 2026-11-14 — Viabilidade separada do valor científico (revisa a D25)
- **Decisão:** o veredito (viable / marginal / not viable) depende **só das regras de engenharia**: Sol no pouso, maior escuridão contínua, fração de horas com Sol, inclinação (D31) e a nota de engenharia (que inclui a comunicação). A **nota de ciência não reprova nem rebaixa** um local; entra no ranking e no melhor compromisso (max min(engenharia, ciência)).
- **Filtro opcional** em "Mission rules": "Minimum science score" (padrão 40), **desligado por padrão**; quando ligado, só tira do melhor compromisso os locais abaixo do mínimo — nunca muda o veredito.
- **Efeito** (missão de 14 dias, 352 dias de pouso com dados completos; `npm run report:census`): viáveis / marginais / inviáveis — Shackleton rim 182 / 15 / 155; Connecting ridge 219 / 0 / 133; de Gerlache rim 200 / 1 / 151; **Malapert massif 226 / 7 / 119**; **Haworth 116 / 1 / 235**; nenhum local viável em 77 dias. Melhor compromisso por dia: Shackleton rim 159, Connecting ridge 68, de Gerlache rim 25, Malapert 16, Haworth 7, nenhum 77 (inalterado, pois locais marginais já eram elegíveis). Com +21 dias, 105 datas trocam o melhor compromisso de um local para outro.

### D33 — 2026-11-14 — Cenário padrão da demonstração
- **Decisão:** ao abrir o painel: pouso planejado **2027-03-04**, missão de **14 dias**, atraso **0**; o botão "Slip launch 21 days" leva o pouso a **2027-03-25**.
- **Por quê:** é o caso mais claro do relatório de atraso (`npm run report:delay`), e continua valendo depois da D32: Shackleton rim viável e melhor compromisso (eng 94 / sci 88) → depois do atraso, not viable ("Dark at landing"), e o de Gerlache rim passa a melhor compromisso (viável, eng 80 / sci 58).

### D34 — 2026-11-14 — Limite declarado: melhor caso por região
- Cada ponto é o pixel de 60 m mais iluminado da sua região no mapa oficial (D30); os pixels vizinhos chegam a ter bem menos luz. Os resultados representam o **melhor caso de cada região, não uma área de pouso**. Declarado no bloco "What this tool covers", no README, em `DADOS.md` e (a fazer) em "Data and limits" do detalhe do local.
- **Número de destaque no painel:** dias de pouso de 2027 em que cada local é viável e dias em que nenhum local serve, para a duração e as regras atuais (`web/src/calc/census.ts`, mesmo código do relatório).

### D35 — 2026-11-14 — Direção visual revisada: limpa, calma e espaçosa (substitui "sala de controle de missão")
- **Decisão:** interface com poucas coisas por tela, muito respiro e uma mensagem de cada vez. Referência de espírito (só clareza e respiro; nada de layout, textos, cores ou componentes copiados): projeto vencedor de 2025, PureFlow (https://larasdiniz.github.io/PureFlow-2025/src/public/html/home/home.html).
- **Princípios, em todas as telas:**
  - Um foco por tela. No painel de missão, o foco é a vista 3D com os cartões ao lado; o resto fica recolhido ou em outra página.
  - Espaço em branco generoso, a partir de uma escala única de espaçamento; separar por espaço, não por bordas e caixas; molduras mínimas.
  - Hierarquia em três níveis: título; número ou veredito principal; texto de apoio discreto.
  - Menos texto: frases curtas, rótulos de uma ou duas palavras; detalhes técnicos só ao expandir ou no detalhe do local.
  - Cor com parcimônia: fundo escuro neutro, texto claro; as três cores funcionais (Sol, Terra, ciência) só onde carregam significado.
  - Tipografia maior e arejada; caixa alta espaçada só em rótulos pequenos.
  - Cartões simples, sem contornos pesados; o melhor compromisso se destaca por tamanho e posição, não por moldura.
  - Poucos indicadores grandes com legenda curta no lugar de frases longas com vários números.
  - Movimento suave e discreto.
  - Abertura: título, uma frase, o globo da Lua e um botão; abaixo, três blocos curtos do que a ferramenta faz e poucos números de destaque reais, vindos dos dados.
- **Mantém:** paleta funcional (Sol âmbar, Terra azul-céu, ciência lilás), contraste AA, vereditos com ícone e texto (nunca só cor), tipografia IBM Plex.
- **Status:** aplicada no painel de missão junto com a D39 (2026-11-14); a abertura é refeita na D40.

### D36 — 2026-11-14 — Hora do pouso: a data é o dia do pouso
- **Problema:** a data virava pouso às 00:00 UTC, e locais eram reprovados ("Dark at landing") por uma hora arbitrária.
- **Decisão:** a data escolhida é o **dia do pouso** (UTC). As 24 horas do dia são avaliadas em ordem e usa-se a **primeira hora que atende às regras de pouso** (veredito diferente de *not viable*); se nenhuma atender, o local é *not viable* naquele dia (mostra-se o motivo da avaliação às 00:00). A hora escolhida aparece no cartão e no relatório (`web/src/calc/evaluate.ts`, testado).
- **Efeito** (missão de 14 dias, 352 dias; `npm run report:census`): viáveis / marginais / inviáveis — Shackleton rim 189 / 15 / 148; Connecting ridge 222 / 0 / 130; de Gerlache rim 207 / 3 / 142; Malapert massif 229 / 9 / 114; Haworth 125 / 2 / 225; nenhum local viável em 71 dias. Melhor compromisso por dia: Shackleton rim 166, Connecting ridge 65, de Gerlache 28, Malapert 15, Haworth 8, nenhum 70. Com +21 dias, **110** datas trocam o melhor compromisso de um local para outro.
- **Cenário padrão (D33) mantido:** 04/03 Shackleton rim viável e melhor compromisso → 25/03 Shackleton not viable ("Dark at landing" em todas as horas) e de Gerlache rim melhor compromisso (viável, eng 80 / sci 58). O caso mais "claro" do relatório passou a ser 03/03 → 24/03 (mesma troca), mas a diferença é de um dia; o padrão não precisou mudar.

### D37 — 2026-11-14 — Uma linha de comunicação por local
- **Decisão:** o cartão mostra uma única linha: "Direct link X% of mission · longest gap Y (relay needed during gaps)"; sem intervalos, só "Direct link X% of mission". O alerta "relay satellite required" aparece **só** quando a cobertura direta fica abaixo de um limite em "Mission rules" (`lowLinkBelowEarthFraction`, padrão **50%** da missão, escolha do time). Não altera o veredito. Substitui o texto "No direct link: relay satellite required" baseado só no instante do pouso, que parecia contradizer "Earth in view 86%".
- Código: `web/src/calc/communication.ts` (testado).

### D38 — 2026-11-14 — Internacionalização sem biblioteca externa
- **Decisão:** inglês (padrão) e português do Brasil, com seletor no cabeçalho e na abertura; a escolha fica salva no navegador (`localStorage`, melhor esforço) e pode ser forçada por `?lang=pt-BR` na URL.
- **Como:** núcleo próprio e pequeno (`web/src/i18n/`): dicionários tipados (`en.ts` define as chaves; `ptBR.ts` precisa ter as mesmas, verificado pelo TypeScript e por teste que compara os marcadores), marcadores com tipo (`{n:pct}`, `{h:hours}`, `{km:km1}`, `{date:date}`, `{t:datetime}`, `{would:verdict}`…) formatados com a API `Intl` do navegador (vírgula decimal, datas, porcentagens). Sem biblioteca: o caso é pequeno e o `Intl` resolve números e datas.
- **Vereditos:** o módulo de cálculo devolve o motivo como **chave + parâmetros** (`{ key: 'reason.survivalDarkness', params: { h: 30, limit: 24 } }`), nunca frase pronta; a interface traduz. Os relatórios em linha de comando usam o dicionário em inglês.
- **Não traduzidos:** nomes próprios dos locais e das fontes (JPL Horizons, LRO LOLA, PGDA, Lunar Surface Data Book).
- **Regra daqui em diante:** nenhum texto de interface fixo no código; todo texto novo entra nos dois dicionários. As mensagens técnicas do validador de dados (arquivo e campo) ficam em inglês, dentro de um título traduzido.

### D39 — 2026-11-14 — Painel em camadas e 3D mais legível

- **Contexto:** o painel mostrava tudo ao mesmo tempo (mapa, painel lateral de fatos, dispersão, censo, cinco cartões completos); em 1920 × 1080 era preciso rolar e o 3D ficava pequeno.
- **Decisão:** primeira tela sem rolagem: controles no topo, 3D à esquerda (cerca de 60% da largura), cinco cartões compactos empilhados à direita (posição, nome, ícone do veredito, duas notas, motivo em uma linha). O cartão selecionado (ou o melhor compromisso, se nenhum foi escolhido) abre a segunda camada: hora do pouso, próxima janela viável, linha do link direto, porcentagens, inclinação, "How the scores are built" e botão de detalhes. O melhor compromisso se destaca por tamanho e posição. Censo (números grandes com legenda), dispersão, faixas de 2027 e regras da missão ficam em seções recolhíveis abaixo, fechadas por padrão. Saem o painel lateral de fatos (vai para o detalhe do local) e o botão "Start" (o nome do produto no cabeçalho leva à abertura).
- **3D:** tom de regolito com sombreamento de cavidade (relevo comparado com a média de uma janela de cerca de 7 km; crateras mais escuras, bordas mais claras); enquadramento inicial que mostra os cinco locais e preenche a área; marcadores distintos (melhor compromisso maior, selecionado em âmbar, ponto de demonstração vazado); rótulos sem sobreposição e dentro da área, com linhas de chamada, que também evitam cobrir outros marcadores; o rótulo do ponto de demonstração só aparece ao passar o mouse, ao focar ou ao selecionar.
- **Globo de orientação:** Lua inteira com a calota do polo sul (cerca de 85° S ao polo) destacada e "You are here", no canto do 3D; o mesmo globo maior na abertura. Textura: NASA SVS CGI Moon Kit, versão de baixa resolução (1024 × 512); se falhar, esfera cinza. Feito em cerca de 15 minutos (limite de 40).
- **Status:** aplicada (2026-11-14). Tudo isso é apresentação; nenhum número vem da imagem.

### D40 — 2026-11-14 — Abertura refeita e estilo de vidro

- **Contexto:** a abertura era um bloco de texto com tabela e seletor sem estilo; quem assiste precisa entender em poucos segundos o que o projeto faz.
- **Decisão:** primeira tela com a altura da janela: céu escuro com campo de estrelas discreto (desenhado uma vez, semente fixa, densidade baixa) e o globo da Lua girando devagar, iluminado de lado, com a calota do polo sul destacada por um brilho discreto; rótulo, nome, uma frase do que a ferramenta faz, a pergunta do atraso, botão "Open mission panel" e link "How it works". Seletor de idioma em alternância EN / PT (também no painel). Segunda seção: frase do problema (o texto antigo da abertura), três cartões de vidro e uma faixa de quatro números calculados no navegador pelo módulo de cálculo com as regras padrão (pontos avaliados, horas de dados por local, dias de 2027 sem nenhum local, datas em que +21 dias troca o melhor local — este último pela nova função `delayChangeDays`, que reproduz o total do relatório de atraso: 194 de 331). Terceira seção: "What this adds", "What this tool covers" e "Data sources", fechados por padrão; rodapé com o aviso de projeto independente.
- **three.js sob demanda:** o globo carrega à parte; enquanto carrega, ou se o WebGL falhar, aparece uma imagem estática (a textura NASA SVS num círculo sombreado).
- **Vidro:** fundo `rgb(13 17 23 / 0.82)` com desfoque, borda clara de 12% de opacidade, cantos de 16 px e sombra suave; sem suporte a desfoque, fundo sólido. Contraste calculado (WCAG) no pior caso, com branco puro atrás do vidro (fundo efetivo `rgb(57 60 65)`): texto 9,42:1; texto secundário 4,96:1; âmbar 5,32:1; azul 4,80:1; lilás 5,14:1. Sobre o fundo escuro da página: texto 16,1:1; secundário 8,48:1. Botão principal (texto escuro sobre claro): 16,1:1. O painel de missão usa a mesma borda fina e sombra nos cartões e seções.
- **Movimento:** rotação do globo (uma volta em cerca de 70 s), cintilação lenta de parte das estrelas, entrada suave ao carregar e ao rolar; com movimento reduzido no sistema, tudo fica estático.
- **Capturas:** `npm run screenshots` (Chrome sem janela pelo protocolo DevTools, sem dependência nova) gera as telas em `web/docs/screenshots/`.
- **Status:** aplicada (2026-11-14).

### D41 — 2026-11-14 — Número do atraso na abertura e céu no painel

- **Número do atraso:** a abertura mostra só as datas em que o atraso de 21 dias leva o melhor local para **outro local** (110), com a legenda "dates where a 21-day slip moves the best site to a different one". O total com trocas para ou de "nenhum local" (194 de 331) fica só no relatório (`npm run report:delay`). `delayChangeDays` passa a devolver as duas contagens.
- **Itens 1 a 6 aprovados:** a D36 fica como regra da hora do pouso; o cenário padrão continua 04/03 → 25/03 (troca de um local para outro).
- **Céu no painel:** o mesmo campo de estrelas da abertura, parado e bem fraco (opacidade máxima das estrelas 0,10), atrás do conteúdo; cartões e seções em vidro (`rgb(21 27 35 / 0.85)`, selecionado `rgb(27 35 45 / 0.85)`, com desfoque).
- **Contraste (WCAG), pior caso:** texto direto sobre uma estrela (fundo efetivo `rgb(35 39 45)`): texto 12,76:1; secundário 6,73:1; apagado 4,73:1; âmbar 7,21:1; azul 6,50:1; lilás 6,96:1. Dentro dos cartões, pior caso (vidro selecionado sobre estrela, `rgb(29 36 46)`): apagado 4,92:1, demais acima de 6,7:1.
- **Status:** aplicada (2026-11-14).

### D42 — 2026-11-14 — Detalhe do local

- **Decisão:** página própria (`#/site/<id>`), com o panorama do horizonte de 360° como elemento principal: silhueta real do relevo (horizonte LOLA, cada grau desenhado como um degrau, coerente com a D19), linha de 0°, trajetórias do Sol e da Terra durante a missão, e os dois discos no **tamanho angular real** do instante selecionado (diâmetro da série do Horizons), esticados pela escala vertical; anéis marcam a posição, porque no panorama inteiro o Sol tem cerca de 2 px. A escala vertical é o maior inteiro que faz a faixa de elevações caber na altura do desenho e aparece na tela ("Vertical ×N"). Controle de tempo com play (uma hora da missão a cada 60 ms) e leitura do estado de cada astro (visível, parcialmente visível, atrás do relevo) com a elevação e o relevo naquela direção.
- **Abaixo:** linha do tempo da missão (faixas hora a hora de luz e de contato direto, regra "qualquer parte do disco", cursor no instante) com a contagem até o próximo ocaso e a próxima perda de contato (ou até o próximo nascer, quando o astro está atrás do relevo); veredito, notas e como são formadas; "Data and limits" recolhido (ponto, posição, relevo, sombra permanente, médias da NASA, resolução do relevo por faixa de distância, altura do mastro, fontes, limite do melhor caso por região, sinal de cerca de 1,3 s em cada sentido, só a linha direta com a Terra é avaliada).
- **Cálculo:** a missão começa na hora de pouso da D36 para o dia escolhido no painel (com o atraso). Visibilidade pelo módulo único (D9); funções puras novas em `calc/panorama.ts` com testes.
- **Status:** aplicada (2026-11-14).

### D43 — 2026-11-14 — "Small move, big change"

- **Decisão:** bloco recolhível no painel (botão "Small move, big change ↓" ao lado do 3D abre e rola até ele) com o ponto de referência da borda do Shackleton (D30) e o centro publicado da região do MDE da NASA, que fica na parede interna da cratera (`purpose = sensitivity_demo`). Mostra a distância entre os dois pontos (grande círculo, raio da esfera do mapa), os dois contornos de horizonte no mesmo panorama e na mesma escala, a trajetória do Sol durante a missão e os números lado a lado (veredito, notas, horas de Sol e de contato, maior escuridão, maior intervalo sem contato, inclinação, motivo), para o dia de pouso e as regras do painel.
- **Cálculo:** `surfaceDistanceKm` (haversine) em `calc/mapGeometry.ts`, com testes; avaliação pelo módulo único (D9). O par fica em `SMALL_MOVE_SITE_IDS` (`config/scoring.ts`).
- **Status:** aplicada (2026-11-14).

### D44 — 2026-11-14 — Tela "Roadmap"

- **Decisão:** tela própria (`#/roadmap`), com link no cabeçalho, em três colunas: "Now" (pontos do polo sul lunar, um ano de dados hora a hora, regras de decisão ajustáveis — marcados "Working today"), "In 3 months" (qualquer coordenada e avaliação da região inteira em vez do melhor pixel; vários anos de dados; cobertura de satélites retransmissores; dois pontos por região, melhor para engenharia e melhor para ciência; resumo do resultado escrito por IA a partir dos números calculados pelo código fixo) e "In 6 months" (IA para refinar o relevo com novos dados de sondas; o mesmo método em Marte e outros corpos; versão educacional). Tudo o que não existe leva o rótulo visível "Concept, not implemented". Sem números.
- **Coerência com os princípios:** a IA aparece só como conceito e nunca faz ou escolhe cálculos; o resumo escrito usaria os números do código fixo.
- **Status:** aplicada (2026-11-14).

### D45 — 2026-11-14 — Comparação da etapa 6 com as médias da NASA

- **Decisão:** para cada local, a porcentagem das horas de 2027 com alguma parte do Sol e da Terra acima do horizonte do relevo, calculada por `yearVisibility` (`calc/validation.ts`) sobre a mesma série de visibilidade do painel (D9), ao lado dos valores do PGDA produto 69 (pixel de 60 m que contém o ponto). Aparece no painel (seção recolhível "Check against NASA averages") e no relatório `npm run report:nasa` → `data/validation/COMPARISON.md`, que inclui a faixa 3 × 3 da NASA.
- **Resultado (pontos percentuais, nosso − NASA):** Sol: Shackleton rim −0,5; Connecting ridge +1,0; de Gerlache rim +1,8; Malapert massif +2,9; Haworth +4,1; parede interna do Shackleton 0,0. Terra: −3,6; −3,1; −1,7; +0,6; +3,6; −11,1.
- **Por que não se espera igualdade:** média de 18,6 anos contra um ano; MDE de 60 m contra 20/80/320 m e observador a 2 m; valor de um pixel de 60 m, que muda dezenas de pontos em cerca de 90 m (faixas 3 × 3 no relatório); horizonte consultado no grau inteiro mais próximo do centro do disco. A parede interna (inclinação de 31°) é o caso mais sensível: nosso ponto fica 2 m acima de um MDE de 20 m numa encosta, o da NASA é a média de um pixel de 60 m.
- **Nada foi ajustado** para aproximar os números.
- **Status:** aplicada (2026-11-14).

### D46 — 2026-11-14 — Publicação no GitHub Pages

- **Decisão:** fluxo do GitHub Actions (`.github/workflows/pages.yml`) que, a cada push na `main` (ou manualmente), instala, roda lint, formatação e testes, gera o build com `BASE_PATH=/<nome do repositório>/` (o `prebuild` copia `data/app` para o site) e publica em `https://aquno.github.io/NasaSpaceApps/`. Só depende de `data/app/` (versionado) e de `web/`.
- **Conferido localmente:** build com `BASE_PATH=/NasaSpaceApps/` servido nesse caminho: dados, textura e telas carregam. As rotas usam `#/`, então não há página 404 a configurar.
- **Ativação:** em Settings → Pages, "Source" = "GitHub Actions" (uma vez). O fluxo só roda depois da junção na `main`, que fica para o time decidir.
- **Status:** preparada (2026-11-14); publicação pendente da junção na `main`.

### Pendências abertas após a etapa 2
- Nenhuma pendência de dados da etapa 2.

### Pendências abertas após a etapa 1 (histórico)
Resolvidas na etapa 1: coordenadas (D12), referencial (D14), convenção de azimute (`DADOS.md`). Continua aberta para a etapa 2: formato e resolução do produto PGDA usado no horizonte (produto 90 ou 78) e a altura do observador a partir do DEM.
