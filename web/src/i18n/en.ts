/**
 * What: English messages (default language). Keys are the source of truth for MessageKey.
 * Roadmap stage: 5 — Interface (see docs/ROTEIRO.md); decision docs/DECISOES.md D38.
 * Placeholders: see translate.ts. Site and source names are never translated.
 */
export const en = {
  // app shell
  'app.loading': 'Loading site data…',
  'app.dataErrorTitle': 'Data error',
  'app.dataErrorIntro': 'The data files do not match the data contract:',
  'app.noSites': 'No sites in sites.json.',
  'app.backToDashboard': 'Back to the mission dashboard',
  'app.unknownSite': 'Unknown site',
  'app.detailComing': 'Site detail: coming next.',

  // header
  'header.title': 'Lunar Site Navigator',
  'header.context': 'Lunar south pole · real NASA data',
  'header.sample': 'SAMPLE DATA',
  'header.whatThisAdds': 'What this adds',
  'header.language': 'Language',
  'header.close': 'Close',
  'lang.en': 'English',
  'lang.pt-BR': 'Português (Brasil)',

  // opening
  'intro.kicker': 'Lunar south pole · Real NASA data',
  'intro.question': 'Your launch just slipped three weeks. Which site still works?',
  'intro.open': 'Open mission panel',
  'intro.whatThisAdds': 'What this adds',
  'intro.lead':
    "Compare landing sites at the Moon's south pole by sunlight, Earth contact and science value, on any date.",
  'intro.how': 'How it works',
  'intro.problem':
    "At the Moon's south pole, the Sun and the Earth sit right on the horizon. One ridge can leave a lander without power or contact. See, for each site and date, whether it will have sunlight and a link to Earth, and which site still works when the launch slips.",
  'intro.f1Title': 'Sun and Earth',
  'intro.f1':
    'See sunlight and direct contact with Earth at each site and date, with the real terrain on the horizon.',
  'intro.f2Title': 'Side by side',
  'intro.f2': 'Compare the sites at once, with a science score and an engineering score.',
  'intro.f3Title': 'Replan a delay',
  'intro.f3': 'Move the launch date and see at once which site still works.',
  'intro.statPoints': 'reference points evaluated',
  'intro.statHours': 'hours of Sun and Earth data per site, {year}',
  'intro.statNone': 'days of {year} when no site works (of {total:int})',
  'intro.statDelay':
    'landing dates where a {d:int}-day delay changes the best site (of {total:int})',
  'intro.statsNote':
    'Computed in your browser from the data files, with the default mission rules ({days:int}-day mission).',
  'intro.sources': 'Data sources',
  'langShort.en': 'EN',
  'langShort.pt-BR': 'PT',

  // what this adds
  'adds.today': 'Today',
  'adds.withTool': 'With this tool',
  'adds.r1a': 'One scenario at a time',
  'adds.r1b': 'Several sites side by side',
  'adds.r2a': 'Raw data',
  'adds.r2b': 'A verdict with its reason',
  'adds.r3a': 'Three interfaces',
  'adds.r3b': 'One screen',
  'adds.r4a': 'Engineering only',
  'adds.r4b': 'Science and engineering',
  'adds.r5a': 'Redo everything when the date changes',
  'adds.r5b': 'A delay control',
  'adds.note':
    'JPL Horizons, LROC Quickmap and NASA Moon Trek remain the sources and the tools for detailed analysis.',

  // scope
  'covers.title': 'What this tool covers',
  'covers.planning':
    'A planning tool, used on Earth before launch. Verdicts come from fixed decision rules and scoring, shown on screen.',
  'covers.bestCaseTitle': 'Best case per region, not a landing area.',
  'covers.bestCase':
    "Each site point is the most-illuminated 60 m pixel of its NASA region on NASA's average-illumination map; neighbouring pixels can get much less light.",
  'covers.covers': 'Covers',
  'covers.notCovers': 'Does not cover',
  'covers.c1': 'Sunlight at the site (power)',
  'covers.c2': 'Direct line of sight to Earth (communication)',
  'covers.c3': 'Terrain slope at the site',
  'covers.c4': 'Proximity to permanently shadowed regions (science)',
  'covers.n1': 'Trajectory and propellant',
  'covers.n2': 'Thermal environment',
  'covers.n3': 'Obstacles on the ground (rocks, craters below the map resolution)',
  'covers.n4': 'Relay satellite networks',

  // footer
  'footer.sources':
    'Sources: JPL Horizons (Sun and Earth positions); LRO LOLA topography, illumination and permanent-shadow products, NASA Goddard PGDA (products 69, 78, 90); NASA Lunar Surface Data Book (site regions); Moon globe texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC color).',
  'footer.points': 'Regional reference points, not NASA-designated landing sites.',
  'footer.independent': 'Independent hackathon project, not a NASA product.',
  'footer.event': 'NASA Space Apps Challenge 2026.',
  'footer.future': 'A version for education is a possible future step.',

  // controls
  'controls.landing': 'Landing day (UTC)',
  'controls.duration': 'Mission',
  'controls.durationOption': '{n:int} days',
  'controls.delay': 'Launch delay',
  'controls.withDelay': 'Landing with delay',
  'controls.delayReadout': '+{d:int} d → {date:date}',
  'controls.delayAria': '{d:int} days',
  'controls.slip': 'Slip {n:int} days',
  'controls.noDelay': 'No delay',

  // warnings and summaries
  'warn.outside':
    'The mission ({days:int} days from {date:date}) runs past the data, which cover {start:date} to {end:date}. Results are not computed with incomplete data.',
  'warn.noSite': 'No site meets the mission rules on {date:date}.',
  'earliest.after': 'Earliest viable site after the slip',
  'earliest.from': 'Earliest viable site from this date',
  'earliest.value': '{site}, landing {date:date} (viable for {n:int} landing days in a row)',
  'earliest.none': 'none before the end of the data.',
  'census.title': 'Landing days that work in {year} ({days:int}-day mission, current rules)',
  'census.noneShort': 'days with no site (of {total:int})',
  'aria.best': 'Best compromise: {site}',
  'aria.noBest': 'No site qualifies with these rules.',
  'cards.aria': 'Sites ranked for this mission',
  'section.map': 'South pole map',
  'section.scatter': 'Science versus engineering',

  // verdicts
  'verdict.viable': 'Viable',
  'verdict.marginal': 'Marginal',
  'verdict.not-viable': 'Not viable',

  // cards
  'card.best': 'Best compromise',
  'card.engineering': 'Engineering',
  'card.science': 'Science',
  'card.aria': '{site}, rank {rank:int}, {verdict:verdict}',
  'card.ariaBest': '{site}, rank {rank:int}, {verdict:verdict}, best compromise',
  'card.landingAt': 'Landing {t:datetime}',
  'card.noLandingHour': 'No hour of this day meets the landing rules.',
  'card.next': 'Next viable landing: {date:date} (viable {n:int} days in a row)',
  'card.noNext': 'No viable landing left in the data year.',
  'card.linkContinuous': 'Direct link {p:pct} of mission',
  'card.linkGaps':
    'Direct link {p:pct} of mission · longest gap {g:hours} (relay needed during gaps)',
  'card.linkLow': 'Direct link only {p:pct} of mission: relay satellite required',
  'card.sun': '{p:pct} sun',
  'card.sunTitle': 'Mission hours with some part of the Sun visible',
  'card.psr': '{km:km1} to permanent shadow',
  'card.psrTitle': 'Distance to the nearest permanently shadowed region',
  'card.slope': 'Slope {s:deg1}',
  'card.slopeTitle': 'Local terrain slope (20 m DEM)',
  'card.howBuilt': 'How the scores are built',
  'card.partValue': '{v:pct} × {w:int}',
  'card.partPoints': '= {p:dec1}',
  'card.fullDisc':
    'Full solar disc {s:hours}; full Earth disc {e:hours}. Weights are team choices.',
  'card.details': 'Site details',
  'card.outside': 'The mission runs past the end of the data. Choose an earlier day.',
  'card.outsideAria': '{site}: outside the data',

  // score parts
  'part.sunlight': 'Sunlight during mission',
  'part.sunlightFromLanding': 'Continuous sunlight from landing',
  'part.earthContact': 'Earth in view during mission',
  'part.contactGaps': 'Short gaps without Earth contact',
  'part.psrProximity': 'Proximity to permanent shadow',

  // verdict reasons (built by the calc module as key + parameters)
  'reason.darkAtLanding':
    'Dark at landing: the Sun is behind the terrain (rule: Sun visible at landing).',
  'reason.survivalDarkness': 'Longest darkness {h:hours} exceeds the {limit:hours} survival limit.',
  'reason.minSunFraction': 'Only {p:pct} of the mission in sunlight (minimum {min:pct}).',
  'reason.marginalSunFraction':
    '{p:pct} of the mission in sunlight, below the {comfort:pct} comfort level.',
  'reason.engineering':
    'Engineering score {score:dec1floor} below {min:int}: Earth in view {earth:pct}, longest contact gap {gap:hours}.',
  'reason.slope':
    'Terrain slope {slope:deg1} exceeds the {limit:deg1} limit (would otherwise be {would:verdict}).',
  'reason.viable': '{p:pct} sunlit, Earth in view {earth:pct}, permanent shadow {km:km1} away.',
  'reason.viableNoPsr': '{p:pct} sunlit, Earth in view {earth:pct}.',

  // mission rules
  'rules.title': 'Mission rules',
  'rules.note': "Defaults are our team's choices for this demo, not NASA requirements.",
  'rules.sunAtLanding': 'Sun visible at landing',
  'rules.survival': 'Survival limit: longest darkness (h)',
  'rules.minSun': 'Minimum sunlit share (%)',
  'rules.marginalSun': 'Marginal below sunlit share (%)',
  'rules.viableEng': 'Viable: engineering ≥',
  'rules.scienceFilter': 'Minimum science score filter',
  'rules.scienceFilterEnable': 'Enable the minimum science score filter',
  'rules.scienceFilterValue': 'Minimum science score',
  'rules.relay': 'Relay alert below direct link (%)',
  'rules.slope': 'Max terrain slope (°)',
  'rules.reset': 'Reset to defaults',
  'rules.explain':
    'Not viable: no hour of the landing day with the Sun visible, a darkness longer than the survival limit, or too little sunlight. Marginal: sunlight below the comfort share, or an engineering score below the viable minimum. The verdict uses engineering rules only; the science score ranks the sites. Earth contact counts through the engineering score. A terrain slope above the limit lowers the verdict by one level. Best compromise: the site with the highest of min(engineering, science) among sites that are not "not viable" (and pass the optional science filter).',

  // scatter
  'scatter.title': 'Science × engineering',
  'scatter.legend': '● meets the hard rules ○ not viable',
  'scatter.trail': 'faint ring = planned date, line = move with +{d:int} d',
  'scatter.x': 'Science score ◆',
  'scatter.y': 'Engineering score ●▲',
  'scatter.zone': 'engineering ≥ viable minimum (team rules)',
  'scatter.aria': 'Science score versus engineering score for each site',

  // annual strips
  'strips.title': '{year} at a glance: Sun and Earth by day',
  'strips.sun': 'share of the day with the Sun visible',
  'strips.earth': 'share of the day with the Earth visible',
  'strips.planned': 'planned landing {date:date}',
  'strips.delayed': 'landing with delay {date:date} + mission',
  'strips.rowAria': '{site}: daily Sun and Earth visibility in {year}',

  // map / 3D
  'map.title2d': 'South pole · shaded relief (LOLA {px:int} m/pixel, visual only)',
  'map.title3d': 'South pole · 3D, Sun at the landing instant (LOLA {px:int} m/pixel, visual only)',
  'map.orientation': 'Up = 0° E (toward Earth) · pole at centre',
  'map.aria': 'South polar map with the sites',
  'map.select': 'Select {site}',
  'map.show2d': 'Show 2D map',
  'map.show3d': 'Show 3D view',
  'map.demoNote': '○ Shackleton inner wall, kept to show how much the exact position matters.',
  'map.how3d':
    'Drag to rotate, scroll to zoom (or arrow keys, +/−, R). Light comes from the Sun as seen from the selected site at the landing instant.',
  'map.how2d': 'Static light.',
  'map.numbersNote': 'Numbers come from the horizon calculation, not from this picture.',
  'scene.vertical': 'Vertical ×{n:int}',
  'scene.verticalAria': 'Vertical exaggeration',
  'scene.reset': 'Reset view',
  'scene.sun': 'Sun {el:deg1}',
  'scene.at': 'at {site}',
  'scene.earth': 'Earth',
  'scene.curvature': 'curvature on',
  'scene.visualOnly': 'visual only',
  'scene.aria': '3D south pole view. Arrow keys rotate and tilt, plus and minus zoom, R resets.',
  'scene.loading': 'Loading the 3D view…',
  'scene.youAreHere': 'You are here',

  // site facts
  'facts.pick': 'Click a site on the map, a card or the scatter.',
  'facts.site': 'Site',
  'facts.point': 'Point',
  'facts.published': 'Published point (NASA Lunar Surface Data Book)',
  'facts.derived': 'Derived: most-illuminated 60 m pixel of its NASA region (best case)',
  'facts.position': 'Position',
  'facts.positionValue': '{lat:dec1}°, {lon:dec1}° E',
  'facts.terrain': 'Terrain',
  'facts.terrainValue': '{h:int} m · slope {s:deg1}',
  'facts.psr': 'Permanent shadow',
  'facts.psrValue': '{km:km1} · {a:dec1} km² region',
  'facts.nasa': 'NASA 18.6-yr averages',

  // units
  'unit.km': '{n} km',
  'unit.hours': '{n} h',
  'unit.days': '{n} days',
  'unit.beyondData': 'beyond the data',
  'unit.na': 'n/a',
} as const;
