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

  // header
  'header.title': 'Lunar Site Navigator',
  'header.context': 'Lunar south pole · real NASA data',
  'header.sample': 'SAMPLE DATA',
  'header.whatThisAdds': 'About',
  'header.language': 'Language',
  'header.close': 'Close',
  'lang.en': 'English',
  'lang.pt-BR': 'Português (Brasil)',

  // opening
  'intro.kicker': 'Mission planning · Lunar south pole · Real NASA data',
  'intro.open': 'Open mission panel',
  'intro.lead':
    "Compare landing sites at the Moon's south pole by sunlight, Earth contact and science value, on any date.",
  'intro.how': 'How it works',
  'intro.problem':
    'Near the lunar south pole the Sun and the Earth stay close to the horizon, so the surrounding terrain decides whether a site has sunlight and a direct link to Earth.',
  'intro.f1Title': 'Sunlight and Earth contact',
  'intro.f1':
    'Hourly visibility of the Sun and the Earth at each site, against the terrain horizon.',
  'intro.f2Title': 'Site comparison',
  'intro.f2': 'Science and engineering scores for all sites, side by side.',
  'intro.f3Title': 'Delay replanning',
  'intro.f3': 'Results for the new landing date when the launch moves.',
  'intro.statShackValue': '{a:pct}',
  'intro.statShack': 'NASA average sunlight at two Shackleton points, {km:km1} apart',
  'intro.statBest':
    'viable landing days at {site}, the site with the most viable landing days, of {total:int} possible landing days in {year}',
  'intro.dataScope':
    '{n:int} reference points · {h:int} hours of Sun and Earth data per site, {year}.',
  'intro.statNone': 'days with no viable site, of {total:int} possible landing days in {year}',
  'intro.statDelay': 'landing dates where +{d:int} days changes the best site',
  'intro.statsNote':
    'Computed in the browser from the data files with the default rules ({days:int}-day mission).',
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
  'covers.title': 'Scope',
  'covers.planning': 'Planning tool, used on Earth before launch.',
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
    'JPL Horizons (Sun and Earth positions); LRO LOLA topography, illumination and permanent-shadow products, NASA Goddard PGDA (products 69, 78, 90); NASA Lunar Surface Data Book (site regions); Moon globe texture: NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC color).',
  'footer.points': 'Regional reference points, not NASA-designated landing sites.',
  'footer.independent': 'Independent hackathon project, not a NASA product.',
  'footer.event': 'NASA Space Apps Challenge 2026.',

  // controls
  'controls.landing': 'Landing day (UTC)',
  'controls.duration': 'Mission length',
  'controls.durationOption': '{n:int} {n:plural:day|days}',
  'controls.delay': 'Launch delay',
  'controls.withDelay': 'Delayed landing',
  'controls.delayReadout': '+{d:int} d → {date:date}',
  'controls.delayAria': '{d:int} {d:plural:day|days}',
  'controls.slip': '+{n:int} {n:plural:day|days}',
  'controls.noDelay': 'Reset',

  // warnings and summaries
  'warn.outside':
    'The {days:int}-day mission from {date:date} runs past the data ({start:date} to {end:date}). No results.',
  'warn.noSite': 'No viable site on {date:date}.',
  'earliest.after': 'Earliest viable landing',
  'earliest.from': 'Earliest viable landing',
  'earliest.value': '{site}, {date:date} ({n:int} consecutive {n:plural:day|days})',
  'earliest.none': 'None in the data period.',
  'census.title': 'Viable landing days, {year}',
  'census.noneShort': 'no viable site, of {total:int} possible landing days',
  'aria.best': 'Best overall: {site}',
  'aria.noBest': 'No site qualifies with these rules.',
  'cards.aria': 'Sites ranked for this mission',
  'section.map': 'South pole map',

  // verdicts
  'verdict.viable': 'Viable',
  'verdict.marginal': 'Marginal',
  'verdict.not-viable': 'Not viable',

  // cards
  'card.best': 'Best overall',
  'card.engineering': 'Engineering',
  'card.science': 'Science',
  'card.aria': '{site}, rank {rank:int}, {verdict:verdict}',
  'card.ariaBest': '{site}, rank {rank:int}, {verdict:verdict}, best overall',
  'card.landingAt': 'Landing {t:datetime}',
  'card.noLandingHour': 'No hour of this day meets the landing rules.',
  'card.next': 'Next viable: {date:date} ({n:int} consecutive {n:plural:day|days})',
  'card.noNext': 'No viable landing before the end of the data.',
  'card.linkContinuous': 'Direct link {p:pct} of mission',
  'card.linkGaps': 'Direct link {p:pct} of mission · longest gap {g:hours}',
  'card.linkLow': 'Direct link only {p:pct} of mission: relay satellite required',
  'card.sun': 'Sun {p:pct}',
  'card.sunTitle': 'Mission hours with some part of the Sun visible',
  'card.psr': '{km:km1} to permanent shadow ({a:dec1} km² region)',
  'card.psrTitle': 'Distance to the nearest permanently shadowed region',
  'card.slope': 'Slope {s:deg1}',
  'card.slopeTitle': 'Local terrain slope (20 m DEM)',
  'card.howBuilt': 'Score breakdown',
  'card.partValue': '{v:pct} × {w:int}',
  'card.partPoints': '= {p:dec1}',
  'card.fullDisc': 'Full disc: Sun {s:hours}, Earth {e:hours}.',
  'card.details': 'Site details',
  'card.outside': 'The mission runs past the end of the data. Choose an earlier day.',
  'card.outsideAria': '{site}: outside the data',

  // score parts
  'part.sunlight': 'Sunlight',
  'part.sunlightFromLanding': 'Sunlight from landing',
  'part.earthContact': 'Earth in view',
  'part.contactGaps': 'Contact gaps',
  'part.psrProximity': 'Proximity to permanent shadow',

  // verdict reasons (built by the calc module as key + parameters)
  'reason.darkAtLanding': 'Sun behind the terrain at landing.',
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
  'rules.note': 'Defaults are team choices, not NASA requirements.',
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
    'The verdict uses engineering rules only; science ranks the sites, and the best overall has the highest min(engineering, science).',

  // scatter
  'scatter.title': 'Science × engineering',
  'scatter.legend': '● meets the hard rules ○ not viable',
  'scatter.trail': 'faint ring = planned date, line = move with +{d:int} d',
  'scatter.x': 'Science score ◆',
  'scatter.y': 'Engineering score ●▲',
  'scatter.zone': 'engineering ≥ viable minimum (team rules)',
  'scatter.aria': 'Science score versus engineering score for each site',

  // annual strips
  'strips.title': '{year} availability',
  'strips.sun': 'Sun, share of day',
  'strips.earth': 'Earth, share of day',
  'strips.planned': 'Planned landing {date:date}',
  'strips.delayed': 'Delayed landing {date:date} + mission',
  'strips.rowAria': '{site}: daily Sun and Earth visibility in {year}',

  // map / 3D
  'map.title2d': 'South pole, relief',
  'map.title3d': 'South pole, 3D',
  'map.orientation': 'Up = 0° E (toward Earth) · pole at centre',
  'map.aria': 'South polar map with the sites',
  'map.select': 'Select {site}',
  'map.show2d': 'Show 2D map',
  'map.show3d': 'Show 3D view',
  'map.demoNote':
    'Hollow marker: Shackleton inner wall, kept to show the effect of the exact position.',
  'map.how3d':
    'Drag to rotate, scroll to zoom (or arrow keys, +/−, R). Light: the Sun seen from the selected site at the landing time.',
  'map.how2d': 'Fixed light.',
  'map.numbersNote': 'The numbers come from the horizon calculation, not from this view.',
  'scene.vertical': 'Vertical ×{n:int}',
  'scene.verticalAria': 'Vertical exaggeration',
  'scene.reset': 'Reset view',
  'scene.at': 'at {site}',
  'scene.aria': '3D south pole view. Arrow keys rotate and tilt, plus and minus zoom, R resets.',
  'scene.loading': 'Loading the 3D view…',
  'scene.youAreHere': 'South pole',

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

  // site detail (D42)
  'detail.panorama': 'Horizon, 360°',
  'detail.vertical': 'Vertical ×{n:int}',
  'detail.realSize':
    'Sun ({s:deg1}) and Earth ({e:deg1}) drawn as circles at their real angular size on the vertical scale; the horizontal scale is compressed, so widths are not to scale. Strong line: visible; faint line: behind the terrain; dots: rise and set.',
  'detail.astroHorizon': '0° (flat horizon)',
  'detail.sun': 'Sun',
  'detail.earth': 'Earth',
  'detail.panoramaAria':
    '360-degree horizon panorama of {site} with the Sun and the Earth at {t:datetime}',
  'detail.time': 'Mission time',
  'detail.now': '{t:datetime}',
  'detail.play': 'Play',
  'detail.pause': 'Pause',
  'detail.hourOf': 'Hour {h:int} of {n:int}',
  'detail.visible': 'visible',
  'detail.partial': 'partly visible',
  'detail.hidden': 'behind the terrain',
  'detail.timeline': 'Mission timeline',
  'detail.sunRow': 'Sunlight',
  'detail.earthRow': 'Direct contact with Earth',
  'detail.nextSunset': 'Next sunset in {h:hours}',
  'detail.noSunset': 'No sunset before the mission ends',
  'detail.nextSunrise': 'Next sunrise in {h:hours}',
  'detail.noSunrise': 'No sunrise before the mission ends',
  'detail.nextEarthLoss': 'Next loss of direct contact in {h:hours}',
  'detail.noEarthLoss': 'No loss of direct contact before the mission ends',
  'detail.nextEarthRise': 'Contact again in {h:hours}',
  'detail.noEarthRise': 'No contact before the mission ends',
  'detail.scores': 'Verdict and scores',
  'detail.dataLimits': 'Data and limits',
  'detail.sources': 'Sources',
  'detail.demRes': 'Terrain resolution',
  'detail.band': '{px:int} m up to {km:int} km',
  'detail.observer': 'Observer height',
  'detail.observerValue': '{m:dec1} m above the ground (mast)',
  'detail.signal':
    'About 1.3 s each way: mean Earth–Moon distance (384,400 km, NASA) divided by the speed of light.',
  'detail.directOnly': 'Direct line of sight only; relay satellites are not modelled.',
  'detail.notFound': 'This site is not in the data.',
  'dir.N': 'N',
  'dir.E': 'E',
  'dir.S': 'S',
  'dir.W': 'W',

  // small move, big change (D43)
  'small.title': 'Position sensitivity',
  'small.lead': '{a} and {b}: {km:km1} apart, same landing day and rules.',
  'small.aria': 'Horizon contours of {a} and {b} on the same scale',
  'small.sunPath': 'Sun path',
  'small.verdict': 'Verdict',
  'small.sun': 'Sunlight',
  'small.earth': 'Direct contact with Earth',
  'small.pct': '{p:pct}',
  'small.dark': 'Longest darkness',
  'small.gap': 'Longest gap without contact',
  'small.hours': '{h:hours}',
  'small.deg': '{s:deg1}',
  'small.slope': 'Slope',
  'small.reason': 'Reason',

  // roadmap (D44)
  'header.roadmap': 'Roadmap',
  'roadmap.title': 'Roadmap',
  'roadmap.now': 'Now',
  'roadmap.m3': 'In 3 months',
  'roadmap.m6': 'In 6 months',
  'roadmap.available': 'Working today',
  'roadmap.concept': 'Concept, not implemented',
  'roadmap.now1': 'Reference points at the lunar south pole',
  'roadmap.now2': 'One year of hourly Sun and Earth data',
  'roadmap.now3': 'Adjustable decision rules',
  'roadmap.m3_1': 'Any coordinate, and the whole region evaluated instead of the best pixel',
  'roadmap.m3_2': 'Several years of data',
  'roadmap.m3_3': 'Coverage of relay satellites',
  'roadmap.m3_4': 'Two points per region: best for engineering and best for science',
  'roadmap.m3_5': 'A written summary of the result by AI, from the numbers the fixed code computed',
  'roadmap.m6_1': 'AI to refine the terrain with new data from spacecraft',
  'roadmap.m6_2': 'The same method applied to Mars and other bodies',
  'roadmap.m6_3': 'An education version',

  // stage 6 check (D45)
  'check.title': 'Comparison with NASA averages',
  'check.lead':
    'Hours of {year} with some part of the Sun or the Earth above the terrain horizon, beside NASA averages for the same points (PGDA product 69).',
  'check.site': 'Site',
  'check.sunOurs': 'Sun, {year} (this tool)',
  'check.sunNasa': 'Sun, NASA average',
  'check.earthOurs': 'Earth, {year} (this tool)',
  'check.earthNasa': 'Earth, NASA average',
  'check.difference': 'Difference',
  'check.pct': '{v:dec1}%',
  'check.diff': '{sign}{d:dec1} pts',
  'check.whyTitle': 'Why they differ',
  'check.why1':
    'NASA averages 18.6 years of hourly steps (a full lunar nutation cycle); this tool looks at 2027 only, a single year within that cycle, so the paths of the Sun and especially the Earth over the terrain differ from the long-term average.',
  'check.why2':
    'NASA uses a 60 m terrain map; this tool uses 20, 80 and 320 m maps by distance, with the observer on a 2 m mast.',
  'check.why3':
    'Each NASA value is one 60 m pixel; within about 90 m it can change by tens of points (see data/validation/COMPARISON.md).',
  'check.why4':
    'The tool looks up the horizon only at the whole degree of azimuth nearest the disc centre; the Earth is about 1.9° wide, so terrain under the edges of its disc is not checked.',
  'check.notTuned': 'Nothing was adjusted to bring the numbers closer.',

  // text review (D50)
  'map.resolution': 'LOLA relief, {px:int} m per pixel; vertical scale exaggerated. Visual only.',
  'info.label': 'More information',
  'census.tip':
    '{days:int}-day mission, current rules. Possible landing days: the mission has to end within the data.',
  'detail.teamRules': 'Weights and limits of the scores are team choices, not NASA requirements.',
  'about.title': 'About',
  'about.compare': 'Compared with existing tools',
  'about.sources': 'Sources',
  'detail.limitBestCase': 'Best case',
  'detail.limitLink': 'Earth link',
  'detail.limitSignal': 'Signal delay',
  'detail.limitRules': 'Scores',

  // text review decisions (D50)
  'card.linkTip': 'During gaps without direct contact, a relay satellite is needed.',
  'card.rule': 'Rule: {rule}',
  'rule.sunAtLanding': 'Sun visible at landing',
  'rule.survivalDarkness': 'Longest darkness at most {h:hours}',
  'rule.minSunFraction': 'Sunlight in at least {p:pct} of the mission',
  'rule.marginalSunFraction': 'Sunlight in at least {p:pct} of the mission for viable',
  'rule.engineering': 'Engineering score at least {n:int} for viable',
  'rule.slope': 'Terrain slope at most {s:deg1}',

  // profile review (D52)
  'intro.statRim': 'rim',
  'intro.statWall': 'inner wall',
  'intro.totalTip':
    'Possible landing days: the {days:int}-day mission has to end within the {year} data, so the last days of the year cannot be landing days.',
  'controls.prevDay': 'Previous day',
  'controls.nextDay': 'Next day',
  'controls.pickDay': 'Landing day {date:date}. Open the calendar',
  'controls.noDelayReadout': 'No delay',
  'clear.above': '{d:deg1} above the terrain',
  'clear.below': '{d:deg1} below the terrain',
  'clear.level': 'at the terrain line',
  'clear.tip': 'Disc centre: elevation {el:deg1}; terrain {h:deg1} in that direction.',
  'header.nav': 'Screens',
  'header.mission': 'Mission panel',
  'cards.more': 'More sites below',
  'part.gapsTip':
    'Earth in view is the share of the mission with direct contact; Contact gaps is 1 minus the longest gap without contact as a share of the mission. When all the time without contact is one single gap, the two values are equal.',
  'part.psrFact': 'Permanent shadow {km:km1} away · {a:dec1} km² region',
  'detail.axisDate': '{t:daymonth}',
} as const;
