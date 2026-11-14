# Glossário

Termos em linguagem simples, para o time e para o pitch.

**Azimute** — A direção de algo no céu, medida ao longo do horizonte, em graus de 0 a 360. É como uma bússola: diz "para que lado olhar". (A origem e o sentido exatos que usamos estão em `CONTRATO_DE_DADOS.md`.)

**Elevação** — A altura de algo acima do horizonte, em graus. 0° é rente ao horizonte, 90° é bem em cima da cabeça, valores negativos significam abaixo do horizonte.

**Efeméride** — Uma tabela que diz onde um astro está no céu em cada instante. No projeto, as efemérides do JPL Horizons dizem onde estão o Sol e a Terra, hora a hora, vistos de cada local.

**Horizonte (ideal e real)** — O horizonte **ideal** é uma linha perfeitamente plana em volta do observador (o que o Horizons usa). O horizonte **real** é o contorno do terreno: montanhas e bordas de cratera que levantam a linha do horizonte em algumas direções. No projeto, o horizonte real é uma lista de 360 elevações, uma para cada grau de azimute.

**Libração** — Um pequeno "balanço" aparente da Lua. Visto da superfície lunar, faz com que a Terra não fique parada no céu: ela oscila numa região pequena. No polo sul, onde a Terra fica baixa, essa oscilação pode fazer a Terra aparecer e sumir atrás do relevo.

**Sombra permanente (PSR, *permanently shadowed region*)** — Região, geralmente no fundo de crateras perto dos polos, onde a luz do Sol não chega diretamente. São muito frias e podem guardar gelo de água — por isso interessam à ciência.

**Dia lunar** — O ciclo de dia e noite na Lua, que dura cerca de 29,5 dias terrestres (aproximadamente duas semanas de luz e duas de escuridão em latitudes médias). Perto dos polos o Sol fica sempre baixo e o relevo altera muito esse padrão.

**Linha de visada** — Caminho reto e desimpedido entre dois pontos. Comunicação direta com a Terra precisa de linha de visada até a Terra.

**Topocêntrico** — "Visto de um ponto da superfície". As efemérides que usamos são topocêntricas: posições do Sol e da Terra vistas do local de pouso, não do centro da Lua.

**Referencial (ex.: MOON_ME)** — O sistema de coordenadas usado para dizer onde fica um ponto na Lua. Dados de fontes diferentes só podem ser combinados se usarem o mesmo referencial (ou se convertermos entre eles).

**LOLA** — *Lunar Orbiter Laser Altimeter*, instrumento da sonda LRO que mediu a altura do terreno lunar. Base dos mapas de relevo que usamos.

**PGDA** — *Planetary Geodesy Data Archive*, do NASA Goddard, onde estão publicados os produtos de relevo, sombra permanente e iluminação que usamos.
