import os from "os";
import path from "path";
import { createWriteStream, promises as fs } from "fs";
import { finished } from "stream/promises";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import StreamZip from "node-stream-zip";
import { LaunchBoxGameMetadataResult } from "./types";
import { ensureLaunchBoxIndex, extractGenresFromXml, extractPlatformsFromXml, makeKey } from "./xml-parser";

// TODO: Look up game-alternate-name as a fallback when looking up a game name
// This will require a 2nd index, that references stuff via their DatabaseID
// We might wanna make one map of DatabaseID -> Game
// And then maps:
// Primary title -> DatabaseID
// Alternate title -> DatabaseID

export type LaunchBoxMetadataDownloadResult = {
    zipPath: string;
    bytes: number;
};

export type LaunchBoxMetadataConfig = {
    enabled: false
} | {
    enabled: true;
    downloadUrl: string;
} | {
    enabled: true;
    xmlPath: string;
}

const downloadedXmls: Map<string, string> = new Map();

async function fetchDownloadToFile(url: string, outPath: string): Promise<number> {
    if (typeof fetch !== "function") {
        throw new Error("global fetch is not available. Use Node 18+ or Bun.");
    }

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} when downloading ${url}: ${await res.text()}`);
    }
    if (!res.body) {
        throw new Error(`No response body when downloading ${url}`);
    }

    const file = createWriteStream(outPath);
    const body = Readable.fromWeb(res.body as unknown as NodeReadableStream);
    await finished(body.pipe(file));

    const len = res.headers.get("content-length");
    if (len) {
        const parsed = Number.parseInt(len, 10);
        if (!Number.isNaN(parsed)) return parsed;
    }
    const stat = await fs.stat(outPath);
    return stat.size;
}

async function downloadLaunchBoxMetadataZip(opts: {
    url: string;
    outDir?: string;
    fileName?: string;
}): Promise<LaunchBoxMetadataDownloadResult> {
    const outDir = opts?.outDir ?? os.tmpdir();
    const fileName = opts?.fileName ?? `launchbox-metadata-${Date.now()}.zip`;

    await fs.mkdir(outDir, { recursive: true });
    const zipPath = path.join(outDir, fileName);
    const bytes = await fetchDownloadToFile(opts.url, zipPath);
    return { zipPath, bytes };
}

async function extractMetadataXmlFromZipToTemp(zipPath: string): Promise<string> {
    const zip = new StreamZip.async({ file: zipPath });
    try {
        const entryName = "Metadata.xml";
        const data = await zip.entryData(entryName);
        const outPath = path.join(os.tmpdir(), `launchbox-metadata-${Date.now()}.xml`);
        await fs.writeFile(outPath, data.toString("utf8"), "utf8");
        return outPath;
    } finally {
        await zip.close();
    }
}

async function downloadLaunchBoxMetadataXml(opts: {
    downloadUrl: string;
    outDir?: string;
    fileName?: string;
}): Promise<string> {
    const downloadUrl = opts.downloadUrl;
    if (downloadedXmls.has(downloadUrl)) {
        return downloadedXmls.get(downloadUrl)!;
    }
    console.log("Downloading LaunchBox metadata from " + downloadUrl);
    const dl = await downloadLaunchBoxMetadataZip({ url: downloadUrl, outDir: opts?.outDir, fileName: opts?.fileName });
    const outPath = await extractMetadataXmlFromZipToTemp(dl.zipPath);
    downloadedXmls.set(downloadUrl, outPath);
    console.log("Downloaded LaunchBox metadata to " + outPath);
    
    return outPath;
}

export async function queryLaunchBoxGenreAndLocalMultiplayer(
    gameName: string,
    system: string,
    opts: LaunchBoxMetadataConfig
): Promise<LaunchBoxGameMetadataResult | undefined> {
    if(!opts.enabled) {
        return undefined;
    }

    let xmlPath: string;
    if('xmlPath' in opts) {
        xmlPath = opts.xmlPath;
    } else {
        xmlPath = await downloadLaunchBoxMetadataXml(opts);
    }

    const index = await ensureLaunchBoxIndex(xmlPath);
    const entry = index.get(makeKey(system, gameName));
    if (!entry) return undefined;

    const maxPlayers = entry.maxPlayers ?? 1;
    const localCoop = entry.cooperative === true;
    const supportsLocalMultiplayer = maxPlayers > 1;
    const localVs = supportsLocalMultiplayer && !localCoop;

    return {
        matchedName: entry.name,
        matchedSystem: entry.platform,
        genres: entry.genres,
        localMultiplayer: {
            supportsLocalMultiplayer,
            localCoop,
            localVs,
        },
    };
}

export async function listLaunchBoxGenres(opts?:  LaunchBoxMetadataConfig): Promise<string[]> {
    if(!opts?.enabled) {
        return [];
    }
    
    let xmlPath: string;
    if('xmlPath' in opts) {
        xmlPath = opts.xmlPath;
    } else {
        xmlPath = await downloadLaunchBoxMetadataXml(opts);
    }

    return extractGenresFromXml(xmlPath);
}

export async function listLaunchBoxPlatforms(opts?:  LaunchBoxMetadataConfig): Promise<string[]> {
    if(!opts?.enabled) {
        return [];
    }
    
    let xmlPath: string;
    if('xmlPath' in opts) {
        xmlPath = opts.xmlPath;
    } else {
        xmlPath = await downloadLaunchBoxMetadataXml(opts);
    }

    return extractPlatformsFromXml(xmlPath);
}