// Curated competitions available from ESPN's public scoreboard.
// Football is the full list; other sports are loaded when their tab is opened.

export const SPORTS = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
  { id: "hockey", label: "Hockey" },
  { id: "nfl", label: "NFL" },
];

/** @type {Array<{
 *   id: string,
 *   sport: string,
 *   espnSport: string,
 *   slug: string,
 *   country: string,
 *   countryRank: number,
 *   leagueRank: number,
 *   name: string,
 *   kind?: "tennis"
 * }>} */
export const LEAGUES = [
  { id: "ucl", sport: "football", espnSport: "soccer", slug: "uefa.champions", country: "Europe", countryRank: 10, leagueRank: 10, name: "UEFA Champions League" },
  { id: "uel", sport: "football", espnSport: "soccer", slug: "uefa.europa", country: "Europe", countryRank: 10, leagueRank: 20, name: "UEFA Europa League" },
  { id: "uecl", sport: "football", espnSport: "soccer", slug: "uefa.europa.conf", country: "Europe", countryRank: 10, leagueRank: 30, name: "UEFA Conference League" },
  { id: "cyp", sport: "football", espnSport: "soccer", slug: "cyp.1", country: "Cyprus", countryRank: 20, leagueRank: 10, name: "Cypriot First Division" },
  { id: "epl", sport: "football", espnSport: "soccer", slug: "eng.1", country: "England", countryRank: 30, leagueRank: 10, name: "Premier League" },
  { id: "elc", sport: "football", espnSport: "soccer", slug: "eng.2", country: "England", countryRank: 30, leagueRank: 20, name: "Championship" },
  { id: "facup", sport: "football", espnSport: "soccer", slug: "eng.fa", country: "England", countryRank: 30, leagueRank: 30, name: "FA Cup" },
  { id: "eflcup", sport: "football", espnSport: "soccer", slug: "eng.league_cup", country: "England", countryRank: 30, leagueRank: 40, name: "EFL Cup" },
  { id: "laliga", sport: "football", espnSport: "soccer", slug: "esp.1", country: "Spain", countryRank: 40, leagueRank: 10, name: "La Liga" },
  { id: "seriea", sport: "football", espnSport: "soccer", slug: "ita.1", country: "Italy", countryRank: 50, leagueRank: 10, name: "Serie A" },
  { id: "serieb", sport: "football", espnSport: "soccer", slug: "ita.2", country: "Italy", countryRank: 50, leagueRank: 20, name: "Serie B" },
  { id: "bundesliga", sport: "football", espnSport: "soccer", slug: "ger.1", country: "Germany", countryRank: 60, leagueRank: 10, name: "Bundesliga" },
  { id: "ligue1", sport: "football", espnSport: "soccer", slug: "fra.1", country: "France", countryRank: 70, leagueRank: 10, name: "Ligue 1" },
  { id: "eredivisie", sport: "football", espnSport: "soccer", slug: "ned.1", country: "Netherlands", countryRank: 80, leagueRank: 10, name: "Eredivisie" },
  { id: "primeira", sport: "football", espnSport: "soccer", slug: "por.1", country: "Portugal", countryRank: 90, leagueRank: 10, name: "Primeira Liga" },
  { id: "superlig", sport: "football", espnSport: "soccer", slug: "tur.1", country: "Turkey", countryRank: 100, leagueRank: 10, name: "Super Lig" },
  { id: "greek", sport: "football", espnSport: "soccer", slug: "gre.1", country: "Greece", countryRank: 110, leagueRank: 10, name: "Super League" },
  { id: "belgian", sport: "football", espnSport: "soccer", slug: "bel.1", country: "Belgium", countryRank: 120, leagueRank: 10, name: "Pro League" },
  { id: "scottish", sport: "football", espnSport: "soccer", slug: "sco.1", country: "Scotland", countryRank: 130, leagueRank: 10, name: "Premiership" },
  { id: "mls", sport: "football", espnSport: "soccer", slug: "usa.1", country: "United States", countryRank: 200, leagueRank: 10, name: "MLS" },
  { id: "ligamx", sport: "football", espnSport: "soccer", slug: "mex.1", country: "Mexico", countryRank: 210, leagueRank: 10, name: "Liga MX" },
  { id: "brazil", sport: "football", espnSport: "soccer", slug: "bra.1", country: "Brazil", countryRank: 220, leagueRank: 10, name: "Brasileirão" },
  { id: "argentina", sport: "football", espnSport: "soccer", slug: "arg.1", country: "Argentina", countryRank: 230, leagueRank: 10, name: "Liga Profesional" },
  { id: "jleague", sport: "football", espnSport: "soccer", slug: "jpn.1", country: "Japan", countryRank: 240, leagueRank: 10, name: "J.League" },

  { id: "euroleague", sport: "basketball", espnSport: "basketball", slug: "euroleague", country: "Europe", countryRank: 10, leagueRank: 10, name: "EuroLeague" },
  { id: "nba", sport: "basketball", espnSport: "basketball", slug: "nba", country: "United States", countryRank: 20, leagueRank: 10, name: "NBA" },
  { id: "ncaam", sport: "basketball", espnSport: "basketball", slug: "mens-college-basketball", country: "United States", countryRank: 20, leagueRank: 20, name: "NCAA Men's Basketball" },

  { id: "atp", sport: "tennis", espnSport: "tennis", slug: "atp", country: "ATP", countryRank: 10, leagueRank: 10, name: "ATP", kind: "tennis" },
  { id: "wta", sport: "tennis", espnSport: "tennis", slug: "wta", country: "WTA", countryRank: 20, leagueRank: 10, name: "WTA", kind: "tennis" },

  { id: "nhl", sport: "hockey", espnSport: "hockey", slug: "nhl", country: "North America", countryRank: 10, leagueRank: 10, name: "NHL" },

  { id: "nfl", sport: "nfl", espnSport: "football", slug: "nfl", country: "United States", countryRank: 10, leagueRank: 10, name: "NFL" },
];

export function leaguesForSport(sport) {
  return LEAGUES.filter((league) => league.sport === sport);
}
