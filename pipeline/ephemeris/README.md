# Etapa 1 — Efemérides

**O que faz:** consulta o JPL Horizons e obtém, para cada local, azimute e elevação do Sol e da Terra, hora a hora, durante um ano.

- **Entra:** lista dos cinco locais (id, latitude, longitude — `PENDENTE:` ver `docs/DADOS.md`), intervalo 2027-01-01T00:00:00Z a 2027-12-31T23:00:00Z, passo de 1 hora (D8).
- **Fonte:** JPL Horizons API — https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **Cache:** respostas brutas da API em `data/raw/horizons/` (fora do git).
- **Sai:** um arquivo por local em `data/ephemeris/` com `t` (UTC), `sun_az`, `sun_el`, `earth_az`, `earth_el` em graus.
- **Pronto quando:** houver um arquivo por local **e** as verificações de sanidade passarem (8.760 registros horários, sem lacunas; azimute em [0, 360); elevação em [-90, 90]; alguns pontos conferidos manualmente na interface web do Horizons).
- **Ponto de controle:** um local pronto até sábado 18h.
- **Atenção:** a elevação do Horizons é contra um horizonte ideal (sem relevo). Confirmar o referencial das coordenadas (MOON_ME).
