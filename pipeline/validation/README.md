# Etapa 6 — Validação (parte de dados)

**Status da parte de dados: concluída (2026-11-14).** Relatório: [`data/validation/REPORT.md`](../../data/validation/REPORT.md).

**O que faz:** lê, para cada local, a iluminação solar média e a visibilidade média da Terra publicadas pela NASA (PGDA produto 69), no mapa de maior resolução que cobre os locais (85°S–90°S, 60 m/pixel). A comparação com o nosso cálculo **não** é feita aqui: ela usará o módulo de visibilidade da interface (D9).

```bash
python -m pipeline.validation.run_reference
```

- **Arquivos:** `AVGVISIB_85S_060M_201608.IMG/.LBL` (Sol) e `AVGVISIB_85S_060M_201608_EARTH.IMG/.LBL` (Terra), no nó de dados do LOLA no PDS (http://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/). Os links COG da página do produto 69 dão 404; os IMG são lidos por faixa de bytes (uma linha de 10.116 bytes por vez).
- **Escala:** valor = DN × 0,00004 + 0 (rótulo PDS); fração 0–1, exportada em %.
- **Pixel:** o pixel que contém o local (sem interpolação); mínimo e máximo 3 × 3 só como contexto.
- **Conferência do conteúdo (a página avisa que há links trocados):** o mapa do Sol tem de dar 0 em pontos dentro de PSRs da etapa 3 (deu 100%; com o eixo X espelhado daria 30%); o mapa da Terra tem de ser maior no lado próximo que no lado oculto a 85,5°S (0,515 contra 0,067). Se falhar, os valores ficam nulos.
- **Sai:** `data/validation/nasa_reference.json` e `data/validation/REPORT.md`.

| Arquivo | Responsabilidade |
|---|---|
| `pds_img.py` | Rótulo PDS3 (puro), pixel de um ponto (puro), escala (pura), leitura de linhas por faixa (I/O). |
| `run_reference.py` | Conferência do conteúdo, valores por local, JSON e relatório. |
