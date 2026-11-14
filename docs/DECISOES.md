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

### Pendências abertas após a etapa 1
Resolvidas na etapa 1: coordenadas (D12), referencial (D14), convenção de azimute (`DADOS.md`). Continua aberta para a etapa 2: formato e resolução do produto PGDA usado no horizonte (produto 90 ou 78) e a altura do observador a partir do DEM.
