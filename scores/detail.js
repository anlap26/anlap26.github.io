export function summaryUrl(league, eventId) {
  return `https://site.api.espn.com/apis/site/v2/sports/${league.espnSport}/${league.slug}/summary?event=${encodeURIComponent(eventId)}`;
}

export function standingsUrl(league) {
  return `https://site.api.espn.com/apis/v2/sports/${league.espnSport}/${league.slug}/standings`;
}

export function scheduleUrl(league, teamId) {
  return `https://site.api.espn.com/apis/site/v2/sports/${league.espnSport}/${league.slug}/teams/${encodeURIComponent(teamId)}/schedule`;
}

function logoOf(team) {
  if (!team) return "";
  if (typeof team.logo === "string") return team.logo;
  const logos = Array.isArray(team.logos) ? team.logos : [];
  const preferred = logos.find((logo) => (logo.rel || []).includes("default")) || logos[0];
  return preferred?.href || "";
}

function presentStat(name, value) {
  const numeric = Number(String(value ?? "").replace("%", ""));
  if (String(name).endsWith("Pct") && Number.isFinite(numeric) && Math.abs(numeric) <= 1.5) {
    return String(Math.round(numeric * 1000) / 10);
  }
  return value ?? "–";
}

function scoreText(score) {
  if (score == null) return null;
  if (typeof score === "string" || typeof score === "number") return String(score);
  if (typeof score === "object" && score.displayValue != null) return String(score.displayValue);
  return null;
}

function timelineKind(typeText, scoringPlay) {
  const text = String(typeText || "").toLowerCase();
  if (text.includes("card")) return "card";
  if (text.includes("substitut")) return "sub";
  if (scoringPlay || text === "goal" || text.includes("own goal") || text.includes("penalty goal")) return "goal";
  return null;
}

export function parseSummary(data) {
  const headerComp = data?.header?.competitions?.[0] || {};
  const status = headerComp.status || data?.header?.status || {};
  const start = headerComp.date || data?.header?.competitions?.[0]?.date || "";
  const sides = { home: null, away: null };
  for (const comp of headerComp.competitors || []) {
    const team = comp.team || {};
    sides[comp.homeAway === "away" ? "away" : "home"] = {
      id: team.id == null ? "" : String(team.id),
      name: team.displayName || team.name || "Team",
      logo: logoOf(team),
      score: scoreText(comp.score),
      winner: Boolean(comp.winner),
    };
  }
  const venue = data?.gameInfo?.venue || {};
  const officials = (data?.gameInfo?.officials || [])
    .map((official) => official.displayName || official.fullName)
    .filter(Boolean);

  const timeline = [];
  for (const event of data?.keyEvents || []) {
    const typeText = event?.type?.text || "";
    const kind = timelineKind(typeText, Boolean(event?.scoringPlay));
    if (!kind) continue;
    const people = (event.participants || []).map((person) => person?.athlete?.displayName).filter(Boolean);
    timeline.push({
      id: String(event.id || timeline.length),
      kind,
      minute: event?.clock?.displayValue || "",
      teamId: event?.team?.id == null ? "" : String(event.team.id),
      teamName: event?.team?.displayName || "",
      text: event.text || event.shortText || typeText,
      players: people,
      order: Number(event?.clock?.value ?? 0),
    });
  }
  timeline.sort((a, b) => a.order - b.order);

  const lineups = [];
  for (const roster of data?.rosters || []) {
    const players = Array.isArray(roster.roster) ? roster.roster : [];
    const mapPlayer = (player) => ({
      name: player?.athlete?.displayName || "Player",
      jersey: player?.jersey ? String(player.jersey) : "",
      position: player?.position?.abbreviation || player?.position?.displayName || "",
      place: Number(player?.formationPlace || 0),
    });
    const starters = players.filter((player) => player?.starter).map(mapPlayer).sort((a, b) => a.place - b.place);
    const bench = players.filter((player) => !player?.starter).map(mapPlayer);
    if (!starters.length && !bench.length) continue;
    lineups.push({
      teamId: roster?.team?.id == null ? "" : String(roster.team.id),
      name: roster?.team?.displayName || "Team",
      formation: roster.formation || "",
      homeAway: roster.homeAway || "",
      starters,
      bench,
    });
  }

  const statTeams = data?.boxscore?.teams || [];
  const byName = new Map();
  for (const side of statTeams) {
    const bag = {};
    for (const stat of side.statistics || []) {
      if (!stat?.name) continue;
      bag[stat.name] = { label: stat.label || stat.displayName || stat.name, value: stat.displayValue ?? "" };
    }
    byName.set(side.homeAway || side.team?.id, bag);
  }
  const homeStats = byName.get("home") || {};
  const awayStats = byName.get("away") || {};
  const statOrder = ["possessionPct", "totalShots", "shotsOnTarget", "wonCorners", "foulsCommitted", "yellowCards", "redCards", "passPct", "saves", "offsides"];
  const stats = [];
  for (const name of statOrder) {
    const home = homeStats[name];
    const away = awayStats[name];
    if (!home && !away) continue;
    stats.push({
      name,
      label: home?.label || away?.label || name,
      home: presentStat(name, home?.value),
      away: presentStat(name, away?.value),
    });
  }

  const form = (data?.lastFiveGames || []).map((block) => ({
    teamId: block?.team?.id == null ? "" : String(block.team.id),
    name: block?.team?.displayName || "Team",
    results: (block.events || []).slice(0, 5).map((event) => ({
      date: event.gameDate || event.date || "",
      opponent: event?.opponent?.displayName || "Opponent",
      score: event.score || "",
      result: event.gameResult || "",
      atVs: event.atVs || "",
    })),
  })).filter((block) => block.results.length);

  const series = (data?.seasonseries || []).find((item) => item?.type === "head-to-head") || (data?.seasonseries || [])[0];
  let h2h = null;
  if (series && (series.events || []).length) {
    h2h = {
      summary: series.summary || series.shortSummary || "",
      events: series.events.slice(0, 5).map((event) => {
        const comps = event.competitors || event.competitions?.[0]?.competitors || [];
        const home = comps.find((c) => c.homeAway === "home") || comps[0];
        const away = comps.find((c) => c.homeAway === "away") || comps[1];
        return {
          id: String(event.id || ""),
          date: event.date || "",
          status: event.statusType?.shortDetail || event.status || "",
          state: event.statusType?.state || "",
          home: home?.team?.displayName || "",
          away: away?.team?.displayName || "",
          homeScore: scoreText(home?.score),
          awayScore: scoreText(away?.score),
        };
      }).filter((event) => event.home || event.away),
    };
  }

  return {
    start,
    status,
    venue: {
      name: venue.fullName || venue.displayName || "",
      city: venue.address?.city || "",
      country: venue.address?.country || "",
    },
    attendance: Number(data?.gameInfo?.attendance) || null,
    officials,
    home: sides.home,
    away: sides.away,
    timeline,
    lineups,
    stats,
    form,
    h2h,
    box: parseBoxScore(data),
  };
}

function groupTitle(athletes, labels) {
  if (labels.includes("SV%")) return "Goalies";
  const abbrs = athletes.map((athlete) => athlete?.athlete?.position?.abbreviation).filter(Boolean);
  if (abbrs.length && abbrs.every((abbr) => abbr === "D")) return "Defence";
  if (abbrs.length && abbrs.every((abbr) => abbr === "G")) return "Goalies";
  if (labels.includes("PTS") || labels.includes("MIN")) return "Players";
  return "Skaters";
}

function pickColumns(labels) {
  const preferred = labels.includes("PTS")
    ? ["MIN", "PTS", "REB", "AST", "FG", "3PT", "FT", "+/-"]
    : labels.includes("SV%")
      ? ["SV", "SV%", "GA", "SA", "TOI"]
      : ["G", "A", "SOG", "S", "+/-", "TOI"];
  const chosen = preferred.filter((label) => labels.includes(label));
  return chosen.length ? chosen : labels.slice(0, 6);
}

export function parseBoxScore(data) {
  const groups = data?.boxscore?.players;
  if (!Array.isArray(groups) || !groups.length) return null;
  const teams = [];
  for (const group of groups) {
    const tables = [];
    for (const block of group.statistics || []) {
      const labels = block.labels || block.names || [];
      const athletes = block.athletes || [];
      if (!athletes.length || !labels.length) continue;
      const columns = pickColumns(labels);
      const indexes = columns.map((label) => labels.indexOf(label));
      tables.push({
        title: groupTitle(athletes, labels),
        columns,
        rows: athletes.map((athlete) => ({
          name: athlete?.athlete?.displayName || "Player",
          position: athlete?.athlete?.position?.abbreviation || "",
          starter: Boolean(athlete.starter),
          didNotPlay: Boolean(athlete.didNotPlay),
          values: athlete.didNotPlay ? [] : indexes.map((index) => (athlete.stats || [])[index] ?? ""),
        })),
      });
    }
    if (!tables.length) continue;
    teams.push({
      id: group?.team?.id == null ? "" : String(group.team.id),
      name: group?.team?.displayName || "Team",
      tables,
    });
  }
  return teams.length ? teams : null;
}

const STANDING_COLUMNS = [
  { key: "rank", alt: "playoffSeed", label: "Pos", wide: false },
  { key: "gamesPlayed", label: "P", wide: false },
  { key: "wins", label: "W", wide: true },
  { key: "ties", label: "D", wide: true },
  { key: "losses", label: "L", wide: true },
  { key: "pointsFor", label: "F", wide: true },
  { key: "pointsAgainst", label: "A", wide: true },
  { key: "pointDifferential", label: "GD", wide: true },
  { key: "points", label: "Pts", wide: false },
  { key: "winPercent", label: "Pct", wide: true },
  { key: "gamesBehind", label: "GB", wide: true },
];

export function parseStandings(data) {
  const children = Array.isArray(data?.children) && data.children.length
    ? data.children
    : (data?.standings ? [data] : []);
  const tables = [];
  for (const child of children) {
    const entries = child?.standings?.entries || [];
    if (!entries.length) continue;
    const rows = entries.map((entry, index) => {
      const stats = {};
      for (const stat of entry.stats || []) {
        if (stat?.name) stats[stat.name] = stat.displayValue ?? "";
      }
      return {
        teamId: entry?.team?.id == null ? "" : String(entry.team.id),
        team: entry?.team?.displayName || entry?.team?.name || "Team",
        logo: logoOf(entry.team),
        rank: stats.rank || stats.playoffSeed || String(index + 1),
        stats,
      };
    });
    const basketball = rows.some((row) => row.stats.winPercent);
    const skip = new Set(basketball ? ["points", "pointsFor", "pointsAgainst", "pointDifferential", "gamesPlayed"] : []);
    const columns = STANDING_COLUMNS.filter((column) => !skip.has(column.key) && rows.some((row) => {
      const value = row.stats[column.key] || (column.alt && row.stats[column.alt]);
      return value != null && value !== "";
    })).map((column) => ({
      ...column,
      key: rows.some((row) => row.stats[column.key] != null && row.stats[column.key] !== "") ? column.key : column.alt,
    }));
    tables.push({
      name: child.name || data?.name || "Standings",
      columns,
      rows,
    });
  }
  return tables;
}

export function parseSchedule(data) {
  const team = data?.team || {};
  const events = (data?.events || []).map((event) => {
    const comp = event?.competitions?.[0] || {};
    const sides = {};
    for (const competitor of comp.competitors || []) {
      sides[competitor.homeAway === "away" ? "away" : "home"] = {
        id: competitor?.team?.id == null ? "" : String(competitor.team.id),
        name: competitor?.team?.displayName || competitor?.team?.name || "Team",
        score: scoreText(competitor.score),
        winner: Boolean(competitor.winner),
      };
    }
    const type = comp.status?.type || {};
    return {
      id: String(event.id || ""),
      start: event.date || "",
      state: type.state || "",
      statusLabel: type.shortDetail || type.description || "",
      home: sides.home || null,
      away: sides.away || null,
    };
  }).filter((event) => event.start && event.home && event.away);
  return {
    id: team.id == null ? "" : String(team.id),
    name: team.displayName || team.name || "Team",
    logo: logoOf(team),
    events,
  };
}

export function splitSchedule(events, now = Date.now()) {
  const upcoming = [];
  const recent = [];
  for (const event of events) {
    const when = Date.parse(event.start);
    if (event.state === "in" || event.state === "pre" || (event.state !== "post" && Number.isFinite(when) && when >= now)) upcoming.push(event);
    else recent.push(event);
  }
  upcoming.sort((a, b) => (a.start < b.start ? -1 : 1));
  recent.sort((a, b) => (a.start < b.start ? 1 : -1));
  return { upcoming: upcoming.slice(0, 8), recent: recent.slice(0, 8) };
}
