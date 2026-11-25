import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { clubs, countries, derbies, guides, leagueMeta, sportHubs } from "./seo-copy.mjs";
import { esc, renderDocument, sitemapIndex, sitemapXml } from "./seo-render.mjs";
import { parseSchedule, parseStandings, scheduleUrl, splitSchedule, standingsUrl } from "../scores/detail.js";
import { LEAGUES, leagueById } from "../scores/leagues.js";
import {
  addDaysYmd,
  espnDatesForLocalDay,
  formatKickoff,
  normalizeScoreboard,
  scoreboardUrl,
  todayYmd,
} from "../scores/logic.js";

const ZONE = "Europe/Nicosia";
const ROOT = process.cwd();
const WHAT_TIME = new Set(["ucl", "uel", "uecl", "epl", "laliga", "seriea", "bundesliga", "ligue1", "cyp"]);

async function getJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "HarbourlineSEO/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function pool(items, limit, fn) {
  const out = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

function viewMatch(match) {
  const kick = formatKickoff(match.start, ZONE);
  const scheduled = match.bucket === "scheduled" || match.home.score == null;
  return {
    iso: match.start,
    dateLabel: kick.dateLabel,
    timeLabel: kick.timeLabel,
    home: match.home.name,
    away: match.away.name,
    score: scheduled ? "–" : `${match.home.score}–${match.away.score}`,
    status: match.statusLabel,
    venue: match.venue || "",
    state: match.state,
    bucket: match.bucket,
    leagueId: match.leagueId,
    sport: match.sport,
    scoreText: scheduled ? `${kick.dateLabel} ${kick.timeLabel} Europe/Nicosia` : `Score ${match.home.score}–${match.away.score}`,
  };
}

function tableSection(tables) {
  if (!tables?.length) return "<section><h2>Table</h2><p>No standings table was published in the latest fetch.</p></section>";
  const blocks = tables.map((table) => {
    const columns = table.columns.slice(0, 8);
    const head = columns.map((column) => `<th>${esc(column.label)}</th>`).join("");
    const rows = table.rows.map((row) => {
      const cells = columns.map((column) => `<td>${esc(row.stats[column.key] || "–")}</td>`).join("");
      return `<tr><td>${esc(row.rank)}. ${esc(row.team)}</td>${cells}</tr>`;
    }).join("");
    return `<h3>${esc(table.name)}</h3><div class="table-wrap"><table class="standings"><tr><th>Team</th>${head}</tr>${rows}</table></div>`;
  }).join("");
  return `<section><h2>Table</h2>${blocks}</section>`;
}

function crumbs(...items) {
  return [{ href: "/", label: "Home" }, { href: "/scores/", label: "Scores" }, ...items];
}

function sportCrumb(sportPath, label) {
  return { href: `/scores/${sportPath}/`, label };
}

function findClub(tables, names) {
  const wanted = names.map((name) => name.toLowerCase());
  for (const table of tables) {
    for (const row of table.rows) {
      const team = row.team.toLowerCase();
      if (wanted.some((name) => team === name || team.startsWith(`${name} `) || team.startsWith(name))) return row;
    }
  }
  return null;
}

function slugify(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const now = new Date();
  const today = todayYmd(ZONE, now);
  const yesterday = addDaysYmd(today, -1);
  const tomorrow = addDaysYmd(today, 1);
  const days = [yesterday, today, tomorrow];
  const espnDates = [...new Set(days.flatMap((day) => espnDatesForLocalDay(day, ZONE)))];
  const fetchedAt = formatKickoff(now.toISOString(), ZONE);
  const fetchedLabel = `${fetchedAt.dateLabel} ${fetchedAt.timeLabel} Europe/Nicosia`;

  let okLeagues = 0;
  const byLeague = new Map();
  await pool(LEAGUES, 6, async (league) => {
    const matches = [];
    let ok = false;
    for (const date of espnDates) {
      try {
        const data = await getJson(scoreboardUrl(league, date));
        matches.push(...normalizeScoreboard(data, league));
        ok = true;
      } catch (error) {
        console.warn("scoreboard", league.id, date, error.message);
      }
    }
    if (ok) okLeagues += 1;
    const deduped = [...new Map(matches.map((match) => [match.id, match])).values()];
    byLeague.set(league.id, deduped.map(viewMatch));
  });
  if (okLeagues < 5) {
    console.error(`Only ${okLeagues} leagues responded. Leaving existing pages in place.`);
    process.exit(1);
  }

  const standings = new Map();
  await pool(Object.keys(leagueMeta), 6, async (id) => {
    const league = leagueById(id);
    try {
      standings.set(id, parseStandings(await getJson(standingsUrl(league))));
    } catch (error) {
      console.warn("standings", id, error.message);
      standings.set(id, []);
    }
  });

  const onDay = (id, ymd) => (byLeague.get(id) || []).filter((match) => formatKickoff(match.iso, ZONE).ymd === ymd);
  const pages = [];

  const sportLabels = { football: "Football", basketball: "Basketball", tennis: "Tennis", hockey: "Hockey", nfl: "NFL" };
  pages.push({
    path: "/scores/",
    title: "Harbourline live scores, fixtures and results",
    description: "Live football, basketball, tennis, NHL and NFL scores, with kick-off times, results and tables.",
    h1: "Live scores, fixtures and results",
    intro: [
      "Harbourline lists kick-off times, live scores and final results for the competitions it follows. The written snapshot uses Europe/Nicosia. The live board uses the time zone of your device.",
      "Start with football, or open a league page for a table and a fixture list. Scores come from ESPN’s public scoreboards. This is not a betting site.",
    ],
    crumbs: crumbs(),
    fixtures: LEAGUES.filter((league) => league.sport === "football").flatMap((league) => onDay(league.id, today)).slice(0, 40),
    sport: "football",
    day: "today",
    faqs: [
      { q: "What time zone are the written fixtures in?", a: "The snapshot on each page is Europe/Nicosia. The live board converts kick-offs to the time zone of the phone or computer you are using." },
      { q: "Where do the scores come from?", a: "Harbourline reads ESPN’s public scoreboard JSON in the browser and in a scheduled refresh of these pages. It is not affiliated with ESPN or the leagues." },
      { q: "Do you show betting odds?", a: "No. Harbourline does not list odds, spreads or betting partners." },
    ],
    related: [
      { href: "/scores/football/", label: "Football" },
      { href: "/scores/football/matches-today/", label: "Football today" },
      { href: "/scores/football/results-yesterday/", label: "Football results yesterday" },
      { href: "/scores/football/fixtures-tomorrow/", label: "Football fixtures tomorrow" },
      { href: "/scores/football/champions-league/", label: "Champions League" },
      { href: "/scores/football/champions-league/guide/", label: "Champions League format" },
      { href: "/scores/football/premier-league/", label: "Premier League" },
      { href: "/scores/football/premier-league/guide/", label: "Premier League format" },
      { href: "/scores/football/cyprus-first-division/", label: "Cyprus First Division" },
      { href: "/scores/football/england/", label: "England today" },
      { href: "/scores/football/derbies/el-clasico/", label: "El Clasico" },
      { href: "/scores/football/teams/arsenal/", label: "Arsenal" },
      { href: "/scores/basketball/nba/", label: "NBA" },
      { href: "/scores/tennis/atp/", label: "ATP" },
    ],
    events: [],
  });

  for (const [sport, copy] of Object.entries(sportHubs)) {
    const leagues = LEAGUES.filter((league) => league.sport === sport);
    pages.push({
      path: `/scores/${sport}/`,
      title: copy.title,
      description: copy.description,
      h1: copy.h1,
      intro: copy.intro,
      crumbs: crumbs({ href: `/scores/${sport}/`, label: sportLabels[sport] }),
      fixtures: leagues.flatMap((league) => onDay(league.id, today)).slice(0, 30),
      sport,
      day: "today",
      faqs: [
        { q: `Which ${copy.h1.replace(" live scores", "").replace(" scores", "")} competitions are listed?`, a: leagues.map((league) => leagueMeta[league.id]?.h1 || league.name).join(", ") + "." },
      ],
      related: [
        ...leagues.map((league) => ({ href: `/scores/${leagueMeta[league.id].sportPath}/${leagueMeta[league.id].slug}/`, label: league.name })),
        ...(sport === "football" ? [
          { href: "/scores/football/matches-today/", label: "Matches today" },
          { href: "/scores/football/results-yesterday/", label: "Results yesterday" },
          { href: "/scores/football/fixtures-tomorrow/", label: "Fixtures tomorrow" },
          ...countries.map((country) => ({ href: `/scores/football/${country.slug}/`, label: `${country.name} today` })),
          ...derbies.map((derby) => ({ href: `/scores/football/derbies/${derby.slug}/`, label: derby.title })),
        ] : []),
      ],
      events: [],
    });
  }

  const dayPages = [
    { slug: "matches-today", ymd: today, title: "Football matches today", h1: "Football matches today", description: "Football matches today with kick-off times in Europe/Nicosia, live scores and results.", day: "today", bucket: null },
    { slug: "results-yesterday", ymd: yesterday, title: "Football results yesterday", h1: "Football results yesterday", description: "Yesterday’s football results, full-time scores and kick-off times in Europe/Nicosia.", day: "yesterday", bucket: "finished" },
    { slug: "fixtures-tomorrow", ymd: tomorrow, title: "Football fixtures tomorrow", h1: "Football fixtures tomorrow", description: "Tomorrow’s football fixtures and kick-off times in Europe/Nicosia.", day: "tomorrow", bucket: "scheduled" },
  ];
  for (const day of dayPages) {
    let fixtures = LEAGUES.filter((league) => league.sport === "football").flatMap((league) => onDay(league.id, day.ymd));
    if (day.bucket) fixtures = fixtures.filter((match) => match.bucket === day.bucket);
    pages.push({
      path: `/scores/football/${day.slug}/`,
      title: `${day.title} · kick-off times and scores`,
      description: day.description,
      h1: day.h1,
      intro: [
        `${day.h1} across the football competitions Harbourline follows. The date is the Europe/Nicosia day, not the US television date.`,
        "A match with a dash has not kicked off in the snapshot. A finished match shows the score from the feed. Nothing on this list is estimated.",
      ],
      crumbs: crumbs(sportCrumb("football", "Football"), { href: `/scores/football/${day.slug}/`, label: day.h1 }),
      fixtures,
      sport: "football",
      day: day.day,
      faqs: [
        { q: "Which date is “today”?", a: "Today, yesterday and tomorrow on these pages are Europe/Nicosia dates. A match after midnight in Cyprus is tomorrow even if it is still evening in America." },
      ],
      related: countries.slice(0, 6).map((country) => ({ href: `/scores/football/${country.slug}/`, label: `${country.name} today` })),
      events: fixtures.slice(0, 12),
    });
  }

  for (const country of countries) {
    const fixtures = country.leagues.flatMap((id) => onDay(id, today));
    pages.push({
      path: `/scores/football/${country.slug}/`,
      title: `${country.name} football matches today`,
      description: `${country.name} football matches today, with kick-off times in Europe/Nicosia, scores and links to each league.`,
      h1: `${country.name} football matches today`,
      intro: [country.blurb, "Only the leagues named above are included. If the snapshot is empty, those leagues have no match on this Nicosia date."],
      crumbs: crumbs(sportCrumb("football", "Football"), { href: `/scores/football/${country.slug}/`, label: country.name }),
      fixtures,
      sport: "football",
      day: "today",
      faqs: [
        { q: `Which ${country.name} matches are listed today?`, a: country.blurb },
        { q: `What time are ${country.name} matches in Cyprus?`, a: country.timeNote },
      ],
      related: [
        ...country.leagues.map((id) => ({ href: `/scores/football/${leagueMeta[id].slug}/`, label: leagueMeta[id].h1.replace(" live scores", "") })),
        { href: "/scores/football/matches-today/", label: "All football today" },
        { href: "/scores/football/results-yesterday/", label: "Results yesterday" },
      ],
      events: fixtures.slice(0, 8),
    });
  }

  for (const [id, meta] of Object.entries(leagueMeta)) {
    const base = `/scores/${meta.sportPath}/${meta.slug}/`;
    const todayMatches = onDay(id, today);
    const upcoming = [...onDay(id, today), ...onDay(id, tomorrow)];
    const results = [...onDay(id, yesterday), ...onDay(id, today)].filter((match) => match.bucket === "finished");
    const shared = {
      sport: meta.sportPath === "nfl" ? "nfl" : LEAGUES.find((league) => league.id === id).sport,
      league: id,
    };
    const leagueCrumbs = [
      sportCrumb(meta.sportPath, sportLabelsFor(meta.sportPath)),
      { href: base, label: meta.h1.replace(" live scores", "").replace(" scores", "") },
    ];
    pages.push({
      path: base,
      title: meta.title,
      description: meta.description,
      h1: meta.h1,
      intro: meta.intro,
      crumbs: crumbs(...leagueCrumbs),
      fixtures: todayMatches,
      sport: shared.sport,
      league: id,
      day: "today",
      faqs: meta.faq,
      related: [
        { href: `${base}fixtures/`, label: "Fixtures" },
        { href: `${base}results/`, label: "Results" },
        { href: `${base}table/`, label: "Table" },
        ...(guides[id] ? [{ href: `${base}guide/`, label: "Format and dates" }] : []),
      ],
      events: todayMatches.slice(0, 10),
    });
    pages.push({
      path: `${base}fixtures/`,
      title: `${meta.h1.replace(" live scores", "")} fixtures and kick-off times`,
      description: `Upcoming ${meta.h1.replace(" live scores", "")} fixtures with kick-off times in Europe/Nicosia.`,
      h1: `${meta.h1.replace(" live scores", "")} fixtures`,
      intro: [
        meta.tableRule,
        "This fixtures page lists matches from today’s and tomorrow’s scoreboards. It is not a full-season calendar, and it does not add matches the feed does not have.",
      ],
      crumbs: crumbs(...leagueCrumbs, { href: `${base}fixtures/`, label: "Fixtures" }),
      fixtures: upcoming,
      ...shared,
      day: "today",
      faqs: [
        { q: `Where are the ${meta.h1.replace(" live scores", "")} dates?`, a: "This page lists today and tomorrow only, in Europe/Nicosia. It is not a full-season calendar. A match the scoreboard did not return is not added." },
      ],
      related: [{ href: base, label: meta.h1 }, { href: `${base}table/`, label: "Table" }, ...(guides[id] ? [{ href: `${base}guide/`, label: "Format and dates" }] : [])],
      events: upcoming.slice(0, 10),
    });
    pages.push({
      path: `${base}results/`,
      title: `${meta.h1.replace(" live scores", "")} results`,
      description: `Recent ${meta.h1.replace(" live scores", "")} results and full-time scores.`,
      h1: `${meta.h1.replace(" live scores", "")} results`,
      intro: [
        "Results are finished matches from yesterday and today in Europe/Nicosia. A match that is still scheduled is not given a score.",
      ],
      crumbs: crumbs(...leagueCrumbs, { href: `${base}results/`, label: "Results" }),
      fixtures: results,
      ...shared,
      day: "yesterday",
      faqs: [
        { q: `Which ${meta.h1.replace(" live scores", "")} results are shown?`, a: "Finished matches from yesterday and today in Europe/Nicosia. A match that has not been played is not given a score." },
      ],
      related: [{ href: base, label: meta.h1 }, { href: `${base}fixtures/`, label: "Fixtures" }],
      events: results.slice(0, 10),
    });
    pages.push({
      path: `${base}table/`,
      title: `${meta.h1.replace(" live scores", "")} table`,
      description: meta.tableRule,
      h1: `${meta.h1.replace(" live scores", "")} table`,
      intro: [meta.tableRule],
      extra: tableSection(standings.get(id) || []),
      crumbs: crumbs(...leagueCrumbs, { href: `${base}table/`, label: "Table" }),
      fixtures: null,
      ...shared,
      day: "today",
      faqs: [
        { q: `How is the ${meta.h1.replace(" live scores", "")} table ordered?`, a: meta.tableRule },
      ],
      related: [{ href: base, label: meta.h1 }, ...(guides[id] ? [{ href: `${base}guide/`, label: "Format and dates" }] : [])],
      events: [],
    });
    const guide = guides[id];
    if (guide) {
      pages.push({
        path: `${base}guide/`,
        title: guide.title,
        description: guide.description,
        h1: guide.h1,
        intro: guide.intro,
        crumbs: crumbs(...leagueCrumbs, { href: `${base}guide/`, label: "Format and dates" }),
        fixtures: upcoming,
        ...shared,
        day: "today",
        faqs: guide.faq,
        related: [
          { href: base, label: meta.h1 },
          { href: `${base}fixtures/`, label: "Fixtures" },
          { href: `${base}results/`, label: "Results" },
          { href: `${base}table/`, label: "Table" },
        ],
        events: upcoming.slice(0, 8),
      });
    }
  }

  for (const club of clubs) {
    const row = findClub(standings.get(club.league) || [], club.names);
    if (!row?.teamId) {
      console.warn("skip club, not in table", club.slug);
      continue;
    }
    const league = leagueById(club.league);
    const meta = leagueMeta[club.league];
    let schedule = null;
    try {
      schedule = parseSchedule(await getJson(scheduleUrl(league, row.teamId)));
    } catch (error) {
      console.warn("schedule", club.slug, error.message);
      continue;
    }
    const split = splitSchedule(schedule.events);
    const fixtures = [...split.upcoming, ...split.recent].slice(0, 12).map((event) => {
      const kick = formatKickoff(event.start, ZONE);
      const done = event.state === "post";
      return {
        iso: event.start,
        dateLabel: kick.dateLabel,
        timeLabel: kick.timeLabel,
        home: event.home.name,
        away: event.away.name,
        score: done ? `${event.home.score}–${event.away.score}` : "–",
        status: done ? (event.statusLabel || "FT") : "Scheduled",
        venue: "",
        state: event.state,
        sport: league.sport,
        scoreText: done ? `Score ${event.home.score}–${event.away.score}` : `${kick.dateLabel} ${kick.timeLabel}`,
      };
    });
    const next = split.upcoming[0];
    const nextLine = next
      ? `The next match on the fetched schedule is ${next.home.name} vs ${next.away.name} on ${formatKickoff(next.start, ZONE).dateLabel} at ${formatKickoff(next.start, ZONE).timeLabel} Europe/Nicosia.`
      : "The fetched schedule has no upcoming match to name.";
    pages.push({
      path: `/scores/${meta.sportPath}/teams/${club.slug}/`,
      title: `${row.team} fixtures, results and next match`,
      description: `${row.team} fixtures, recent results and the next match, with kick-off times in Europe/Nicosia.`,
      h1: `${row.team} fixtures and results`,
      intro: [
        `${row.team} are based in ${club.city} and appear in the ${league.name} table Harbourline reads. ${nextLine}`,
        "Past scores on this page are the ones in that schedule response. A dash means the match has not been played in the feed.",
      ],
      crumbs: crumbs(sportCrumb(meta.sportPath, sportLabelsFor(meta.sportPath)), { href: `/scores/${meta.sportPath}/${meta.slug}/`, label: league.name }, { href: `/scores/${meta.sportPath}/teams/${club.slug}/`, label: row.team }),
      fixtures,
      sport: league.sport,
      league: club.league,
      day: "today",
      faqs: [
        { q: `When is ${row.team}'s next match?`, a: nextLine },
      ],
      related: [{ href: `/scores/${meta.sportPath}/${meta.slug}/`, label: meta.h1 }, { href: `/scores/${meta.sportPath}/${meta.slug}/table/`, label: "Table" }],
      events: fixtures.slice(0, 6),
    });
  }

  for (const derby of derbies) {
    const meta = leagueMeta[derby.league];
    const poolMatches = [...onDay(derby.league, yesterday), ...onDay(derby.league, today), ...onDay(derby.league, tomorrow)];
    const hits = poolMatches.filter((match) => {
      const names = [match.home.toLowerCase(), match.away.toLowerCase()];
      return derby.teams.every((team) => names.some((name) => name.includes(team.toLowerCase().slice(0, 6))));
    });
    pages.push({
      path: `/scores/football/derbies/${derby.slug}/`,
      title: `${derby.title}: kick-off time, score and fixture`,
      description: `${derby.title} kick-off time and score when the fixture is on the current schedule.`,
      h1: derby.title,
      intro: [
        derby.text,
        hits.length
          ? `On the dates just fetched, the scoreboard includes ${hits.map((match) => `${match.home} vs ${match.away} at ${match.timeLabel} on ${match.dateLabel}`).join("; ")}.`
          : "No meeting between these sides is on yesterday’s, today’s or tomorrow’s scoreboard. This page does not invent the next date.",
      ],
      crumbs: crumbs(sportCrumb("football", "Football"), { href: `/scores/football/derbies/${derby.slug}/`, label: derby.title }),
      fixtures: hits,
      sport: "football",
      league: derby.league,
      day: "today",
      faqs: [
        { q: `What time is ${derby.title}?`, a: hits.length ? `${hits[0].home} vs ${hits[0].away} is listed at ${hits[0].timeLabel} Europe/Nicosia on ${hits[0].dateLabel}.` : "No kick-off is listed in the current three-day scoreboard." },
      ],
      related: [{ href: `/scores/football/${meta.slug}/`, label: meta.h1 }],
      events: hits,
    });
  }

  const whatTime = [];
  for (const id of WHAT_TIME) {
    for (const match of [...onDay(id, today), ...onDay(id, tomorrow)]) {
      if (match.bucket === "finished") continue;
      whatTime.push(match);
    }
  }
  whatTime.sort((a, b) => (a.iso < b.iso ? -1 : 1));
  const whatPaths = new Set();
  for (const match of whatTime.slice(0, 24)) {
    const meta = leagueMeta[match.leagueId];
    const slug = `what-time-is-${slugify(match.home)}-vs-${slugify(match.away)}`;
    const pagePath = `/scores/football/what-time/${slug}/`;
    if (whatPaths.has(pagePath)) continue;
    whatPaths.add(pagePath);
    pages.push({
      path: pagePath,
      title: `What time is ${match.home} vs ${match.away}?`,
      description: `${match.home} vs ${match.away} kicks off at ${match.timeLabel} Europe/Nicosia on ${match.dateLabel}.`,
      h1: `What time is ${match.home} vs ${match.away}?`,
      intro: [
        `${match.home} vs ${match.away} is scheduled for ${match.dateLabel} at ${match.timeLabel} in Europe/Nicosia${match.venue ? ` at ${match.venue}` : ""}.`,
        "That clock time is Cyprus time. The live board shows the same kick-off in whatever time zone your device uses. If the match has since been moved, the status on the live board is the one to trust.",
      ],
      crumbs: crumbs(sportCrumb("football", "Football"), { href: `/scores/football/${meta.slug}/`, label: meta.h1.replace(" live scores", "") }, { href: pagePath, label: `${match.home} vs ${match.away}` }),
      fixtures: [match],
      sport: "football",
      league: match.leagueId,
      day: formatKickoff(match.iso, ZONE).ymd === tomorrow ? "tomorrow" : "today",
      faqs: [
        { q: `What time is ${match.home} vs ${match.away}?`, a: `${match.timeLabel} Europe/Nicosia on ${match.dateLabel}.` },
      ],
      related: [{ href: `/scores/football/${meta.slug}/`, label: meta.h1 }],
      events: [match],
    });
  }

  const titles = new Set();
  for (const page of pages) {
    if (titles.has(page.title)) throw new Error(`Duplicate title: ${page.title}`);
    titles.add(page.title);
    if (!page.h1 || !page.description || !page.path.endsWith("/")) throw new Error(`Bad page ${page.path}`);
  }

  const writtenWhat = new Set();
  for (const page of pages) {
    const file = page.path === "/scores/" ? path.join(ROOT, "scores/index.html") : path.join(ROOT, page.path.slice(1), "index.html");
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, renderDocument({ ...page, fetchedAt: fetchedLabel }));
    if (page.path.startsWith("/scores/football/what-time/")) writtenWhat.add(path.dirname(file));
  }

  const whatDir = path.join(ROOT, "scores/football/what-time");
  await mkdir(whatDir, { recursive: true });
  for (const entry of await readdir(whatDir, { withFileTypes: true })) {
    const full = path.join(whatDir, entry.name);
    if (entry.isDirectory() && !writtenWhat.has(full)) await rm(full, { recursive: true, force: true });
  }

  const lastmod = today;
  await writeFile(path.join(ROOT, "scores/sitemap.xml"), sitemapXml(pages.map((page) => page.path), lastmod));
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemapIndex());
  console.log(`Wrote ${pages.length} pages, ${okLeagues} leagues ok`);
}

function sportLabelsFor(sportPath) {
  return { football: "Football", basketball: "Basketball", tennis: "Tennis", hockey: "Hockey", nfl: "NFL" }[sportPath] || sportPath;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
