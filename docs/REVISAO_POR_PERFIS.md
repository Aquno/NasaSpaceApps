# Revisão por perfis

Data: 14/11/2026. Revisão feita sobre a `main` no commit `2cb8ecf`, com o site compilado e servido localmente (`vite preview`). Quatro avaliadores trabalharam em paralelo e de forma independente, cada um com o próprio Chrome headless dirigido pelo DevTools.

**Esta é só uma revisão.** Nada foi corrigido e nenhum commit foi feito. O time decide o que entra.

## Limites desta revisão

- **A cobertura ficou incompleta.** A máquina ficou sobrecarregada (Chrome com cerca de 4 GB de RAM) e os quatro avaliadores foram interrompidos antes do fim. Cada um entregou o relatório só com o que já tinha coletado.
- **O 3D foi desenhado em software (swiftshader).** Por isso os tempos de carregamento e a primeira aparição do globo podem ser piores aqui do que numa máquina com placa de vídeo. Os achados afetados estão marcados com "a confirmar com GPU".
- **Ficou sem testar:**
  - a interface em português;
  - navegação por teclado;
  - o estado de erro (falha ao carregar `/data/`);
  - valores extremos (datas no começo e no fim de 2027, duração e atraso máximos, regras nos extremos);
  - os botões de atraso;
  - voltar, avançar e recarregar numa rota interna;
  - rotas inexistentes.

  Isso pede uma segunda rodada, mais leve, focada nesses itens.
- **As capturas e os textos extraídos estão no scratchpad da sessão, fora do repositório:** `C:\Users\User\AppData\Local\Temp\claude\9730f27ee69152a6\dc8cdb2f-0813-4191-ae29-f899bbd85787\scratchpad\` (pastas `fisico`, `designer`, `empresario`, `leigo`). Essa pasta é temporária: se alguém quiser guardar alguma evidência, precisa copiá-la para outro lugar.

Legenda de gravidade: **B** = bloqueia a demonstração · **I** = importante · **A** = acabamento.
Legenda de verificação: **V** = verificado no sistema rodando · **O** = opinião.

---

## 1. Físico especialista

Cobriu `#/mission` e `#/site/shackleton-rim` no cenário padrão (pouso em 4/3/2027, 14 dias, sem atraso, painéis abertos). Conferiu os números da tela contra `data/validation/COMPARISON.md`, `nasa_reference.json`, `data/app/sites.json`, `scoring.ts` e `docs/DECISOES.md`.

| # | Tela e elemento | O que aconteceu / o que era esperado | Tipo | Grav. | Verif. |
|---|---|---|---|---|---|
| F1 | `#/mission`, tabela "Comparison with NASA averages", linha *Shackleton inner wall* | Na Terra, a ferramenta dá 0,0% e a NASA dá 11,1% (−11,1 pts). A faixa 3×3 da NASA vai de 9,7% a 12,4%, então o motivo "variação dentro de ~90 m" não explica o 0%. Esperado: uma explicação física específica, como a hipótese do relevo de 20 m perto do mastro numa encosta de 31°. Sem ela, um jurado lê "a ferramenta erra 11 pontos". | inconsistência | I | V |
| F2 | Mesma tabela | As diferenças da Terra têm sinal sistemático (−3,6 / −3,1 / −1,7) e são maiores que as do Sol. O texto trata tudo como ruído de pixel. Faltam dois motivos: 2027 é um ano só (a libração varia no ciclo de 18,6 anos) e a D24 testa só o centro do disco da Terra. | confusão | A | O (sobre números V) |
| F3 | Legenda do 3D em `#/mission` e painel do horizonte em `#/site/...` | "Sun −0.4°" aparece ao lado de "100% sunlit". A física está certa (o horizonte local fica em −0,9°), mas a tela parece contraditória. Sugestão: mostrar "acima do relevo (−0,9°)" na legenda do 3D. | confusão | A | V |
| F4 | Detalhe do local, nota de ciência | A nota ignora a área da sombra permanente: uma PSR de 2 km² vale o mesmo que uma de 233 km². A área aparece só em "Data and limits". A D21 declara a escolha, mas a tela não mostra a área junto da nota. | sugestão | I | O |
| F5 | Detalhe do local, "Data and limits" → SOURCES | Diz que as coordenadas vêm do *Lunar Surface Data Book*. Pela D30, o ponto é o pixel mais iluminado do PGDA 69 dentro da região do Data Book. Esperado: "Região: Data Book; ponto: derivado do PGDA 69". | inconsistência | A | V |
| F6 | `#/mission`, "Earliest viable landing … (3 consecutive days)" | Não fica claro se "3 consecutive days" é a janela atual ou o total. O mesmo painel mostra 189 dias viáveis no ano para esse local. | confusão | A | V |
| F7 | `docs/DECISOES.md` (D25/D32 contra a decisão mais recente) | A tela mostra 189/222/207/229/125 e 71 dias sem local viável, o que bate com `DECISOES.md:219`. Mas `:129` e `:190` ainda trazem 182/219/200/226/116 e 77, sem aviso de que foram substituídos. | inconsistência (doc.) | A | V |
| F8 | Detalhe do local, "Signal delay: about 1.3 s each way" | O valor não tem fonte em `REFERENCIAS.md` nem em `DADOS.md` e aparece como PENDENTE na D31. Fere a regra de que todo número tem fonte. | inconsistência | A | V |
| F9 | Detalhe do local, "Score breakdown" | "Contact gaps 86%" é igual a "Earth in view 86%". A conta está certa: com uma única lacuna os dois termos coincidem, e o peso real da Terra vira 40%. Sugestão: explicar isso no ⓘ. | confusão | A | V |
| F10 | Carregamento | Com vários acessos simultâneos, a tela ficou mais de 8 s em "Loading site data…", sem indicador. Provavelmente é efeito da carga da revisão. | sugestão | A | V (sob carga) |

**Conferências que bateram:**
- Sol e Terra "ours" na tela batem com `COMPARISON.md`.
- Médias da NASA batem com `nasa_reference.json`.
- Inclinação, altura e PSR batem com `sites.json`.
- Pesos 35/25/25/15 batem com `scoring.ts`.
- Nota de ciência 88,2 bate com a fórmula da D25.
- A regra "qualquer parte do disco" segue o produto 69.

**Impressão:** a física de base é correta e honesta, e os limites estão declarados. O ponto mais frágil diante de um jurado técnico é a validação: os −11 pontos da Terra na parede interna e o viés sistemático da Terra pedem uma explicação explícita.

---

## 2. Designer de UI/UX sênior

Cobriu todas as telas em 1920 e 1366. Não testou teclado nem o estado de erro. O contraste WCAG foi medido só em `#/mission` a 1920, e nenhum texto ficou abaixo de AA.

| # | Tela e elemento | O que aconteceu / o que era esperado | Tipo | Grav. | Verif. |
|---|---|---|---|---|---|
| D1 | `#/mission` e `#/site/...`, estado "carregando" | A tela fica toda escura, só com "Loading site data…" no canto. Não há cabeçalho, marca nem indicador. Quem chega pelo link direto pode achar que quebrou. Esperado: manter o cabeçalho e mostrar um esqueleto ou indicador. | sugestão | I | V |
| D2 | `#/mission` a 1366, área do 3D | "Loading the 3D view…" fica sobreposto ao rótulo "SOUTH POLE, 3D". Esperado: o aviso centralizado dentro da área do 3D. | erro | A | V |
| D3 | Detalhe do local, panorama do horizonte | A Terra "behind the terrain" aparece como um disco azul cheio de cerca de 40 px (o Sol tem cerca de 12 px), desenhado **por cima** do relevo. Esperado: o astro escondido com tratamento diferente (contorno vazado, tracejado ou opacidade baixa) e em tamanho proporcional. | confusão | I | V |
| D4 | Detalhe do local, "Score breakdown" | Termos de engenharia e de ciência ficam na mesma lista, sem subtítulos, totais por grupo nem as cores das notas. A 1366, valor e rótulo ficam a cerca de 480 px de distância. | confusão | I | V |
| D5 | `#/mission`, campo "Landing day (UTC)" | O campo mostra "04/03/2027" (formato do sistema operacional) e ao lado aparece "Mar 4, 2027". Em inglês, 04/03 se lê como 3 de abril, o que é arriscado no pitch "slipped three weeks". | inconsistência | I | V |
| D6 | Cabeçalho | Não indica a tela atual (falta estado ativo e `aria-current`) e não tem item explícito para voltar ao painel da missão. | confusão | A | V |
| D7 | `#/mission` a 1366, lista de locais | A lista fica numa caixa com rolagem própria e o 5º cartão aparece cortado, escondendo o "Not viable". Esperado: os cinco locais visíveis ou um sinal de que há mais conteúdo. | sugestão | A | V |
| D8 | `#/`, primeira dobra | Na entrada, o globo aparece sem textura, cortado, com uma segunda esfera escura embaixo; depois a textura aparece. É a primeira impressão dos jurados. | erro | I se repetir com GPU | V (a confirmar com GPU) |
| D9 | Detalhe do local, "Mission timeline" | O eixo tem 14 marcas sem rótulo de data, e "Contact again in 47 h" não dá para localizar no eixo. | sugestão | A | O |
| D10 | Positivo | Sol e Terra usam forma além da cor (● ▲). Viável e não viável usam ✓ e ✕. Os selos do Roadmap distinguem bem os dois estados. Não há rolagem horizontal da página. O contraste passa AA no painel. | — | — | V |

**Impressão:** visual escuro coeso, IBM Plex bem usada e cores de engenharia e ciência consistentes. Os pontos fracos estão nas transições (carregando, entrada do 3D) e em leituras ambíguas (Terra escondida, data, detalhamento das notas). Teclado e estado de erro continuam sem verificação.

---

## 3. Empresário / investidor

Julgou só pela interface. Viu `#/` e `#/mission`; não abriu `#/site/...` nem `#/roadmap` e não clicou no atraso.

**Teste dos 5 segundos:**
- **O que faz:** compara locais de pouso no polo sul da Lua por luz, contato com a Terra e ciência, com dados da NASA. Isso fica claro.
- **Para quem:** não fica claro.
- **Qual a dor:** "o lançamento atrasou" só aparece depois de rolar a página ou dentro do About.

| # | Tela e elemento | O que aconteceu / o que era esperado | Tipo | Grav. | Verif. |
|---|---|---|---|---|---|
| E1 | `#/`, bloco "About" recolhido | A tabela "Today / With this tool" é o melhor argumento de venda e fica escondida. Esperado: visível na primeira ou segunda tela. | sugestão | I | V |
| E2 | `#/`, subtítulo | Diz o que a ferramenta faz, mas não para quem é nem qual a dor. A pergunta do pitch não aparece no topo. | confusão | I | O |
| E3 | `#/`, faixa de números | "87% · 11%" não diz por que importa, e "(of 352)" deixa a pergunta "por que não 365?". Esperado: cada número dizer o "e daí". | confusão | I | V (texto) |
| E4 | `#/mission`, cartão nº 1 e legenda do 3D | "100% sunlit" ao lado de "Sun −0.4°" parece contradição. | inconsistência | I | V |
| E5 | `#/mission`, 3D a 1366 | O rótulo "Earth" fica por cima de "Malapert massif". | erro | A (na tela principal) | V |
| E6 | `#/mission`, data | "04/03/2027" no campo e "Mar 4, 2027" ao lado. | inconsistência | A | V |
| E7 | `#/mission`, lista de cartões | Na data padrão, 4 dos 5 locais estão "Not viable". Passa a ideia de "a ferramenta só manda escolher Shackleton" e esconde o valor da comparação. Sugestão: uma data padrão com mais concorrência ou mais destaque ao botão de atraso. | sugestão | I (pitch) | O |
| E8 | `#/mission`, notas 94 / 88 | Não mostra a escala nem o que entra em cada nota. Um comprador pergunta "posso confiar?". | confusão | I | O |
| E9 | Rodapé e About | Positivo: fontes da NASA, "Covers / Does not cover" e o aviso "not a NASA product" ajudam na diligência. Manter. | — | — | V |
| E10 | About, escopo | 5 locais, só 2027, sem ponto livre. Serve para a demonstração; como produto, falta. | sugestão | I (negócio) | V |

**Veredito:** ainda não compraria como produto, mas investiria na equipe e no protótipo (visual, dados reais, honestidade, caso de uso claro). Para virar produto faltam:
- dizer para quem é e qual a dor na primeira tela;
- tirar a comparação de dentro do About;
- locais e datas livres;
- notas auditáveis;
- exportação;
- um cliente real.

---

## 4. Usuário leigo

Revisão **parcial**: viu só `#/` e o topo de `#/mission`, em inglês. Não houve nenhuma exceção no console nas telas visitadas.

| # | Tela e elemento | O que aconteceu / o que era esperado | Tipo | Grav. | Verif. |
|---|---|---|---|---|---|
| L1 | `#/mission`, legenda do 3D e cartões | "Sun −0.4°" convive com "100% sunlit", e o cartão nº 2 diz "Sun behind the terrain". Elevação negativa parece "Sol abaixo do horizonte". | confusão | I | V |
| L2 | `#/mission`, "Landing day (UTC)" | "04/03/2027" contra "Mar 4, 2027": dá para ler 3 de abril. | inconsistência | I | V |
| L3 | `#/`, números do fim da página | "(of 352)" sem explicação; o leigo espera 365. | confusão | I | V |
| L4 | `#/`, "87% · 11%" | Não diz qual porcentagem é de qual ponto, e o ⓘ fica longe do número. | confusão | A | V |
| L5 | `#/`, Lua da primeira tela | Disco quase preto, quase invisível. | inconsistência | A | V (a confirmar com GPU) |
| L6 | `#/mission`, coluna de cartões a 1366 | Aparece uma barra de rolagem horizontal sem nada evidente para rolar. | erro de layout | A | V |
| L7 | `#/`, bloco de números | "Loading site data…" aparece antes dos números, sem indicador. | acabamento | A | V |
| L8 | Console | `favicon.ico` dá 404 em todas as páginas, e em `#/mission` aparece o aviso do three.js "PCFSoftShadowMap has been removed". | erro | A | V |
| L9 | `#/mission`, "Mission rules" | Campos `number` sem rótulo acessível e um `BUTTON` cujo único nome é "button". | inconsistência (a11y) | A | V (só pela lista de controles da página) |
| L10 | `#/` → `#/mission` | A abertura chama Malapert de "the best site", mas no painel ele aparece por último e "Not viable", sem uma frase como "na data escolhida…". | confusão | I | O |

**Impressão:** "achei que era para escolher em qual dos 5 pontos do polo sul pousar numa data". O visual é forte e não vi nada quebrar, mas os números pedem explicação.

---

## Lista consolidada (sem repetições)

As marcas entre colchetes indicam quem apontou cada item. **★** = apareceu em mais de um avaliador.

### Erros reais reproduzidos

1. ★ **Lua e globo da abertura aparecem escuros ou sem textura na entrada** [D8, L5]. I se se repetir com GPU; precisa confirmar numa máquina com placa de vídeo.
2. **Terra escondida desenhada como disco cheio e grande por cima do relevo** no panorama do detalhe [D3]. I.
3. **Rótulo "Earth" por cima de "Malapert massif"** no 3D a 1366 [E5]. A, mas aparece na tela principal.
4. **"Loading the 3D view…" sobreposto a "SOUTH POLE, 3D"** a 1366 [D2]. A.
5. ★ **Rolagem própria na lista de cartões a 1366**, com o 5º cartão cortado e barra de rolagem visível [D7, L6]. A.
6. **`favicon.ico` 404 e aviso do three.js "PCFSoftShadowMap"** no console [L8]. A.
7. **Campos e botão sem nome acessível** em "Mission rules" [L9]. A; precisa confirmar abrindo a seção.
8. **Fonte das coordenadas atribuída só ao Data Book**, sem mencionar o PGDA 69 (D30) [F5]. A.
9. **"Signal delay ~1.3 s" sem fonte no repositório** (PENDENTE na D31) [F8]. A.
10. **D25/D32 em `DECISOES.md` com números antigos** sem aviso de que foram substituídos [F7]. A, só documentação.

### Pontos de confusão

1. ★ **"Sun −0.4°" ao lado de "100% sunlit"** [F3, E4, L1]. I. É o achado mais citado.
2. ★ **Data "04/03/2027" no campo contra "Mar 4, 2027" ao lado** [D5, E6, L2]. I; risco direto no pitch das três semanas.
3. ★ **"(of 352)" em vez de 365 e "87% · 11%" sem o "e daí"** [E3, L3, L4]. I.
4. ★ **Notas sem explicação de escala e composição; detalhamento misturado; termos duplicados (86% = 86%); ciência ignora a área da PSR** [E8, D4, F9, F4]. I.
5. ★ **Na data padrão, 4 de 5 locais "Not viable", e Malapert sai de "the best site" para último** [E7, L10]. I para o pitch.
6. **Comparação com a NASA: −11 pts na Terra da parede interna e viés sistemático da Terra sem explicação física** [F1, F2]. I diante de jurado técnico.
7. **Público e dor ausentes da primeira tela** [E2]. I.
8. **"Earliest viable … (3 consecutive days)" ambíguo** [F6]. A.
9. **Cabeçalho sem estado ativo e sem item para o painel da missão** [D6]. A.
10. **Eixo da "Mission timeline" sem datas** [D9]. A.

### Sugestões

1. ★ **Estado de carregamento com cabeçalho e indicador**, em vez de tela preta com texto solto [D1, L7, F10]. I.
2. **Trazer a tabela "Today / With this tool" para fora do About** [E1]. I.
3. **Escolher uma data padrão com mais locais concorrendo, ou dar mais destaque ao controle de atraso** [E7]. I para o pitch.
4. **Escopo para virar produto:** locais livres, outros anos, exportação de relatório [E10]. Fora do escopo do hackathon.
5. **Manter o que funciona bem:** forma além da cor, ✓/✕, contraste AA, fontes citadas, "not a NASA product" [D10, E9].

### O que falta revisar (segunda rodada sugerida, uma aba por vez)

- Português.
- Teclado e foco.
- Estado de erro.
- Botões de atraso e valores extremos.
- Regras nos extremos.
- Voltar, avançar e recarregar.
- Rotas inexistentes.
- `#/roadmap` em detalhe.
- Contraste nas outras telas.
