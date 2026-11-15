# CLAUDE.md — MoonCrux (Lunar site navigator)

Contexto para qualquer sessão do Claude (ou pessoa do time) que entre no projeto sem memória das conversas anteriores.

## Antes de começar qualquer tarefa

1. **Leia `docs/ROTEIRO.md`** para saber em que etapa estamos, o que está pronto e o que falta.
2. Leia o documento da área que vai mexer: `docs/ARQUITETURA.md`, `docs/DADOS.md`, `docs/CONTRATO_DE_DADOS.md`.
3. Trabalhe em **uma etapa por vez**. Não adiante funcionalidades de etapas futuras.

## Ao terminar uma etapa

- Atualize `docs/ROTEIRO.md` (status, responsável, observações, data).
- Atualize `docs/DADOS.md` se algo mudou sobre as fontes (resolução, formato, limites, pendências resolvidas).
- Atualize `README.md` (inglês) se a mudança aparece para jurados/visitantes.
- Registre em `docs/DECISOES.md` toda decisão que mude escopo, dados ou método.
- Toda fonte externa nova vai para `docs/REFERENCIAS.md`.
- **Rode testes e lint antes do commit** (ver `docs/BOAS_PRATICAS.md`).

## O projeto em poucas linhas

- **Nome:** **MoonCrux** (D55), com "Lunar site navigator" como descrição secundária. Crux é a constelação do Cruzeiro do Sul, usada para encontrar o sul. O repositório e os endereços publicados mantêm os nomes antigos.

- **Evento:** NASA Space Apps Challenge 2026, hackathon de 14 e 15 de novembro de 2026.
- **Desafio:** "Lunar Landing Site Navigator" — ferramenta intuitiva para comparar locais e datas de pouso na Lua, vendo a posição do Sol e da Terra em relação ao horizonte, para avaliar energia e janelas de comunicação direta com a Terra.
- **Problema:** no polo sul lunar o Sol e a Terra ficam rasantes ao horizonte; o relevo decide se há luz e contato. Os dados existem, mas estão espalhados em ferramentas difíceis. Quando o cronograma muda, não há como comparar alternativas rápido.
- **Ângulo:** ciência contra engenharia. Ciência quer ficar perto da sombra permanente (gelo de água); engenharia quer luz e contato com a Terra. A ferramenta mostra os dois lados e aponta o melhor compromisso.
- **Pergunta do pitch:** *"Your launch just slipped three weeks. Which site still works for science and engineering?"*
- **Forma:** MVP de demonstração, dados reais, volume pequeno, visual forte. **Site estático, sem servidor.**
- **Locais (lista fechada):** Shackleton rim, Connecting ridge, de Gerlache rim, Malapert massif, Haworth.
- **Intervalo:** 2027-01-01 a 2027-12-31 UTC, passo de 1 hora (D8).
- **Página do desafio:** https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/

Detalhes em `docs/VISAO.md`.

## Princípios (inegociáveis)

1. Todo número mostrado vem de dado real da NASA ou de cálculo sobre ele. Dados de exemplo são **sempre** marcados como exemplo (`meta.sample = true` e aviso visível na interface).
2. Os cálculos são código fixo e verificável. **Nenhuma IA faz ou escolhe cálculos.**
3. Limites declarados: resolução do relevo, lista fechada de locais, intervalo de datas.
4. Trabalho original: não copiar código de outros projetos deste desafio. Toda fonte externa vai para `docs/REFERENCIAS.md`.
5. A ferramenta apoia a decisão; **não é um produto da NASA** nem serve para planejamento real de missão.

Regra extra: **não invente fatos** sobre a Lua, coordenadas ou números. Onde faltar informação, deixe uma pendência marcada com `PENDENTE:`.

## Como os dados se unem (resumo)

Tudo vira o céu visto do local de pouso: **azimute** (direção) e **elevação** (altura acima do horizonte).

- JPL Horizons → azimute/elevação do Sol e da Terra, hora a hora, por local (horizonte ideal, sem relevo).
- Relevo LOLA (PGDA) → para cada grau de azimute, a elevação do terreno (contorno do horizonte).
- **Regra de visibilidade:** astro visível se `elevação do astro > elevação do terreno` no mesmo azimute.
- Mapa de sombra permanente (PGDA) → distância até a sombra permanente mais próxima (valor científico).

Onde cada coisa é calculada:
- **Pipeline** exporta só horizonte, séries do Sol e da Terra e metadados para `data/app/`. **Não calcula visibilidade nem métricas** (D9).
- **Interface** calcula visibilidade e métricas em **um único módulo TypeScript** de funções puras com testes. A validação da etapa 6 usa o mesmo módulo (D9).
- `npm run sync-data` copia `data/app/` → `web/public/data/` antes do dev e do build. `docs/CONTRATO_DE_DADOS.md` é a fonte única do formato (D10).

Diagrama completo em `docs/ARQUITETURA.md`.

## Etapas

| # | Etapa | Pasta |
|---|-------|-------|
| 0 | Base do repositório e documentação | raiz, `docs/` |
| 1 | Efemérides (Horizons) — **concluída** | `pipeline/ephemeris/` |
| 2 | Horizonte (LOLA) — **concluída** | `pipeline/horizon/` |
| 3 | Valor científico (sombra permanente) — **concluída** | `pipeline/science/` |
| 4 | Exportação para a interface — **concluída** | `pipeline/export/` |
| 5 | Interface | `web/` |
| 6 | Validação contra iluminação média da NASA — **concluída** (dados em `pipeline/validation/`, comparação D45) | `web/` (mesmo módulo de visibilidade) + `docs/` |
| 7 | Entrega (vídeo, página de submissão, referências) | `docs/`, `README.md` |

Status e critérios de pronto: `docs/ROTEIRO.md`.

## Estrutura

```
docs/        documentação do time (português)
pipeline/    scripts Python, uma pasta por etapa 1–4 (rodar como módulos: python -m pipeline....)
pipeline/sites.json  lista de locais com coordenadas e fontes (D12)
pipeline/config.py   constantes nomeadas com origem citada
data/raw/        downloads brutos (fora do git)
data/ephemeris/  saída da etapa 1 (fora do git, regenerável)
data/horizon/    saída da etapa 2 (fora do git, regenerável)
data/app/        arquivos que a interface lê (versionados, pequenos)
web/         interface Vite + React + TypeScript
web/public/data/ cópia de data/app (npm run sync-data, fora do git)
```

## Convenções de código e boas práticas

Versão completa, com exemplos e o equilíbrio entre rigor e prazo: **`docs/BOAS_PRATICAS.md`**. Resumo:

**Idioma e documentação**
- Código, nomes e comentários em inglês; documentos do time (`docs/`, `CLAUDE.md`) em português; `README.md` em inglês.
- **Cabeçalho de módulo:** todo módulo começa com um comentário explicando o que faz, em qual etapa do roteiro se encaixa, o que recebe, o que produz e de qual fonte da NASA dependem os dados.
- **Docstrings:** toda função pública tem docstring com **unidades** (graus, km, UTC) e **referencial** (ex.: MOON_ME, topocêntrico, convenção de azimute).
- Comentários explicam o **porquê**, não repetem o que o código diz.

**SOLID, de forma pragmática**
- Responsabilidade única: buscar dados, converter, calcular e exibir ficam em lugares separados. Na interface, componentes só exibem; cálculos ficam em funções puras fora deles.
- Aberto para extensão: novo local = novo registro em `sites.json`; nova métrica = nova função registrada numa lista.
- Substituição: dados de exemplo e reais obedecem ao mesmo contrato; horizonte liso e com relevo são intercambiáveis.
- Interfaces pequenas: funções recebem só o que usam.
- Inversão de dependência: cálculo não conhece rede nem arquivos; acesso ao Horizons e ao relevo fica isolado em funções próprias.

**Outras práticas**
- Funções puras para todo cálculo, sem estado global.
- **Nenhum número mágico:** constantes nomeadas em arquivo de configuração (`pipeline/config.py`; na interface, um módulo de config), com origem citada. Pesos e limites das notas ficam lá.
- Tipos em tudo: type hints no Python; TypeScript estrito. Tipos do contrato definidos uma vez e reutilizados.
- Validação nas bordas: todo arquivo lido é validado contra o contrato; erros dizem arquivo e campo.
- Erro explícito: nada de falha silenciosa nem valor padrão inventado. Interface trata carregando, vazio e erro.
- Testes onde o erro custa caro: visibilidade, métricas, notas, conversão de coordenadas (casos simples de resultado conhecido).
- A **regra de visibilidade existe em um único lugar**: o módulo TypeScript da interface (D9).
- Reprodutibilidade: pipeline roda do zero e gera os mesmos arquivos; respostas brutas das APIs ficam em cache (`data/raw/`).
- Lint/formatação: **ruff** no Python (`pyproject.toml`); **ESLint + Prettier** na interface.
- Acessibilidade: contraste, teclado, informação nunca só por cor.
- Dependências mínimas, com motivo registrado.
- **Ângulos** em graus nos dados; radianos só dentro de funções. **Tempo** sempre UTC ISO 8601.
- Nada de dado inventado. Dados de exemplo levam `meta.sample = true`.

**Git**
- Commits pequenos em **Conventional Commits** (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`), ex.: `feat(ephemeris): query Horizons for one site`.
- **Um branch por etapa** (ex.: `stage-1-ephemeris`); fora das etapas, uma branch por tarefa.
- **Fluxo de git em toda tarefa (regra permanente, D48), sem precisar pedir:**
  1. Começar conferindo `git status` e atualizando a branch a partir do remoto (`git fetch` + `git pull --ff-only`).
  2. Trabalhar numa branch própria, criada a partir da `main` atualizada, com nome que descreva a tarefa (ex.: `polish-visual-review`).
  3. Commits pequenos em Conventional Commits e push ao fim de cada passo concluído.
  4. Antes de juntar na `main`: testes, lint e build passando (web e pipeline). Depois juntar com commit de merge (`git merge --no-ff`) e enviar a `main`.
  5. **Nunca** usar push forçado, reescrever histórico já enviado, apagar branches remotas, nem mudar a visibilidade ou as configurações do repositório sem perguntar ao time.
  6. Ao fim de cada tarefa, dizer em uma linha: branch, último commit e se a `main` foi atualizada.
- Verificação automática a cada push: `.github/workflows/ci.yml` (D47). Repositório **público**; site publicado no Vercel (https://nasa-space-apps-tgau.vercel.app/), configurado fora do repositório (D54).
- Nada de segredos nem arquivos grandes no repositório.
- **Rodar testes e lint antes do commit.**

**Equilíbrio:** é um MVP de dois dias para cinco pessoas. Na dúvida, a solução mais simples que respeite responsabilidade única e funções puras. Não crie classes, interfaces ou padrões de projeto sem necessidade concreta já presente.

Modelo de cabeçalho Python:

```python
"""
What: <one-line description>
Roadmap stage: <N — name> (see docs/ROTEIRO.md)
Inputs: <files / parameters, with units>
Outputs: <files written, format, see docs/CONTRATO_DE_DADOS.md>
NASA data source: <JPL Horizons | LOLA PGDA product NN | ...>
"""
```

## Pontos de controle (fuso do time)

- **Sábado 14/11, 18h:** etapa 1 pronta para um local.
- **Fim de sábado 14/11:** etapa 2 pronta ou decisão pelo plano B (horizonte liso).
- **Domingo 15/11, meio-dia:** congelar funcionalidades.
