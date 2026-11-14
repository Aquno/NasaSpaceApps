# web/ — Interface (etapa 5)

**Status:** em andamento (ver `docs/ROTEIRO.md`). Usuário único: o planejador de missão (D26). Interface em inglês.

- **Stack:** Vite + React + TypeScript (modo `strict`), site estático, sem servidor. ESLint + Prettier. Testes com Vitest.
- **Dados:** lê `web/public/data/` (URL `${BASE_URL}data/...`), cópia de `data/app/` feita por `npm run sync-data`, executado antes do dev e do build (D10). Nunca edite a cópia. Formato: `docs/CONTRATO_DE_DADOS.md` (versão 2), fonte única.
- **Cálculo:** um único módulo de funções puras com testes (D9): `src/calc/`. Componentes só exibem.

## Como rodar

```bash
cd web
npm install
npm run dev            # sync-data + servidor de desenvolvimento
npm test               # testes (inclui a validação dos arquivos reais de data/app)
npm run lint && npm run typecheck
npm run build          # sync-data + build estático em web/dist
BASE_PATH=/NasaSpaceApps/ npm run build   # build para GitHub Pages (caminho base)
npm run report:scores  # tabela de notas/vereditos para datas de pouso (revisão)
```

## Onde fica cada coisa

| Caminho | Conteúdo |
|---|---|
| `scripts/sync-data.mjs` | copia `../data/app` para `public/data` (D10) |
| `scripts/score-table.ts` | tabela de notas por data (usa o mesmo módulo de cálculo) |
| `src/data/contract.ts` | tipos do contrato v2 (definidos uma vez) e eixo de tempo implícito |
| `src/data/validate.ts` | validação contra o contrato (erros com arquivo e campo) |
| `src/data/load.ts`, `src/data/useSites.ts` | leitura dos arquivos e estados carregando/erro/pronto |
| `src/calc/visibility.ts` | **a** regra de visibilidade (D24) |
| `src/calc/metrics.ts` | métricas da missão (horas de luz, contato, intervalos, próximo ocaso) |
| `src/calc/scores.ts`, `src/calc/evaluate.ts` | notas, veredito, melhor compromisso, ordenação (D25) |
| `src/config/scoring.ts` | pesos e limites (escolhas do time, não da NASA) |
| Telas | a fazer (passos 4–7) |

## Dependências e motivo

| Pacote | Motivo |
|---|---|
| react, react-dom | interface |
| vite, @vitejs/plugin-react | build estático e servidor de desenvolvimento |
| typescript, typescript-eslint, eslint, @eslint/js, eslint-plugin-react-hooks, globals | tipos estritos e lint |
| prettier | formatação |
| vitest | testes das funções puras e da validação dos dados reais |
| @types/node | tipos dos scripts e testes que leem arquivos |
| tsx | rodar os scripts TypeScript de relatório (`report:scores`, comparação da etapa 6) com o mesmo código do app |
