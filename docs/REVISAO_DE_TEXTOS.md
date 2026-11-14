# Revisão de textos da interface (D50)

Revisão de todos os textos visíveis (e dos rótulos para leitor de tela) dos dicionários `web/src/i18n/en.ts` e `ptBR.ts`, com as regras: rótulos em vez de slogans; menos legendas (explicações vão para o ícone ⓘ ou para "Data and limits"); uma ideia por texto; tom neutro e técnico nos dois idiomas; avisos obrigatórios discretos e em um só lugar por tela; na abertura, só o nome e a frase do que a ferramenta faz.

Contagens com singular e plural: marcador `{n:plural:singular|plural}` (1 → singular; 0 e demais → plural, nos dois idiomas).

Nomes próprios (locais, produtos e fontes da NASA) não são traduzidos.

## Resumo

| Ação | Textos |
|---|---:|
| mantido | 202 |
| reescrito | 54 |
| movido para dica | 6 |
| movido para Sobre | 2 |
| removido | 8 |
| novo | 7 |
| dúvida | 16 |
| **total** | **295** |

## Casos de dúvida (ficam com o texto atual até decisão)

1. `card.linkGaps` — Tirar "(relay needed during gaps)"? Você pediu esse complemento antes (D37); proposta: "Direct link 86% of mission · longest gap 47 h" com a explicação na dica.
2. `card.linkContinuous` — Termo em português: "Linha direta" soa como tradução literal; proposta: "Enlace direto" ou "Contato direto" (vale para as três variantes).
3. `intro.kicker` — Rótulo "Lunar south pole · Real NASA data" na abertura: a regra 6 permite só o nome e a frase. Manter como rótulo ou remover?
4. `intro.how` — "How it works" é navegação (rola para a seção seguinte), não frase de efeito. Manter, trocar por "Details" / "Detalhes" ou remover?
5. `intro.f1Title` — Os três cartões da abertura (títulos e frases) são descritivos. Reescrever em tom neutro ("Sun and Earth visibility" / "Hourly, at each site, against the terrain horizon"…) ou remover?
6. `check.notTuned` — "Nothing was adjusted to bring the numbers closer." é uma garantia importante, mas pode soar defensiva. Manter, mover para a dica ou remover?
7. `reason.darkAtLanding` — Encurtar para "Sun behind the terrain at landing." tira a referência à regra "(rule: Sun visible at landing)". Manter a referência?
8. `rules.explain` — Parágrafo que explica os vereditos: deixar visível dentro de "Mission rules" (já recolhido) ou mover para a dica?
9. `roadmap.lead` — "Only the first column exists." repete os rótulos "Concept, not implemented". Remover?
10. `covers.planning` — "A planning tool, used on Earth before launch…" em "Scope": manter, encurtar para "Planning tool, for use before launch." ou remover?

## Tabela completa

| Tela | Chave | Atual (EN) | Atual (PT) | Proposto (EN) | Proposto (PT) | Ação |
|---|---|---|---|---|---|---|
| Geral (estados) | `app.loading` | Loading site data… | Carregando os dados dos locais… | Loading site data… | Carregando os dados dos locais… | mantido |
| Geral (estados) | `app.dataErrorTitle` | Data error | Erro nos dados | Data error | Erro nos dados | mantido |
| Geral (estados) | `app.dataErrorIntro` | The data files do not match the data contract: | Os arquivos de dados não seguem o contrato de dados: | The data files do not match the data contract: | Os arquivos de dados não seguem o contrato de dados: | mantido |
| Geral (estados) | `app.noSites` | No sites in sites.json. | Nenhum local em sites.json. | No sites in sites.json. | Nenhum local em sites.json. | mantido |
| Geral (estados) | `app.backToDashboard` | Back to the mission dashboard | Voltar ao painel da missão | Back to the mission dashboard | Voltar ao painel da missão | mantido |
| Cabeçalho | `header.title` | Lunar Site Navigator | Lunar Site Navigator | Lunar Site Navigator | Lunar Site Navigator | mantido |
| Cabeçalho | `header.context` | Lunar south pole · real NASA data | Polo sul da Lua · dados reais da NASA | Lunar south pole · real NASA data | Polo sul da Lua · dados reais da NASA | mantido |
| Cabeçalho | `header.sample` | SAMPLE DATA | DADOS DE EXEMPLO | SAMPLE DATA | DADOS DE EXEMPLO | mantido |
| Cabeçalho | `header.whatThisAdds` | What this adds | O que a ferramenta acrescenta | About | Sobre | reescrito |
| Cabeçalho | `header.language` | Language | Idioma | Language | Idioma | mantido |
| Cabeçalho | `header.close` | Close | Fechar | Close | Fechar | mantido |
| Cabeçalho | `lang.en` | English | English | English | English | mantido |
| Cabeçalho | `lang.pt-BR` | Português (Brasil) | Português (Brasil) | Português (Brasil) | Português (Brasil) | mantido |
| Abertura | `intro.kicker` | Lunar south pole · Real NASA data | Polo sul da Lua · Dados reais da NASA | Lunar south pole · Real NASA data | Polo sul da Lua · Dados reais da NASA | dúvida (mantido até decisão) |
| Abertura | `intro.question` | Your launch just slipped three weeks. Which site still works? | Seu lançamento acabou de atrasar três semanas. Qual local ainda serve? | — | — | removido |
| Abertura | `intro.open` | Open mission panel | Abrir painel da missão | Open mission panel | Abrir painel da missão | mantido |
| Abertura | `intro.whatThisAdds` | What this adds | O que a ferramenta acrescenta | — | — | removido |
| Abertura | `intro.lead` | Compare landing sites at the Moon's south pole by sunlight, Earth contact and science value, on any date. | Compare locais de pouso no polo sul da Lua por luz do Sol, contato com a Terra e valor científico, em qualquer data. | Compare landing sites at the Moon's south pole by sunlight, Earth contact and science value, on any date. | Compare locais de pouso no polo sul da Lua por luz do Sol, contato com a Terra e valor científico, em qualquer data. | mantido |
| Abertura | `intro.how` | How it works | Como funciona | How it works | Como funciona | dúvida (mantido até decisão) |
| Abertura | `intro.problem` | At the Moon's south pole, the Sun and the Earth sit right on the horizon. One ridge can leave a lander without power or contact. See, for each site and date, whether it will have sunlight and a link to Earth, and which site still works when the launch slips. | No polo sul da Lua, o Sol e a Terra ficam rente ao horizonte. Uma única crista pode deixar um módulo de pouso sem energia ou sem contato. Veja, para cada local e data, se haverá luz do Sol e ligação com a Terra, e qual local ainda serve quando o lançamento atrasa. | Near the lunar south pole the Sun and the Earth stay close to the horizon, so the surrounding terrain decides whether a site has sunlight and a direct link to Earth. | Perto do polo sul da Lua, o Sol e a Terra ficam rente ao horizonte; o relevo em volta decide se um local tem luz do Sol e ligação direta com a Terra. | reescrito |
| Abertura | `intro.f1Title` | Sun and Earth | Sol e Terra | Sun and Earth | Sol e Terra | dúvida (mantido até decisão) |
| Abertura | `intro.f1` | See sunlight and direct contact with Earth at each site and date, with the real terrain on the horizon. | Veja a luz do Sol e o contato direto com a Terra em cada local e data, com o relevo real no horizonte. | See sunlight and direct contact with Earth at each site and date, with the real terrain on the horizon. | Veja a luz do Sol e o contato direto com a Terra em cada local e data, com o relevo real no horizonte. | dúvida (mantido até decisão) |
| Abertura | `intro.f2Title` | Side by side | Lado a lado | Side by side | Lado a lado | dúvida (mantido até decisão) |
| Abertura | `intro.f2` | Compare the sites at once, with a science score and an engineering score. | Compare os locais de uma vez, com nota de ciência e nota de engenharia. | Compare the sites at once, with a science score and an engineering score. | Compare os locais de uma vez, com nota de ciência e nota de engenharia. | dúvida (mantido até decisão) |
| Abertura | `intro.f3Title` | Replan a delay | Replaneje o atraso | Replan a delay | Replaneje o atraso | dúvida (mantido até decisão) |
| Abertura | `intro.f3` | Move the launch date and see at once which site still works. | Mude a data do lançamento e veja na hora qual local ainda serve. | Move the launch date and see at once which site still works. | Mude a data do lançamento e veja na hora qual local ainda serve. | dúvida (mantido até decisão) |
| Abertura | `intro.statShackValue` | {a:pct} · {b:pct} | {a:pct} · {b:pct} | {a:pct} · {b:pct} | {a:pct} · {b:pct} | mantido |
| Abertura | `intro.statShack` | NASA average sunlight on the Shackleton rim point and on its inner wall, only {km:km1} apart | luz do Sol média da NASA no ponto da borda do Shackleton e na sua parede interna, a apenas {km:km1} um do outro | NASA average sunlight: Shackleton rim point and inner wall, {km:km1} apart | Luz do Sol média da NASA: ponto da borda e parede interna do Shackleton, a {km:km1} | reescrito |
| Abertura | `intro.statBest` | days of {year} when the best site of the year, {site}, accepts a landing (of {total:int}) | dias de {year} em que o melhor local do ano, {site}, aceita pouso (de {total:int}) | viable landing days in {year} at the best site, {site} (of {total:int}) | dias de pouso viáveis em {year} no melhor local, {site} (de {total:int}) | reescrito |
| Abertura | `intro.dataScope` | {n:int} reference points evaluated · {h:int} hours of Sun and Earth data per site, {year}. | {n:int} pontos de referência avaliados · {h:int} horas de dados do Sol e da Terra por local, {year}. | {n:int} reference points · {h:int} hours of Sun and Earth data per site, {year}. | {n:int} pontos de referência · {h:int} horas de dados do Sol e da Terra por local, {year}. | movido para Sobre |
| Abertura | `intro.statNone` | days of {year} when no site works (of {total:int}) | dias de {year} em que nenhum local serve (de {total:int}) | days in {year} with no viable site (of {total:int}) | dias de {year} sem local viável (de {total:int}) | reescrito |
| Abertura | `intro.statDelay` | dates where a {d:int}-day slip moves the best site to a different one | datas em que um atraso de {d:int} dias leva o melhor local para outro | landing dates where +{d:int} days changes the best site | datas de pouso em que +{d:int} dias trocam o melhor local | reescrito |
| Abertura | `intro.statsNote` | Computed in your browser from the data files, with the default mission rules ({days:int}-day mission). | Calculado no seu navegador a partir dos arquivos de dados, com as regras padrão da missão (missão de {days:int} dias). | Computed in the browser from the data files with the default rules ({days:int}-day mission). | Calculado no navegador a partir dos arquivos de dados, com as regras padrão (missão de {days:int} dias). | movido para dica |
| Abertura | `intro.sources` | Data sources | Fontes de dados | — | — | removido |
| Cabeçalho | `langShort.en` | EN | EN | EN | EN | mantido |
| Cabeçalho | `langShort.pt-BR` | PT | PT | PT | PT | mantido |
| Sobre | `adds.today` | Today | Hoje | Today | Hoje | mantido |
| Sobre | `adds.withTool` | With this tool | Com esta ferramenta | With this tool | Com esta ferramenta | mantido |
| Sobre | `adds.r1a` | One scenario at a time | Um cenário de cada vez | One scenario at a time | Um cenário de cada vez | mantido |
| Sobre | `adds.r1b` | Several sites side by side | Vários locais lado a lado | Several sites side by side | Vários locais lado a lado | mantido |
| Sobre | `adds.r2a` | Raw data | Dados brutos | Raw data | Dados brutos | mantido |
| Sobre | `adds.r2b` | A verdict with its reason | Um veredito com o motivo | A verdict with its reason | Um veredito com o motivo | mantido |
| Sobre | `adds.r3a` | Three interfaces | Três interfaces | Three interfaces | Três interfaces | mantido |
| Sobre | `adds.r3b` | One screen | Uma tela | One screen | Uma tela | mantido |
| Sobre | `adds.r4a` | Engineering only | Só engenharia | Engineering only | Só engenharia | mantido |
| Sobre | `adds.r4b` | Science and engineering | Ciência e engenharia | Science and engineering | Ciência e engenharia | mantido |
| Sobre | `adds.r5a` | Redo everything when the date changes | Refazer tudo quando a data muda | Redo everything when the date changes | Refazer tudo quando a data muda | mantido |
| Sobre | `adds.r5b` | A delay control | Um controle de atraso | A delay control | Um controle de atraso | mantido |
| Sobre | `adds.note` | JPL Horizons, LROC Quickmap and NASA Moon Trek remain the sources and the tools for detailed analysis. | JPL Horizons, LROC Quickmap e NASA Moon Trek continuam sendo as fontes e as ferramentas de análise detalhada. | JPL Horizons, LROC Quickmap and NASA Moon Trek remain the sources and the tools for detailed analysis. | JPL Horizons, LROC Quickmap e NASA Moon Trek continuam sendo as fontes e as ferramentas de análise detalhada. | mantido |
| Sobre | `covers.title` | What this tool covers | O que a ferramenta cobre | Scope | Escopo | reescrito |
| Sobre | `covers.planning` | A planning tool, used on Earth before launch. Verdicts come from fixed decision rules and scoring, shown on screen. | Uma ferramenta de planejamento, usada na Terra antes do lançamento. Os vereditos vêm de regras de decisão e pontuação fixas, mostradas na tela. | A planning tool, used on Earth before launch. Verdicts come from fixed decision rules and scoring, shown on screen. | Uma ferramenta de planejamento, usada na Terra antes do lançamento. Os vereditos vêm de regras de decisão e pontuação fixas, mostradas na tela. | dúvida (mantido até decisão) |
| Sobre | `covers.bestCaseTitle` | Best case per region, not a landing area. | Melhor caso de cada região, não uma área de pouso. | Best case per region, not a landing area. | Melhor caso de cada região, não uma área de pouso. | mantido |
| Sobre | `covers.bestCase` | Each site point is the most-illuminated 60 m pixel of its NASA region on NASA's average-illumination map; neighbouring pixels can get much less light. | Cada ponto é o pixel de 60 m mais iluminado da sua região da NASA no mapa de iluminação média da NASA; pixels vizinhos podem receber bem menos luz. | Each site point is the most-illuminated 60 m pixel of its NASA region on NASA's average-illumination map; neighbouring pixels can get much less light. | Cada ponto é o pixel de 60 m mais iluminado da sua região da NASA no mapa de iluminação média da NASA; pixels vizinhos podem receber bem menos luz. | mantido |
| Sobre | `covers.covers` | Covers | Cobre | Covers | Cobre | mantido |
| Sobre | `covers.notCovers` | Does not cover | Não cobre | Does not cover | Não cobre | mantido |
| Sobre | `covers.c1` | Sunlight at the site (power) | Luz do Sol no local (energia) | Sunlight at the site (power) | Luz do Sol no local (energia) | mantido |
| Sobre | `covers.c2` | Direct line of sight to Earth (communication) | Linha de visada direta para a Terra (comunicação) | Direct line of sight to Earth (communication) | Linha de visada direta para a Terra (comunicação) | mantido |
| Sobre | `covers.c3` | Terrain slope at the site | Inclinação do terreno no local | Terrain slope at the site | Inclinação do terreno no local | mantido |
| Sobre | `covers.c4` | Proximity to permanently shadowed regions (science) | Proximidade de regiões em sombra permanente (ciência) | Proximity to permanently shadowed regions (science) | Proximidade de regiões em sombra permanente (ciência) | mantido |
| Sobre | `covers.n1` | Trajectory and propellant | Trajetória e combustível | Trajectory and propellant | Trajetória e combustível | mantido |
| Sobre | `covers.n2` | Thermal environment | Ambiente térmico | Thermal environment | Ambiente térmico | mantido |
| Sobre | `covers.n3` | Obstacles on the ground (rocks, craters below the map resolution) | Obstáculos no solo (rochas, crateras menores que a resolução do mapa) | Obstacles on the ground (rocks, craters below the map resolution) | Obstáculos no solo (rochas, crateras menores que a resolução do mapa) | mantido |
| Sobre | `covers.n4` | Relay satellite networks | Redes de satélites de retransmissão | Relay satellite networks | Redes de satélites de retransmissão | mantido |
| Rodapé | `footer.sources` | Sources: JPL Horizons (Sun and Earth positions); LRO LOLA topography, illumination and permanent-shadow products, NASA Goddard PGDA (products 69, 78, 90); NASA Lunar Surface Data Book (site regions); Moon globe texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC color). | Fontes: JPL Horizons (posições do Sol e da Terra); produtos de topografia, iluminação e sombra permanente do LRO LOLA, NASA Goddard PGDA (produtos 69, 78, 90); NASA Lunar Surface Data Book (regiões dos locais); textura do globo da Lua: NASA Scientific Visualization Studio, CGI Moon Kit (cor LRO LROC). | JPL Horizons (Sun and Earth positions); LRO LOLA topography, illumination and permanent-shadow products, NASA Goddard PGDA (products 69, 78, 90); NASA Lunar Surface Data Book (site regions); Moon globe texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC color). | JPL Horizons (posições do Sol e da Terra); produtos de topografia, iluminação e sombra permanente do LRO LOLA, NASA Goddard PGDA (produtos 69, 78, 90); NASA Lunar Surface Data Book (regiões dos locais); textura do globo da Lua: NASA Scientific Visualization Studio, CGI Moon Kit (cor LRO LROC). | movido para Sobre |
| Rodapé | `footer.points` | Regional reference points, not NASA-designated landing sites. | Pontos de referência regionais, não locais de pouso designados pela NASA. | Regional reference points, not NASA-designated landing sites. | Pontos de referência regionais, não locais de pouso designados pela NASA. | mantido |
| Rodapé | `footer.independent` | Independent hackathon project, not a NASA product. | Projeto independente de hackathon, não é um produto da NASA. | Independent hackathon project, not a NASA product. | Projeto independente de hackathon, não é um produto da NASA. | mantido |
| Rodapé | `footer.event` | NASA Space Apps Challenge 2026. | NASA Space Apps Challenge 2026. | NASA Space Apps Challenge 2026. | NASA Space Apps Challenge 2026. | mantido |
| Rodapé | `footer.future` | A version for education is a possible future step. | Uma versão para educação é uma possível evolução futura. | — | — | removido |
| Painel: controles | `controls.landing` | Landing day (UTC) | Dia do pouso (UTC) | Landing day (UTC) | Dia do pouso (UTC) | mantido |
| Painel: controles | `controls.duration` | Mission | Missão | Mission length | Duração da missão | reescrito |
| Painel: controles | `controls.durationOption` | {n:int} days | {n:int} dias | {n:int} {n:plural:day\|days} | {n:int} {n:plural:dia\|dias} | reescrito |
| Painel: controles | `controls.delay` | Launch delay | Atraso do lançamento | Launch delay | Atraso do lançamento | mantido |
| Painel: controles | `controls.withDelay` | Landing with delay | Pouso com atraso | Delayed landing | Pouso com atraso | reescrito |
| Painel: controles | `controls.delayReadout` | +{d:int} d → {date:date} | +{d:int} d → {date:date} | +{d:int} d → {date:date} | +{d:int} d → {date:date} | mantido |
| Painel: controles | `controls.delayAria` | {d:int} days | {d:int} dias | {d:int} {d:plural:day\|days} | {d:int} {d:plural:dia\|dias} | reescrito |
| Painel: controles | `controls.slip` | Slip {n:int} days | Atrasar {n:int} dias | +{n:int} {n:plural:day\|days} | +{n:int} {n:plural:dia\|dias} | reescrito |
| Painel: controles | `controls.noDelay` | No delay | Sem atraso | Reset | Zerar | reescrito |
| Painel: avisos | `warn.outside` | The mission ({days:int} days from {date:date}) runs past the data, which cover {start:date} to {end:date}. Results are not computed with incomplete data. | A missão ({days:int} dias a partir de {date:date}) passa do fim dos dados, que vão de {start:date} a {end:date}. Os resultados não são calculados com dados incompletos. | The {days:int}-day mission from {date:date} runs past the data ({start:date} to {end:date}). No results. | A missão de {days:int} dias a partir de {date:date} passa do fim dos dados ({start:date} a {end:date}). Sem resultados. | reescrito |
| Painel: avisos | `warn.noSite` | No site meets the mission rules on {date:date}. | Nenhum local atende às regras da missão em {date:date}. | No viable site on {date:date}. | Nenhum local viável em {date:date}. | reescrito |
| Painel | `earliest.after` | Earliest viable site after the slip | Primeiro local viável depois do atraso | Earliest viable landing | Primeiro pouso viável | reescrito |
| Painel | `earliest.from` | Earliest viable site from this date | Primeiro local viável a partir desta data | Earliest viable landing | Primeiro pouso viável | reescrito |
| Painel | `earliest.value` | {site}, landing {date:date} (viable for {n:int} landing days in a row) | {site}, pouso em {date:date} (viável por {n:int} dias de pouso seguidos) | {site}, {date:date} ({n:int} consecutive {n:plural:day\|days}) | {site}, {date:date} ({n:int} {n:plural:dia seguido\|dias seguidos}) | reescrito |
| Painel | `earliest.none` | none before the end of the data. | nenhum antes do fim dos dados. | None in the data period. | Nenhum no período dos dados. | reescrito |
| Painel: dias viáveis | `census.title` | Landing days that work in {year} ({days:int}-day mission, current rules) | Dias de pouso que funcionam em {year} (missão de {days:int} dias, regras atuais) | Viable landing days, {year} | Dias de pouso viáveis, {year} | reescrito |
| Painel: dias viáveis | `census.noneShort` | days with no site (of {total:int}) | dias sem nenhum local (de {total:int}) | no viable site (of {total:int}) | nenhum local viável (de {total:int}) | reescrito |
| Painel (leitor de tela) | `aria.best` | Best compromise: {site} | Melhor compromisso: {site} | Best overall: {site} | Melhor no conjunto: {site} | reescrito |
| Painel (leitor de tela) | `aria.noBest` | No site qualifies with these rules. | Nenhum local se qualifica com estas regras. | No site qualifies with these rules. | Nenhum local se qualifica com estas regras. | mantido |
| Painel (leitor de tela) | `cards.aria` | Sites ranked for this mission | Locais ordenados para esta missão | Sites ranked for this mission | Locais ordenados para esta missão | mantido |
| Painel | `section.map` | South pole map | Mapa do polo sul | South pole map | Mapa do polo sul | mantido |
| Painel | `section.scatter` | Science versus engineering | Ciência versus engenharia | — | — | removido |
| Painel/Detalhe | `verdict.viable` | Viable | Viável | Viable | Viável | mantido |
| Painel/Detalhe | `verdict.marginal` | Marginal | Marginal | Marginal | Marginal | mantido |
| Painel/Detalhe | `verdict.not-viable` | Not viable | Inviável | Not viable | Inviável | mantido |
| Painel: cartões | `card.best` | Best compromise | Melhor compromisso | Best overall | Melhor no conjunto | reescrito |
| Painel: cartões | `card.engineering` | Engineering | Engenharia | Engineering | Engenharia | mantido |
| Painel: cartões | `card.science` | Science | Ciência | Science | Ciência | mantido |
| Painel: cartões | `card.aria` | {site}, rank {rank:int}, {verdict:verdict} | {site}, posição {rank:int}, {verdict:verdict} | {site}, rank {rank:int}, {verdict:verdict} | {site}, posição {rank:int}, {verdict:verdict} | mantido |
| Painel: cartões | `card.ariaBest` | {site}, rank {rank:int}, {verdict:verdict}, best compromise | {site}, posição {rank:int}, {verdict:verdict}, melhor compromisso | {site}, rank {rank:int}, {verdict:verdict}, best overall | {site}, posição {rank:int}, {verdict:verdict}, melhor no conjunto | reescrito |
| Painel: cartões | `card.landingAt` | Landing {t:datetime} | Pouso {t:datetime} | Landing {t:datetime} | Pouso {t:datetime} | mantido |
| Painel: cartões | `card.noLandingHour` | No hour of this day meets the landing rules. | Nenhuma hora deste dia atende às regras de pouso. | No hour of this day meets the landing rules. | Nenhuma hora deste dia atende às regras de pouso. | reescrito |
| Painel: cartões | `card.next` | Next viable landing: {date:date} (viable {n:int} days in a row) | Próximo pouso viável: {date:date} (viável {n:int} dias seguidos) | Next viable: {date:date} ({n:int} consecutive {n:plural:day\|days}) | Próximo viável: {date:date} ({n:int} {n:plural:dia seguido\|dias seguidos}) | reescrito |
| Painel: cartões | `card.noNext` | No viable landing left in the data year. | Nenhum pouso viável até o fim do ano dos dados. | No viable landing before the end of the data. | Nenhum pouso viável até o fim dos dados. | reescrito |
| Painel: cartões | `card.linkContinuous` | Direct link {p:pct} of mission | Linha direta {p:pct} da missão | Direct link {p:pct} of mission | Linha direta {p:pct} da missão | dúvida (mantido até decisão) |
| Painel: cartões | `card.linkGaps` | Direct link {p:pct} of mission · longest gap {g:hours} (relay needed during gaps) | Linha direta {p:pct} da missão · maior intervalo {g:hours} (retransmissão necessária nos intervalos) | Direct link {p:pct} of mission · longest gap {g:hours} (relay needed during gaps) | Linha direta {p:pct} da missão · maior intervalo {g:hours} (retransmissão necessária nos intervalos) | dúvida (mantido até decisão) |
| Painel: cartões | `card.linkLow` | Direct link only {p:pct} of mission: relay satellite required | Linha direta só {p:pct} da missão: satélite de retransmissão necessário | Direct link only {p:pct} of mission: relay satellite required | Linha direta só {p:pct} da missão: satélite de retransmissão necessário | dúvida (mantido até decisão) |
| Painel: cartões | `card.sun` | {p:pct} sun | {p:pct} de Sol | Sun {p:pct} | Sol {p:pct} | reescrito |
| Painel: cartões | `card.sunTitle` | Mission hours with some part of the Sun visible | Horas da missão com alguma parte do Sol visível | Mission hours with some part of the Sun visible | Horas da missão com alguma parte do Sol visível | mantido |
| Painel: cartões | `card.psr` | {km:km1} to permanent shadow | {km:km1} até a sombra permanente | {km:km1} to permanent shadow | {km:km1} até a sombra permanente | mantido |
| Painel: cartões | `card.psrTitle` | Distance to the nearest permanently shadowed region | Distância até a região em sombra permanente mais próxima | Distance to the nearest permanently shadowed region | Distância até a região em sombra permanente mais próxima | mantido |
| Painel: cartões | `card.slope` | Slope {s:deg1} | Inclinação {s:deg1} | Slope {s:deg1} | Inclinação {s:deg1} | mantido |
| Painel: cartões | `card.slopeTitle` | Local terrain slope (20 m DEM) | Inclinação local do terreno (DEM de 20 m) | Local terrain slope (20 m DEM) | Inclinação local do terreno (DEM de 20 m) | mantido |
| Painel: cartões | `card.howBuilt` | How the scores are built | Como as notas são formadas | Score breakdown | Composição das notas | reescrito |
| Painel: cartões | `card.partValue` | {v:pct} × {w:int} | {v:pct} × {w:int} | {v:pct} × {w:int} | {v:pct} × {w:int} | mantido |
| Painel: cartões | `card.partPoints` | = {p:dec1} | = {p:dec1} | = {p:dec1} | = {p:dec1} | mantido |
| Painel: cartões | `card.fullDisc` | Full solar disc {s:hours}; full Earth disc {e:hours}. Weights are team choices. | Disco solar inteiro {s:hours}; disco da Terra inteiro {e:hours}. Os pesos são escolhas do time. | Full disc: Sun {s:hours}, Earth {e:hours}. | Disco inteiro: Sol {s:hours}, Terra {e:hours}. | reescrito |
| Painel: cartões | `card.details` | Site details | Detalhes do local | Site details | Detalhes do local | mantido |
| Painel: cartões | `card.outside` | The mission runs past the end of the data. Choose an earlier day. | A missão passa do fim dos dados. Escolha um dia anterior. | The mission runs past the end of the data. Choose an earlier day. | A missão passa do fim dos dados. Escolha um dia anterior. | mantido |
| Painel: cartões | `card.outsideAria` | {site}: outside the data | {site}: fora dos dados | {site}: outside the data | {site}: fora dos dados | mantido |
| Cartões/Detalhe: composição | `part.sunlight` | Sunlight during mission | Luz do Sol durante a missão | Sunlight | Luz do Sol | reescrito |
| Cartões/Detalhe: composição | `part.sunlightFromLanding` | Continuous sunlight from landing | Luz contínua a partir do pouso | Sunlight from landing | Luz desde o pouso | reescrito |
| Cartões/Detalhe: composição | `part.earthContact` | Earth in view during mission | Terra visível durante a missão | Earth in view | Terra visível | reescrito |
| Cartões/Detalhe: composição | `part.contactGaps` | Short gaps without Earth contact | Intervalos curtos sem contato com a Terra | Contact gaps | Intervalos sem contato | reescrito |
| Cartões/Detalhe: composição | `part.psrProximity` | Proximity to permanent shadow | Proximidade da sombra permanente | Proximity to permanent shadow | Proximidade da sombra permanente | mantido |
| Cartões/Detalhe: motivo | `reason.darkAtLanding` | Dark at landing: the Sun is behind the terrain (rule: Sun visible at landing). | Escuro no pouso: o Sol está atrás do relevo (regra: Sol visível no pouso). | Dark at landing: the Sun is behind the terrain (rule: Sun visible at landing). | Escuro no pouso: o Sol está atrás do relevo (regra: Sol visível no pouso). | dúvida (mantido até decisão) |
| Cartões/Detalhe: motivo | `reason.survivalDarkness` | Longest darkness {h:hours} exceeds the {limit:hours} survival limit. | A maior escuridão, {h:hours}, passa do limite de sobrevivência de {limit:hours}. | Longest darkness {h:hours} exceeds the {limit:hours} survival limit. | A maior escuridão, {h:hours}, passa do limite de sobrevivência de {limit:hours}. | mantido |
| Cartões/Detalhe: motivo | `reason.minSunFraction` | Only {p:pct} of the mission in sunlight (minimum {min:pct}). | Só {p:pct} da missão com Sol (mínimo {min:pct}). | Only {p:pct} of the mission in sunlight (minimum {min:pct}). | Só {p:pct} da missão com Sol (mínimo {min:pct}). | mantido |
| Cartões/Detalhe: motivo | `reason.marginalSunFraction` | {p:pct} of the mission in sunlight, below the {comfort:pct} comfort level. | {p:pct} da missão com Sol, abaixo do nível confortável de {comfort:pct}. | {p:pct} of the mission in sunlight, below the {comfort:pct} comfort level. | {p:pct} da missão com Sol, abaixo do nível confortável de {comfort:pct}. | mantido |
| Cartões/Detalhe: motivo | `reason.engineering` | Engineering score {score:dec1floor} below {min:int}: Earth in view {earth:pct}, longest contact gap {gap:hours}. | Nota de engenharia {score:dec1floor} abaixo de {min:int}: Terra visível {earth:pct}, maior intervalo sem contato {gap:hours}. | Engineering score {score:dec1floor} below {min:int}: Earth in view {earth:pct}, longest contact gap {gap:hours}. | Nota de engenharia {score:dec1floor} abaixo de {min:int}: Terra visível {earth:pct}, maior intervalo sem contato {gap:hours}. | mantido |
| Cartões/Detalhe: motivo | `reason.slope` | Terrain slope {slope:deg1} exceeds the {limit:deg1} limit (would otherwise be {would:verdict}). | Inclinação do terreno {slope:deg1} acima do limite de {limit:deg1} (sem isso seria {would:verdict}). | Terrain slope {slope:deg1} exceeds the {limit:deg1} limit (would otherwise be {would:verdict}). | Inclinação do terreno {slope:deg1} acima do limite de {limit:deg1} (sem isso seria {would:verdict}). | mantido |
| Cartões/Detalhe: motivo | `reason.viable` | {p:pct} sunlit, Earth in view {earth:pct}, permanent shadow {km:km1} away. | {p:pct} com Sol, Terra visível {earth:pct}, sombra permanente a {km:km1}. | {p:pct} sunlit, Earth in view {earth:pct}, permanent shadow {km:km1} away. | {p:pct} com Sol, Terra visível {earth:pct}, sombra permanente a {km:km1}. | mantido |
| Cartões/Detalhe: motivo | `reason.viableNoPsr` | {p:pct} sunlit, Earth in view {earth:pct}. | {p:pct} com Sol, Terra visível {earth:pct}. | {p:pct} sunlit, Earth in view {earth:pct}. | {p:pct} com Sol, Terra visível {earth:pct}. | mantido |
| Painel: regras | `rules.title` | Mission rules | Regras da missão | Mission rules | Regras da missão | mantido |
| Painel: regras | `rules.note` | Defaults are our team's choices for this demo, not NASA requirements. | Os padrões são escolhas do nosso time para esta demonstração, não requisitos da NASA. | Defaults are team choices, not NASA requirements. | Os padrões são escolhas do time, não requisitos da NASA. | reescrito |
| Painel: regras | `rules.sunAtLanding` | Sun visible at landing | Sol visível no pouso | Sun visible at landing | Sol visível no pouso | mantido |
| Painel: regras | `rules.survival` | Survival limit: longest darkness (h) | Limite de sobrevivência: maior escuridão (h) | Survival limit: longest darkness (h) | Limite de sobrevivência: maior escuridão (h) | mantido |
| Painel: regras | `rules.minSun` | Minimum sunlit share (%) | Fração mínima com Sol (%) | Minimum sunlit share (%) | Fração mínima com Sol (%) | mantido |
| Painel: regras | `rules.marginalSun` | Marginal below sunlit share (%) | Marginal abaixo da fração com Sol (%) | Marginal below sunlit share (%) | Marginal abaixo da fração com Sol (%) | mantido |
| Painel: regras | `rules.viableEng` | Viable: engineering ≥ | Viável: engenharia ≥ | Viable: engineering ≥ | Viável: engenharia ≥ | mantido |
| Painel: regras | `rules.scienceFilter` | Minimum science score filter | Filtro de nota mínima de ciência | Minimum science score filter | Filtro de nota mínima de ciência | mantido |
| Painel: regras | `rules.scienceFilterEnable` | Enable the minimum science score filter | Ativar o filtro de nota mínima de ciência | Enable the minimum science score filter | Ativar o filtro de nota mínima de ciência | mantido |
| Painel: regras | `rules.scienceFilterValue` | Minimum science score | Nota mínima de ciência | Minimum science score | Nota mínima de ciência | mantido |
| Painel: regras | `rules.relay` | Relay alert below direct link (%) | Alerta de retransmissão abaixo de linha direta (%) | Relay alert below direct link (%) | Alerta de retransmissão abaixo de linha direta (%) | mantido |
| Painel: regras | `rules.slope` | Max terrain slope (°) | Inclinação máxima do terreno (°) | Max terrain slope (°) | Inclinação máxima do terreno (°) | mantido |
| Painel: regras | `rules.reset` | Reset to defaults | Voltar aos padrões | Reset to defaults | Voltar aos padrões | mantido |
| Painel: regras | `rules.explain` | Not viable: no hour of the landing day with the Sun visible, a darkness longer than the survival limit, or too little sunlight. Marginal: sunlight below the comfort share, or an engineering score below the viable minimum. The verdict uses engineering rules only; the science score ranks the sites. Earth contact counts through the engineering score. A terrain slope above the limit lowers the verdict by one level. Best compromise: the site with the highest of min(engineering, science) among sites that are not "not viable" (and pass the optional science filter). | Inviável: nenhuma hora do dia do pouso com o Sol visível, escuridão maior que o limite de sobrevivência, ou pouca luz do Sol. Marginal: luz abaixo do nível confortável, ou nota de engenharia abaixo do mínimo para viável. O veredito usa só regras de engenharia; a nota de ciência ordena os locais. O contato com a Terra entra pela nota de engenharia. Inclinação acima do limite rebaixa o veredito em um nível. Melhor compromisso: o local com o maior min(engenharia, ciência) entre os que não são "inviáveis" (e passam no filtro opcional de ciência). | Not viable: no hour of the landing day with the Sun visible, a darkness longer than the survival limit, or too little sunlight. Marginal: sunlight below the comfort share, or an engineering score below the viable minimum. The verdict uses engineering rules only; the science score ranks the sites. Earth contact counts through the engineering score. A terrain slope above the limit lowers the verdict by one level. Best compromise: the site with the highest of min(engineering, science) among sites that are not "not viable" (and pass the optional science filter). | Inviável: nenhuma hora do dia do pouso com o Sol visível, escuridão maior que o limite de sobrevivência, ou pouca luz do Sol. Marginal: luz abaixo do nível confortável, ou nota de engenharia abaixo do mínimo para viável. O veredito usa só regras de engenharia; a nota de ciência ordena os locais. O contato com a Terra entra pela nota de engenharia. Inclinação acima do limite rebaixa o veredito em um nível. Melhor compromisso: o local com o maior min(engenharia, ciência) entre os que não são "inviáveis" (e passam no filtro opcional de ciência). | dúvida (mantido até decisão) |
| Painel: ciência × engenharia | `scatter.title` | Science × engineering | Ciência × engenharia | Science × engineering | Ciência × engenharia | mantido |
| Painel: ciência × engenharia | `scatter.legend` | ● meets the hard rules ○ not viable | ● atende às regras obrigatórias ○ inviável | ● meets the hard rules ○ not viable | ● atende às regras obrigatórias ○ inviável | mantido |
| Painel: ciência × engenharia | `scatter.trail` | faint ring = planned date, line = move with +{d:int} d | anel claro = data planejada, linha = deslocamento com +{d:int} d | faint ring = planned date, line = move with +{d:int} d | anel claro = data planejada, linha = deslocamento com +{d:int} d | mantido |
| Painel: ciência × engenharia | `scatter.x` | Science score ◆ | Nota de ciência ◆ | Science score ◆ | Nota de ciência ◆ | mantido |
| Painel: ciência × engenharia | `scatter.y` | Engineering score ●▲ | Nota de engenharia ●▲ | Engineering score ●▲ | Nota de engenharia ●▲ | mantido |
| Painel: ciência × engenharia | `scatter.zone` | engineering ≥ viable minimum (team rules) | engenharia ≥ mínimo para viável (regras do time) | engineering ≥ viable minimum (team rules) | engenharia ≥ mínimo para viável (regras do time) | mantido |
| Painel: ciência × engenharia | `scatter.aria` | Science score versus engineering score for each site | Nota de ciência versus nota de engenharia de cada local | Science score versus engineering score for each site | Nota de ciência versus nota de engenharia de cada local | mantido |
| Painel: disponibilidade | `strips.title` | {year} at a glance: Sun and Earth by day | {year} num relance: Sol e Terra por dia | {year} availability | Disponibilidade em {year} | reescrito |
| Painel: disponibilidade | `strips.sun` | share of the day with the Sun visible | fração do dia com o Sol visível | Sun, share of day | Sol, fração do dia | reescrito |
| Painel: disponibilidade | `strips.earth` | share of the day with the Earth visible | fração do dia com a Terra visível | Earth, share of day | Terra, fração do dia | reescrito |
| Painel: disponibilidade | `strips.planned` | planned landing {date:date} | pouso planejado {date:date} | Planned landing {date:date} | Pouso planejado {date:date} | reescrito |
| Painel: disponibilidade | `strips.delayed` | landing with delay {date:date} + mission | pouso com atraso {date:date} + missão | Delayed landing {date:date} + mission | Pouso com atraso {date:date} + missão | reescrito |
| Painel: disponibilidade | `strips.rowAria` | {site}: daily Sun and Earth visibility in {year} | {site}: visibilidade diária do Sol e da Terra em {year} | {site}: daily Sun and Earth visibility in {year} | {site}: visibilidade diária do Sol e da Terra em {year} | mantido |
| Painel: mapa/3D | `map.title2d` | South pole · shaded relief (LOLA {px:int} m/pixel, visual only) | Polo sul · relevo sombreado (LOLA {px:int} m/pixel, só visualização) | South pole, relief | Polo sul, relevo | reescrito |
| Painel: mapa/3D | `map.title3d` | South pole · 3D, Sun at the landing instant (LOLA {px:int} m/pixel, visual only) | Polo sul · 3D, Sol no instante do pouso (LOLA {px:int} m/pixel, só visualização) | South pole, 3D | Polo sul, 3D | reescrito |
| Painel: mapa/3D | `map.orientation` | Up = 0° E (toward Earth) · pole at centre | Para cima = 0° L (em direção à Terra) · polo no centro | Up = 0° E (toward Earth) · pole at centre | Para cima = 0° L (em direção à Terra) · polo no centro | mantido |
| Painel: mapa/3D | `map.aria` | South polar map with the sites | Mapa do polo sul com os locais | South polar map with the sites | Mapa do polo sul com os locais | mantido |
| Painel: mapa/3D | `map.select` | Select {site} | Selecionar {site} | Select {site} | Selecionar {site} | mantido |
| Painel: mapa/3D | `map.show2d` | Show 2D map | Ver mapa 2D | Show 2D map | Ver mapa 2D | mantido |
| Painel: mapa/3D | `map.show3d` | Show 3D view | Ver 3D | Show 3D view | Ver 3D | mantido |
| Painel: mapa/3D | `map.demoNote` | ○ Shackleton inner wall, kept to show how much the exact position matters. | ○ Parede interna do Shackleton, mantida para mostrar o quanto a posição exata importa. | Hollow marker: Shackleton inner wall, kept to show the effect of the exact position. | Marcador vazado: parede interna do Shackleton, mantida para mostrar o efeito da posição exata. | movido para dica |
| Painel: mapa/3D | `map.how3d` | Drag to rotate, scroll to zoom (or arrow keys, +/−, R). Light comes from the Sun as seen from the selected site at the landing instant. | Arraste para girar, role para aproximar (ou setas, +/−, R). A luz vem do Sol visto do local selecionado no instante do pouso. | Drag to rotate, scroll to zoom (or arrow keys, +/−, R). Light: the Sun seen from the selected site at the landing time. | Arraste para girar, role para aproximar (ou setas, +/−, R). Luz: o Sol visto do local selecionado na hora do pouso. | movido para dica |
| Painel: mapa/3D | `map.how2d` | Static light. | Luz fixa. | Fixed light. | Luz fixa. | movido para dica |
| Painel: mapa/3D | `map.numbersNote` | Numbers come from the horizon calculation, not from this picture. | Os números vêm do cálculo com o contorno do horizonte, não desta imagem. | The numbers come from the horizon calculation, not from this view. | Os números vêm do cálculo do horizonte, não desta vista. | movido para dica |
| Painel: 3D | `scene.vertical` | Vertical ×{n:int} | Vertical ×{n:int} | Vertical ×{n:int} | Vertical ×{n:int} | mantido |
| Painel: 3D | `scene.verticalAria` | Vertical exaggeration | Exagero vertical | Vertical exaggeration | Exagero vertical | mantido |
| Painel: 3D | `scene.reset` | Reset view | Reiniciar vista | Reset view | Reiniciar vista | mantido |
| Painel: 3D | `scene.sun` | Sun {el:deg1} | Sol {el:deg1} | Sun {el:deg1} | Sol {el:deg1} | mantido |
| Painel: 3D | `scene.at` | at {site} | em {site} | at {site} | em {site} | mantido |
| Painel: 3D | `scene.earth` | Earth | Terra | Earth | Terra | mantido |
| Painel: 3D | `scene.curvature` | curvature on | curvatura ligada | — | — | removido |
| Painel: 3D | `scene.visualOnly` | visual only | só visualização | — | — | removido |
| Painel: 3D | `scene.aria` | 3D south pole view. Arrow keys rotate and tilt, plus and minus zoom, R resets. | Vista 3D do polo sul. Setas giram e inclinam, mais e menos aproximam, R reinicia. | 3D south pole view. Arrow keys rotate and tilt, plus and minus zoom, R resets. | Vista 3D do polo sul. Setas giram e inclinam, mais e menos aproximam, R reinicia. | mantido |
| Painel: 3D | `scene.loading` | Loading the 3D view… | Carregando a vista 3D… | Loading the 3D view… | Carregando a vista 3D… | mantido |
| Painel: 3D | `scene.youAreHere` | You are here | Você está aqui | South pole | Polo sul | reescrito |
| Detalhe: dados e limites | `facts.pick` | Click a site on the map, a card or the scatter. | Clique num local no mapa, num cartão ou na dispersão. | Click a site on the map, a card or the scatter. | Clique num local no mapa, num cartão ou na dispersão. | mantido |
| Detalhe: dados e limites | `facts.site` | Site | Local | Site | Local | mantido |
| Detalhe: dados e limites | `facts.point` | Point | Ponto | Point | Ponto | mantido |
| Detalhe: dados e limites | `facts.published` | Published point (NASA Lunar Surface Data Book) | Ponto publicado (NASA Lunar Surface Data Book) | Published point (NASA Lunar Surface Data Book) | Ponto publicado (NASA Lunar Surface Data Book) | mantido |
| Detalhe: dados e limites | `facts.derived` | Derived: most-illuminated 60 m pixel of its NASA region (best case) | Derivado: pixel de 60 m mais iluminado da região da NASA (melhor caso) | Derived: most-illuminated 60 m pixel of its NASA region (best case) | Derivado: pixel de 60 m mais iluminado da região da NASA (melhor caso) | mantido |
| Detalhe: dados e limites | `facts.position` | Position | Posição | Position | Posição | mantido |
| Detalhe: dados e limites | `facts.positionValue` | {lat:dec1}°, {lon:dec1}° E | {lat:dec1}°, {lon:dec1}° L | {lat:dec1}°, {lon:dec1}° E | {lat:dec1}°, {lon:dec1}° L | mantido |
| Detalhe: dados e limites | `facts.terrain` | Terrain | Terreno | Terrain | Terreno | mantido |
| Detalhe: dados e limites | `facts.terrainValue` | {h:int} m · slope {s:deg1} | {h:int} m · inclinação {s:deg1} | {h:int} m · slope {s:deg1} | {h:int} m · inclinação {s:deg1} | mantido |
| Detalhe: dados e limites | `facts.psr` | Permanent shadow | Sombra permanente | Permanent shadow | Sombra permanente | mantido |
| Detalhe: dados e limites | `facts.psrValue` | {km:km1} · {a:dec1} km² region | {km:km1} · região de {a:dec1} km² | {km:km1} · {a:dec1} km² region | {km:km1} · região de {a:dec1} km² | mantido |
| Detalhe: dados e limites | `facts.nasa` | NASA 18.6-yr averages | Médias da NASA em 18,6 anos | NASA 18.6-yr averages | Médias da NASA em 18,6 anos | mantido |
| Geral (unidades) | `unit.km` | {n} km | {n} km | {n} km | {n} km | mantido |
| Geral (unidades) | `unit.hours` | {n} h | {n} h | {n} h | {n} h | mantido |
| Geral (unidades) | `unit.days` | {n} days | {n} dias | {n} days | {n} dias | mantido |
| Geral (unidades) | `unit.beyondData` | beyond the data | além dos dados | beyond the data | além dos dados | mantido |
| Geral (unidades) | `unit.na` | n/a | n/d | n/a | n/d | mantido |
| Detalhe do local | `detail.panorama` | Horizon seen from {site} | Horizonte visto de {site} | Horizon, 360° | Horizonte, 360° | reescrito |
| Detalhe do local | `detail.vertical` | Vertical ×{n:int} | Vertical ×{n:int} | Vertical ×{n:int} | Vertical ×{n:int} | mantido |
| Detalhe do local | `detail.realSize` | Sun and Earth drawn at their real angular size (Sun {s:deg1}, Earth {e:deg1}), stretched by the vertical scale; the rings only mark where they are. Lines: their paths during the mission. | Sol e Terra no tamanho angular real (Sol {s:deg1}, Terra {e:deg1}), esticados pela escala vertical; os anéis só marcam onde estão. Linhas: trajetória durante a missão. | Sun ({s:deg1}) and Earth ({e:deg1}) at their real angular size, stretched by the vertical scale; rings mark their position; lines show their paths during the mission. | Sol ({s:deg1}) e Terra ({e:deg1}) no tamanho angular real, esticados pela escala vertical; os anéis marcam a posição; as linhas, a trajetória durante a missão. | movido para dica |
| Detalhe do local | `detail.astroHorizon` | 0° (flat horizon) | 0° (horizonte plano) | 0° (flat horizon) | 0° (horizonte plano) | mantido |
| Detalhe do local | `detail.terrainLegend` | Terrain (LOLA) | Relevo (LOLA) | — | — | removido |
| Detalhe do local | `detail.sun` | Sun | Sol | Sun | Sol | mantido |
| Detalhe do local | `detail.earth` | Earth | Terra | Earth | Terra | mantido |
| Detalhe do local | `detail.panoramaAria` | 360-degree horizon panorama of {site} with the Sun and the Earth at {t:datetime} | Panorama de 360 graus do horizonte de {site} com o Sol e a Terra em {t:datetime} | 360-degree horizon panorama of {site} with the Sun and the Earth at {t:datetime} | Panorama de 360 graus do horizonte de {site} com o Sol e a Terra em {t:datetime} | mantido |
| Detalhe do local | `detail.time` | Mission time | Tempo da missão | Mission time | Tempo da missão | mantido |
| Detalhe do local | `detail.now` | {t:datetime} | {t:datetime} | {t:datetime} | {t:datetime} | mantido |
| Detalhe do local | `detail.play` | Play | Reproduzir | Play | Reproduzir | mantido |
| Detalhe do local | `detail.pause` | Pause | Pausar | Pause | Pausar | mantido |
| Detalhe do local | `detail.hourOf` | Hour {h:int} of {n:int} | Hora {h:int} de {n:int} | Hour {h:int} of {n:int} | Hora {h:int} de {n:int} | mantido |
| Detalhe do local | `detail.bodyAt` | elevation {el:deg1} · terrain {h:deg1} in that direction | elevação {el:deg1} · relevo {h:deg1} nessa direção | elevation {el:deg1} · terrain {h:deg1} in that direction | elevação {el:deg1} · relevo {h:deg1} nessa direção | mantido |
| Detalhe do local | `detail.visible` | visible | visível | visible | visível | mantido |
| Detalhe do local | `detail.partial` | partly visible | parcialmente visível | partly visible | parcialmente visível | mantido |
| Detalhe do local | `detail.hidden` | behind the terrain | atrás do relevo | behind the terrain | atrás do relevo | mantido |
| Detalhe do local | `detail.timeline` | Mission timeline | Linha do tempo da missão | Mission timeline | Linha do tempo da missão | mantido |
| Detalhe do local | `detail.sunRow` | Sunlight | Luz do Sol | Sunlight | Luz do Sol | mantido |
| Detalhe do local | `detail.earthRow` | Direct contact with Earth | Contato direto com a Terra | Direct contact with Earth | Contato direto com a Terra | mantido |
| Detalhe do local | `detail.nextSunset` | Next sunset in {h:hours} | Próximo ocaso em {h:hours} | Next sunset in {h:hours} | Próximo ocaso em {h:hours} | mantido |
| Detalhe do local | `detail.noSunset` | No sunset before the mission ends | Sem ocaso até o fim da missão | No sunset before the mission ends | Sem ocaso até o fim da missão | mantido |
| Detalhe do local | `detail.nextSunrise` | Sun behind the terrain; next sunrise in {h:hours} | Sol atrás do relevo; nasce de novo em {h:hours} | Next sunrise in {h:hours} | Próximo nascer do Sol em {h:hours} | reescrito |
| Detalhe do local | `detail.noSunrise` | Sun behind the terrain until the mission ends | Sol atrás do relevo até o fim da missão | No sunrise before the mission ends | Sem nascer do Sol até o fim da missão | reescrito |
| Detalhe do local | `detail.nextEarthLoss` | Next loss of direct contact in {h:hours} | Próxima perda de contato direto em {h:hours} | Next loss of direct contact in {h:hours} | Próxima perda de contato direto em {h:hours} | mantido |
| Detalhe do local | `detail.noEarthLoss` | No loss of direct contact before the mission ends | Sem perda de contato direto até o fim da missão | No loss of direct contact before the mission ends | Sem perda de contato direto até o fim da missão | mantido |
| Detalhe do local | `detail.nextEarthRise` | Earth behind the terrain; contact again in {h:hours} | Terra atrás do relevo; contato de novo em {h:hours} | Contact again in {h:hours} | Contato de novo em {h:hours} | reescrito |
| Detalhe do local | `detail.noEarthRise` | Earth behind the terrain until the mission ends | Terra atrás do relevo até o fim da missão | No contact before the mission ends | Sem contato até o fim da missão | reescrito |
| Detalhe do local | `detail.scores` | Verdict and scores | Veredito e notas | Verdict and scores | Veredito e notas | mantido |
| Detalhe do local | `detail.dataLimits` | Data and limits | Dados e limites | Data and limits | Dados e limites | mantido |
| Detalhe do local | `detail.sources` | Sources | Fontes | Sources | Fontes | mantido |
| Detalhe do local | `detail.demRes` | Terrain resolution | Resolução do relevo | Terrain resolution | Resolução do relevo | mantido |
| Detalhe do local | `detail.band` | {px:int} m up to {km:int} km | {px:int} m até {km:int} km | {px:int} m up to {km:int} km | {px:int} m até {km:int} km | mantido |
| Detalhe do local | `detail.observer` | Observer height | Altura do observador | Observer height | Altura do observador | mantido |
| Detalhe do local | `detail.observerValue` | {m:dec1} m above the ground (mast) | {m:dec1} m acima do solo (mastro) | {m:dec1} m above the ground (mast) | {m:dec1} m acima do solo (mastro) | mantido |
| Detalhe do local | `detail.signal` | A radio signal takes about 1.3 s each way between the Earth and the Moon. | Um sinal de rádio leva cerca de 1,3 s em cada sentido entre a Terra e a Lua. | A radio signal takes about 1.3 s each way between the Earth and the Moon. | Um sinal de rádio leva cerca de 1,3 s em cada sentido entre a Terra e a Lua. | mantido |
| Detalhe do local | `detail.directOnly` | Only the direct line of sight to Earth is evaluated; relay satellites are not modelled. | Só a linha de visada direta com a Terra é avaliada; satélites retransmissores não são modelados. | Only the direct line of sight to Earth is evaluated; relay satellites are not modelled. | Só a linha de visada direta com a Terra é avaliada; satélites retransmissores não são modelados. | mantido |
| Detalhe do local | `detail.notFound` | This site is not in the data. | Este local não está nos dados. | This site is not in the data. | Este local não está nos dados. | mantido |
| Detalhe: panorama | `dir.N` | N | N | N | N | mantido |
| Detalhe: panorama | `dir.E` | E | L | E | L | mantido |
| Detalhe: panorama | `dir.S` | S | S | S | S | mantido |
| Detalhe: panorama | `dir.W` | W | O | W | O | mantido |
| Painel: sensibilidade à posição | `small.title` | Small move, big change | Pequena mudança, grande diferença | Position sensitivity | Sensibilidade à posição | reescrito |
| Painel: sensibilidade à posição | `small.lead` | {a} and {b} are only {km:km1} apart. Same landing day, same rules: | {a} e {b} ficam a apenas {km:km1} um do outro. Mesmo dia de pouso, mesmas regras: | {a} and {b}: {km:km1} apart, same landing day and rules. | {a} e {b}: a {km:km1} um do outro, mesmo dia de pouso e mesmas regras. | reescrito |
| Painel: sensibilidade à posição | `small.aria` | Horizon contours of {a} and {b} on the same scale | Contornos do horizonte de {a} e {b} na mesma escala | Horizon contours of {a} and {b} on the same scale | Contornos do horizonte de {a} e {b} na mesma escala | mantido |
| Painel: sensibilidade à posição | `small.sunPath` | Sun path during the mission | Trajetória do Sol durante a missão | Sun path | Trajetória do Sol | reescrito |
| Painel: sensibilidade à posição | `small.verdict` | Verdict | Veredito | Verdict | Veredito | mantido |
| Painel: sensibilidade à posição | `small.sun` | Sunlight | Luz do Sol | Sunlight | Luz do Sol | mantido |
| Painel: sensibilidade à posição | `small.earth` | Direct contact with Earth | Contato direto com a Terra | Direct contact with Earth | Contato direto com a Terra | mantido |
| Painel: sensibilidade à posição | `small.pct` | {p:pct} | {p:pct} | {p:pct} | {p:pct} | mantido |
| Painel: sensibilidade à posição | `small.dark` | Longest darkness | Maior escuridão | Longest darkness | Maior escuridão | mantido |
| Painel: sensibilidade à posição | `small.gap` | Longest gap without contact | Maior intervalo sem contato | Longest gap without contact | Maior intervalo sem contato | mantido |
| Painel: sensibilidade à posição | `small.hours` | {h:hours} | {h:hours} | {h:hours} | {h:hours} | mantido |
| Painel: sensibilidade à posição | `small.deg` | {s:deg1} | {s:deg1} | {s:deg1} | {s:deg1} | mantido |
| Painel: sensibilidade à posição | `small.slope` | Slope | Inclinação | Slope | Inclinação | mantido |
| Painel: sensibilidade à posição | `small.reason` | Reason | Motivo | Reason | Motivo | mantido |
| Cabeçalho | `header.roadmap` | Roadmap | Roteiro | Roadmap | Roteiro | mantido |
| Roadmap | `roadmap.title` | Roadmap | Roteiro | Roadmap | Roteiro | mantido |
| Roadmap | `roadmap.lead` | What the tool does today, and ideas for later. Only the first column exists. | O que a ferramenta faz hoje e ideias para depois. Só a primeira coluna existe. | What the tool does today, and ideas for later. Only the first column exists. | O que a ferramenta faz hoje e ideias para depois. Só a primeira coluna existe. | dúvida (mantido até decisão) |
| Roadmap | `roadmap.now` | Now | Agora | Now | Agora | mantido |
| Roadmap | `roadmap.m3` | In 3 months | Em 3 meses | In 3 months | Em 3 meses | mantido |
| Roadmap | `roadmap.m6` | In 6 months | Em 6 meses | In 6 months | Em 6 meses | mantido |
| Roadmap | `roadmap.available` | Working today | Funciona hoje | Working today | Funciona hoje | mantido |
| Roadmap | `roadmap.concept` | Concept, not implemented | Conceito, não implementado | Concept, not implemented | Conceito, não implementado | mantido |
| Roadmap | `roadmap.now1` | Reference points at the lunar south pole | Pontos de referência no polo sul da Lua | Reference points at the lunar south pole | Pontos de referência no polo sul da Lua | mantido |
| Roadmap | `roadmap.now2` | One year of hourly Sun and Earth data | Um ano de dados do Sol e da Terra, hora a hora | One year of hourly Sun and Earth data | Um ano de dados do Sol e da Terra, hora a hora | mantido |
| Roadmap | `roadmap.now3` | Adjustable decision rules | Regras de decisão ajustáveis | Adjustable decision rules | Regras de decisão ajustáveis | mantido |
| Roadmap | `roadmap.m3_1` | Any coordinate, and the whole region evaluated instead of the best pixel | Qualquer coordenada, e a região inteira avaliada em vez do melhor pixel | Any coordinate, and the whole region evaluated instead of the best pixel | Qualquer coordenada, e a região inteira avaliada em vez do melhor pixel | mantido |
| Roadmap | `roadmap.m3_2` | Several years of data | Vários anos de dados | Several years of data | Vários anos de dados | mantido |
| Roadmap | `roadmap.m3_3` | Coverage of relay satellites | Cobertura de satélites retransmissores | Coverage of relay satellites | Cobertura de satélites retransmissores | mantido |
| Roadmap | `roadmap.m3_4` | Two points per region: best for engineering and best for science | Dois pontos por região: o melhor para engenharia e o melhor para ciência | Two points per region: best for engineering and best for science | Dois pontos por região: o melhor para engenharia e o melhor para ciência | mantido |
| Roadmap | `roadmap.m3_5` | A written summary of the result by AI, from the numbers the fixed code computed | Resumo do resultado escrito por IA, a partir dos números calculados pelo código fixo | A written summary of the result by AI, from the numbers the fixed code computed | Resumo do resultado escrito por IA, a partir dos números calculados pelo código fixo | mantido |
| Roadmap | `roadmap.m6_1` | AI to refine the terrain with new data from spacecraft | IA para refinar o relevo com novos dados de sondas | AI to refine the terrain with new data from spacecraft | IA para refinar o relevo com novos dados de sondas | mantido |
| Roadmap | `roadmap.m6_2` | The same method applied to Mars and other bodies | O mesmo método aplicado a Marte e a outros corpos | The same method applied to Mars and other bodies | O mesmo método aplicado a Marte e a outros corpos | mantido |
| Roadmap | `roadmap.m6_3` | An education version | Versão educacional | An education version | Versão educacional | mantido |
| Painel: comparação NASA | `check.title` | Check against NASA averages | Conferência com as médias da NASA | Comparison with NASA averages | Comparação com as médias da NASA | reescrito |
| Painel: comparação NASA | `check.lead` | Share of the hours of {year} with some part of the Sun or the Earth above the terrain horizon, computed by the same code as the rest of the tool, beside the averages NASA publishes for the same points (LOLA polar illumination, PGDA product 69). | Parcela das horas de {year} com alguma parte do Sol ou da Terra acima do horizonte do relevo, calculada pelo mesmo código do resto da ferramenta, ao lado das médias que a NASA publica para os mesmos pontos (iluminação polar do LOLA, PGDA produto 69). | Hours of {year} with some part of the Sun or the Earth above the terrain horizon, beside NASA averages for the same points (PGDA product 69). | Horas de {year} com alguma parte do Sol ou da Terra acima do horizonte do relevo, ao lado das médias da NASA para os mesmos pontos (PGDA produto 69). | reescrito |
| Painel: comparação NASA | `check.site` | Site | Local | Site | Local | mantido |
| Painel: comparação NASA | `check.sunOurs` | Sun, {year} (this tool) | Sol, {year} (esta ferramenta) | Sun, {year} (this tool) | Sol, {year} (esta ferramenta) | mantido |
| Painel: comparação NASA | `check.sunNasa` | Sun, NASA average | Sol, média da NASA | Sun, NASA average | Sol, média da NASA | mantido |
| Painel: comparação NASA | `check.earthOurs` | Earth, {year} (this tool) | Terra, {year} (esta ferramenta) | Earth, {year} (this tool) | Terra, {year} (esta ferramenta) | mantido |
| Painel: comparação NASA | `check.earthNasa` | Earth, NASA average | Terra, média da NASA | Earth, NASA average | Terra, média da NASA | mantido |
| Painel: comparação NASA | `check.difference` | Difference | Diferença | Difference | Diferença | mantido |
| Painel: comparação NASA | `check.pct` | {v:dec1}% | {v:dec1}% | {v:dec1}% | {v:dec1}% | mantido |
| Painel: comparação NASA | `check.diff` | {sign}{d:dec1} pts | {sign}{d:dec1} p.p. | {sign}{d:dec1} pts | {sign}{d:dec1} p.p. | mantido |
| Painel: comparação NASA | `check.whyTitle` | Why the numbers are not expected to match | Por que não se espera igualdade | Why they differ | Por que diferem | reescrito |
| Painel: comparação NASA | `check.why1` | NASA averages 18.6 years of hourly steps (a lunar nutation cycle); this tool looks at one year. | A NASA faz a média de 18,6 anos de passos horários (um ciclo de nutação lunar); a ferramenta olha um ano. | NASA averages 18.6 years of hourly steps (a lunar nutation cycle); this tool looks at one year. | A NASA faz a média de 18,6 anos de passos horários (um ciclo de nutação lunar); a ferramenta olha um ano. | mantido |
| Painel: comparação NASA | `check.why2` | NASA uses a 60 m terrain map; this tool uses 20, 80 and 320 m maps by distance, with the observer on a 2 m mast. | A NASA usa um mapa de relevo de 60 m; a ferramenta usa mapas de 20, 80 e 320 m conforme a distância, com o observador num mastro de 2 m. | NASA uses a 60 m terrain map; this tool uses 20, 80 and 320 m maps by distance, with the observer on a 2 m mast. | A NASA usa um mapa de relevo de 60 m; a ferramenta usa mapas de 20, 80 e 320 m conforme a distância, com o observador num mastro de 2 m. | mantido |
| Painel: comparação NASA | `check.why3` | Each NASA value is one 60 m pixel; within about 90 m it can change by tens of points (see data/validation/COMPARISON.md). | Cada valor da NASA é um pixel de 60 m; em cerca de 90 m ele pode mudar dezenas de pontos (ver data/validation/COMPARISON.md). | Each NASA value is one 60 m pixel; within about 90 m it can change by tens of points (see data/validation/COMPARISON.md). | Cada valor da NASA é um pixel de 60 m; em cerca de 90 m ele pode mudar dezenas de pontos (ver data/validation/COMPARISON.md). | mantido |
| Painel: comparação NASA | `check.why4` | The tool looks up the horizon at the whole degree of azimuth nearest the disc centre. | A ferramenta consulta o horizonte no grau inteiro de azimute mais próximo do centro do disco. | The tool looks up the horizon at the whole degree of azimuth nearest the disc centre. | A ferramenta consulta o horizonte no grau inteiro de azimute mais próximo do centro do disco. | mantido |
| Painel: comparação NASA | `check.notTuned` | Nothing was adjusted to bring the numbers closer. | Nada foi ajustado para aproximar os números. | Nothing was adjusted to bring the numbers closer. | Nada foi ajustado para aproximar os números. | dúvida (mantido até decisão) |
| Painel: mapa/3D | `map.resolution` |  |  | LOLA relief, {px:int} m per pixel; vertical scale exaggerated. Visual only. | Relevo LOLA, {px:int} m por pixel; escala vertical exagerada. Só visualização. | novo |
| Geral (dica) | `info.label` |  |  | More information | Mais informações | novo |
| Painel: dias viáveis | `census.tip` |  |  | {days:int}-day mission, current rules. | Missão de {days:int} dias, regras atuais. | novo |
| Detalhe do local | `detail.teamRules` |  |  | Weights and limits of the scores are team choices, not NASA requirements. | Os pesos e limites das notas são escolhas do time, não requisitos da NASA. | novo |
| Sobre | `about.title` |  |  | About | Sobre | novo |
| Sobre | `about.compare` |  |  | Compared with existing tools | Comparação com as ferramentas existentes | novo |
| Sobre | `about.sources` |  |  | Sources | Fontes | novo |
