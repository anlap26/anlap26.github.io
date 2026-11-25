import { SPORTS, leaguesForSport } from "./leagues.js";
import {
  addDaysYmd,
  dedupeMatches,
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
];

const state = {
  timeZone: resolveTimeZone(readDetectedZone()),
  sport: "football",
  dayOffset: 0,
  bucket: "all",
  matches: [],
  loading: true,
  updatedAt: null,
  notice: null,
  generation: 0,
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
  const raw = location.hash.replace(/^#\/?/, "");
  const [sport, day] = raw.split("/");
  if (SPORTS.some((item) => item.id === sport)) state.sport = sport;
  const found = DAY_OFFSETS.find((item) => item.id === day);
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
    const count = bucket.id === "all" ? visible.length : visible.filter((match) => match.bucket === bucket.id).length;
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

  article.append(when, sides, badge);
  return article;
}

function renderBoard() {
  const ymd = selectedYmd();
  const headingDate = civilLabel(ymd);
  const sportLabel = SPORTS.find((item) => item.id === state.sport)?.label || "Scores";
  const dayMatches = state.matches.filter((match) => match.sport === state.sport && onLocalDay(match, ymd, state.timeZone));
  const shown = state.bucket === "all" ? dayMatches : dayMatches.filter((match) => match.bucket === state.bucket);

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
        const count = document.createElement("span");
        count.className = "league-count";
        count.textContent = String(league.matches.length);
        head.append(h3, count);
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
  renderChrome();
  renderNotice();
  renderBoard();
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
    render();
  } catch (error) {
    if (error?.name !== "AbortError") {
      state.notice = { kind: "stale", text: "Live update failed. Showing the last scores saved on this device." };
      render();
    }
  }
  armTimer();
}

function armTimer() {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { void refreshLive(); }, refreshDelay());
}

sportsNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-sport]");
  if (!button || button.dataset.sport === state.sport) return;
  state.sport = button.dataset.sport;
  state.bucket = "all";
  writeRoute();
  void load({ fresh: false });
});

daysNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-offset]");
  if (!button) return;
  const offset = Number(button.dataset.offset);
  if (offset === state.dayOffset) return;
  state.dayOffset = offset;
  state.bucket = "all";
  writeRoute();
  void load({ fresh: false });
});

filtersNav.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-bucket]");
  if (!button) return;
  state.bucket = button.dataset.bucket;
  render();
});

refreshBtn.addEventListener("click", () => { void load({ fresh: true }); });

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void refreshLive();
});

window.addEventListener("hashchange", () => {
  const previous = `${state.sport}:${state.dayOffset}`;
  readRoute();
  if (`${state.sport}:${state.dayOffset}` !== previous) void load({ fresh: false });
  else render();
});

readRoute();
writeRoute();
void load({ fresh: false });
