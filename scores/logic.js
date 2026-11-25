const FALLBACK_ZONE = "Europe/Nicosia";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS_LONG = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export function resolveTimeZone(detected) {
  if (typeof detected !== "string" || !detected.trim()) return FALLBACK_ZONE;
  const zone = detected.trim();
  try {
    Intl.DateTimeFormat("en-GB", { timeZone: zone }).format(new Date());
    return zone;
  } catch {
    return FALLBACK_ZONE;
  }
}

export function partsInZone(date, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") bag[part.type] = part.value.trim();
  }
  let hour = bag.hour || "00";
  if (hour === "24") hour = "00";
  return {
    weekday: bag.weekday || "",
    year: bag.year,
    month: bag.month,
    day: bag.day,
    hour,
    minute: bag.minute || "00",
  };
}

export function ymdInZone(date, timeZone) {
  const p = partsInZone(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

export function todayYmd(timeZone, now = new Date()) {
  return ymdInZone(now, timeZone);
}

export function addDaysYmd(ymd, delta) {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + delta);
  return utc.toISOString().slice(0, 10);
}

/** UTC instant of local midnight at the start of `ymd` in `timeZone`. */
export function zonedMidnight(ymd, timeZone) {
  const [y, m, d] = ymd.split("-").map(Number);
  let utc = Date.UTC(y, m - 1, d, 0, 0, 0);
  for (let i = 0; i < 4; i += 1) {
    const p = partsInZone(new Date(utc), timeZone);
    const got = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), 0);
    const want = Date.UTC(y, m - 1, d, 0, 0, 0);
    const diff = want - got;
    if (diff === 0) break;
    utc += diff;
  }
  return new Date(utc);
}

export function espnDatesForLocalDay(ymd, timeZone) {
  const start = zonedMidnight(ymd, timeZone).getTime();
  const end = zonedMidnight(addDaysYmd(ymd, 1), timeZone).getTime();
  const dates = new Set();
  const step = 3 * 60 * 60 * 1000;
  for (let t = start; t < end; t += step) {
    dates.add(ymdInZone(new Date(t), "America/New_York").replaceAll("-", ""));
  }
  dates.add(ymdInZone(new Date(end - 1), "America/New_York").replaceAll("-", ""));
  return [...dates].sort();
}

export function formatKickoff(iso, timeZone) {
  const date = new Date(iso);
  const p = partsInZone(date, timeZone);
  const monthIndex = Number(p.month) - 1;
  const weekdayLong = WEEKDAYS_LONG[p.weekday] || p.weekday;
  return {
    ymd: `${p.year}-${p.month}-${p.day}`,
    dateLabel: `${p.weekday} ${p.day} ${MONTHS[monthIndex]}`,
    timeLabel: `${p.hour}:${p.minute}`,
    longLabel: `${weekdayLong} ${Number(p.day)} ${MONTHS_LONG[monthIndex]} ${p.year}`,
    title: `${weekdayLong} ${Number(p.day)} ${MONTHS_LONG[monthIndex]} ${p.year}, ${p.hour}:${p.minute} (${timeZone})`,
  };
}

export function shownZoneName(timeZone) {
  if (timeZone === "Asia/Nicosia" || timeZone === "Europe/Nicosia") return "Europe/Nicosia";
  return timeZone;
}

export function zoneLabel(timeZone, now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(now);
    const short = parts.find((p) => p.type === "timeZoneName")?.value || "";
    const name = shownZoneName(timeZone);
    if (short && short !== name && short !== timeZone) return `Times in ${name} (${short})`;
    return `Times in ${name}`;
  } catch {
    return "Times in Europe/Nicosia";
  }
}

export function describeStatus(status) {
  const type = status?.type || {};
  const name = type.name || "";
  const state = type.state || "";
  const shortDetail = String(type.shortDetail || "").trim();
  const clock = String(status?.displayClock || "").trim();

  if (/POSTPON/.test(name)) return { state: "pre", bucket: "other", label: "Postponed" };
  if (/CANCEL/.test(name)) return { state: "post", bucket: "other", label: "Cancelled" };
  if (/SUSPEND/.test(name)) return { state: "in", bucket: "live", label: "Suspended" };
  if (/DELAY/.test(name)) return { state: "pre", bucket: "scheduled", label: "Delayed" };
  if (name === "STATUS_HALFTIME" || shortDetail === "HT") {
    return { state: "in", bucket: "live", label: "Half-time" };
  }
  if (state === "pre") return { state: "pre", bucket: "scheduled", label: "Scheduled" };
  if (state === "post") {
    const usable = shortDetail && shortDetail.length <= 10 && !/\d{1,2}\/\d{1,2}/.test(shortDetail);
    return { state: "post", bucket: "finished", label: usable ? shortDetail : "FT" };
  }
  if (state === "in") {
    let detail = "";
    if (shortDetail && shortDetail.length <= 22 && !/scheduled/i.test(shortDetail)) detail = shortDetail;
    else if (clock && clock !== "0'" && clock !== "0.0" && clock !== "0") detail = clock;
    return { state: "in", bucket: "live", label: detail ? `Live · ${detail}` : "Live" };
  }
  return { state: state || "pre", bucket: "other", label: type.description || "Scheduled" };
}

function blankScore(described) {
  return described.bucket === "scheduled" || described.label === "Postponed" || described.label === "Cancelled";
}

function rosterAthletes(roster) {
  if (!roster) return [];
  if (Array.isArray(roster)) return roster.map((player) => player?.athlete || player).filter(Boolean);
  if (Array.isArray(roster.athletes)) return roster.athletes;
  return [];
}

function sideFromCompetitor(comp, tennis) {
  const athlete = comp?.athlete || {};
  const team = comp?.team || {};
  const athletes = rosterAthletes(comp?.roster);
  let name = "";
  let logo = "";
  if (tennis) {
    name = athlete.displayName || athlete.fullName || "";
    logo = athlete.flag?.href || "";
    if (!name && comp?.roster && !Array.isArray(comp.roster) && comp.roster.displayName) {
      name = comp.roster.displayName;
    }
    if (!name && athletes.length) {
      name = athletes.map((player) => player.displayName || player.shortName || player.fullName).filter(Boolean).join(" / ");
    }
    if (!logo) logo = athletes[0]?.flag?.href || "";
    if (!name) name = "Player";
  } else {
    name = team.displayName || team.shortDisplayName || team.name || "TBD";
    logo = team.logo || "";
  }
  const rawId = tennis ? athlete.id : team.id;
  const sets = Array.isArray(comp?.linescores)
    ? comp.linescores.map((set) => ({
        value: set?.value,
        won: Boolean(set?.winner),
      }))
    : [];
  return {
    id: rawId == null ? "" : String(rawId),
    name,
    logo: typeof logo === "string" ? logo : "",
    score: comp?.score == null ? null : String(comp.score),
    sets,
    winner: Boolean(comp?.winner),
  };
}

function competitionMatch(comp, event, league, leagueName, round) {
  const start = comp?.startDate || comp?.date || event?.date;
  if (!start || Number.isNaN(Date.parse(start))) return null;
  const described = describeStatus(comp?.status || event?.status || {});
  const tennis = league.kind === "tennis";
  const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];
  const homeComp = competitors.find((c) => c.homeAway === "home") || competitors[0];
  const awayComp = competitors.find((c) => c.homeAway === "away") || competitors[1];
  if (!homeComp || !awayComp) return null;
  const hide = blankScore(described);
  const home = sideFromCompetitor(homeComp, tennis);
  const away = sideFromCompetitor(awayComp, tennis);
  if (hide) {
    home.score = null;
    away.score = null;
    home.sets = [];
    away.sets = [];
    home.winner = false;
    away.winner = false;
  }
  const venue = comp?.venue?.fullName || comp?.venue?.displayName || event?.venue?.fullName || event?.venue?.displayName || "";
  return {
    id: `${league.id}:${comp?.id || event?.id || start}`,
    eventId: String(comp?.id || event?.id || ""),
    leagueId: league.id,
    sport: league.sport,
    country: league.country,
    countryRank: league.countryRank,
    league: leagueName,
    leagueRank: league.leagueRank,
    start: new Date(start).toISOString(),
    state: described.state,
    bucket: described.bucket,
    statusLabel: described.label,
    round: round || "",
    venue,
    tennis,
    home,
    away,
  };
}

export function normalizeScoreboard(data, league) {
  const events = Array.isArray(data?.events) ? data.events : [];
  const apiLeagueName = data?.leagues?.[0]?.name;
  const matches = [];
  if (league.kind === "tennis") {
    for (const event of events) {
      const tournament = event?.name || apiLeagueName || league.name;
      for (const grouping of event?.groupings || []) {
        const groupName = grouping?.grouping?.displayName || "";
        for (const comp of grouping?.competitions || []) {
          const round = comp?.round?.displayName || groupName;
          const match = competitionMatch(comp, event, league, tournament, round);
          if (match) matches.push(match);
        }
      }
    }
    return matches;
  }
  const leagueName = apiLeagueName || league.name;
  for (const event of events) {
    const comp = event?.competitions?.[0] || event;
    const match = competitionMatch(comp, event, league, leagueName, "");
    if (match) matches.push(match);
  }
  return matches;
}

export function dedupeMatches(matches) {
  const map = new Map();
  for (const match of matches) map.set(match.id, match);
  return [...map.values()];
}

export function onLocalDay(match, ymd, timeZone) {
  return formatKickoff(match.start, timeZone).ymd === ymd;
}

export function groupMatches(matches) {
  const sorted = [...matches].sort((a, b) => {
    if (a.countryRank !== b.countryRank) return a.countryRank - b.countryRank;
    if (a.country !== b.country) return a.country.localeCompare(b.country);
    if (a.leagueRank !== b.leagueRank) return a.leagueRank - b.leagueRank;
    if (a.league !== b.league) return a.league.localeCompare(b.league);
    if (a.start !== b.start) return a.start < b.start ? -1 : 1;
    return a.home.name.localeCompare(b.home.name);
  });
  const countries = new Map();
  for (const match of sorted) {
    let country = countries.get(match.country);
    if (!country) {
      country = { country: match.country, countryRank: match.countryRank, leagues: new Map() };
      countries.set(match.country, country);
    }
    let league = country.leagues.get(match.league);
    if (!league) {
      league = { name: match.league, rank: match.leagueRank, id: match.leagueId, matches: [] };
      country.leagues.set(match.league, league);
    }
    league.matches.push(match);
  }
  return [...countries.values()]
    .sort((a, b) => a.countryRank - b.countryRank || a.country.localeCompare(b.country))
    .map((country) => ({
      country: country.country,
      leagues: [...country.leagues.values()].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)),
    }));
}

export function scoreboardUrl(league, espnDate) {
  return `https://site.api.espn.com/apis/site/v2/sports/${league.espnSport}/${league.slug}/scoreboard?dates=${espnDate}&limit=200`;
}
