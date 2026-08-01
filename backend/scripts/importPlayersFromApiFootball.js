const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Player = require("../models/playerModel");
const Team = require("../models/teamModel");

dotenv.config({ path: path.resolve(__dirname, "../config.env") });

const API_FOOTBALL_BASE_URL =
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io";
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

const REQUEST_TIMEOUT_MS = Number(process.env.API_FOOTBALL_TIMEOUT_MS || 25000);
const REQUEST_RETRIES = Number(process.env.API_FOOTBALL_RETRIES || 4);
const MIN_DELAY_MS = Number(process.env.API_FOOTBALL_MIN_DELAY_MS || 1200);
const MAX_REQUEST_BUDGET = Number(process.env.API_FOOTBALL_MAX_REQUESTS || 0);
const MAX_PAGES_PER_SEASON = Number(
  process.env.API_FOOTBALL_MAX_PAGES_PER_SEASON || 0,
);
const FETCH_PLAYER_HISTORY =
  String(process.env.API_FOOTBALL_FETCH_HISTORY || "true").toLowerCase() !==
  "false";
const MAX_PLAYERS_PER_TEAM = Number(
  process.env.API_FOOTBALL_MAX_PLAYERS_PER_TEAM || 0,
);
const DEFAULT_SEASONS = String(
  process.env.API_FOOTBALL_SEASONS || new Date().getUTCFullYear(),
)
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 1900);

const TEAM_NAME_ALIASES = {
  "atletico madrid": ["Atletico de Madrid"],
  bilbao: ["Athletic Club", "Athletic Bilbao"],
  psg: ["Paris Saint Germain"],
  "bayern munchen": ["Bayern Munich"],
  "inter milan": ["Inter"],
  "as roma": ["Roma"],
  napoli: ["SSC Napoli"],
  besiktas: ["Besiktas"],
  fenerbahce: ["Fenerbahce"],
  "dinamo bucuresti": ["Dinamo Bucuresti"],
  "universitatea craiova": ["U Craiova 1948"],
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(value) {
  if (!value) {
    return undefined;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric;
  }

  const dateMs = Date.parse(String(value));
  if (Number.isFinite(dateMs)) {
    const deltaSeconds = Math.ceil((dateMs - Date.now()) / 1000);
    return deltaSeconds > 0 ? deltaSeconds : undefined;
  }

  return undefined;
}

function isRetriableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

let lastRequestTime = 0;
let totalApiRequestsMade = 0;

async function waitForRateWindow() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }
  lastRequestTime = Date.now();
}

async function apiRequest(endpoint, query = {}) {
  let lastError;

  const queryString = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    queryString.set(key, String(value));
  }

  const url = `${API_FOOTBALL_BASE_URL}${endpoint}${queryString.toString() ? `?${queryString.toString()}` : ""}`;

  for (let attempt = 1; attempt <= REQUEST_RETRIES; attempt += 1) {
    if (MAX_REQUEST_BUDGET > 0 && totalApiRequestsMade >= MAX_REQUEST_BUDGET) {
      throw new Error(
        `API request budget reached (${totalApiRequestsMade}/${MAX_REQUEST_BUDGET}). Stop to protect daily quota.`,
      );
    }

    await waitForRateWindow();
    totalApiRequestsMade += 1;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "x-apisports-key": API_FOOTBALL_KEY,
          Accept: "application/json",
          "User-Agent": "LigaACLabsPlayerImporter/1.0",
        },
      });

      if (!response.ok) {
        if (isRetriableStatus(response.status) && attempt < REQUEST_RETRIES) {
          const retryAfter = parseRetryAfterSeconds(
            response.headers.get("retry-after"),
          );
          const backoffMs = retryAfter
            ? retryAfter * 1000
            : MIN_DELAY_MS * attempt * 2;
          await sleep(backoffMs);
          continue;
        }

        throw new Error(
          `API-FOOTBALL ${endpoint} failed with status ${response.status}`,
        );
      }

      const payload = await response.json();

      const errors = payload?.errors;
      if (errors && Object.keys(errors).length > 0) {
        throw new Error(
          `API-FOOTBALL ${endpoint} errors: ${JSON.stringify(errors)}`,
        );
      }

      return payload;
    } catch (error) {
      lastError =
        error?.name === "AbortError"
          ? new Error(
              `API-FOOTBALL ${endpoint} timed out after ${REQUEST_TIMEOUT_MS}ms`,
            )
          : error;

      if (attempt < REQUEST_RETRIES) {
        await sleep(MIN_DELAY_MS * attempt);
        continue;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`API-FOOTBALL ${endpoint} request failed`);
}

function buildPlayerKey(name, dob) {
  const day = new Date(dob).toISOString().slice(0, 10);
  return `${normalizeText(name)}|${day}`;
}

function buildTeamLookup(teams) {
  const lookup = new Map();

  for (const team of teams) {
    const normalized = normalizeText(team.name);
    if (!normalized) {
      continue;
    }
    lookup.set(normalized, team._id.toString());

    const aliases = TEAM_NAME_ALIASES[normalized] || [];
    for (const alias of aliases) {
      lookup.set(normalizeText(alias), team._id.toString());
    }
  }

  return lookup;
}

async function resolveExternalTeamId(team) {
  const labels = [
    ...new Set([
      team.name,
      ...(TEAM_NAME_ALIASES[normalizeText(team.name)] || []),
    ]),
  ];

  for (const label of labels) {
    const payload = await apiRequest("/teams", { search: label });

    const candidates = payload?.response || [];
    if (candidates.length === 0) {
      continue;
    }

    let filteredCandidates = candidates;
    const teamCountry = normalizeText(team.country);
    if (teamCountry) {
      const byCountry = candidates.filter(
        (item) =>
          normalizeText(item?.team?.country || item?.country) === teamCountry,
      );

      if (byCountry.length > 0) {
        filteredCandidates = byCountry;
      }
    }

    const exact = filteredCandidates.find(
      (item) => normalizeText(item?.team?.name) === normalizeText(team.name),
    );
    if (exact?.team?.id) {
      return exact.team.id;
    }

    const first = filteredCandidates[0]?.team?.id;
    if (first) {
      return first;
    }
  }

  return undefined;
}

async function fetchTeamPlayersBySeason(externalTeamId, season) {
  let page = 1;
  const rows = [];

  while (true) {
    const payload = await apiRequest("/players", {
      team: externalTeamId,
      season,
      page,
    });

    const responseRows = payload?.response || [];
    rows.push(...responseRows);

    const currentPage = Number(payload?.paging?.current || page);
    const totalPages = Number(payload?.paging?.total || currentPage);

    if (MAX_PAGES_PER_SEASON > 0 && currentPage >= MAX_PAGES_PER_SEASON) {
      break;
    }

    if (currentPage >= totalPages) {
      break;
    }

    page += 1;
  }

  return rows;
}

async function fetchPlayerTeams(playerId) {
  try {
    const payload = await apiRequest("/players/teams", { player: playerId });
    const teams = payload?.response || [];
    return teams.map((item) => item?.team?.name || item?.name).filter(Boolean);
  } catch (_error) {
    // Optional endpoint. Continue without blocking import.
    return [];
  }
}

function mapClubNamesToDbTeamIds(clubNames, teamLookup, fallbackTeamId) {
  const teamIds = new Set();

  for (const clubName of clubNames) {
    const normalized = normalizeText(clubName);
    if (!normalized) {
      continue;
    }

    const dbTeamId = teamLookup.get(normalized);
    if (dbTeamId) {
      teamIds.add(dbTeamId);
    }
  }

  if (fallbackTeamId) {
    teamIds.add(String(fallbackTeamId));
  }

  return [...teamIds];
}

async function connectDb() {
  if (!process.env.MONGO_URI || !process.env.DB_PASSWORD) {
    throw new Error("Missing MONGO_URI or DB_PASSWORD in backend/config.env");
  }

  const dbUrl = process.env.MONGO_URI.replace(
    "<db_password>",
    process.env.DB_PASSWORD,
  );
  await mongoose.connect(dbUrl);
}

async function runImport() {
  if (!API_FOOTBALL_KEY) {
    throw new Error("Missing API_FOOTBALL_KEY in backend/config.env");
  }

  const dryRun = process.argv.includes("--dry-run");
  const skipExistingUpdates = process.argv.includes("--skip-existing-updates");
  const teamLimitArg = process.argv.find((arg) =>
    arg.startsWith("--team-limit="),
  );
  const teamFilterArg = process.argv.find((arg) =>
    arg.startsWith("--team-filter="),
  );

  const teamLimit = teamLimitArg
    ? Number(teamLimitArg.split("=")[1])
    : undefined;
  const teamFilter = teamFilterArg ? teamFilterArg.split("=")[1]?.trim() : "";

  const stats = {
    teamsInDb: 0,
    teamsResolvedToExternal: 0,
    teamsSkippedNoExternalMatch: 0,
    apiRequests: 0,
    scrapedCandidates: 0,
    skippedInvalid: 0,
    skippedNoTeamMatch: 0,
    skippedDuplicateInRun: 0,
    skippedAlreadyComplete: 0,
    inserted: 0,
    updated: 0,
    stoppedByRequestBudget: 0,
  };

  await connectDb();

  let teams = await Team.find({}, "name country").lean();
  if (teamFilter) {
    const normalizedFilter = normalizeText(teamFilter);
    teams = teams.filter((team) =>
      normalizeText(team.name).includes(normalizedFilter),
    );
  }
  if (Number.isFinite(teamLimit) && teamLimit > 0) {
    teams = teams.slice(0, teamLimit);
  }

  stats.teamsInDb = teams.length;

  if (teams.length === 0) {
    console.log("No teams found in DB after filters. Nothing to import.");
    return;
  }

  const teamLookup = buildTeamLookup(teams);

  const existingPlayers = await Player.find(
    {},
    "name dateOfBirth teams",
  ).lean();
  const existingByKey = new Map();

  for (const player of existingPlayers) {
    if (!player.name || !player.dateOfBirth) {
      continue;
    }

    const key = buildPlayerKey(player.name, player.dateOfBirth);
    existingByKey.set(key, {
      _id: player._id,
      teamIds: new Set((player.teams || []).map((teamId) => String(teamId))),
    });
  }

  const processedInRun = new Set();
  let stopImport = false;

  for (const team of teams) {
    if (stopImport) {
      break;
    }

    let externalTeamId;
    try {
      externalTeamId = await resolveExternalTeamId(team);
    } catch (error) {
      if (String(error.message).includes("API request budget reached")) {
        stats.stoppedByRequestBudget = 1;
        stopImport = true;
        break;
      }

      console.warn(
        `[WARN] Failed to resolve external team for '${team.name}': ${error.message}`,
      );
      stats.teamsSkippedNoExternalMatch += 1;
      continue;
    }

    if (!externalTeamId) {
      stats.teamsSkippedNoExternalMatch += 1;
      continue;
    }

    stats.teamsResolvedToExternal += 1;

    const candidateRows = [];
    for (const season of DEFAULT_SEASONS) {
      if (stopImport) {
        break;
      }

      try {
        const rows = await fetchTeamPlayersBySeason(externalTeamId, season);
        candidateRows.push(...rows);
      } catch (error) {
        if (String(error.message).includes("API request budget reached")) {
          stats.stoppedByRequestBudget = 1;
          stopImport = true;
          break;
        }

        console.warn(
          `[WARN] Team '${team.name}' season '${season}' fetch failed: ${error.message}`,
        );
      }
    }

    if (
      MAX_PLAYERS_PER_TEAM > 0 &&
      candidateRows.length > MAX_PLAYERS_PER_TEAM
    ) {
      candidateRows.length = MAX_PLAYERS_PER_TEAM;
    }

    stats.scrapedCandidates += candidateRows.length;

    for (const row of candidateRows) {
      if (stopImport) {
        break;
      }

      const playerData = row?.player || {};
      const statsRows = row?.statistics || [];

      const playerName = playerData?.name;
      const playerDob = playerData?.birth?.date;
      const playerNationality = playerData?.nationality;

      if (!playerName || !playerDob || !playerNationality) {
        stats.skippedInvalid += 1;
        continue;
      }

      const clubNames = new Set();

      for (const statRow of statsRows) {
        const teamNameFromStats = statRow?.team?.name;
        if (teamNameFromStats) {
          clubNames.add(teamNameFromStats);
        }
      }

      const playerId = playerData?.id;
      if (FETCH_PLAYER_HISTORY && playerId) {
        try {
          const historyTeams = await fetchPlayerTeams(playerId);
          for (const historyTeamName of historyTeams) {
            clubNames.add(historyTeamName);
          }
        } catch (error) {
          if (String(error.message).includes("API request budget reached")) {
            stats.stoppedByRequestBudget = 1;
            stopImport = true;
            break;
          }
        }
      }

      const matchedTeamIds = mapClubNamesToDbTeamIds(
        [...clubNames],
        teamLookup,
        team._id,
      );

      if (matchedTeamIds.length === 0) {
        stats.skippedNoTeamMatch += 1;
        continue;
      }

      const playerKey = buildPlayerKey(playerName, playerDob);

      if (processedInRun.has(playerKey)) {
        stats.skippedDuplicateInRun += 1;
        continue;
      }

      processedInRun.add(playerKey);

      const existing = existingByKey.get(playerKey);

      if (!existing) {
        if (!dryRun) {
          const createdPlayer = await Player.create({
            name: playerName.trim(),
            dateOfBirth: new Date(playerDob),
            nationality: playerNationality.trim(),
            teams: matchedTeamIds,
          });

          existingByKey.set(playerKey, {
            _id: createdPlayer._id,
            teamIds: new Set(matchedTeamIds),
          });
        }

        stats.inserted += 1;
        continue;
      }

      if (skipExistingUpdates) {
        stats.skippedAlreadyComplete += 1;
        continue;
      }

      const beforeCount = existing.teamIds.size;
      for (const matchedTeamId of matchedTeamIds) {
        existing.teamIds.add(matchedTeamId);
      }

      if (existing.teamIds.size === beforeCount) {
        stats.skippedAlreadyComplete += 1;
        continue;
      }

      if (!dryRun) {
        await Player.updateOne(
          { _id: existing._id },
          {
            $set: {
              teams: [...existing.teamIds],
            },
          },
        );
      }

      stats.updated += 1;
    }
  }

  stats.apiRequests = totalApiRequestsMade;

  console.log("\nImport summary (API-FOOTBALL):");
  console.table(stats);
  console.log(`Dry run mode: ${dryRun ? "ON" : "OFF"}`);
  console.log(
    `Existing updates: ${skipExistingUpdates ? "SKIPPED" : "ENABLED"}`,
  );
  console.log(`Min delay between requests: ${MIN_DELAY_MS}ms`);
  console.log(
    `Request budget: ${MAX_REQUEST_BUDGET > 0 ? `${MAX_REQUEST_BUDGET} max` : "unlimited"}`,
  );
  console.log(`Fetch player history: ${FETCH_PLAYER_HISTORY ? "ON" : "OFF"}`);
  if (MAX_PAGES_PER_SEASON > 0) {
    console.log(`Max pages per season/team: ${MAX_PAGES_PER_SEASON}`);
  }
  if (MAX_PLAYERS_PER_TEAM > 0) {
    console.log(`Max players per team: ${MAX_PLAYERS_PER_TEAM}`);
  }
  console.log(`Seasons: ${DEFAULT_SEASONS.join(", ") || "none"}`);
  if (teamFilter) {
    console.log(`Team filter: ${teamFilter}`);
  }
  if (Number.isFinite(teamLimit) && teamLimit > 0) {
    console.log(`Team limit: ${teamLimit}`);
  }
}

runImport()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
