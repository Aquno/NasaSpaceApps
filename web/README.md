# web/ — Interface (etapa 5)

Reservada para a interface. **Ainda não implementada.**

- **Stack:** Vite + React + TypeScript (modo `strict`), site estático, sem servidor.
- **Lint/formatação:** ESLint + Prettier. `.prettierrc` já existe; o ESLint é configurado ao criar o projeto Vite.
- **Dados:** lê os arquivos de `data/app/` descritos em `docs/CONTRATO_DE_DADOS.md` (`sites.json` e `sites/<id>.json`). `PENDENTE:` definir como os arquivos chegam ao build (cópia para `web/public/data/` ou alias do Vite) e registrar em `docs/DECISOES.md`.
- **Dados de exemplo:** a interface começa em paralelo com o pipeline, usando arquivos de exemplo no **mesmo formato**, com `meta.sample = true`. Quando `sample` for `true`, a interface mostra um aviso visível. A interface não depende de saber se o dado é de exemplo ou real para funcionar.

## Telas

1. **Abertura** — o problema e os cinco locais.
2. **Painel de missão** — comparação dos locais (Sol, Terra, distância à sombra permanente) com controle de atraso.
3. **Detalhe do local** — panorama 360° do horizonte com as trajetórias do Sol e da Terra e linha do tempo.

## Regras

- Componentes só exibem; cálculos (visibilidade, métricas, notas) ficam em funções puras fora deles, com testes.
- Tipos do contrato definidos uma vez e reutilizados; todo arquivo lido é validado.
- Estados de carregando, vazio e erro tratados.
- Acessibilidade: contraste, teclado, nada transmitido só por cor.
- Aviso de que não é um produto da NASA.

Ver `docs/BOAS_PRATICAS.md`.
