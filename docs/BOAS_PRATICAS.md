# Boas práticas e convenções de código

Valem para o pipeline (Python) e para a interface (TypeScript). Resumo também em `CLAUDE.md`.

## Equilíbrio — leia primeiro

Este é um **MVP de hackathon com prazo de dois dias**. As práticas abaixo servem para manter o código **legível, correto e fácil de dividir entre cinco pessoas**, não para criar camadas e abstrações antecipadas.

- Na dúvida, prefira **a solução mais simples** que respeite responsabilidade única e funções puras.
- **Não crie classes, interfaces ou padrões de projeto sem uma necessidade concreta já presente.** Uma função num módulo bem nomeado quase sempre basta.
- Três linhas repetidas são melhores que uma abstração especulativa. A exceção é regra de negócio (ver "Sem duplicação").

---

## Idioma e documentação

- Código, nomes e comentários em **inglês**; documentos do time em **português**; `README.md` em inglês.
- Todo módulo começa com um **cabeçalho**:

  ```python
  """
  What: <one-line description>
  Roadmap stage: <N — name> (see docs/ROTEIRO.md)
  Inputs: <files / parameters, with units>
  Outputs: <files written, format, see docs/CONTRATO_DE_DADOS.md>
  NASA data source: <JPL Horizons | LOLA PGDA product NN | ...>
  """
  ```

  Em TypeScript, o mesmo conteúdo num comentário `/** ... */` no topo do arquivo.

- Toda **função pública** tem docstring com **unidades** (graus, km, UTC) e **referencial** (MOON_ME, topocêntrico, convenção de azimute).
- Comentários explicam o **porquê**, não repetem o que o código já diz.

## SOLID, aplicado de forma pragmática

| Princípio | Como aplicamos aqui |
|-----------|--------------------|
| **Responsabilidade única** | Cada módulo faz uma coisa. Buscar dados, converter, calcular e exibir ficam em lugares separados. Na interface, **componentes só exibem**; cálculos ficam em funções puras fora deles. |
| **Aberto para extensão** | Novo local: só um registro novo em `sites.json` (e os arquivos gerados pelo pipeline). Nova métrica: uma função nova registrada numa lista de métricas — sem mexer nas existentes. |
| **Substituição** | A fonte de dados é trocável: dados de exemplo e reais obedecem ao mesmo contrato (`CONTRATO_DE_DADOS.md`), e a interface não sabe qual está lendo. Horizonte liso (plano B) e horizonte com relevo também são intercambiáveis. |
| **Interfaces pequenas** | Funções recebem só o que usam (ex.: `horizon` e `az`, não o objeto do local inteiro). |
| **Inversão de dependência** | A lógica de cálculo não conhece rede nem arquivos. Quem chama entrega os dados já carregados. Acesso ao Horizons e aos arquivos de relevo fica isolado atrás de funções próprias. |

Separação esperada no pipeline (por etapa):

```
fetch_*    → fala com rede/disco, guarda cache em data/raw/
parse_*    → converte resposta bruta em estruturas tipadas
compute_*  → funções puras, sem I/O
write_*    → grava saída e valida contra o contrato
```

Não é obrigatório ter os quatro em todo módulo — é um guia de onde cada coisa mora.

## Outras práticas

- **Funções puras** para todo cálculo: sem estado global, sem efeitos colaterais.
- **Nenhum número mágico:** constantes nomeadas em um arquivo de configuração, com a origem citada (URL, documento ou raciocínio). Pesos e limites das notas ficam nessa configuração.
  - Pipeline: `pipeline/config.py` (criado na etapa 1).
  - Interface: um módulo de configuração em `web/src/` (criado na etapa 5).
- **Tipos em tudo:** type hints no Python; TypeScript em modo `strict`. Os tipos do contrato de dados são **definidos uma vez** (um módulo no pipeline, um na interface) e reutilizados.
- **Validação nas bordas:** todo arquivo lido é validado contra o contrato de dados. A mensagem de erro diz **qual arquivo e qual campo** falhou.
- **Tratamento de erro explícito:** nada de falha silenciosa nem de valor padrão inventado quando um dado falta (use `null` e trate). Na interface, os estados **carregando, vazio e erro** são tratados.
- **Testes onde o erro custa caro:** funções de visibilidade, métricas e notas (TypeScript) e conversão de coordenadas (Python) têm testes automáticos com casos simples de resultado conhecido (ex.: astro a 5° acima de um horizonte de 3° → visível). Não é preciso testar componentes visuais.
- **Sem duplicação de regra de negócio:** a regra de visibilidade existe em **um único lugar**: um módulo TypeScript de funções puras com testes, na interface (D9). O pipeline não calcula visibilidade nem métricas; a validação da etapa 6 importa esse mesmo módulo.
- **Reprodutibilidade:** o pipeline pode ser rodado de novo do zero e gera os mesmos arquivos. Respostas brutas das APIs ficam em cache em `data/raw/`.
- **Formatação e lint automáticos:**
  - Python: **ruff** (`ruff check` e `ruff format`), configurado em `pyproject.toml`.
  - Interface: **ESLint + Prettier**, configurados ao criar o projeto Vite (etapa 5); `web/.prettierrc` já existe.
- **Acessibilidade na interface:** contraste adequado, navegação por teclado, informação nunca transmitida só por cor (ex.: Sol visível = cor **e** ícone/texto).
- **Dependências mínimas:** só adicionar biblioteca quando poupar trabalho real; registrar o motivo (comentário no `requirements.txt`/`package.json` ou em `DECISOES.md`) e a referência em `REFERENCIAS.md`.

## Git

- Commits pequenos, padrão **Conventional Commits**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
  - Ex.: `feat(ephemeris): query Horizons for Shackleton rim`, `docs: update roadmap after stage 1`.
- **Um branch por etapa:** `stage-1-ephemeris`, `stage-2-horizon`, `stage-3-science`, `stage-4-export`, `stage-5-web`, `stage-6-validation`, `stage-7-delivery`.
- **Fluxo de git em toda tarefa (regra permanente, D48), sem precisar pedir:**
  1. Começar conferindo `git status` e atualizando a branch a partir do remoto (`git fetch` + `git pull --ff-only`).
  2. Trabalhar numa branch própria, criada a partir da `main` atualizada, com nome que descreva a tarefa (ex.: `polish-visual-review`).
  3. Commits pequenos em Conventional Commits e push ao fim de cada passo concluído.
  4. Antes de juntar na `main`: testes, lint e build passando (web e pipeline). Depois juntar com commit de merge (`git merge --no-ff`) e enviar a `main`.
  5. **Nunca** usar push forçado, reescrever histórico já enviado, apagar branches remotas, nem mudar a visibilidade ou as configurações do repositório sem perguntar ao time.
  6. Ao fim de cada tarefa, dizer em uma linha: branch, último commit e se a `main` foi atualizada.
- **Verificação automática:** `.github/workflows/ci.yml` roda lint, formatação, testes e build a cada push (D47). Conferir na aba Actions que passou.
- Nada de segredos nem arquivos grandes no repositório (ver `.gitignore` e `data/README.md`).

## Ao concluir uma etapa

1. Rodar **testes e lint** (`ruff check`, `ruff format --check`, `pytest`; na interface `npm run lint` e `npm run build`).
2. Atualizar `docs/ROTEIRO.md`, `docs/DADOS.md` se algo mudou, e o `README.md`.
3. Registrar decisões novas em `docs/DECISOES.md` e fontes novas em `docs/REFERENCIAS.md`.
4. Commit e merge do branch da etapa.
