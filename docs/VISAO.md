# Visão do produto

## Desafio

**NASA Space Apps Challenge 2026 — "Lunar Landing Site Navigator".**

Resumo oficial: criar uma ferramenta intuitiva que permita a planejadores de missão, educadores e público comparar rapidamente locais e datas de pouso na Lua, visualizando a posição do Sol e da Terra em relação ao horizonte, para avaliar geração de energia e janelas de comunicação direta com a Terra.

## Problema

- No polo sul da Lua o Sol e a Terra ficam rasantes ao horizonte (elevações baixas).
- Por isso o **relevo** decide se há luz (energia solar) e se há linha de visada para a Terra (comunicação direta).
- Os dados para avaliar isso existem — JPL Horizons, Quickmap, Moon Trek, relevo do LOLA — mas estão espalhados em ferramentas difíceis de usar e de combinar.
- Quando o cronograma de uma missão muda (o lançamento atrasa), não há como comparar alternativas com rapidez.

## Ideia

Uma ferramenta em que o planejador:

1. escolhe um local e uma data;
2. vê na hora se terá Sol e contato com a Terra;
3. quando o lançamento atrasa, compara as alternativas (outros locais, outras datas) lado a lado.

## Ângulo: ciência contra engenharia

| Lado | O que quer | Por quê |
|------|-----------|---------|
| Ciência | Pousar perto das regiões em sombra permanente | Possível gelo de água preso nessas regiões |
| Engenharia | Luz e contato com a Terra | Energia solar e comunicação direta |

Esses objetivos se opõem: perto da sombra permanente tende a haver menos luz. A ferramenta mostra **os dois lados na mesma tela** e aponta o melhor compromisso para as datas escolhidas.

Pergunta do pitch: *"Your launch just slipped three weeks. Which site still works for science and engineering?"*

## Usuários

- **Planejador de missão (principal, para o pitch):** quer comparar locais e reagir a atrasos.
- **Educador:** quer mostrar por que o relevo importa no polo sul.
- **Público:** quer entender visualmente onde e quando há Sol e Terra no céu lunar.

## Forma do MVP

- Demonstração com dados reais, volume pequeno, visual forte.
- Site estático, sem servidor. Os dados são pré-calculados por um pipeline Python.
- Cinco locais fixos: Shackleton rim, Connecting ridge, de Gerlache rim, Malapert massif, Haworth.
- Um ano de efemérides, passo de uma hora (intervalo exato: ver `docs/DADOS.md`).

## Telas planejadas (etapa 5)

1. **Abertura:** o problema em uma frase e o mapa dos cinco locais.
2. **Painel de missão:** comparação dos locais (luz, contato com a Terra, distância à sombra permanente) com **controle de atraso** (deslocar a janela de pouso em dias/semanas).
3. **Detalhe do local:** panorama do horizonte (360°) com as trajetórias do Sol e da Terra e linha do tempo de visibilidade.

## Fora do MVP

- Locais escolhidos livremente pelo usuário (só a lista fechada de cinco).
- Cálculo em tempo real no navegador a partir do relevo bruto.
- Servidor, contas de usuário, banco de dados.
- Modelos térmicos, de bateria ou de enlace de rádio (potência, taxa de dados).
- Relé de comunicação por satélite (só contato direto com a Terra).
- Sombras projetadas pelo próprio módulo de pouso, altura de antena/painel acima do solo.
- Qualquer uso de IA para fazer ou escolher cálculos.
- Uso em planejamento real de missão.
