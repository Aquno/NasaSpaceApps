# Roteiro

**Leia este arquivo antes de começar qualquer tarefa. Atualize-o ao terminar uma etapa.**

Legenda de status: `a fazer` · `em andamento` · `concluído` · `plano B` · `cortado`

Última atualização: 2026-11-14 — etapa 0 concluída e revisada (decisões D8–D11).

## Pontos de controle

| Quando | O que precisa estar pronto | Status |
|--------|---------------------------|--------|
| Sábado 14/11, 18h | Etapa 1 pronta para **um** local | a fazer |
| Fim de sábado 14/11 | Etapa 2 pronta **ou** decisão pelo plano B (horizonte liso) | a fazer |
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
- Status: a fazer
- O que é: consultar o JPL Horizons para os cinco locais, de 2027-01-01 a 2027-12-31 UTC, passo de uma hora (azimute e elevação do Sol e da Terra).
- Pasta: `pipeline/ephemeris/` → `data/ephemeris/`
- Critério de pronto:
  - [ ] Coordenadas dos cinco locais definidas, com fonte citada (`DADOS.md`)
  - [x] Intervalo de datas definido e registrado (D8)
  - [ ] Convenção de azimute do Horizons confirmada e registrada em `CONTRATO_DE_DADOS.md`
  - [ ] Pendência de referencial (MOON_ME) resolvida ou decisão registrada
  - [ ] Um arquivo por local em `data/ephemeris/`
  - [ ] Verificações de sanidade passam (ex.: 8.760 registros, um por hora, sem lacunas; azimute em [0, 360); elevação em [-90, 90]; comparação manual de alguns pontos com a interface web do Horizons)
- Ponto de controle: um local pronto até sábado 18h.

### 2. Horizonte
- Responsável:
- Status: a fazer
- O que é: calcular o contorno de 360 graus de cada local a partir de uma versão leve do relevo do LOLA.
- Pasta: `pipeline/horizon/` → `data/horizon/`
- Critério de pronto:
  - [ ] Produto LOLA escolhido; formato, projeção, referencial e resolução registrados em `DADOS.md`
  - [ ] 360 valores de elevação do terreno por local (um por grau de azimute)
  - [ ] Convenção de azimute igual à do Horizons
  - [ ] Verificação visual de ao menos um local (ex.: comparação qualitativa com Quickmap/Moon Trek)
- **Plano B:** horizonte liso (360 zeros), com o limite declarado no README e na interface. Decidir até o fim de sábado.

### 3. Valor científico
- Responsável:
- Status: a fazer
- O que é: distância de cada local até a sombra permanente mais próxima, a partir do mapa de sombra permanente do PGDA.
- Pasta: `pipeline/science/`
- Critério de pronto:
  - [ ] Produto de sombra permanente escolhido e registrado em `DADOS.md`
  - [ ] `psr_distance_km` calculado para os cinco locais
  - [ ] Método de distância documentado no cabeçalho do módulo

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
