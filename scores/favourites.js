const KEY = "harbourline.favs.v1";

export function emptyFavs() {
  return { matches: new Set(), teams: new Set(), leagues: new Set() };
}

export function loadFavs() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return {
      matches: new Set(Array.isArray(raw.matches) ? raw.matches : []),
      teams: new Set(Array.isArray(raw.teams) ? raw.teams : []),
      leagues: new Set(Array.isArray(raw.leagues) ? raw.leagues : []),
    };
  } catch {
    return emptyFavs();
  }
}

export function saveFavs(favs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      matches: [...favs.matches],
      teams: [...favs.teams],
      leagues: [...favs.leagues],
    }));
  } catch {
    /* Private mode should not block starring in memory for this visit. */
  }
}

export function teamKey(sport, teamId) {
  return `${sport}:${teamId}`;
}

export function toggleFav(favs, kind, id) {
  const bag = favs[kind];
  if (!bag || !id) return favs;
  if (bag.has(id)) bag.delete(id);
  else bag.add(id);
  saveFavs(favs);
  return favs;
}

export function isMine(match, favs) {
  if (!match || !favs) return false;
  if (favs.matches.has(match.id)) return true;
  if (favs.leagues.has(match.leagueId)) return true;
  if (match.home?.id && favs.teams.has(teamKey(match.sport, match.home.id))) return true;
  if (match.away?.id && favs.teams.has(teamKey(match.sport, match.away.id))) return true;
  return false;
}
