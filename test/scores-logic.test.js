import assert from "node:assert/strict";
import test from "node:test";
import {
  addDaysYmd,
  describeStatus,
  espnDatesForLocalDay,
  formatKickoff,
  groupMatches,
  normalizeScoreboard,
  resolveTimeZone,
  zonedMidnight,
  zoneLabel,
} from "../scores/logic.js";

const ucl = {
  id: "ucl",
  sport: "football",
  espnSport: "soccer",
  slug: "uefa.champions",
  country: "Europe",
  countryRank: 10,
  leagueRank: 10,
  name: "UEFA Champions League",
};

test("falls back to Europe/Nicosia when the zone is missing or invalid", () => {
  assert.equal(resolveTimeZone(undefined), "Europe/Nicosia");
  assert.equal(resolveTimeZone(""), "Europe/Nicosia");
  assert.equal(resolveTimeZone("Not/AZone"), "Europe/Nicosia");
  assert.equal(resolveTimeZone("Asia/Nicosia"), "Asia/Nicosia");
});

test("labels the fallback zone", () => {
  assert.match(zoneLabel("Europe/Nicosia", new Date("2026-11-25T12:00:00Z")), /Europe\/Nicosia/);
  assert.match(zoneLabel("Asia/Nicosia", new Date("2026-11-25T12:00:00Z")), /Europe\/Nicosia \(EET\)/);
});

test("converts kick-off into Europe/Nicosia local time and always has a date", () => {
  const kick = formatKickoff("2026-11-25T17:45:00Z", "Europe/Nicosia");
  assert.equal(kick.ymd, "2026-11-25");
  assert.equal(kick.timeLabel, "19:45");
  assert.equal(kick.dateLabel, "Wed 25 Nov");
  assert.match(kick.title, /19:45/);
  assert.match(kick.title, /Europe\/Nicosia/);
});

test("a late US tip is the next calendar day in Nicosia", () => {
  const kick = formatKickoff("2026-11-26T00:30:00Z", "Europe/Nicosia");
  assert.equal(kick.ymd, "2026-11-26");
  assert.equal(kick.timeLabel, "02:30");
});

test("local midnight in Nicosia is 22:00 UTC the previous day in winter", () => {
  assert.equal(zonedMidnight("2026-11-25", "Europe/Nicosia").toISOString(), "2026-11-24T22:00:00.000Z");
});

test("ESPN dates covering a Nicosia day include the US date on both sides of midnight", () => {
  assert.deepEqual(espnDatesForLocalDay("2026-11-25", "Europe/Nicosia"), ["20261124", "20261125"]);
  assert.deepEqual(espnDatesForLocalDay("2026-11-26", "Europe/Nicosia"), ["20261125", "20261126"]);
});

test("addDaysYmd does calendar arithmetic", () => {
  assert.equal(addDaysYmd("2026-11-25", -1), "2026-11-24");
  assert.equal(addDaysYmd("2026-11-25", 1), "2026-11-26");
  assert.equal(addDaysYmd("2026-12-31", 1), "2027-01-01");
});

test("status buckets for scheduled, live, half-time, and full time", () => {
  assert.deepEqual(
    describeStatus({ type: { name: "STATUS_SCHEDULED", state: "pre", shortDetail: "Scheduled" }, displayClock: "0'" }),
    { state: "pre", bucket: "scheduled", label: "Scheduled" },
  );
  assert.equal(
    describeStatus({ type: { name: "STATUS_IN_PROGRESS", state: "in", shortDetail: "67'" }, displayClock: "67'" }).label,
    "Live · 67'",
  );
  assert.equal(
    describeStatus({ type: { name: "STATUS_HALFTIME", state: "in", shortDetail: "HT" } }).label,
    "Half-time",
  );
  assert.equal(
    describeStatus({ type: { name: "STATUS_FULL_TIME", state: "post", shortDetail: "FT", completed: true } }).bucket,
    "finished",
  );
  assert.equal(describeStatus({ type: { name: "STATUS_POSTPONED", state: "post", shortDetail: "Postponed" } }).label, "Postponed");
});

test("scheduled football hides the 0-0 placeholder and keeps both club names", () => {
  const matches = normalizeScoreboard({
    leagues: [{ name: "UEFA Champions League" }],
    events: [{
      id: "401915378",
      date: "2026-11-25T17:45Z",
      competitions: [{
        id: "401915378",
        date: "2026-11-25T17:45Z",
        status: { displayClock: "0'", type: { name: "STATUS_SCHEDULED", state: "pre", shortDetail: "Scheduled" } },
        venue: { fullName: "Baku Olympic Stadium" },
        competitors: [
          { homeAway: "home", score: "0", team: { displayName: "Sabah FK", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/21922.png" } },
          { homeAway: "away", score: "0", team: { displayName: "Barcelona", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/83.png" } },
        ],
      }],
    }],
  }, ucl);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].home.name, "Sabah FK");
  assert.equal(matches[0].away.name, "Barcelona");
  assert.equal(matches[0].home.score, null);
  assert.equal(matches[0].bucket, "scheduled");
  assert.equal(matches[0].venue, "Baku Olympic Stadium");
  const kick = formatKickoff(matches[0].start, "Europe/Nicosia");
  assert.equal(kick.timeLabel, "19:45");
  assert.equal(kick.dateLabel, "Wed 25 Nov");
});

test("finished football keeps the score", () => {
  const matches = normalizeScoreboard({
    leagues: [{ name: "J.League" }],
    events: [{
      id: "9",
      date: "2026-11-25T10:00Z",
      competitions: [{
        id: "9",
        date: "2026-11-25T10:00Z",
        status: { displayClock: "90'", type: { name: "STATUS_FULL_TIME", state: "post", shortDetail: "FT" } },
        competitors: [
          { homeAway: "home", score: "1", winner: false, team: { displayName: "Avispa Fukuoka" } },
          { homeAway: "away", score: "2", winner: true, team: { displayName: "Yokohama" } },
        ],
      }],
    }],
  }, { ...ucl, id: "jleague", country: "Japan", countryRank: 240, name: "J.League" });
  assert.equal(matches[0].home.score, "1");
  assert.equal(matches[0].away.score, "2");
  assert.equal(matches[0].statusLabel, "FT");
  assert.equal(matches[0].away.winner, true);
});

test("tennis matches are read from groupings and keep set scores", () => {
  const matches = normalizeScoreboard({
    events: [{
      name: "Argentina Open",
      groupings: [{
        grouping: { displayName: "Women's Singles" },
        competitions: [{
          id: "187580",
          date: "2026-11-24T15:05Z",
          status: { type: { name: "STATUS_FINAL", state: "post", shortDetail: "Final" } },
          round: { displayName: "Qualifying Final" },
          competitors: [
            { homeAway: "home", winner: true, athlete: { displayName: "Josefina Estevez" }, linescores: [{ value: 6, winner: true }, { value: 6, winner: true }] },
            { homeAway: "away", winner: false, athlete: { displayName: "Camila Markus" }, linescores: [{ value: 1, winner: false }, { value: 0, winner: false }] },
          ],
        }, {
          id: "later",
          date: "2026-11-26T18:00Z",
          status: { type: { name: "STATUS_SCHEDULED", state: "pre", shortDetail: "Scheduled" } },
          competitors: [
            { homeAway: "home", athlete: { displayName: "Player A" }, linescores: [] },
            { homeAway: "away", athlete: { displayName: "Player B" }, linescores: [] },
          ],
        }],
      }],
    }],
  }, { id: "wta", sport: "tennis", kind: "tennis", country: "WTA", countryRank: 20, leagueRank: 10, name: "WTA" });
  assert.equal(matches.length, 2);
  assert.equal(matches[0].league, "Argentina Open");
  assert.equal(matches[0].round, "Qualifying Final");
  assert.equal(matches[0].home.sets.length, 2);
  assert.equal(matches[1].home.sets.length, 0);
});

test("tennis doubles use the roster display name", () => {
  const matches = normalizeScoreboard({
    events: [{
      name: "Argentina Open",
      groupings: [{
        competitions: [{
          id: "dbl",
          date: "2026-11-25T20:00Z",
          status: { type: { name: "STATUS_SCHEDULED", state: "pre", shortDetail: "Scheduled" } },
          round: { displayName: "Quarterfinal" },
          competitors: [
            { homeAway: "home", roster: { displayName: "Lourdes Ayala / Sol Ailin Larraya Guidi", athletes: [{ flag: { href: "https://a.espncdn.com/i/teamlogos/countries/500/arg.png" } }] } },
            { homeAway: "away", roster: { displayName: "Varvara Lepchenko / Anastasia Zolotareva" } },
          ],
        }],
      }],
    }],
  }, { id: "wta", sport: "tennis", kind: "tennis", country: "WTA", countryRank: 20, leagueRank: 10, name: "WTA" });
  assert.equal(matches[0].home.name, "Lourdes Ayala / Sol Ailin Larraya Guidi");
  assert.equal(matches[0].away.name, "Varvara Lepchenko / Anastasia Zolotareva");
  assert.equal(matches[0].home.logo, "https://a.espncdn.com/i/teamlogos/countries/500/arg.png");
});

test("groups Europe before Cyprus before England", () => {
  const base = {
    sport: "football",
    start: "2026-11-25T18:00:00.000Z",
    state: "pre",
    bucket: "scheduled",
    statusLabel: "Scheduled",
    round: "",
    venue: "",
    tennis: false,
    home: { name: "Home", logo: "", score: null, sets: [], winner: false },
    away: { name: "Away", logo: "", score: null, sets: [], winner: false },
  };
  const groups = groupMatches([
    { ...base, id: "3", leagueId: "epl", country: "England", countryRank: 30, league: "Premier League", leagueRank: 10 },
    { ...base, id: "2", leagueId: "cyp", country: "Cyprus", countryRank: 20, league: "Cypriot First Division", leagueRank: 10 },
    { ...base, id: "1", leagueId: "ucl", country: "Europe", countryRank: 10, league: "UEFA Champions League", leagueRank: 10 },
    { ...base, id: "4", leagueId: "elc", country: "England", countryRank: 30, league: "Championship", leagueRank: 20, start: "2026-11-25T19:00:00.000Z" },
  ]);
  assert.deepEqual(groups.map((g) => g.country), ["Europe", "Cyprus", "England"]);
  assert.deepEqual(groups[2].leagues.map((l) => l.name), ["Premier League", "Championship"]);
});
