import { createReadStream } from "fs";
import readline from "readline";
import { titlefyString } from "../../util";

import { LaunchBoxGameEntry } from "./types";

let cacheBuildPromises = new Map<string, Promise<Map<string, LaunchBoxGameEntry>>>();
let cachedIndex:
    | {
          xmlPath: string;
          byKey: Map<string, LaunchBoxGameEntry>;
      }
    | undefined;

function decodeXmlEntities(raw: string): string {
    if (!raw.includes("&")) return raw;
    return raw.replace(/&(amp|lt|gt|quot|apos);/g, (_m, entity) => {
        switch (entity) {
            case "amp":
                return "&";
            case "lt":
                return "<";
            case "gt":
                return ">";
            case "quot":
                return '"';
            case "apos":
                return "'";
        }
        return _m;
    });
}

function getTextTag(line: string, tag: string): string | undefined {
    const open = `<${tag}>`;
    const close = `</${tag}>`;
    const start = line.indexOf(open);
    if (start === -1) return undefined;
    const end = line.indexOf(close, start + open.length);
    if (end === -1) return undefined;
    return decodeXmlEntities(line.slice(start + open.length, end));
}

function mapLaunchBoxGenre(genre: string): string {
    switch(genre) {
        case "Construction and Management Simulation": return "Simulation";
        case "Life Simulation": return "Simulation";
        case "Flight Simulator": return "Simulation";
        case "Vehicle Simulation": return "Simulation";
        default: return genre;
    }
}

function parseGenres(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .split(/[,|;]/g)
        .map((s) => s.trim())
        .map((s) => mapLaunchBoxGenre(s))
        .filter((s) => s.length > 0);
}

export function makeKey(platformName: string, gameName: string): string {
    return `${titlefyString(platformName)}|${titlefyString(gameName)}`;
}

export async function ensureLaunchBoxIndex(xmlPath: string): Promise<Map<string, LaunchBoxGameEntry>> {
    if (cachedIndex && cachedIndex.xmlPath === xmlPath) {
        return cachedIndex.byKey;
    }

    const buildPromise = cacheBuildPromises.get(xmlPath)
    if(buildPromise) {
        return buildPromise;
    }

    const p = buildLaunchboxIndex(xmlPath);
    cacheBuildPromises.set(xmlPath, p);

    const byKey = await p;
    cachedIndex = {
        xmlPath,
        byKey,
    };

    console.log("Launchbox index completed")
    return byKey;
}

async function buildLaunchboxIndex(xmlPath: string) {
    
    console.log("Bulding Launchbox index. This might take a while.")
    const byKey = new Map<string, LaunchBoxGameEntry>();

    const rl = readline.createInterface({
        input: createReadStream(xmlPath, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    let inGame = false;
    let current: Partial<LaunchBoxGameEntry> = {};

    for await (const line of rl) {
        if (line.includes("<Game>")) {
            inGame = true;
            current = {};
            continue;
        }
        if (inGame && line.includes("</Game>")) {
            inGame = false;
            if (current.name && current.platform) {
                const entry: LaunchBoxGameEntry = {
                    name: current.name,
                    platform: current.platform,
                    genres: current.genres ?? [],
                    maxPlayers: current.maxPlayers,
                    cooperative: current.cooperative,
                };
                byKey.set(makeKey(entry.platform, entry.name), entry);
            }
            continue;
        }

        if (!inGame) continue;

        const name = getTextTag(line, "Name");
        if (name !== undefined) {
            current.name = name;
            continue;
        }
        const platform = getTextTag(line, "Platform");
        if (platform !== undefined) {
            current.platform = platform;
            continue;
        }
        const genres = getTextTag(line, "Genres");
        if (genres !== undefined) {
            current.genres = parseGenres(genres);
            continue;
        }
        const maxPlayers = getTextTag(line, "MaxPlayers");
        if (maxPlayers !== undefined) {
            const parsed = Number.parseInt(maxPlayers, 10);
            if (!Number.isNaN(parsed)) current.maxPlayers = parsed;
            continue;
        }
        const cooperative = getTextTag(line, "Cooperative");
        if (cooperative !== undefined) {
            current.cooperative = cooperative.trim().toLowerCase() === "true";
            continue;
        }
    }

    return byKey;
}

export async function extractGenresFromXml(xmlPath: string): Promise<string[]> {
    const genres = new Set<string>();
    const rl = readline.createInterface({
        input: createReadStream(xmlPath, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const raw = getTextTag(line, "Genres");
        if (raw === undefined) continue;
        for (const g of parseGenres(raw)) {
            genres.add(g);
        }
    }

    return [...genres].sort((a, b) => a.localeCompare(b));
}

export async function extractPlatformsFromXml(xmlPath: string): Promise<string[]> {
    const genres = new Set<string>();
    const rl = readline.createInterface({
        input: createReadStream(xmlPath, { encoding: "utf8" }),
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const raw = getTextTag(line, "Platform");
        if (raw === undefined) continue;
        for (const g of parseGenres(raw)) {
            genres.add(g);
        }
    }

    return [...genres].sort((a, b) => a.localeCompare(b));
}