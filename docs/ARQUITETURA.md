# Arquitetura

## Visão geral

Pipeline Python **offline** que baixa e processa dados da NASA e gera arquivos JSON pequenos. Um **site estático** (Vite + React + TypeScript) lê esses arquivos. Não há servidor.

## Fluxo de dados

```mermaid
flowchart LR
    subgraph Fontes["Fontes NASA"]
        H["JPL Horizons API<br/>(efemérides)"]
        L["LOLA relevo polar<br/>PGDA produto 90 / 78"]
        P["Mapa de sombra permanente<br/>PGDA produto 90"]
        I["Iluminação média<br/>PGDA produto 69"]
    end

    subgraph Pipeline["pipeline/ (Python)"]
        E1["Etapa 1<br/>ephemeris/"]
        E2["Etapa 2<br/>horizon/"]
        E3["Etapa 3<br/>science/"]
        E4["Etapa 4<br/>export/"]
    end

    subgraph Dados["data/"]
        R[("raw/<br/>downloads brutos")]
        DE[("ephemeris/<br/>um arquivo por local")]
        DH[("horizon/<br/>360 elevações por local")]
        DA[("app/<br/>sites.json + sites/&lt;id&gt;.json")]
    end

    subgraph Web["web/ (site estático)"]
        SY["npm run sync-data<br/>copia data/app → web/public/data"]
        VIS["módulo de visibilidade<br/>(TS, funções puras, testes)"]
        UI["Vite + React + TS<br/>abertura · painel de missão · detalhe do local"]
        E6["Etapa 6<br/>validação"]
    end

    H --> E1 --> DE
    L --> R --> E2 --> DH
    P --> R --> E3
    DE --> E4
    DH --> E4
    E3 --> E4
    E4 --> DA --> SY --> VIS --> UI
    VIS --> E6
    I --> E6
```

- O pipeline exporta **apenas** horizonte e séries do Sol e da Terra (mais metadados e `psr_distance_km`). **Visibilidade e métricas são calculadas na interface**, num único módulo TypeScript; a validação da etapa 6 usa o mesmo módulo (D9).
- A interface lê `web/public/data/`, cópia de `data/app/` feita por `npm run sync-data` antes do dev e do build (D10).
- A etapa 5 (interface) começa em paralelo usando **dados de exemplo no mesmo formato** de `data/app/` (marcados `meta.sample = true`).

## Como os dados se unem

Tudo é convertido para o mesmo ponto de vista: **o céu visto do local de pouso**, descrito por

- **azimute**: direção no plano do horizonte, em graus (0–360);
- **elevação**: altura acima do horizonte, em graus (negativa = abaixo).

```mermaid
flowchart TB
    subgraph Ceu["Céu visto do local (azimute, elevação)"]
        S["Sol: (sun_az, sun_el) por hora<br/>— Horizons"]
        T["Terra: (earth_az, earth_el) por hora<br/>— Horizons"]
        HZ["Terreno: horizon[az] para az = 0..359<br/>— LOLA"]
    end
    S --> V{"sun_el > horizon[sun_az] ?"}
    HZ --> V
    T --> W{"earth_el > horizon[earth_az] ?"}
    HZ --> W
    V -->|sim| SL["Sol visível → energia"]
    V -->|não| SN["Sol bloqueado"]
    W -->|sim| TL["Terra visível → comunicação direta"]
    W -->|não| TN["Terra bloqueada"]
```

1. **JPL Horizons** fornece azimute e elevação do Sol e da Terra, hora a hora, vistos de cada local (observador topocêntrico na superfície lunar). A elevação do Horizons é contra um **horizonte ideal, sem relevo**.
2. **Relevo do LOLA** (NASA Goddard PGDA) vira, para cada direção (1 grau de azimute), a **elevação angular do terreno** vista do local. É o contorno do horizonte.
3. **Regra de visibilidade:** o astro está visível se a elevação dele é **maior** que a do terreno na mesma direção:
   `visível(t) = el_astro(t) > horizon[round(az_astro(t)) mod 360]`
   Essa regra vive num único módulo TypeScript da interface (D9); o método exato de interpolação entre graus será definido na etapa 5 e registrado em `DECISOES.md`.
4. **Mapa de sombra permanente** (PGDA) dá a distância de cada local até a sombra permanente mais próxima — o **valor científico**.

Com isso, cada local recebe, para qualquer janela de datas:

- **% de horas com Sol** (proxy de energia);
- **% de horas com a Terra visível** (proxy de comunicação direta);
- **distância à sombra permanente** (proxy de valor científico).

### Condições para a união funcionar

- **Mesmo referencial:** as coordenadas enviadas ao Horizons e as do relevo devem estar no mesmo referencial lunar. `PENDENTE:` confirmar que ambos usam MOON_ME (ver `DADOS.md`).
- **Mesma convenção de azimute:** Horizons e o horizonte calculado devem medir o azimute do mesmo jeito (origem e sentido). `PENDENTE:` confirmar a convenção do Horizons e adotá-la no cálculo do horizonte; registrar em `CONTRATO_DE_DADOS.md`.
- **Tempo em UTC** em todos os arquivos.

## Onde cada coisa roda

| Parte | Quando roda | Onde |
|-------|-------------|------|
| Pipeline (etapas 1–4) | Uma vez, na máquina do time | `pipeline/` |
| Sincronização de dados | Antes do dev e do build (`npm run sync-data`) | `data/app/` → `web/public/data/` |
| Interface (etapa 5) | No navegador do visitante | `web/`, lendo `web/public/data/` |
| Validação (etapa 6) | Uma vez, na máquina do time | script/teste TypeScript em `web/`, usando o módulo de visibilidade |

Os cálculos pesados (efemérides, horizonte, distâncias) ficam no pipeline. No navegador ficam a regra de visibilidade e as métricas sobre os dados pré-calculados, num único módulo de funções puras.
