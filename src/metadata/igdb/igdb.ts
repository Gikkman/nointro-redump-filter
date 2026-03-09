import {distance} from "fastest-levenshtein";
import { RequestLimiter } from "./request-limiter";

export type IgdbLocalMultiplayer = {
    supportsLocalMultiplayer: boolean;
    localCoop: boolean;
    localVs: boolean;
};

export type IgdbGameGenreAndMultiplayerResult = {
    gameName: string;
    system: string;
    igdbGameId?: number;
    matchedName?: string;
    genres: string[];
    localMultiplayer: IgdbLocalMultiplayer;
};

type IgdbEnabledConfig = {
    enabled: true;
    clientId: string;
    clientSecret: string;
}
type IgdbDisabledConfig = {
    enabled: false
}
export type IgdbMetadataConfig = IgdbEnabledConfig | IgdbDisabledConfig;

type TwitchTokenResponse = {
    access_token: string;
    expires_in: number;
    token_type: string;
};

type IgdbGenre = { name?: string };

type IgdbMultiplayerMode = {
    campaigncoop?: boolean;
    dropin?: boolean;
    lancoop?: boolean;
    offlinecoop?: boolean;
    offlinecoopmax?: number;
    offlinemax?: number;
    onlinecoop?: boolean;
    onlinecoopmax?: number;
    onlinemax?: number;
    splitscreen?: boolean;
    splitscreenonline?: boolean;
};

type IgdbAlternativeName = { name?: string };

type IgdbGame = {
    id: number;
    name: string;
    genres?: IgdbGenre[];
    multiplayer_modes?: IgdbMultiplayerMode[];
    alternative_names?: IgdbAlternativeName[];
};

let cachedTwitchToken:
    | {
          token: string;
          expiresAtMs: number;
      }
    | undefined;

let twitchTokenInFlight: Promise<string> | undefined;
const requestLimiter = new RequestLimiter({ maxPerSecond: 4, maxPending: 4 });

async function fetchPostText(url: string, headers: Record<string, string>, body: string): Promise<string> {
    if (typeof fetch !== "function") {
        throw new Error("global fetch is not available. Use Node 18+ or Bun.");
    }

    const res = await fetch(url, {
        method: "POST",
        headers,
        body,
    });

    const text = await res.text();
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return text;
}

async function getTwitchAppAccessToken(config: IgdbEnabledConfig): Promise<string> {
    const clientId = config.clientId;
    const clientSecret = config.clientSecret;
    if (!clientId || !clientSecret) {
        throw new Error("Missing: IGDB_CLIENT_ID and/or IGDB_CLIENT_SECRET");
    }

    if (cachedTwitchToken && cachedTwitchToken.expiresAtMs - Date.now() > 30_000) {
        return cachedTwitchToken.token;
    }

    if (twitchTokenInFlight) {
        return twitchTokenInFlight;
    }

    twitchTokenInFlight = (async () => {
        const body = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "client_credentials",
        }).toString();

        const raw = await fetchPostText(
            "https://id.twitch.tv/oauth2/token",
            {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body
        );

        const parsed = JSON.parse(raw) as TwitchTokenResponse;
        cachedTwitchToken = {
            token: parsed.access_token,
            expiresAtMs: Date.now() + parsed.expires_in * 1000,
        };

        return parsed.access_token;
    })();

    try {
        return await twitchTokenInFlight;
    } finally {
        twitchTokenInFlight = undefined;
    }
}

async function igdbQuery<T>(endpoint: string, query: string, config: IgdbEnabledConfig): Promise<T> {

    return requestLimiter.schedule(async () => {
        console.log("Sending IGDB request to endpoint %s: %s", endpoint, query)
        const token = await getTwitchAppAccessToken(config);
        const url = `https://api.igdb.com/v4/${endpoint}`;

        const raw = await fetchPostText(
            url,
            {
                "Client-ID": config.clientId,
                Authorization: `Bearer ${token}`,
                "Content-Type": "text/plain",
                Accept: "application/json",
            },
            query
        );

        return JSON.parse(raw) as T;
    });
}

function scoreCandidate(queryName: string, candidateName: string): number {
    return distance(queryName, candidateName);
}

export async function fetchAllPlatformsFromIgdb(config: IgdbEnabledConfig): Promise<{id: number, name: string}[]> {
    const pageSize = 500;
    const all: {id: number, name: string}[] = [];

    for (let offset = 0; ; offset += pageSize) {
        const page = await igdbQuery<{id: number, name: string}[]>(
            "platforms",
            `fields name; sort id asc; limit ${pageSize}; offset ${offset};`,
            config
        );
        if (!page.length) break;
        all.push(...page);
        if (page.length < pageSize) break;
    }

    return all;
}

export async function fetchAllGenresFromIgdb(config: IgdbEnabledConfig): Promise<{id:number, name:string}[]> {
    const pageSize = 500;
    const all: {id:number, name:string}[] = [];

    for (let offset = 0; ; offset += pageSize) {
        const page = await igdbQuery<{id: number, name: string}[]>(
            "genres",
            `fields name,id; sort id asc; limit ${pageSize}; offset ${offset};`,
            config
        );
        if (!page.length) break;
        for (const row of page) {
            if (row.name && row.id) all.push({id: row.id, name: row.name});
        }
        if (page.length < pageSize) break;
    }

    return [...new Set(all)].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Return the lowest levenshtein score for the game name or any alternative name.
 * A smaller value is a better match.
 */
export function scoreGame(query: string, game: { name: string; alternative_names?: IgdbAlternativeName[] }): number {
    const q = query.toLowerCase();
    let best = scoreCandidate(q, game.name.toLowerCase());
    if (game.alternative_names) {
        for (const alt of game.alternative_names) {
            if (alt.name) {
                const d = scoreCandidate(q, alt.name.toLowerCase());
                if (d < best) best = d;
            }
        }
    }
    return best;
}

export function pickBestByName<T extends { name: string; alternative_names?: IgdbAlternativeName[] }>(query: string, list: T[]): T | undefined {
    const q = query.trim();
    if (!q) return undefined;

    const scored = list
        .map((x) => ({ x, score: scoreGame(q, x) }))
        .sort((a, b) => a.score - b.score);

    // TODO: Refine search and check so the lowest scoring ones actually contains any of the proper words
    // Use example: "Baseball Stars - Pocket Sports Series" "Neo Geo Pocket"
    // This might match "Baseball Stars" or "King of Fighters R-1: Pocket Fighting Series", both with distance of 23
    console.log(JSON.stringify(scored, null, 2))
    return scored[0]?.x;
}

export function normalizeLocalMultiplayer(modes: IgdbMultiplayerMode[] | undefined): IgdbLocalMultiplayer {
    const list = modes ?? [];

    const supportsLocal = list.some((m) => (m.offlinemax ?? 0) > 1 || (m.offlinecoopmax ?? 0) > 1 || m.splitscreen === true);

    const coop = list.some((m) => m.offlinecoop === true || (m.offlinecoopmax ?? 0) > 1 || m.campaigncoop === true);

    const vs = list.some((m) => {
        const max = m.offlinemax ?? 0;
        const coopFlag = m.offlinecoop === true || (m.offlinecoopmax ?? 0) > 1 || m.campaigncoop === true;
        return max > 1 && !coopFlag;
    });

    return {
        supportsLocalMultiplayer: supportsLocal,
        localCoop: coop,
        localVs: vs,
    };
}

function mapIgdbGenreName(genre: string|undefined): string|undefined {
    switch(genre) {
        case "Card & Board Game": return "Board Game";
        case "Hack and slash/Beat 'em up": return "Beat 'em Up";
        case "Role-playing (RPG)": return "Role-Playing";
        case "Quiz/Trivia": return "Quiz";
        case "Real Time Strategy (RTS)": return "Strategy";
        case "Turn-based strategy (TBS)": return "Strategy";
        case "Tactical": return "Strategy";
        default: return genre;
    }
}

export async function queryIgdbGenreAndLocalMultiplayer(gameName: string, platform: Platform, config: IgdbEnabledConfig): Promise<IgdbGameGenreAndMultiplayerResult|undefined> {
    if (!gameName) return undefined;

    const escapedName = gameName.replace(/\"/g, "\\\"").toLocaleLowerCase().replaceAll(/[^a-zA-Z0-9 ]/g, "").replaceAll(/\s{2,}/g," ")
    const wherePlatform = platform.igdbId ? ` where platforms = (${platform.igdbId});` : "";

    // try the normal "search" first; the API search is decent but sometimes
    // returns no results for queries that the website handles.
    let games = await igdbQuery<IgdbGame[]>(
        "games",
        `fields name, genres.name, multiplayer_modes.*, alternative_names.name; search "${escapedName}";${wherePlatform} limit 20;`,
        config
    );

    if(!games.length) {
        games = await igdbQuery<IgdbGame[]>(
            "games",
            `fields name, genres.name, multiplayer_modes.*, alternative_names.name; where alternative_names.name = "${escapedName}";${wherePlatform} limit 20;`,
            config
        );
    }

    // if nothing returned, try a contains match on the name itself. this is
    // closer to how the website behaves (it will match substrings and ignore
    // punctuation).
    if (!games.length) {
        games = await igdbQuery<IgdbGame[]>(
            "games",
            `fields name, genres.name, multiplayer_modes.*, alternative_names.name; where name ~ "*${escapedName}*";${wherePlatform} limit 20;`,
            config
        );
    }

    // still nothing? look through alternative_names explicitly.
    if (!games.length) {
        games = await igdbQuery<IgdbGame[]>(
            "games",
            `fields name, genres.name, multiplayer_modes.*, alternative_names.name; where alternative_names.name ~ "*${escapedName}*";${wherePlatform} limit 20;`,
            config
        );
    }

    if (!games.length) {
        return undefined;
    }

    const best = pickBestByName(gameName, games);
    if (!best) {
        return undefined;
    }

    const genresSet = new Set((best.genres ?? []).map((g) => mapIgdbGenreName(g.name)).filter((n): n is string => !!n));
    const genres = Array.from(genresSet);
    return {
        gameName,
        system: platform.name,
        igdbGameId: best.id,
        matchedName: best.name,
        genres,
        localMultiplayer: normalizeLocalMultiplayer(best.multiplayer_modes),
    };
}
