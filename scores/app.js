import { parseSchedule, parseStandings, parseSummary, scheduleUrl, splitSchedule, standingsUrl, summaryUrl } from "./detail.js";
import { PARTNERS, amazonSearch } from "./partners.js";
import { isMine, loadFavs, teamKey, toggleFav } from "./favourites.js";
import { SPORTS, leagueById, leaguesForSport } from "./leagues.js";
import {
  addDaysYmd,
  dedupeMatches,
  describeStatus,
  espnDatesForLocalDay,
  formatKickoff,
  groupMatches,
  normalizeScoreboard,
  onLocalDay,
  resolveTimeZone,
  scoreboardUrl,
  todayYmd,
  zoneLabel,
} from "./logic.js";

const REFRESH_MS = 45000;
const WAKE_BEFORE_MS = 20 * 60 * 1000;
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const CACHE_KEY = "harbourline.v1";
const DAY_OFFSETS = [
  { id: "yesterday", offset: -1, label: "Yesterday" },
  { id: "today", offset: 0, label: "Today" },
  { id: "tomorrow", offset: 1, label: "Tomorrow" },
];
const BUCKETS = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "finished", label: "Finished" },
  { id: "scheduled", label: "Scheduled" },
  { id: "mine", label: "My games" },
];

const state = {
  timeZone: resolveTimeZone(readDetectedZone()),
  sport: "football",
  dayOffset: 0,
  bucket: "all",
  view: "board",
  leagueId: "",
  eventId: "",
  teamId: "",
  matches: [],
  loading: true,
  updatedAt: null,
  notice: null,
  generation: 0,
  favs: loadFavs(),
  detail: null,
  detailError: "",
  detailLoading: false,
};

let activeController = null;
let timer = 0;

const sportsNav = document.querySelector("#sports");
const daysNav = document.querySelector("#days");
const filtersNav = document.querySelector("#filters");
const board = document.querySelector("#board");
const noticeEl = document.querySelector("#notice");
const updatedEl = document.querySelector("#updated");
const tzEl = document.querySelector("#tz-label");
const refreshBtn = document.querySelector("#refresh");

function readDetectedZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

function selectedYmd() {
  return addDaysYmd(todayYmd(state.timeZone), state.dayOffset);
}

function readRoute() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "match" && parts[1] && parts[2]) {
    state.view = "match";
    state.leagueId = parts[1];
    state.eventId = decodeURIComponent(parts[2]);
    const league = leagueById(parts[1]);
    if (league) state.sport = league.sport;
    return;
  }
  if (parts[0] === "team" && parts[1] && parts[2]) {
    state.view = "team";
    state.leagueId = parts[1];
    state.teamId = decodeURIComponent(parts[2]);
    const league = leagueById(parts[1]);
    if (league) state.sport = league.sport;
    return;
  }
  if (parts[0] === "table" && parts[1]) {
    state.view = "table";
    state.leagueId = parts[1];
    const league = leagueById(parts[1]);
    if (league) state.sport = league.sport;
    return;
  }
  state.view = "board";
  if (SPORTS.some((item) => item.id === parts[0])) state.sport = parts[0];
  const found = DAY_OFFSETS.find((item) => item.id === parts[1]);
  if (found) state.dayOffset = found.offset;
}

function writeRoute() {
  const day = DAY_OFFSETS.find((item) => item.offset === state.dayOffset)?.id || "today";
  const next = `#${state.sport}/${day}`;
  if (location.hash !== next) history.replaceState(null, "", next);
}

function readCacheStore() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCacheStore(store) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(store));
  } catch {
    /* Private mode or a full disk should not block the page. */
  }
}

function cacheMatches(leagueId, espnDate, matches) {
  const store = readCacheStore();
  store[`${leagueId}:${espnDate}`] = { at: Date.now(), matches };
  writeCacheStore(store);
}

function cachedMatches(leagueId, espnDate) {
  const store = readCacheStore();
  const row = store[`${leagueId}:${espnDate}`];
  if (!row || !Array.isArray(row.matches)) return null;
  if (Date.now() - row.at > CACHE_MAX_AGE) return null;
  return { at: row.at, matches: row.matches };
}

async function fetchScoreboard(league, espnDate, signal, fresh) {
  const response = await fetch(scoreboardUrl(league, espnDate), {
    signal,
    cache: fresh ? "reload" : "default",
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) return { leagues: [], events: [] };
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function loadLeagueDate(league, espnDate, signal, fresh) {
  try {
    const data = await fetchScoreboard(league, espnDate, signal, fresh);
    const matches = normalizeScoreboard(data, league);
    cacheMatches(league.id, espnDate, matches);
    return { leagueId: league.id, matches, failed: false, staleAt: null };
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    const cached = cachedMatches(league.id, espnDate);
    if (cached) return { leagueId: league.id, matches: cached.matches, failed: true, staleAt: cached.at };
    return { leagueId: league.id, matches: [], failed: true, staleAt: null };
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function ensureChrome() {
  if (!sportsNav.childElementCount) {
    sportsNav.replaceChildren(...SPORTS.map((sport) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sport-tab";
      button.dataset.sport = sport.id;
      button.append(document.createTextNode(sport.label));
      const count = document.createElement("span");
      count.className = "sport-count";
      button.append(count);
      return button;
    }));
  }
  if (!daysNav.childElementCount) {
    daysNav.replaceChildren(...DAY_OFFSETS.map((day) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "day";
      button.dataset.offset = String(day.offset);
      const small = document.createElement("small");
      small.textContent = day.label;
      const strong = document.createElement("strong");
      button.append(small, strong);
      return button;
    }));
  }
  if (!filtersNav.childElementCount) {
    filtersNav.replaceChildren(...BUCKETS.map((bucket) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "filter";
      button.dataset.bucket = bucket.id;
      return button;
    }));
  }
}

function renderChrome() {
  ensureChrome();
  tzEl.textContent = zoneLabel(state.timeZone);
  const ymd = selectedYmd();
  for (const sport of SPORTS) {
    const button = sportsNav.querySelector(`button[data-sport="${sport.id}"]`);
    button.setAttribute("aria-pressed", String(sport.id === state.sport));
    const count = button.querySelector(".sport-count");
    if (sport.id === state.sport && !(state.loading && !state.matches.length)) {
      const n = state.matches.filter((match) => match.sport === sport.id && onLocalDay(match, ymd, state.timeZone)).length;
      count.textContent = ` ${n}`;
      count.hidden = false;
    } else {
      count.textContent = "";
      count.hidden = true;
    }
  }
  for (const day of DAY_OFFSETS) {
    const button = daysNav.querySelector(`button[data-offset="${day.offset}"]`);
    const parts = civilLabel(addDaysYmd(todayYmd(state.timeZone), day.offset));
    button.setAttribute("aria-pressed", String(day.offset === state.dayOffset));
    button.setAttribute("aria-label", `${day.label}, ${parts.longLabel}`);
    button.querySelector("strong").textContent = parts.dateLabel;
  }
  const visible = state.matches.filter((match) => match.sport === state.sport && onLocalDay(match, ymd, state.timeZone));
  for (const bucket of BUCKETS) {
    const button = filtersNav.querySelector(`button[data-bucket="${bucket.id}"]`);
    const count = bucket.id === "all"
      ? visible.length
      : bucket.id === "mine"
        ? visible.filter((match) => isMine(match, state.favs)).length
        : visible.filter((match) => match.bucket === bucket.id).length;
    button.setAttribute("aria-pressed", String(bucket.id === state.bucket));
    button.textContent = `${bucket.label} · ${count}`;
  }

  if (state.loading && !dayMatchCount()) {
    updatedEl.textContent = "Loading fixtures…";
  } else if (state.loading) {
    updatedEl.textContent = "Refreshing…";
  } else if (state.updatedAt) {
    const stamp = formatKickoff(new Date(state.updatedAt).toISOString(), state.timeZone);
    const live = visible.some((match) => match.bucket === "live");
    updatedEl.textContent = live
      ? `Updated ${stamp.timeLabel} · refreshing live scores`
      : `Updated ${stamp.timeLabel}`;
  }
}

function civilLabel(ymd) {
  const [year, month, date] = ymd.split("-").map(Number);
  return formatKickoff(new Date(Date.UTC(year, month - 1, date, 12)).toISOString(), "UTC");
}

function dayMatchCount() {
  return state.matches.filter((match) => match.sport === state.sport && onLocalDay(match, selectedYmd(), state.timeZone)).length;
}

function crestNode(side) {
  const allowed = typeof side.logo === "string" && side.logo.startsWith("https://a.espncdn.com/");
  if (!allowed) return initialsNode(side.name);
  const img = document.createElement("img");
  img.className = "crest";
  img.alt = "";
  img.width = 28;
  img.height = 28;
  img.decoding = "async";
  img.referrerPolicy = "no-referrer";
  img.src = side.logo;
  img.addEventListener("error", () => {
    img.replaceWith(initialsNode(side.name));
  });
  return img;
}

function initialsNode(name) {
  const el = document.createElement("span");
  el.className = "initials";
  el.setAttribute("aria-hidden", "true");
  const letters = String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  el.textContent = letters || "•";
  return el;
}

function scoreNode(side, tennis) {
  if (tennis && side.sets.length) {
    const wrap = document.createElement("span");
    wrap.className = "sets";
    for (const set of side.sets) {
      const cell = document.createElement("span");
      cell.className = set.won ? "set" : "set lost";
      const value = Number(set.value);
      cell.textContent = Number.isFinite(value) ? String(Math.round(value)) : "–";
      wrap.append(cell);
    }
    return wrap;
  }
  const el = document.createElement("span");
  el.className = "side-score";
  el.textContent = side.score == null || side.score === "" ? "–" : side.score;
  return el;
}

function renderMatch(match) {
  const kick = formatKickoff(match.start, state.timeZone);
  const article = document.createElement("article");
  article.className = `match${match.bucket === "finished" ? " is-final" : ""}`;
  article.dataset.state = match.bucket;
  article.dataset.kickoff = match.start;
  article.dataset.league = match.league;
  if (match.venue) article.title = match.venue;

  const when = document.createElement("div");
  when.className = "when";
  const time = document.createElement("time");
  time.dateTime = match.start;
  time.title = kick.title;
  const date = document.createElement("span");
  date.className = "when-date";
  date.textContent = kick.dateLabel;
  const clock = document.createElement("span");
  clock.className = "when-time";
  clock.textContent = kick.timeLabel;
  time.append(date, clock);
  when.append(time);
  if (match.round) {
    const round = document.createElement("span");
    round.className = "round";
    round.textContent = match.round;
    when.append(round);
  }

  const sides = document.createElement("div");
  sides.className = "sides";
  for (const side of [match.home, match.away]) {
    const row = document.createElement("div");
    const role = match.bucket === "finished" ? (side.winner ? " winner" : " loser") : "";
    row.className = `side${role}`;
    const name = document.createElement("span");
    name.className = "side-name";
    name.textContent = side.name;
    row.append(crestNode(side), name, scoreNode(side, match.tennis));
    sides.append(row);
  }

  const badge = document.createElement("p");
  badge.className = `badge ${match.bucket === "finished" ? "finished" : match.bucket}`;
  badge.textContent = match.statusLabel;

  article.append(starButton("matches", match.id, `${match.home.name} vs ${match.away.name}`), when, sides, badge);
  article.tabIndex = 0;
  article.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    location.hash = `#match/${match.leagueId}/${encodeURIComponent(match.eventId)}`;
  });
  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter") location.hash = `#match/${match.leagueId}/${encodeURIComponent(match.eventId)}`;
  });
  return article;
}

function starButton(kind, id, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "star";
  button.dataset.star = kind;
  button.dataset.id = id;
  const on = state.favs[kind]?.has(id);
  button.setAttribute("aria-pressed", String(Boolean(on)));
  button.setAttribute("aria-label", on ? `Remove ${label} from favourites` : `Star ${label}`);
  button.textContent = "★";
  return button;
}

function renderBoard() {
  const ymd = selectedYmd();
  const headingDate = civilLabel(ymd);
  const sportLabel = SPORTS.find((item) => item.id === state.sport)?.label || "Scores";
  const dayMatches = state.matches.filter((match) => match.sport === state.sport && onLocalDay(match, ymd, state.timeZone));
  const shown = state.bucket === "all"
    ? dayMatches
    : state.bucket === "mine"
      ? dayMatches.filter((match) => isMine(match, state.favs))
      : dayMatches.filter((match) => match.bucket === state.bucket);

  const fragment = document.createDocumentFragment();
  const heading = document.createElement("h2");
  heading.className = "day-heading";
  heading.textContent = `${headingDate.longLabel} · ${sportLabel}`;
  fragment.append(heading);

  if (state.loading && !shown.length) {
    const block = document.createElement("div");
    block.className = "loading-block";
    block.innerHTML = '<div class="sk"></div><div class="sk wide"></div><div class="sk wide"></div><p>Loading fixtures…</p>';
    fragment.append(block);
  } else if (!shown.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const title = document.createElement("h2");
    const copy = document.createElement("p");
    if (state.bucket === "live") {
      title.textContent = "No live matches";
      copy.textContent = "Nothing in this sport is in play right now. Scheduled and finished matches are on the other filters.";
    } else if (state.bucket === "finished") {
      title.textContent = "No final scores yet";
      copy.textContent = "None of these competitions have a finished match on this day.";
    } else if (state.bucket === "scheduled") {
      title.textContent = "No upcoming kick-offs";
      copy.textContent = "Every match we have for this day has already started or finished.";
    } else if (state.bucket === "mine") {
      title.textContent = "No starred games on this day";
      copy.textContent = "Star a match, a team, or a league. Matches you star, and matches involving a starred team or league, show up here.";
    } else if (state.notice?.kind === "error") {
      title.textContent = "Scores could not be loaded";
      copy.textContent = "The score feed did not respond, and there is no saved copy on this device. Check your connection and try again.";
    } else {
      title.textContent = "No matches on this day";
      copy.textContent = `None of the ${sportLabel.toLowerCase()} competitions Harbourline follows have a fixture on ${headingDate.longLabel}.`;
    }
    empty.append(title, copy);
    fragment.append(empty);
  } else {
    const note = document.createElement("p");
    note.className = "day-note";
    note.textContent = `${shown.length} ${shown.length === 1 ? "match" : "matches"} · ${zoneLabel(state.timeZone)}`;
    fragment.append(note);
    for (const country of groupMatches(shown)) {
      const label = document.createElement("p");
      label.className = "country-label";
      label.textContent = country.country;
      fragment.append(label);
      for (const league of country.leagues) {
        const section = document.createElement("section");
        section.className = "league";
        const head = document.createElement("div");
        head.className = "league-head";
        const h3 = document.createElement("h3");
        h3.textContent = league.name;
        const tools = document.createElement("div");
        tools.className = "league-tools";
        const table = document.createElement("a");
        table.className = "table-link";
        table.href = `#table/${league.id}`;
        table.textContent = "Table";
        const count = document.createElement("span");
        count.className = "league-count";
        count.textContent = String(league.matches.length);
        tools.append(starButton("leagues", league.id, league.name), table, count);
        head.append(h3, tools);
        section.append(head);
        for (const match of league.matches) section.append(renderMatch(match));
        fragment.append(section);
      }
    }
  }

  board.replaceChildren(fragment);
  document.title = `${headingDate.longLabel} · Harbourline scores`;
}

function renderNotice() {
  noticeEl.replaceChildren();
  if (!state.notice) return;
  const banner = document.createElement("div");
  banner.className = "banner";
  banner.setAttribute("role", "status");
  const p = document.createElement("p");
  p.textContent = state.notice.text;
  banner.append(p);
  if (state.notice.kind === "error" || state.notice.kind === "stale") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Try again";
    button.addEventListener("click", () => { void load({ fresh: true }); });
    banner.append(button);
  }
  noticeEl.append(banner);
}

function render() {
  document.body.classList.toggle("is-deep", state.view !== "board");
  renderChrome();
  if (state.view !== "board") noticeEl.replaceChildren();
  else renderNotice();
  if (state.view === "match") renderMatchPage();
  else if (state.view === "team") renderTeamPage();
  else if (state.view === "table") renderTablePage();
  else renderBoard();
}

function applyResults(parts, leagues) {
  const received = new Set(parts.map((part) => part.leagueId));
  const incoming = dedupeMatches(parts.flatMap((part) => part.matches));
  state.matches = dedupeMatches([
    ...state.matches.filter((match) => !received.has(match.leagueId)),
    ...incoming,
  ]);
  const failed = parts.filter((part) => part.failed).length;
  const staleTimes = parts.map((part) => part.staleAt).filter(Boolean);
  state.updatedAt = Date.now();
  if (failed === parts.length && matches.length === 0) {
    state.notice = {
      kind: "error",
      text: "Scores could not be loaded. Check your connection and try again.",
    };
  } else if (failed > 0 && staleTimes.length) {
    const oldest = Math.min(...staleTimes);
    const stamp = formatKickoff(new Date(oldest).toISOString(), state.timeZone);
    state.notice = {
      kind: "stale",
      text: `Live update failed for ${failed} of ${leagues.length} competitions. Showing saved scores from ${stamp.dateLabel} ${stamp.timeLabel}.`,
    };
  } else if (failed > 0) {
    state.notice = {
      kind: "partial",
      text: `${failed} competition${failed === 1 ? "" : "s"} could not be refreshed. The rest of the board is up to date.`,
    };
  } else {
    state.notice = null;
  }
}

async function load({ fresh = false, leagues = null } = {}) {
  const generation = ++state.generation;
  if (activeController) activeController.abort();
  const controller = new AbortController();
  activeController = controller;
  const sportLeagues = leagues || leaguesForSport(state.sport);
  const dates = espnDatesForLocalDay(selectedYmd(), state.timeZone);
  const jobs = sportLeagues.flatMap((league) => dates.map((espnDate) => ({ league, espnDate })));
  state.loading = true;
  render();

  const parts = [];
  try {
    await mapPool(jobs, 6, async (job) => {
      const result = await loadLeagueDate(job.league, job.espnDate, controller.signal, fresh);
      if (generation !== state.generation) return;
      parts.push(result);
      applyResults(parts, sportLeagues);
      state.loading = parts.length < jobs.length;
      render();
    });
  } catch (error) {
    if (error?.name === "AbortError") return;
    state.notice = { kind: "error", text: "Scores could not be loaded. Check your connection and try again." };
  }
  if (generation !== state.generation) return;
  state.loading = false;
  if (!parts.length && jobs.length) {
    state.notice = { kind: "error", text: "Scores could not be loaded. Check your connection and try again." };
  }
  render();
  armTimer();
}

function leaguesDueForRefresh() {
  const now = Date.now();
  const ymd = selectedYmd();
  const ids = new Set();
  for (const match of state.matches) {
    if (match.sport !== state.sport || !onLocalDay(match, ymd, state.timeZone)) continue;
    const start = Date.parse(match.start);
    if (match.bucket === "live") ids.add(match.leagueId);
    if (match.bucket === "scheduled" && start - now <= WAKE_BEFORE_MS && now - start <= 6 * 60 * 60 * 1000) {
      ids.add(match.leagueId);
    }
  }
  return leaguesForSport(state.sport).filter((league) => ids.has(league.id));
}

function refreshDelay() {
  const now = Date.now();
  const ymd = selectedYmd();
  let due = false;
  let next = Infinity;
  for (const match of state.matches) {
    if (match.sport !== state.sport || !onLocalDay(match, ymd, state.timeZone)) continue;
    const start = Date.parse(match.start);
    if (match.bucket === "live") due = true;
    if (match.bucket === "scheduled") {
      const wake = start - WAKE_BEFORE_MS;
      if (wake <= now) due = true;
      else next = Math.min(next, wake - now);
    }
  }
  if (due) return REFRESH_MS;
  if (next < Infinity) return Math.min(next, 10 * 60 * 1000);
  return 10 * 60 * 1000;
}

async function refreshLive() {
  if (document.hidden) {
    armTimer();
    return;
  }
  const due = leaguesDueForRefresh();
  if (!due.length) {
    armTimer();
    return;
  }
  const dates = espnDatesForLocalDay(selectedYmd(), state.timeZone);
  const jobs = due.flatMap((league) => dates.map((espnDate) => ({ league, espnDate })));
  const controller = new AbortController();
  try {
    const parts = await mapPool(jobs, 4, (job) => loadLeagueDate(job.league, job.espnDate, controller.signal, false));
    const blocked = new Set(parts.filter((part) => part.failed && part.matches.length === 0).map((part) => part.leagueId));
    const leagueIds = new Set(due.map((league) => league.id));
    const incoming = dedupeMatches(parts.flatMap((part) => part.matches)).filter((match) => !blocked.has(match.leagueId));
    const kept = state.matches.filter((match) => blocked.has(match.leagueId) || !leagueIds.has(match.leagueId));
    state.matches = dedupeMatches([...kept, ...incoming]);
    state.updatedAt = Date.now();
    const failed = parts.filter((part) => part.failed).length;
    if (failed === parts.length) {
      state.notice = { kind: "stale", text: "Live update failed. Showing the last scores saved on this device." };
    } else if (failed === 0) {
      state.notice = null;
    }
    if (state.view === "board") render();
  } catch (error) {
    if (error?.name !== "AbortError") {
      state.notice = { kind: "stale", text: "Live update failed. Showing the last scores saved on this device." };
      if (state.view === "board") render();
    }
  }
  armTimer();
}

function armTimer() {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { void refreshLive(); }, refreshDelay());
}

function safeLogo(url) {
  return typeof url === "string" && url.startsWith("https://a.espncdn.com/") ? url : "";
}

function backLink() {
  const p = document.createElement("p");
  p.className = "back";
  const a = document.createElement("a");
  a.href = boardHash();
  a.textContent = "← Scores";
  p.append(a);
  return p;
}

function partnerLink(href, name, hint) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = href;
  a.rel = "sponsored noopener";
  a.target = "_blank";
  a.append(document.createTextNode(name));
  if (hint) {
    const span = document.createElement("span");
    span.textContent = hint;
    a.append(span);
  }
  li.append(a);
  return li;
}

function travelBlock(gearQuery) {
  const aside = document.createElement("aside");
  aside.className = "partners";
  aside.setAttribute("aria-label", "Partner links");
  const kicker = document.createElement("p");
  kicker.className = "partners-kicker";
  const tag = document.createElement("span");
  tag.className = "ad-tag";
  tag.textContent = "Ad";
  kicker.append(tag, document.createTextNode("Travel to the match"));
  const note = document.createElement("p");
  note.className = "section-note";
  note.textContent = "Flights, a transfer, or an eSIM for the trip. Partner links.";
  const list = document.createElement("ul");
  list.className = "partner-links";
  for (const partner of PARTNERS) list.append(partnerLink(partner.href, partner.name, partner.hint));
  list.append(partnerLink(amazonSearch(gearQuery), "Amazon.de", "Fan gear"));
  aside.append(kicker, note, list);
  return aside;
}

function sectionTitle(text) {
  const h = document.createElement("h3");
  h.className = "section-title";
  h.textContent = text;
  return h;
}

function panelNote(text) {
  const p = document.createElement("p");
  p.className = "section-note";
  p.textContent = text;
  return p;
}

let deepToken = 0;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function openDeep() {
  const token = ++deepToken;
  state.detail = null;
  state.detailError = "";
  state.detailLoading = true;
  render();
  const league = leagueById(state.leagueId);
  if (!league) {
    state.detailLoading = false;
    state.detailError = "That competition is not on Harbourline.";
    if (token === deepToken) render();
    return;
  }
  try {
    if (state.view === "match" && league.kind === "tennis") {
      state.detail = { tennis: true, match: state.matches.find((match) => match.leagueId === league.id && match.eventId === state.eventId) || null };
    } else if (state.view === "match") {
      state.detail = parseSummary(await fetchJson(summaryUrl(league, state.eventId)));
    } else if (state.view === "table") {
      state.detail = { tables: parseStandings(await fetchJson(standingsUrl(league))) };
    } else if (state.view === "team") {
      const [scheduleResult, standingsResult] = await Promise.all([
        fetchJson(scheduleUrl(league, state.teamId)).then((data) => parseSchedule(data)).catch(() => null),
        fetchJson(standingsUrl(league)).then((data) => parseStandings(data)).catch(() => []),
      ]);
      if (!scheduleResult) throw new Error("schedule");
      state.detail = { schedule: scheduleResult, tables: standingsResult };
    }
  } catch {
    state.detailError = "This page could not be loaded. The feed did not respond, and there is nothing saved for it.";
  }
  if (token !== deepToken) return;
  state.detailLoading = false;
  render();
}

function loadingBlock(text) {
  const block = document.createElement("div");
  block.className = "loading-block";
  const p = document.createElement("p");
  p.textContent = text;
  block.append(p);
  return block;
}

function renderMatchPage() {
  const league = leagueById(state.leagueId);
  const fragment = document.createDocumentFragment();
  fragment.append(backLink());
  if (state.detailLoading) {
    fragment.append(loadingBlock("Loading match detail…"));
    board.replaceChildren(fragment);
    return;
  }
  if (state.detailError || !state.detail) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const title = document.createElement("h2");
    title.textContent = "Match detail unavailable";
    empty.append(title, panelNote(state.detailError || "Nothing was returned for this match."));
    fragment.append(empty);
    board.replaceChildren(fragment);
    return;
  }
  if (state.detail.tennis) renderTennisDetail(fragment, state.detail.match, league);
  else renderSummaryDetail(fragment, state.detail, league);
  board.replaceChildren(fragment);
}

function renderTennisDetail(fragment, match, league) {
  if (!match) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const title = document.createElement("h2");
    title.textContent = "Open this match from the board";
    empty.append(title, panelNote("Tennis set scores come from the scoreboard. Go back to the list and open the match from there."));
    fragment.append(empty);
    return;
  }
  fragment.append(scoreHeader({
    start: match.start,
    status: { type: { state: match.state, shortDetail: match.statusLabel, name: match.bucket === "finished" ? "STATUS_FINAL" : "STATUS_SCHEDULED" } },
    home: match.home,
    away: match.away,
    venue: { name: match.venue || "" },
    officials: [],
    attendance: null,
    league,
    tennis: true,
  }));
  const card = document.createElement("section");
  card.className = "detail-card";
  card.append(sectionTitle(match.round || "Sets"));
  if (match.home.sets?.length || match.away.sets?.length) {
    card.append(setLine(match.home), setLine(match.away));
  } else {
    card.append(panelNote("Set scores have not been posted yet."));
  }
  fragment.append(card);
  fragment.append(travelBlock(`${match.home.name} ${match.away.name} tennis`));
  document.title = `${match.home.name} vs ${match.away.name} · Harbourline`;
}

function setLine(side) {
  const row = document.createElement("p");
  row.className = "player-row";
  const name = document.createElement("span");
  name.textContent = side.name;
  const sets = document.createElement("span");
  sets.className = "sets";
  for (const set of side.sets || []) {
    const cell = document.createElement("span");
    cell.className = set.won ? "set" : "set lost";
    cell.textContent = Number.isFinite(Number(set.value)) ? String(Math.round(Number(set.value))) : "–";
    sets.append(cell);
  }
  if (!side.sets?.length) sets.textContent = "–";
  row.append(name, sets);
  return row;
}

function renderSummaryDetail(fragment, detail, league) {
  fragment.append(scoreHeader({ ...detail, league, tennis: false }));
  const homeName = detail.home?.name || "";
  const awayName = detail.away?.name || "";
  fragment.append(travelBlock(`${homeName} ${awayName} football jersey`.trim()));
  const described = describeStatus(detail.status);
  const soccer = league?.espnSport === "soccer";
  if (soccer) {
  fragment.append(sectionTitle("Timeline"));
  const timeline = document.createElement("section");
  timeline.className = "detail-card";
  if (!detail.timeline.length) {
    timeline.append(panelNote(described.bucket === "scheduled"
      ? "Goals, cards, and substitutions appear here once the match starts."
      : "No goals, cards, or substitutions were posted for this match."));
  } else {
    const list = document.createElement("ol");
    list.className = "timeline";
    for (const item of detail.timeline) {
      const li = document.createElement("li");
      const minute = document.createElement("span");
      minute.className = "minute";
      minute.textContent = item.minute || "–";
      const text = document.createElement("span");
      text.className = `kind-${item.kind}`;
      text.textContent = item.text || item.players.join(" · ") || item.teamName;
      li.append(minute, text);
      list.append(li);
    }
    timeline.append(list);
  }
  fragment.append(timeline);
  }

  if (soccer) {
  fragment.append(sectionTitle("Lineups"));
  const lineups = document.createElement("section");
  lineups.className = "detail-card lineup-grid";
  if (!detail.lineups.length) lineups.append(panelNote("Lineups have not been posted."));
  for (const side of detail.lineups) {
    const block = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = side.formation ? `${side.name} · ${side.formation}` : side.name;
    block.append(heading);
    for (const player of side.starters) block.append(playerRow(player, true));
    if (side.bench.length) {
      const bench = document.createElement("p");
      bench.className = "section-note";
      bench.textContent = "Bench";
      block.append(bench);
      for (const player of side.bench) block.append(playerRow(player, false));
    }
    lineups.append(block);
  }
  fragment.append(lineups);
  }

  if (detail.stats.length) {
    fragment.append(sectionTitle("Match stats"));
    const stats = document.createElement("section");
    stats.className = "detail-card";
    for (const stat of detail.stats) stats.append(statRow(stat));
    fragment.append(stats);
  } else if (!detail.box && league?.espnSport === "soccer") {
    fragment.append(sectionTitle("Match stats"));
    const stats = document.createElement("section");
    stats.className = "detail-card";
    stats.append(panelNote("Possession, shots, and the other team stats have not been posted."));
    fragment.append(stats);
  }

  if (detail.box) {
    fragment.append(sectionTitle("Box score"));
    const wrap = document.createElement("div");
    wrap.className = "box-grid";
    for (const team of detail.box) {
      const card = document.createElement("section");
      card.className = "detail-card";
      const heading = document.createElement("h4");
      heading.textContent = team.name;
      card.append(heading);
      for (const table of team.tables) card.append(boxTable(table));
      wrap.append(card);
    }
    fragment.append(wrap);
  }

  if (detail.form?.length) {
    fragment.append(sectionTitle("Recent form"));
    const grid = document.createElement("div");
    grid.className = "form-grid";
    for (const block of detail.form) {
      const card = document.createElement("section");
      card.className = "detail-card";
      const heading = document.createElement("h4");
      heading.textContent = block.name;
      card.append(heading);
      for (const result of block.results) {
        const row = document.createElement("p");
        row.className = "form-row";
        const kick = result.date ? formatKickoff(result.date, state.timeZone) : null;
        const when = document.createElement("span");
        when.textContent = kick ? `${kick.dateLabel} ${kick.timeLabel}` : "";
        const opp = document.createElement("span");
        opp.textContent = `${result.atVs === "@" ? "at" : "vs"} ${result.opponent} ${result.score}`.trim();
        const pill = document.createElement("span");
        pill.className = `form-pill ${result.result}`;
        pill.textContent = result.result || "–";
        row.append(when, opp, pill);
        card.append(row);
      }
      grid.append(card);
    }
    fragment.append(grid);
  }

  if (detail.h2h?.events?.length) {
    fragment.append(sectionTitle("Head to head"));
    const card = document.createElement("section");
    card.className = "detail-card";
    if (detail.h2h.summary) card.append(panelNote(detail.h2h.summary));
    for (const event of detail.h2h.events) {
      const row = document.createElement("p");
      row.className = "h2h-row";
      const kick = event.date ? formatKickoff(event.date, state.timeZone) : null;
      const when = document.createElement("span");
      when.textContent = kick ? `${kick.dateLabel} ${kick.timeLabel}` : "";
      const played = event.state === "post";
      const score = document.createElement("span");
      score.textContent = played
        ? `${event.home} ${event.homeScore ?? "–"} – ${event.awayScore ?? "–"} ${event.away}`
        : `${event.home} – ${event.away}`;
      row.append(when, score);
      card.append(row);
    }
    fragment.append(card);
  }
  const home = detail.home?.name || "Home";
  const away = detail.away?.name || "Away";
  document.title = `${home} vs ${away} · Harbourline`;
}

function scoreHeader(detail) {
  const described = describeStatus(detail.status);
  const card = document.createElement("section");
  card.className = "detail-card detail-top";
  const kick = detail.start ? formatKickoff(detail.start, state.timeZone) : null;
  const when = document.createElement("div");
  when.className = "when";
  if (kick) {
    const time = document.createElement("time");
    time.dateTime = detail.start;
    time.title = kick.title;
    const date = document.createElement("span");
    date.className = "when-date";
    date.textContent = kick.dateLabel;
    const clock = document.createElement("span");
    clock.className = "when-time";
    clock.textContent = kick.timeLabel;
    time.append(date, clock);
    when.append(time);
  }
  const teams = document.createElement("div");
  teams.className = "detail-teams";
  const showScore = described.bucket !== "scheduled" && described.label !== "Postponed" && described.label !== "Cancelled";
  for (const side of [detail.home, detail.away]) {
    if (!side) continue;
    teams.append(detailSide(side, showScore, detail.league, detail.tennis));
  }
  const badge = document.createElement("p");
  badge.className = `badge ${described.bucket}`;
  badge.textContent = described.label;
  const main = document.createElement("div");
  main.append(when, teams);
  card.append(main, badge);
  const facts = [];
  if (detail.venue?.name) facts.push([detail.venue.name, detail.venue.city, detail.venue.country].filter(Boolean).join(", "));
  if (detail.officials?.length) facts.push(`Referee ${detail.officials.join(", ")}`);
  else if (!detail.tennis) facts.push("Referee not listed");
  if (detail.attendance) facts.push(`Attendance ${detail.attendance.toLocaleString("en-GB")}`);
  facts.push(zoneLabel(state.timeZone));
  const fact = document.createElement("p");
  fact.className = "facts";
  fact.textContent = facts.join(" · ");
  card.append(fact);
  return card;
}

function detailSide(side, showScore, league, tennis) {
  const row = document.createElement("div");
  row.className = "detail-side";
  const name = document.createElement(side.id && league && !tennis ? "a" : "span");
  name.textContent = side.name;
  if (side.id && league && !tennis) name.href = `#team/${league.id}/${encodeURIComponent(side.id)}`;
  const score = document.createElement("b");
  score.className = "side-score";
  if (tennis && side.sets?.length) {
    score.textContent = side.sets.map((set) => Math.round(Number(set.value))).join(" ");
  } else {
    score.textContent = showScore && side.score != null ? side.score : "–";
  }
  row.append(crestNode({ name: side.name, logo: safeLogo(side.logo) }), name, score);
  if (side.id && !tennis) row.append(starButton("teams", teamKey(league?.sport || state.sport, side.id), side.name));
  return row;
}

function playerRow(player, starter) {
  const row = document.createElement("p");
  row.className = "player-row";
  const left = document.createElement("span");
  const jersey = document.createElement("span");
  jersey.className = "jersey";
  jersey.textContent = player.jersey ? `${player.jersey} ` : "";
  left.append(jersey, document.createTextNode(`${player.name}${player.position ? ` · ${player.position}` : ""}`));
  const mark = document.createElement("span");
  mark.textContent = starter ? "XI" : "";
  row.append(left, mark);
  return row;
}

function statNumber(value) {
  const match = String(value).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function statRow(stat) {
  const wrap = document.createElement("div");
  wrap.className = "stat";
  const home = document.createElement("b");
  home.textContent = stat.home;
  const label = document.createElement("span");
  label.className = "stat-label";
  label.textContent = stat.label;
  const away = document.createElement("b");
  away.textContent = stat.away;
  const homeN = statNumber(stat.home);
  const awayN = statNumber(stat.away);
  let width = 50;
  if (stat.name === "possessionPct" && homeN != null) width = Math.max(0, Math.min(100, homeN));
  else if (homeN != null && awayN != null && homeN + awayN > 0) width = (100 * homeN) / (homeN + awayN);
  const bar = document.createElement("div");
  bar.className = "bar";
  const fill = document.createElement("span");
  fill.style.width = `${width}%`;
  bar.append(fill);
  wrap.append(home, label, away, bar);
  return wrap;
}

function boxTable(table) {
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const heading = document.createElement("p");
  heading.className = "section-note";
  heading.textContent = table.title;
  const el = document.createElement("table");
  el.className = "box";
  const head = document.createElement("tr");
  const player = document.createElement("th");
  player.textContent = "Player";
  head.append(player);
  for (const column of table.columns) {
    const th = document.createElement("th");
    th.textContent = column;
    head.append(th);
  }
  el.append(head);
  for (const row of table.rows) {
    const tr = document.createElement("tr");
    const name = document.createElement("td");
    name.textContent = row.didNotPlay ? `${row.name} · DNP` : `${row.starter ? "● " : ""}${row.name}`;
    tr.append(name);
    if (row.didNotPlay) {
      const td = document.createElement("td");
      td.colSpan = table.columns.length;
      td.textContent = "DNP";
      tr.append(td);
    } else {
      for (const value of row.values) {
        const td = document.createElement("td");
        td.textContent = value || "–";
        tr.append(td);
      }
    }
    el.append(tr);
  }
  wrap.append(heading, el);
  return wrap;
}

function renderTablePage() {
  const league = leagueById(state.leagueId);
  const fragment = document.createDocumentFragment();
  fragment.append(backLink());
  const heading = document.createElement("h2");
  heading.className = "day-heading";
  heading.textContent = league ? `${league.name} table` : "Table";
  fragment.append(heading);
  if (league) fragment.append(starButton("leagues", league.id, league.name));
  fragment.append(travelBlock(`${league?.name || "football"} shirt`));
  if (state.detailLoading) fragment.append(loadingBlock("Loading standings…"));
  else if (state.detailError) fragment.append(panelNote(state.detailError));
  else if (!state.detail?.tables?.length) fragment.append(panelNote("No standings table is published for this competition."));
  else {
    for (const table of state.detail.tables) fragment.append(standingsCard(table, league));
  }
  board.replaceChildren(fragment);
  document.title = `${league?.name || "Table"} · Harbourline`;
}

function standingsCard(table, league) {
  const card = document.createElement("section");
  card.className = "detail-card";
  if (table.name) {
    const h = document.createElement("h3");
    h.textContent = table.name;
    card.append(h);
  }
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const el = document.createElement("table");
  el.className = "standings";
  const head = document.createElement("tr");
  const teamHead = document.createElement("th");
  teamHead.className = "team-cell";
  teamHead.textContent = "Team";
  head.append(teamHead);
  for (const column of table.columns) {
    const th = document.createElement("th");
    th.textContent = column.label;
    if (column.wide) th.className = "col-wide";
    head.append(th);
  }
  el.append(head);
  for (const row of table.rows) {
    const tr = document.createElement("tr");
    if (row.teamId === state.teamId) tr.className = "is-team";
    const team = document.createElement("td");
    team.className = "team-cell";
    const link = document.createElement("a");
    link.href = `#team/${league.id}/${encodeURIComponent(row.teamId)}`;
    link.textContent = `${row.rank}. ${row.team}`;
    team.append(crestNode({ name: row.team, logo: safeLogo(row.logo) }), link, starButton("teams", teamKey(league.sport, row.teamId), row.team));
    tr.append(team);
    for (const column of table.columns) {
      const td = document.createElement("td");
      td.textContent = row.stats[column.key] || "–";
      if (column.wide) td.className = "col-wide";
      tr.append(td);
    }
    el.append(tr);
  }
  wrap.append(el);
  card.append(wrap);
  return card;
}

function renderTeamPage() {
  const league = leagueById(state.leagueId);
  const fragment = document.createDocumentFragment();
  fragment.append(backLink());
  if (state.detailLoading) {
    fragment.append(loadingBlock("Loading team…"));
    board.replaceChildren(fragment);
    return;
  }
  if (state.detailError || !state.detail?.schedule) {
    const empty = document.createElement("div");
    empty.className = "empty";
    const title = document.createElement("h2");
    title.textContent = "Team page unavailable";
    empty.append(title, panelNote(state.detailError || "Fixtures for this team could not be loaded."));
    fragment.append(empty);
    board.replaceChildren(fragment);
    return;
  }
  const schedule = state.detail.schedule;
  const heading = document.createElement("h2");
  heading.className = "day-heading";
  heading.textContent = schedule.name || "Team";
  const tools = document.createElement("p");
  tools.append(starButton("teams", teamKey(league.sport, state.teamId), schedule.name));
  const tableLink = document.createElement("a");
  tableLink.href = `#table/${league.id}`;
  tableLink.textContent = "Full table";
  tools.append(tableLink);
  fragment.append(heading, tools);
  const blurb = standingBlurb(state.detail.tables || [], state.teamId);
  fragment.append(panelNote(blurb || "No standing is published for this team in this competition."));
  fragment.append(travelBlock(`${schedule.name} football jersey`));
  const parts = splitSchedule(schedule.events);
  fragment.append(sectionTitle("Upcoming"));
  fragment.append(fixtureList(parts.upcoming, league, "No upcoming fixtures in this competition."));
  fragment.append(sectionTitle("Recent results"));
  fragment.append(fixtureList(parts.recent, league, "No recent results in this competition."));
  board.replaceChildren(fragment);
  document.title = `${schedule.name} · Harbourline`;
}

function standingBlurb(tables, teamId) {
  for (const table of tables) {
    const row = table.rows.find((item) => item.teamId === teamId);
    if (!row) continue;
    const bits = [`${row.rank} in ${table.name}`];
    if (row.stats.winPercent) {
      if (row.stats.wins || row.stats.losses) bits.push(`${row.stats.wins || 0}-${row.stats.losses || 0}`);
      bits.push(`pct ${row.stats.winPercent}`);
    } else if (row.stats.points) bits.push(`${row.stats.points} pts`);
    if (row.stats.overall && !row.stats.winPercent) bits.push(row.stats.overall);
    return bits.join(" · ");
  }
  return "";
}

function fixtureList(events, league, emptyText) {
  const card = document.createElement("section");
  card.className = "detail-card";
  if (!events.length) {
    card.append(panelNote(emptyText));
    return card;
  }
  for (const event of events) {
    const link = document.createElement("a");
    link.className = "fixture";
    link.href = `#match/${league.id}/${encodeURIComponent(event.id)}`;
    const kick = formatKickoff(event.start, state.timeZone);
    const when = document.createElement("div");
    when.className = "when";
    const time = document.createElement("time");
    time.dateTime = event.start;
    const date = document.createElement("span");
    date.className = "when-date";
    date.textContent = kick.dateLabel;
    const clock = document.createElement("span");
    clock.className = "when-time";
    clock.textContent = kick.timeLabel;
    time.append(date, clock);
    when.append(time);
    const sides = document.createElement("div");
    sides.className = "sides";
    for (const side of [event.home, event.away]) {
      const row = document.createElement("div");
      row.className = "fixture-side";
      const name = document.createElement("span");
      name.className = "side-name";
      name.textContent = side.name;
      const score = document.createElement("span");
      score.className = "side-score";
      score.textContent = event.state === "pre" || side.score == null ? "–" : side.score;
      row.append(name, score);
      sides.append(row);
    }
    const badge = document.createElement("p");
    badge.className = `badge ${event.state === "post" ? "finished" : event.state === "in" ? "live" : "scheduled"}`;
    badge.textContent = event.state === "post" ? (event.statusLabel || "FT") : event.state === "in" ? "Live" : "Scheduled";
    link.append(when, sides, badge);
    card.append(link);
  }
  return card;
}

function boardHash(sport = state.sport, offset = state.dayOffset) {
  const day = DAY_OFFSETS.find((item) => item.offset === offset)?.id || "today";
  return `#${sport}/${day}`;
}

sportsNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-sport]");
  if (!button) return;
  if (button.dataset.sport === state.sport && state.view === "board") return;
  state.bucket = "all";
  location.hash = boardHash(button.dataset.sport, state.dayOffset);
});

daysNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-offset]");
  if (!button) return;
  const offset = Number(button.dataset.offset);
  if (offset === state.dayOffset && state.view === "board") return;
  state.bucket = "all";
  location.hash = boardHash(state.sport, offset);
});

filtersNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-bucket]");
  if (!button) return;
  state.bucket = button.dataset.bucket;
  render();
});

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("button.star");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  toggleFav(state.favs, button.dataset.star, button.dataset.id);
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
});

refreshBtn.addEventListener("click", () => {
  if (state.view === "board") void load({ fresh: true });
  else void openDeep();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.view === "board") void refreshLive();
});

window.addEventListener("hashchange", () => {
  const previous = `${state.view}:${state.sport}:${state.dayOffset}`;
  readRoute();
  if (state.view !== "board") {
    void openDeep();
    return;
  }
  const next = `${state.view}:${state.sport}:${state.dayOffset}`;
  if (next !== previous) void load({ fresh: false });
  else render();
});

readRoute();
if (state.view === "board") {
  writeRoute();
  void load({ fresh: false });
} else {
  void openDeep();
}
