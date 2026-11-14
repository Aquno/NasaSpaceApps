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
- **Veredito:** *not viable* se houver menos de 24 h de Sol contínuo a partir do pouso, ou nota de engenharia < 35; *viable* se engenharia ≥ 60 e ciência ≥ 40; senão *marginal*. Sempre com um motivo em uma frase.
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
- **Status:** enquadramento e posição na tela aguardando aprovação.

### Pendências abertas após a etapa 2
- Nenhuma pendência de dados da etapa 2.

### Pendências abertas após a etapa 1 (histórico)
Resolvidas na etapa 1: coordenadas (D12), referencial (D14), convenção de azimute (`DADOS.md`). Continua aberta para a etapa 2: formato e resolução do produto PGDA usado no horizonte (produto 90 ou 78) e a altura do observador a partir do DEM.
