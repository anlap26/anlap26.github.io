/** Stable public paths and unique copy. Facts below are competition structure, not invented results. */

export const leagueMeta = {
  ucl: {
    slug: "champions-league",
    sportPath: "football",
    h1: "Champions League live scores",
    title: "Champions League live scores, fixtures, results and table",
    description: "Champions League live scores, kick-off times, results and the league-phase table. Times on the snapshot are Europe/Nicosia.",
    intro: [
      "This is Harbourline’s Champions League page: today’s and upcoming kick-offs, final scores when a match has ended, and the league-phase table when ESPN publishes it.",
      "Since 2024-25 the men’s competition uses a 36-club league phase instead of eight groups. Clubs earn three points for a win and one for a draw. The table, not a guess, is what we show.",
    ],
    tableRule: "The Champions League table on this page is the league-phase ranking: points first. Goal difference and goals scored are the usual tie-breaks, and we print the columns ESPN actually sends.",
    faq: [
      { q: "What time do Champions League matches kick off?", a: "The snapshot lists kick-offs in Europe/Nicosia. The live board converts the same start instant to the time zone of the device you are using." },
      { q: "Where do these Champions League scores come from?", a: "Harbourline reads ESPN’s public scoreboard. It is not the official UEFA site and it does not show betting odds." },
    ],
  },
  uel: {
    slug: "europa-league",
    sportPath: "football",
    h1: "Europa League live scores",
    title: "Europa League live scores, fixtures, results and table",
    description: "Europa League fixtures, live scores, results and table. Kick-off times in the snapshot are Europe/Nicosia.",
    intro: [
      "The Europa League page lists the matches ESPN has on the scoreboard, with a table when the league phase is published.",
      "Like the Champions League, the Europa League now uses a single league-phase table rather than traditional groups. We do not invent a score if the feed has not updated.",
    ],
    tableRule: "Europa League ranking is by points in the league phase. A win is worth more than a draw. Tie-break columns appear only when the feed includes them.",
    faq: [
      { q: "Is the Europa League table a group stage?", a: "The current format is a league phase. This page shows that table rather than eight separate groups." },
    ],
  },
  uecl: {
    slug: "conference-league",
    sportPath: "football",
    h1: "Conference League live scores",
    title: "Conference League live scores, fixtures and table",
    description: "UEFA Conference League live scores, fixtures, results and the league-phase table.",
    intro: [
      "The Conference League is UEFA’s third club competition. Harbourline lists its fixtures and results from the public scoreboard and the league-phase table when it is available.",
      "Kick-off times in the written list are Europe/Nicosia, which is the zone used in Cyprus. Open the live board if you want the same matches in your own zone.",
    ],
    tableRule: "Conference League clubs are ranked on points in the league phase. We do not add clubs that are missing from the feed.",
    faq: [
      { q: "Which clubs appear here?", a: "Only clubs in the ESPN Conference League scoreboard or standings for the dates we fetch. A club that is not in that feed is not given a made-up fixture." },
    ],
  },
  epl: {
    slug: "premier-league",
    sportPath: "football",
    h1: "Premier League live scores",
    title: "Premier League live scores, fixtures, results and table",
    description: "English Premier League live scores, this week’s fixtures, yesterday’s results and the 20-club table.",
    intro: [
      "The Premier League is a 20-club competition. Each club plays 38 league matches. A win is three points and a draw is one.",
      "Use this page for live scores, the fixture list, results and the table. Harbourline does not sell odds.",
    ],
    tableRule: "The Premier League table ranks all 20 clubs by points, then goal difference, then goals scored. The page shows the order returned by the standings feed.",
    faq: [
      { q: "How many teams are in the Premier League?", a: "Twenty clubs play the league season. Each plays the others home and away, 38 matches in total." },
      { q: "What time is a Premier League kick-off in Cyprus?", a: "The snapshot converts the official start to Europe/Nicosia. A 15:00 UK kick-off is later the same afternoon in Nicosia during winter, when the UK is on GMT and Cyprus is on EET." },
    ],
  },
  elc: {
    slug: "championship",
    sportPath: "football",
    h1: "Championship live scores",
    title: "EFL Championship live scores, fixtures and table",
    description: "English Championship live scores, fixtures, results and table.",
    intro: [
      "The Championship is the second tier of English football, one level below the Premier League. This page tracks its scoreboard and table.",
      "Midweek Championship rounds are common. The snapshot date is the Europe/Nicosia day, so a late UK kick-off still belongs to that evening in Cyprus.",
    ],
    tableRule: "Championship clubs are ordered by points. Promotion and playoff places are not labelled unless the feed itself marks them.",
    faq: [
      { q: "Is the Championship the same as the Premier League?", a: "No. The Championship is the league under the Premier League. Harbourline has a separate page for each." },
    ],
  },
  facup: {
    slug: "fa-cup",
    sportPath: "football",
    h1: "FA Cup live scores",
    title: "FA Cup live scores, fixtures and results",
    description: "FA Cup live scores, draw fixtures and results. There is no league table for a knockout cup.",
    intro: [
      "The FA Cup is a knockout competition, so this site does not invent a league table for it. The page is for fixtures, kick-off times and results of the ties ESPN lists.",
      "Replays and extra time are reflected only when the scoreboard says so.",
    ],
    tableRule: "The FA Cup has no points table. If a standings request comes back empty, the table page says so.",
    faq: [
      { q: "Why is there no FA Cup table?", a: "It is a cup. Clubs are not ranked on points across a season in the way a league is." },
    ],
  },
  eflcup: {
    slug: "efl-cup",
    sportPath: "football",
    h1: "EFL Cup live scores",
    title: "EFL Cup live scores and fixtures",
    description: "EFL Cup (Carabao Cup) live scores, fixtures and results.",
    intro: [
      "The EFL Cup is England’s league-cup knockout. Harbourline lists the ties on the ESPN scoreboard, with times in Europe/Nicosia on the snapshot.",
    ],
    tableRule: "There is no season-long points table. The table page stays empty rather than copying another competition.",
    faq: [
      { q: "Is the EFL Cup the same as the FA Cup?", a: "No. The EFL Cup is for clubs in the English league system and is a separate knockout from the FA Cup." },
    ],
  },
  laliga: {
    slug: "la-liga",
    sportPath: "football",
    h1: "La Liga live scores",
    title: "La Liga live scores, fixtures, results and table",
    description: "Spanish La Liga live scores, fixtures, results and the league table.",
    intro: [
      "La Liga is the top division in Spain. This page covers live scores, the fixture list and the table for the clubs in the ESPN standings.",
      "Evening kick-offs in Spain are later the same night in Cyprus. The written times are Europe/Nicosia.",
    ],
    tableRule: "La Liga clubs are ranked by points, then head-to-head and goal records as the feed presents them. We do not reorder the table ourselves.",
    faq: [
      { q: "Where is El Clasico listed?", a: "Real Madrid against Barcelona is on the La Liga page when it is a league match, and on the El Clasico derby page. A European meeting is on the Champions League page instead." },
    ],
  },
  seriea: {
    slug: "serie-a",
    sportPath: "football",
    h1: "Serie A live scores",
    title: "Serie A live scores, fixtures, results and table",
    description: "Italian Serie A live scores, fixtures, results and table.",
    intro: [
      "Serie A is Italy’s top league. Harbourline shows its scoreboard and the table, including the Milan clubs, Juventus, Napoli and the rest of the clubs the feed lists.",
    ],
    tableRule: "Serie A ranking is by points. The table page prints the standings feed without adding clubs.",
    faq: [
      { q: "Does this include Serie B?", a: "No. Serie B has its own page. Serie A is only the top division." },
    ],
  },
  serieb: {
    slug: "serie-b",
    sportPath: "football",
    h1: "Serie B live scores",
    title: "Serie B live scores, fixtures and table",
    description: "Italian Serie B live scores, fixtures, results and table.",
    intro: [
      "Serie B is the division directly under Serie A. Use this page for its fixtures and table, not the Serie A page.",
    ],
    tableRule: "Serie B clubs are ranked on points. Promotion rules are not restated as if they were scores.",
    faq: [
      { q: "Why are some Serie B days empty?", a: "The league does not play every day. An empty snapshot means the feed had no matches for that date." },
    ],
  },
  bundesliga: {
    slug: "bundesliga",
    sportPath: "football",
    h1: "Bundesliga live scores",
    title: "Bundesliga live scores, fixtures, results and table",
    description: "German Bundesliga live scores, fixtures, results and the league table.",
    intro: [
      "The Bundesliga is Germany’s top league, an 18-club competition. This page has live scores, fixtures and the table.",
      "Der Klassiker, Bayern Munich against Borussia Dortmund, is also linked from the derby page when you want that fixture on its own.",
    ],
    tableRule: "Eighteen clubs are ranked by points, then goal difference. The table follows the standings feed.",
    faq: [
      { q: "How many Bundesliga teams are there?", a: "Eighteen clubs play the Bundesliga season, each meeting the others home and away." },
    ],
  },
  ligue1: {
    slug: "ligue-1",
    sportPath: "football",
    h1: "Ligue 1 live scores",
    title: "Ligue 1 live scores, fixtures, results and table",
    description: "French Ligue 1 live scores, fixtures, results and table.",
    intro: [
      "Ligue 1 is the top division in France. Harbourline lists the scoreboard and table for the clubs ESPN includes.",
    ],
    tableRule: "Ligue 1 is ranked on points. We do not publish a separate European table on this page.",
    faq: [
      { q: "Are European matches included in the Ligue 1 table?", a: "No. Champions League and Europa League matches have their own pages and do not add points to the Ligue 1 table." },
    ],
  },
  eredivisie: {
    slug: "eredivisie",
    sportPath: "football",
    h1: "Eredivisie live scores",
    title: "Eredivisie live scores, fixtures and table",
    description: "Dutch Eredivisie live scores, fixtures, results and table.",
    intro: [
      "The Eredivisie is the top league in the Netherlands. This page is for its domestic fixtures and table, not for Dutch clubs’ European nights.",
    ],
    tableRule: "Eredivisie clubs are ordered by league points. European results are not mixed into this table.",
    faq: [
      { q: "Where are Ajax or PSV European matches?", a: "On the Champions League, Europa League or Conference League page, depending on the competition they are in." },
    ],
  },
  primeira: {
    slug: "primeira-liga",
    sportPath: "football",
    h1: "Primeira Liga live scores",
    title: "Primeira Liga live scores, fixtures and table",
    description: "Portuguese Primeira Liga live scores, fixtures, results and table.",
    intro: [
      "The Primeira Liga is Portugal’s top division, including Benfica, Porto and Sporting when they are in the ESPN table. This page is the domestic league, not their European ties.",
    ],
    tableRule: "Primeira Liga ranking is by points. The table page shows only the published standings.",
    faq: [
      { q: "What is the difference between this and the Champions League?", a: "The Primeira Liga is the Portuguese league. A European match is listed on the relevant UEFA page." },
    ],
  },
  superlig: {
    slug: "super-lig",
    sportPath: "football",
    h1: "Super Lig live scores",
    title: "Turkish Super Lig live scores, fixtures and table",
    description: "Turkish Super Lig live scores, fixtures, results and table.",
    intro: [
      "The Super Lig is Turkey’s top league. Harbourline shows its fixtures and table, with snapshot times in Europe/Nicosia, which is one hour ahead of Turkey in winter.",
    ],
    tableRule: "Super Lig clubs are ranked on points. A 19:00 kick-off in Istanbul is 20:00 in Nicosia while Turkey is on UTC+3 and Cyprus is on UTC+2.",
    faq: [
      { q: "Why is the Nicosia time different from Istanbul?", a: "Cyprus and Turkey do not always share the same UTC offset. The snapshot uses Europe/Nicosia only." },
    ],
  },
  greek: {
    slug: "greek-super-league",
    sportPath: "football",
    h1: "Greek Super League live scores",
    title: "Greek Super League live scores, fixtures and table",
    description: "Greek Super League live scores, fixtures, results and table.",
    intro: [
      "The Greek Super League page covers the domestic championship. Olympiacos, Panathinaikos and the other clubs appear when they are in the scoreboard or table.",
    ],
    tableRule: "The Greek table is ranked on points. European matches are not added as league points here.",
    faq: [
      { q: "Does this include the Greek cup?", a: "No. This page is the Super League championship, not a cup." },
    ],
  },
  belgian: {
    slug: "belgian-pro-league",
    sportPath: "football",
    h1: "Belgian Pro League live scores",
    title: "Belgian Pro League live scores and table",
    description: "Belgian Pro League live scores, fixtures, results and table.",
    intro: [
      "The Belgian Pro League page lists domestic fixtures and the table. Playoff phases are shown only as the standings feed describes them.",
    ],
    tableRule: "Clubs are ranked on points. If the feed splits the season into phases, each published group is shown separately.",
    faq: [
      { q: "Why might the Belgian table look split?", a: "The league has used championship and playoff groups. We show the groups the feed returns instead of merging them." },
    ],
  },
  scottish: {
    slug: "scottish-premiership",
    sportPath: "football",
    h1: "Scottish Premiership live scores",
    title: "Scottish Premiership live scores and table",
    description: "Scottish Premiership live scores, fixtures, results and table.",
    intro: [
      "The Scottish Premiership is the top league in Scotland. This page is for its fixtures and table, including the Old Firm when Celtic and Rangers meet in the league.",
    ],
    tableRule: "The Premiership table is ordered by points. The feed decides whether a split is shown after the league divides.",
    faq: [
      { q: "Is the Old Firm on this page?", a: "Yes, when Celtic play Rangers in the Premiership. A cup tie would be on the cup scoreboard instead, if ESPN lists it." },
    ],
  },
  cyp: {
    slug: "cyprus-first-division",
    sportPath: "football",
    h1: "Cyprus First Division live scores",
    title: "Cyprus First Division live scores, fixtures and table",
    description: "Cypriot First Division live scores, fixtures, results and table, with times in Europe/Nicosia.",
    intro: [
      "This is the Cypriot First Division page on Harbourline, for readers in Cyprus and anyone following APOEL, Omonia, Apollon, AEL and the rest of the clubs in the feed.",
      "Snapshot kick-offs are already in Europe/Nicosia, the same zone as the island. The live board still follows the device clock if you are somewhere else.",
    ],
    tableRule: "The First Division table ranks clubs on points. Championship and relegation groups are shown separately when the feed splits them.",
    faq: [
      { q: "What time zone is the Cyprus page in?", a: "The written fixtures use Europe/Nicosia. That is EET in winter and EEST in summer." },
      { q: "Where is the APOEL–Omonia derby?", a: "On this page when it is a league match, and on the dedicated derby page." },
    ],
  },
  mls: {
    slug: "mls",
    sportPath: "football",
    h1: "MLS live scores",
    title: "MLS live scores, fixtures and standings",
    description: "Major League Soccer live scores, fixtures, results and standings.",
    intro: [
      "MLS is the top league in the United States and Canada. Evening matches in North America are often after midnight in Cyprus, so check the date as well as the clock.",
    ],
    tableRule: "MLS standings are usually split by conference. We show each conference the feed returns, ranked by points.",
    faq: [
      { q: "Why is an MLS match on tomorrow’s page in Cyprus?", a: "A 20:00 kick-off in the eastern United States is 03:00 the next day in Nicosia during winter. The snapshot uses the Nicosia date." },
    ],
  },
  ligamx: {
    slug: "liga-mx",
    sportPath: "football",
    h1: "Liga MX live scores",
    title: "Liga MX live scores, fixtures and table",
    description: "Mexican Liga MX live scores, fixtures, results and table.",
    intro: [
      "Liga MX is Mexico’s top league. This page lists its scoreboard and the table or groups the standings feed publishes.",
    ],
    tableRule: "Liga MX ranking follows the published table. Apertura and Clausura are not mixed together by us.",
    faq: [
      { q: "Does this include the Leagues Cup?", a: "Only if that competition is the one ESPN files under this Liga MX scoreboard. Otherwise it is not added." },
    ],
  },
  brazil: {
    slug: "brasileirao",
    sportPath: "football",
    h1: "Brasileirão live scores",
    title: "Brasileirão live scores, fixtures and table",
    description: "Brazilian Serie A live scores, fixtures, results and table.",
    intro: [
      "The Brasileirão is Brazil’s top national league. Matches are often late at night or the next morning in Europe. The snapshot date is the Nicosia date of the kick-off.",
    ],
    tableRule: "Clubs are ranked on points. The 20-club Serie A table is shown when the feed returns it.",
    faq: [
      { q: "Why do Brazilian times look early in the morning?", a: "A night match in Brazil can fall in the early hours of the next calendar day in Cyprus. Both the date and the clock are shown." },
    ],
  },
  argentina: {
    slug: "liga-profesional",
    sportPath: "football",
    h1: "Argentine Liga Profesional live scores",
    title: "Liga Profesional live scores and table",
    description: "Argentine Liga Profesional live scores, fixtures, results and table.",
    intro: [
      "The Liga Profesional is the top division in Argentina. This page is for its domestic fixtures and table.",
    ],
    tableRule: "The Argentine table is ranked on points. Cups are not folded into these points.",
    faq: [
      { q: "Is the Copa Libertadores here?", a: "No. This page is the domestic league only." },
    ],
  },
  jleague: {
    slug: "j-league",
    sportPath: "football",
    h1: "J.League live scores",
    title: "J.League live scores, fixtures and table",
    description: "Japanese J.League live scores, fixtures, results and table.",
    intro: [
      "The J.League page covers Japan’s top division scoreboard. Afternoon matches in Japan are morning fixtures in Cyprus.",
    ],
    tableRule: "J.League clubs are ranked on points. We label the table with the competition name the feed uses.",
    faq: [
      { q: "Are J.League matches already finished by evening in Cyprus?", a: "Often yes, because Japan is ahead of Cyprus. The status on the row says whether a match is scheduled, live or finished." },
    ],
  },
  nba: {
    slug: "nba",
    sportPath: "basketball",
    h1: "NBA live scores",
    title: "NBA live scores, fixtures, results and standings",
    description: "NBA live scores, tonight’s fixtures, results and conference standings.",
    intro: [
      "The NBA page lists basketball games, final scores and the Eastern and Western conference standings when ESPN publishes them.",
      "A game that tips off in the American evening is often after midnight in Cyprus. The snapshot shows the Nicosia date and time, not the US television date.",
    ],
    tableRule: "NBA standings are split by conference and ranked by win-loss record. We do not turn basketball wins into football points.",
    faq: [
      { q: "Where is the box score?", a: "Open a game in the live board. The match page shows the box score when ESPN has one." },
    ],
  },
  euroleague: {
    slug: "euroleague",
    sportPath: "basketball",
    h1: "EuroLeague live scores",
    title: "EuroLeague basketball live scores and fixtures",
    description: "EuroLeague basketball live scores, fixtures and results.",
    intro: [
      "The EuroLeague is the top club basketball competition in Europe. This page lists the games on the ESPN scoreboard.",
      "A standings table is included only when the standings feed actually returns rows. An empty table is left empty.",
    ],
    tableRule: "EuroLeague wins are basketball results, not football points. If the standings feed is empty, we say the table is not available.",
    faq: [
      { q: "Is EuroLeague the same as the NBA?", a: "No. EuroLeague is the European club competition. The NBA has a separate page." },
    ],
  },
  ncaam: {
    slug: "ncaa-basketball",
    sportPath: "basketball",
    h1: "NCAA men’s basketball scores",
    title: "NCAA men’s basketball live scores and results",
    description: "NCAA men’s college basketball live scores, fixtures and results.",
    intro: [
      "This page follows NCAA men’s basketball on the ESPN scoreboard. College schedules are busy on weekends and include many tournaments.",
    ],
    tableRule: "A single national table is not how college basketball is ranked. We do not publish an invented top 25.",
    faq: [
      { q: "Do you show the AP poll?", a: "No. This page is scores and fixtures, not a media poll." },
    ],
  },
  atp: {
    slug: "atp",
    sportPath: "tennis",
    h1: "ATP tennis scores",
    title: "ATP live scores, results and match times",
    description: "ATP tennis scores, match times and results. Set scores appear when the feed includes them.",
    intro: [
      "The ATP page lists men’s singles and doubles matches from the ESPN tennis scoreboard. A scheduled match shows the start time. A finished match shows the set score when it is in the feed.",
      "There is no league table in tennis. The table link explains that instead of inventing one.",
    ],
    tableRule: "ATP matches are not ranked in a club table. Rankings are a separate system and are not copied here.",
    faq: [
      { q: "Why is a tennis score sets instead of a single number?", a: "Tennis is won by sets. Harbourline shows the set line, for example 6-4 6-2, rather than a football-style score." },
    ],
  },
  wta: {
    slug: "wta",
    sportPath: "tennis",
    h1: "WTA tennis scores",
    title: "WTA live scores, results and match times",
    description: "WTA tennis scores, match times and results, including doubles when listed.",
    intro: [
      "The WTA page lists women’s matches from the ESPN scoreboard, including doubles pairings when the feed names both players.",
      "Match times in the snapshot are Europe/Nicosia. The live board uses your own time zone.",
    ],
    tableRule: "There is no WTA club table on this site. We do not convert the race or rankings into a league table.",
    faq: [
      { q: "Are qualifying matches included?", a: "Yes, if they are on the scoreboard for the selected day. The round name is shown when ESPN sends it." },
    ],
  },
  nhl: {
    slug: "nhl",
    sportPath: "hockey",
    h1: "NHL live scores",
    title: "NHL live scores, fixtures, results and standings",
    description: "NHL live scores, fixtures, results and conference standings.",
    intro: [
      "The NHL page lists hockey games, final scores and conference standings. Overtime and shootout results appear when the status says so.",
    ],
    tableRule: "NHL standings are split by conference and use the league’s points, including results beyond regulation when the feed records them.",
    faq: [
      { q: "Where is the player box score?", a: "Open the game from the live board. Skater and goalie lines are shown when the summary feed includes them." },
    ],
  },
  nfl: {
    slug: "nfl",
    sportPath: "nfl",
    h1: "NFL live scores",
    title: "NFL live scores, fixtures and standings",
    description: "NFL live scores, kick-off times, results and standings.",
    intro: [
      "The NFL page lists American football games. A Sunday or Monday night game in the United States is often Monday in Cyprus. The snapshot uses the Nicosia date.",
    ],
    tableRule: "NFL standings are by conference and division when the feed is split that way. Wins and losses are not converted into soccer points.",
    faq: [
      { q: "Is NFL the same as football on this site?", a: "On Harbourline, football means association football. NFL is the American football page." },
    ],
  },
};

export const countries = [
  { slug: "england", name: "England", leagues: ["epl", "elc", "facup", "eflcup"], blurb: "English football on Harbourline means the Premier League, the Championship, the FA Cup and the EFL Cup. This page gathers whatever those scoreboards have on the Europe/Nicosia date.", timeNote: "A Saturday 15:00 kick-off in England is 17:00 in Cyprus while the UK is on GMT and Cyprus is on EET." },
  { slug: "spain", name: "Spain", leagues: ["laliga"], blurb: "Spanish football here is La Liga. Copa del Rey ties are not mixed in unless they appear on that same scoreboard.", timeNote: "Spain is an hour behind Cyprus in winter, so a 21:00 kick-off in Madrid is 22:00 in Nicosia." },
  { slug: "italy", name: "Italy", leagues: ["seriea", "serieb"], blurb: "Italy covers Serie A and Serie B. Each league still has its own table page.", timeNote: "Italy is an hour behind Cyprus in winter. The snapshot already shows the Nicosia clock." },
  { slug: "germany", name: "Germany", leagues: ["bundesliga"], blurb: "Germany on this page is the Bundesliga. The 2. Bundesliga is not part of this country list.", timeNote: "Germany is an hour behind Cyprus in winter. European nights for German clubs are on the UEFA pages, not in this country list." },
  { slug: "france", name: "France", leagues: ["ligue1"], blurb: "France on this page is Ligue 1. European matches for French clubs are on the UEFA pages.", timeNote: "France is an hour behind Cyprus in winter. A 21:00 kick-off in Paris is 22:00 in Nicosia." },
  { slug: "cyprus", name: "Cyprus", leagues: ["cyp"], blurb: "Cyprus means the First Division. Times are already in Europe/Nicosia, the island’s zone.", timeNote: "No conversion is needed for a domestic Cypriot kick-off. The snapshot and the island clock are the same zone." },
  { slug: "netherlands", name: "Netherlands", leagues: ["eredivisie"], blurb: "The Netherlands page is the Eredivisie scoreboard for the Nicosia date.", timeNote: "The Netherlands is an hour behind Cyprus in winter. The written kick-off is the Nicosia time." },
  { slug: "portugal", name: "Portugal", leagues: ["primeira"], blurb: "Portugal on this page is the Primeira Liga, not the Portuguese cup.", timeNote: "Portugal uses the same winter clock as the UK, two hours behind Cyprus, so an evening match in Lisbon is later still in Nicosia." },
  { slug: "turkey", name: "Turkey", leagues: ["superlig"], blurb: "Turkey on this page is the Super Lig. Nicosia times can be an hour different from Istanbul.", timeNote: "Turkey and Cyprus are not always on the same offset. Trust the Europe/Nicosia time printed on the snapshot." },
  { slug: "greece", name: "Greece", leagues: ["greek"], blurb: "Greece on this page is the Super League championship.", timeNote: "Greece and Cyprus share Eastern European Time in winter, so a kick-off in Athens matches the Nicosia clock." },
];

export const clubs = [
  { slug: "arsenal", league: "epl", names: ["Arsenal"], city: "London" },
  { slug: "liverpool", league: "epl", names: ["Liverpool"], city: "Liverpool" },
  { slug: "manchester-city", league: "epl", names: ["Manchester City"], city: "Manchester" },
  { slug: "manchester-united", league: "epl", names: ["Manchester United"], city: "Manchester" },
  { slug: "chelsea", league: "epl", names: ["Chelsea"], city: "London" },
  { slug: "tottenham", league: "epl", names: ["Tottenham Hotspur"], city: "London" },
  { slug: "real-madrid", league: "laliga", names: ["Real Madrid"], city: "Madrid" },
  { slug: "barcelona", league: "laliga", names: ["Barcelona"], city: "Barcelona" },
  { slug: "atletico-madrid", league: "laliga", names: ["Atlético Madrid", "Atletico Madrid"], city: "Madrid" },
  { slug: "bayern-munich", league: "bundesliga", names: ["Bayern Munich"], city: "Munich" },
  { slug: "borussia-dortmund", league: "bundesliga", names: ["Borussia Dortmund"], city: "Dortmund" },
  { slug: "inter", league: "seriea", names: ["Internazionale", "Inter"], city: "Milan" },
  { slug: "ac-milan", league: "seriea", names: ["AC Milan", "Milan"], city: "Milan" },
  { slug: "juventus", league: "seriea", names: ["Juventus"], city: "Turin" },
  { slug: "paris-saint-germain", league: "ligue1", names: ["Paris Saint-Germain"], city: "Paris" },
  { slug: "apoel", league: "cyp", names: ["APOEL", "Apoel"], city: "Nicosia" },
  { slug: "omonoia", league: "cyp", names: ["Omonia"], city: "Nicosia" },
  { slug: "los-angeles-lakers", league: "nba", names: ["Los Angeles Lakers"], city: "Los Angeles" },
  { slug: "boston-celtics", league: "nba", names: ["Boston Celtics"], city: "Boston" },
  { slug: "golden-state-warriors", league: "nba", names: ["Golden State Warriors"], city: "San Francisco" },
];

export const derbies = [
  { slug: "el-clasico", title: "El Clasico", teams: ["Real Madrid", "Barcelona"], league: "laliga", text: "El Clasico is Real Madrid against Barcelona. A league meeting is a La Liga match. If they meet in Europe, that game is on the Champions League page instead of being copied here as a league fixture." },
  { slug: "manchester-derby", title: "Manchester derby", teams: ["Manchester City", "Manchester United"], league: "epl", text: "The Manchester derby is Manchester City against Manchester United in the Premier League. This page only names a kick-off when that fixture is on a schedule we have fetched." },
  { slug: "north-london-derby", title: "North London derby", teams: ["Arsenal", "Tottenham Hotspur"], league: "epl", text: "The North London derby is Arsenal against Tottenham Hotspur. Harbourline does not guess the next date if neither club’s current schedule lists the other." },
  { slug: "merseyside-derby", title: "Merseyside derby", teams: ["Liverpool", "Everton"], league: "epl", text: "The Merseyside derby is Liverpool against Everton. Cup ties are not relabelled as league matches." },
  { slug: "milan-derby", title: "Milan derby", teams: ["Internazionale", "AC Milan"], league: "seriea", text: "The Milan derby is Internazionale against AC Milan. Look at the Serie A page for the league table around them." },
  { slug: "der-klassiker", title: "Der Klassiker", teams: ["Bayern Munich", "Borussia Dortmund"], league: "bundesliga", text: "Der Klassiker is Bayern Munich against Borussia Dortmund in the Bundesliga. A European meeting would be listed under that UEFA competition." },
  { slug: "madrid-derby", title: "Madrid derby", teams: ["Real Madrid", "Atlético Madrid"], league: "laliga", text: "The Madrid derby is Real Madrid against Atlético Madrid. The page uses the Atlético name as the standings feed spells it." },
  { slug: "apoel-omonoia", title: "APOEL vs Omonia", teams: ["APOEL", "Omonia"], league: "cyp", text: "APOEL against Omonia is the main Nicosia derby in the Cypriot First Division. Kick-off times are Europe/Nicosia." },
];

export const sportHubs = {
  football: {
    h1: "Football live scores",
    title: "Football live scores, fixtures and results",
    description: "Football live scores, today’s matches, yesterday’s results and league tables for the competitions Harbourline follows.",
    intro: [
      "Football on Harbourline means association football. The pages below cover the leagues and cups we read from ESPN, with Champions League, the big European leagues and the Cypriot First Division first.",
      "NFL is a different sport and has its own section. Kick-off times in each written snapshot are Europe/Nicosia.",
    ],
  },
  basketball: {
    h1: "Basketball live scores",
    title: "Basketball live scores: NBA and EuroLeague",
    description: "NBA and EuroLeague live scores, results and standings, plus NCAA men’s basketball.",
    intro: [
      "Basketball on Harbourline is the NBA, the EuroLeague and NCAA men’s basketball. A US tip-off can fall on the next calendar day in Cyprus.",
    ],
  },
  tennis: {
    h1: "Tennis live scores",
    title: "Tennis live scores: ATP and WTA",
    description: "ATP and WTA scores, match times and set results.",
    intro: [
      "Tennis is listed as matches and sets, not as a club league. ATP and WTA each have a page.",
    ],
  },
  hockey: {
    h1: "Hockey live scores",
    title: "NHL live scores and standings",
    description: "NHL live scores, results and standings.",
    intro: [
      "Hockey on Harbourline is the NHL. Open a game for the skater and goalie lines when a box score exists.",
    ],
  },
  nfl: {
    h1: "NFL scores",
    title: "American football scores and NFL fixtures",
    description: "NFL scores and kick-off times, separate from association football.",
    intro: [
      "This section is American football. Association football, including the Premier League and Champions League, is under Football.",
    ],
  },
};

/** Format-and-dates guides. Structure only. Kick-off dates stay on the fixture pages. */
export const guides = {
  ucl: {
    title: "Champions League format and dates",
    h1: "Champions League format and dates",
    description: "How the Champions League league phase works, and where Harbourline lists the actual kick-off dates.",
    intro: [
      "Since 2024-25 the men’s Champions League uses one 36-club league phase instead of eight groups. Each club plays eight matches, four at home and four away, against eight different clubs. A win is three points and a draw is one.",
      "The top eight in that table go straight into the round of 16. Places nine to 24 go into a two-legged knockout play-off for the other round-of-16 spots. The round of 16, quarter-finals and semi-finals are two-legged. The final is a single match.",
      "This guide does not print a season calendar of its own. A postponed match would make a copied list wrong. The dates Harbourline will stand behind are the kick-offs on the fixtures page and on each “what time is” page, written in Europe/Nicosia.",
    ],
    faq: [
      { q: "How does the Champions League format work?", a: "One league-phase table of 36 clubs, eight matches each, then a knockout. The table page shows the order the standings feed returns." },
      { q: "When is the next Champions League match?", a: "Open the Champions League fixtures page. Times there are Europe/Nicosia. If a tie has its own “what time is” page, that page names the stadium from the same feed." },
    ],
  },
  uel: {
    title: "Europa League format and dates",
    h1: "Europa League format and dates",
    description: "Europa League league-phase format, and where to read the kick-off dates Harbourline has fetched.",
    intro: [
      "The Europa League uses the same idea as the Champions League: one league-phase table, not the old groups. Clubs collect points, and the table decides who goes straight on and who plays a knockout play-off.",
      "Harbourline does not guess a score or a date that is missing from the feed. The fixtures page is the list of Europa League kick-offs we have fetched, in Europe/Nicosia.",
    ],
    faq: [
      { q: "Is the Europa League still a group stage?", a: "No. It is a league phase with one table. The table page on this site is that ranking when the feed publishes it." },
      { q: "Where are Europa League dates?", a: "On the Europa League fixtures page. This guide explains the shape of the competition and does not copy a calendar." },
    ],
  },
  uecl: {
    title: "Conference League format and dates",
    h1: "Conference League format and dates",
    description: "UEFA Conference League format and where the kick-off dates are listed.",
    intro: [
      "The Conference League is UEFA’s third club competition. It now uses a league phase and then a knockout, in the same family as the Champions League and Europa League. Points, not a guessed group order, decide the table.",
      "Kick-off dates change when a match is moved. The Conference League fixtures page is the set of dates in the latest scoreboard fetch, in Europe/Nicosia.",
    ],
    faq: [
      { q: "Where do Conference League dates come from?", a: "From the public scoreboard, rewritten into Europe/Nicosia. An empty fixtures list means the feed had no match on those days, not that the round was cancelled." },
    ],
  },
  epl: {
    title: "Premier League format and dates",
    h1: "Premier League format and dates",
    description: "Premier League format: 20 clubs, 38 matches, and how kick-off times read in Cyprus.",
    intro: [
      "The Premier League is 20 clubs. Each plays every other club home and away, 38 matches. A win is three points and a draw is one. The table is ordered by points, then goal difference, then goals scored, as the standings feed presents it.",
      "The season runs from August to May. Television and European weeks move individual kick-offs, so this page does not freeze a Saturday list. The fixtures page is the kick-offs we have fetched.",
      "In winter the UK is on GMT and Cyprus is on EET, two hours ahead. A 15:00 kick-off in England is 17:00 in Nicosia. The snapshot already uses that Nicosia clock.",
    ],
    faq: [
      { q: "How many games are in a Premier League season?", a: "Each of the 20 clubs plays 38 league matches. Cup ties are on the FA Cup and EFL Cup pages, not in this table." },
      { q: "What time is a Premier League match in Cyprus?", a: "Read the Europe/Nicosia time on the fixtures page. In winter, add two hours to a UK clock." },
    ],
  },
  elc: {
    title: "Championship format and dates",
    h1: "Championship format and dates",
    description: "EFL Championship format: 24 clubs, 46 matches, and where the dates are listed.",
    intro: [
      "The Championship is the league under the Premier League. Twenty-four clubs each play 46 matches. The top two go up automatically and the next places play off for the third promotion spot. Harbourline prints the table the feed sends and does not add promotion labels of its own.",
      "Midweek rounds are normal. Dates on the fixtures page are the Europe/Nicosia day of the kick-off we fetched, not a copied fixture release.",
    ],
    faq: [
      { q: "Is the Championship the Premier League?", a: "No. It is the second tier. Each competition has its own scores, table and guide." },
    ],
  },
  facup: {
    title: "FA Cup format and dates",
    h1: "FA Cup format and dates",
    description: "FA Cup knockout format, and why there is no league table.",
    intro: [
      "The FA Cup is a knockout. Clubs enter in rounds, and a loss ends that club’s cup run. There is no points table. The table page says so when the standings feed is empty.",
      "Extra time and replays appear only when the scoreboard says the tie is in extra time or that a replay is scheduled. Dates are the ties on the fixtures page, in Europe/Nicosia.",
    ],
    faq: [
      { q: "Why is there no FA Cup table?", a: "It is a cup. Clubs are not ranked on season points the way a league is." },
    ],
  },
  eflcup: {
    title: "EFL Cup format and dates",
    h1: "EFL Cup format and dates",
    description: "EFL Cup knockout format and where the tie dates are listed.",
    intro: [
      "The EFL Cup, often called the Carabao Cup, is a knockout for clubs in the English league system. It is not the FA Cup. There is no season-long points table.",
      "The dates Harbourline lists are the ties in the current scoreboard window. A round that has not been published there is not given a placeholder date.",
    ],
    faq: [
      { q: "Is the EFL Cup the same as the League Cup?", a: "Yes. Harbourline uses the name EFL Cup. The FA Cup is a different competition with its own page." },
    ],
  },
  laliga: {
    title: "La Liga format and dates",
    h1: "La Liga format and dates",
    description: "La Liga format: 20 clubs and 38 matches, with kick-off times for Cyprus.",
    intro: [
      "La Liga is 20 clubs, each playing 38 matches, home and away. Three points for a win and one for a draw. The table page follows the order in the standings feed, including whatever tie-break columns that feed sends.",
      "The season runs from August to May. Spain is an hour behind Cyprus in winter, so a 21:00 kick-off in Spain is 22:00 in Nicosia. The fixtures page already prints the Nicosia time.",
    ],
    faq: [
      { q: "How many teams are in La Liga?", a: "Twenty. Each plays 38 league matches. Copa del Rey ties are not added to this table." },
    ],
  },
  seriea: {
    title: "Serie A format and dates",
    h1: "Serie A format and dates",
    description: "Serie A format: 20 clubs and 38 matches, and where the dates are listed.",
    intro: [
      "Serie A is 20 clubs and 38 matches each, home and away. The table is points first. Serie B has its own page and is not folded into this table.",
      "Italy is an hour behind Cyprus in winter. Kick-off dates on the fixtures page are the ones in the latest fetch, written in Europe/Nicosia.",
    ],
    faq: [
      { q: "Does this page include Serie B?", a: "No. Serie B has a separate scores page and table. This guide is Serie A only." },
    ],
  },
  bundesliga: {
    title: "Bundesliga format and dates",
    h1: "Bundesliga format and dates",
    description: "Bundesliga format: 18 clubs and 34 matches, with Nicosia kick-off times.",
    intro: [
      "The Bundesliga is 18 clubs. Each plays 34 matches. A win is three points. The table page shows the ranking from the standings feed, not a 2. Bundesliga table.",
      "Germany is an hour behind Cyprus in winter. The fixtures page is the kick-off list we have fetched. This guide does not add a match that is not in that list.",
    ],
    faq: [
      { q: "How many teams are in the Bundesliga?", a: "Eighteen clubs play the top division. That is 34 matches each, not the 38 of a 20-club league." },
    ],
  },
  ligue1: {
    title: "Ligue 1 format and dates",
    h1: "Ligue 1 format and dates",
    description: "Ligue 1 format since the league moved to 18 clubs, and where the dates are listed.",
    intro: [
      "Ligue 1 has 18 clubs. Each plays 34 matches. The table is the order in the standings feed. European nights for French clubs are on the Champions League, Europa League or Conference League pages.",
      "France is an hour behind Cyprus in winter. Dates on the fixtures page are Europe/Nicosia kick-offs from the scoreboard, not a copied seasonal poster.",
    ],
    faq: [
      { q: "How many clubs are in Ligue 1?", a: "Eighteen. The season is 34 matches per club. The table page is that 18-club ranking when the feed publishes it." },
    ],
  },
  cyp: {
    title: "Cyprus First Division format and dates",
    h1: "Cyprus First Division format and dates",
    description: "How the Cypriot First Division table is shown, and where domestic kick-off dates are listed.",
    intro: [
      "The Cypriot First Division is the top league in Cyprus. Harbourline ranks clubs in the order the standings feed returns and does not add a club that is missing from that table.",
      "Domestic kick-offs are already in Europe/Nicosia, which is the island’s time zone. The fixtures page lists the dates in the latest scoreboard fetch. A Nicosia derby between APOEL and Omonia has its own page and is only given a kick-off when the feed includes that match.",
    ],
    faq: [
      { q: "What time zone are Cypriot matches in?", a: "Europe/Nicosia. The snapshot and a clock in Cyprus show the same kick-off." },
    ],
  },
  nba: {
    title: "NBA format and dates",
    h1: "NBA format and dates",
    description: "NBA regular-season format and why a US tip-off is often the next day in Cyprus.",
    intro: [
      "The NBA has 30 teams split into Eastern and Western conferences. The regular season is 82 games, running from October into April, and the playoffs follow. Standings on this site use wins and the columns the feed sends. They are not converted into soccer-style points.",
      "A game that tips off in the American evening is often after midnight in Cyprus, so it belongs to the next Nicosia date. The fixtures page uses that Nicosia date. This guide does not invent a tip-off the scoreboard has not listed.",
    ],
    faq: [
      { q: "Why is an NBA game on tomorrow’s date in Cyprus?", a: "Because the tip-off instant falls after midnight in Europe/Nicosia. The fixture list follows the Nicosia calendar, not the US television date." },
    ],
  },
  euroleague: {
    title: "EuroLeague format and dates",
    h1: "EuroLeague format and dates",
    description: "EuroLeague regular season and playoff shape, and where tip-off dates are listed.",
    intro: [
      "The EuroLeague is a European club competition with a regular-season table and a later playoff. Harbourline shows the table the standings feed returns. If that feed has no rows, the table page says so instead of copying the NBA table.",
      "Tip-off dates are on the EuroLeague fixtures page, in Europe/Nicosia. A round that is not in the current scoreboard is not given a guessed date.",
    ],
    faq: [
      { q: "Is the EuroLeague the same as the NBA?", a: "No. The EuroLeague is the European club competition. The NBA has its own scores, standings and guide." },
    ],
  },
  atp: {
    title: "ATP format and dates",
    h1: "ATP format and dates",
    description: "How ATP matches are scored, and why there is no club table.",
    intro: [
      "The ATP is a tennis tour, not a league of clubs. There is no points table of the football kind. Rankings are not reprinted here as a made-up league.",
      "Men’s Grand Slam singles matches are best of five sets. Most other ATP singles matches are best of three. The score on a results page is the set score from the feed. Match dates are the ones on the ATP fixtures page, in Europe/Nicosia.",
    ],
    faq: [
      { q: "Why is there no ATP table?", a: "Tennis is not ranked like a football league on this site. The table page stays empty rather than inventing a club ranking." },
    ],
  },
  wta: {
    title: "WTA format and dates",
    h1: "WTA format and dates",
    description: "How WTA matches are scored, and where the match dates are listed.",
    intro: [
      "The WTA is the women’s tennis tour. Matches are sets, not a league table. Grand Slam singles and regular tour singles are best of three sets. A score is shown only when the feed has one.",
      "Dates are the matches on the WTA fixtures page, converted to Europe/Nicosia. A tournament that is not on that scoreboard is not given a placeholder start time.",
    ],
    faq: [
      { q: "Where is the WTA draw?", a: "Harbourline lists the matches the scoreboard returns, with set scores. It does not draw a bracket the feed did not send." },
    ],
  },
  nhl: {
    title: "NHL format and dates",
    h1: "NHL format and dates",
    description: "NHL season shape, points, and why evening games in North America move a day in Cyprus.",
    intro: [
      "The NHL regular season is 82 games, split into conferences, and the playoffs follow in the spring. Standings use the league’s points, including results that were decided past regulation when the feed records them.",
      "An evening game in the United States or Canada is often the next calendar day in Cyprus. The fixtures page uses the Europe/Nicosia date of the opening face-off.",
    ],
    faq: [
      { q: "Does the NHL table use soccer points?", a: "No. It uses the NHL points the standings feed sends, shown in the conference split when the feed is split that way." },
    ],
  },
  nfl: {
    title: "NFL format and dates",
    h1: "NFL format and dates",
    description: "NFL regular-season length and how US kick-offs land on the Cyprus calendar.",
    intro: [
      "The NFL is American football, not the association football pages. Thirty-two teams play a 17-game regular season from September into early January, then a playoff. Wins and losses stay in that form. They are not turned into a three-point soccer table.",
      "A Sunday or Monday night game in the United States is often Monday in Cyprus. The fixtures page dates that kick-off in Europe/Nicosia.",
    ],
    faq: [
      { q: "Is the NFL under Football?", a: "No. Football on Harbourline is association football. The NFL has this guide and its own scores page." },
    ],
  },
};
