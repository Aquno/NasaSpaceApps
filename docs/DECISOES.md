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
