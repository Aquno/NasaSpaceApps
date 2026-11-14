# Roteiro

**Leia este arquivo antes de começar qualquer tarefa. Atualize-o ao terminar uma etapa.**

Legenda de status: `a fazer` · `em andamento` · `concluído` · `plano B` · `cortado`. Nas listas, `[~]` = item dispensado.

Última atualização: 2026-11-14 — etapa 3 concluída (D21).

## Pontos de controle

| Quando | O que precisa estar pronto | Status |
|--------|---------------------------|--------|
| Sábado 14/11, 18h | Etapa 1 pronta para **um** local | **cumprido** (etapa 1 pronta para os cinco locais, 14/11 à tarde) |
| Fim de sábado 14/11 | Etapa 2 pronta **ou** decisão pelo plano B (horizonte liso) | **cumprido** (etapa 2 pronta com relevo do LOLA, 14/11) |
| Domingo 15/11, meio-dia | **Congelar funcionalidades** (daí em diante só correção, validação e entrega) | a fazer |

## Etapas

### 0. Base do repositório e documentação
- Responsável:
- Status: **concluído** (2026-11-14)
- Critério de pronto:
  - [x] Estrutura de pastas criada (`docs/`, `pipeline/`, `data/`, `web/`)
  - [x] Documentação inicial (README, CLAUDE.md, docs/)
  - [x] `.gitignore` e primeiro commit
  - [x] Revisão aprovada; decisões D8–D11 registradas

### 1. Efemérides
- Responsável:
- Status: **concluído e aprovado** (2026-11-14), branch `stage-1-ephemeris` juntada à `main`
- O que é: consultar o JPL Horizons para os cinco locais, de 2027-01-01 a 2027-12-31 UTC, passo de uma hora (azimute, elevação e diâmetro angular do Sol e da Terra).
- Pasta: `pipeline/ephemeris/` → `data/ephemeris/`; locais em `pipeline/sites.json`
- Critério de pronto:
  - [x] Coordenadas dos cinco locais definidas, com fonte citada (`DADOS.md`, D12)
  - [x] Intervalo de datas definido e registrado (D8)
  - [x] Convenção de azimute do Horizons confirmada e registrada em `CONTRATO_DE_DADOS.md`
  - [x] Pendência de referencial (MOON_ME) resolvida (D14)
  - [x] Um arquivo por local em `data/ephemeris/`
  - [x] Verificações de sanidade passam: 8.760 registros por local, sem lacunas nem repetições; azimute em [0, 360); elevação em [-90, 90]; limite de elevação do Sol; período do azimute do Sol e da elevação da Terra (`data/ephemeris/REPORT.md`)
  - [~] Comparação manual de alguns pontos com a interface web do Horizons — **dispensada** pelo time na aprovação da etapa 1 (2026-11-14). A API é o mesmo sistema; os valores da consulta de teste foram conferidos contra a resposta bruta.
- Como rodar: `python -m pipeline.ephemeris.run_ephemeris` (ver `pipeline/ephemeris/README.md`).
- Ponto de controle: cumprido.

### 2. Horizonte
- Responsável:
- Status: **concluído e aprovado** (2026-11-14), branch `stage-2-horizon` juntada à `main`
- O que é: calcular o contorno de 360 graus de cada local a partir do relevo do LOLA.
- Pasta: `pipeline/horizon/` → `data/horizon/` (relatório e figuras versionados)
- Como rodar: `python -m pipeline.horizon.run_horizon` (ver `pipeline/horizon/README.md`)
- Critério de pronto:
  - [x] Produto LOLA escolhido; formato, projeção, referencial e resolução registrados em `DADOS.md` (D16, D17)
  - [x] 360 valores de elevação do terreno por local (um por grau de azimute), com distâncias do obstáculo e de corte
  - [x] Convenção de azimute igual à do Horizons: a partir do norte, sentido horário (testada)
  - [x] Altura do observador tirada do DEM (D13) + mastro de 2 m (D18)
  - [x] Sanidade: contornos dentro de [−10°, +35°], não constantes, sem direções sem dado (`data/horizon/REPORT.md`)
  - [x] Verificação visual: figuras com o contorno e a trajetória de um mês do Sol e da Terra (`data/horizon/plots/`)
  - [~] Comparação qualitativa com Quickmap/Moon Trek — **dispensada** pelo time na aprovação da etapa 2 (2026-11-14)
- **Plano B** (horizonte liso): não foi necessário.
- **Shackleton rim (resolvido, D20):** o centro publicado do Site04 ficava na parede interna (31,4°). O local passou a usar um ponto derivado na crista (inclinação 3,6°, horizonte −2,5° a 1,0°); o centro publicado virou o sexto local, `shackleton-inner-wall`, para demonstrar a sensibilidade à posição.

### 3. Valor científico
- Responsável:
- Status: **concluído** (2026-11-14), branch `stage-3-science`
- O que é: distância de cada local até a sombra permanente (≥ 1 km²) mais próxima, a partir do shapefile de PSRs do PGDA produto 90.
- Pasta: `pipeline/science/` → `data/science/` (relatório versionado)
- Como rodar: `python -m pipeline.science.run_science`
- Critério de pronto:
  - [x] Produto de sombra permanente escolhido e registrado em `DADOS.md` (`LPSR_80S_20MPP_ADJ_1km2`)
  - [x] `psr_distance_km` calculado para os seis locais, com área e identificação da PSR
  - [x] Método de distância documentado no cabeçalho do módulo e em D21
  - [x] Testes (dentro, fora, buraco, leitura de SHP/DBF sintéticos)

### 4. Exportação
- Responsável:
- Status: a fazer
- O que é: juntar etapas 1 a 3 nos arquivos que a interface lê. Exporta apenas horizonte, séries do Sol e da Terra e metadados; **não calcula visibilidade nem métricas** (D9).
- Pasta: `pipeline/export/` → `data/app/`
- Critério de pronto:
  - [ ] `data/app/sites.json` e `data/app/sites/<id>.json` gerados conforme `CONTRATO_DE_DADOS.md`
  - [ ] Validação automática do formato (campos, tipos, 360 valores de horizonte)
  - [ ] `meta.sample = false` em todos os arquivos reais

### 5. Interface
- Responsável:
- Status: a fazer
- O que é: abertura; painel de missão com comparação e controle de atraso; detalhe do local com panorama do horizonte e linha do tempo.
- Pasta: `web/`
- Começa **em paralelo**, com dados de exemplo no mesmo formato (`meta.sample = true`).
- Critério de pronto:
  - [ ] `npm run sync-data` copia `data/app/` para `web/public/data/` e roda antes do dev e do build (D10)
  - [ ] Módulo único de visibilidade/métricas em TypeScript, funções puras, com testes (D9)
  - [ ] Abertura
  - [ ] Painel de missão com comparação dos cinco locais
  - [ ] Controle de atraso (deslocar a janela de datas)
  - [ ] Detalhe do local: panorama 360° do horizonte com Sol e Terra
  - [ ] Linha do tempo de visibilidade
  - [ ] Aviso visível quando os dados são de exemplo
  - [ ] Aviso "não é produto da NASA"
  - [ ] Build estático funciona

### 6. Validação
- Responsável:
- Status: a fazer
- O que é: comparar a iluminação calculada com a média oficial da NASA (PGDA produto 69) para os mesmos pontos.
- A iluminação calculada vem **do mesmo módulo de visibilidade da interface** (D9), rodado como script/teste TypeScript sobre `data/app/`.
- Critério de pronto:
  - [ ] Tabela local × (iluminação calculada, iluminação NASA, diferença)
  - [ ] Diferenças explicadas (intervalo de datas, resolução, horizonte liso etc.)
  - [ ] Resultado registrado em `DADOS.md` e no README

### 7. Entrega
- Responsável:
- Status: a fazer
- Critério de pronto:
  - [ ] Vídeo de demonstração
  - [ ] Página de submissão em inglês
  - [ ] Lista de referências completa (`REFERENCIAS.md`)
  - [ ] README sem marcadores pendentes (capturas, link da demo)
  - [ ] Site publicado

## Registro de andamento

| Data | Etapa | O que mudou |
|------|-------|-------------|
| 2026-11-14 | 0 | Estrutura do repositório e documentação inicial |
| 2026-11-14 | 0 | Revisão aprovada (D7 e campos de `meta`); decisões D8–D11: intervalo 2027, visibilidade na interface, sync-data, página do desafio |
| 2026-11-14 | 1 | Efemérides dos cinco locais (8.760 registros cada), todas as verificações OK; coordenadas do Data Book da NASA conferidas contra os GeoTIFFs do PGDA 78; decisões D12–D15 |
| 2026-11-14 | 1 | Etapa aprovada; comparação com a interface web do Horizons dispensada; branch juntada à `main` |
| 2026-11-14 | 2 | Horizonte dos cinco locais a partir do LDEM 20 m do PGDA 90 lido por partes; sanidade OK; Malapert com 13,9% das direções cortadas pela borda do DEM; ponto do Shackleton rim em encosta (pendência); decisões D16–D19 |
| 2026-11-14 | 2 | Etapa aprovada; comparação com Quickmap/Moon Trek dispensada; D20: Shackleton rim em ponto derivado na crista, centro publicado mantido como `shackleton-inner-wall`; etapas 1 e 2 rodadas para os seis locais |
| 2026-11-14 | 3 | Distância à PSR (≥ 1 km²) dos seis locais a partir do shapefile do PGDA 90; nenhum local dentro de PSR; D21 |
