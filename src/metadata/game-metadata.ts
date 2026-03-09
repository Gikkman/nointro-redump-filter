import { PlatformEnum } from "../types/platform-enum";
import { SetupData, WorkResult } from "../work";
import { IgdbGameGenreAndMultiplayerResult, IgdbMetadataConfig, queryIgdbGenreAndLocalMultiplayer } from "./igdb/igdb";
import { LaunchBoxMetadataConfig, queryLaunchBoxGenreAndLocalMultiplayer } from "./launchbox/launchbox";
import { LaunchBoxGameMetadataResult } from "./launchbox/types";

export type MetadataResult = SetupData & {games: GameWithMetadata[]}

function makeNoneResult(): GameGenreAndMultiplayer {
    return {
        genres: [],
        localMultiplayer: { coop: false, vs: false },
        source: "none",
    };
}

export async function preHeatMetadata(opts: {
        launchbox: LaunchBoxMetadataConfig;
        igdb: IgdbMetadataConfig;
    }) {
    const platform = PlatformEnum.NES;
    const promises = [];
    if(opts.launchbox.enabled) {
        const p = queryLaunchBoxGenreAndLocalMultiplayer("Battletoads", platform, opts.launchbox);
        promises.push(p);
    }
    if(opts.igdb.enabled) {
        const p = await queryIgdbGenreAndLocalMultiplayer("Battletoads", platform, opts.igdb);
        promises.push(p);
    }
    await Promise.all(promises);
}

export async function queryMetadata(config: any, pastResult: WorkResult): Promise<MetadataResult> {
    const games: GameWithMetadata[] = [];
    const newCopy: MetadataResult = { 
        ...pastResult,
        games
    };
    const promises: Promise<void>[] = [];
    for(const game of pastResult.games) {
        const igdbPlatformId = pastResult.platform.igdbId;
        if(!igdbPlatformId)
            continue;

        const p = queryGameGenreAndLocalMultiplayer(game.bestVersion.gameTitle, pastResult.platform, config)
        .then(md => {
            games.push({
                ...game,
                metadata: md
            });
        })
        promises.push(p);
    }
    await Promise.all(promises);
    return newCopy;
}


export async function queryGameGenreAndLocalMultiplayer(
    gameName: string,
    platform: Platform,
    opts: {
        launchbox: LaunchBoxMetadataConfig;
        igdb: IgdbMetadataConfig;
    }
): Promise<GameGenreAndMultiplayer> {
    let lb: LaunchBoxGameMetadataResult | undefined;
    if(opts.launchbox.enabled) {
        console.log("Looking up %s (%s) in Launchbox database", gameName, platform.name);
        lb = await queryLaunchBoxGenreAndLocalMultiplayer(gameName, platform, opts.launchbox);
    }
    
    if (lb) {
        console.log("Found %s (%s) in Launchbox database", gameName, platform.name);
        return {
            genres: lb.genres,
            localMultiplayer: {
                coop: lb.localMultiplayer.localCoop,
                vs: lb.localMultiplayer.localVs,
            },
            source: "launchbox",
            matchedName: lb.matchedName,
        };
    }
    
    try {
        console.log("Looking up %s (%s) in IGDB database", gameName, platform.name);
        let igdb: IgdbGameGenreAndMultiplayerResult | undefined;
        if(opts.igdb.enabled) {
            igdb = await queryIgdbGenreAndLocalMultiplayer(gameName, platform, opts.igdb);
        }
        if (igdb) {
            console.log("Found %s (%s) in IGDB database", gameName, platform.name);
            return {
                genres: igdb.genres,
                localMultiplayer: {
                    coop: igdb.localMultiplayer.localCoop,
                    vs: igdb.localMultiplayer.localVs,
                },
                source: "igdb",
                matchedName: igdb.matchedName,
            };
        }
    } catch (error) {
        console.log(`Failed to query IGDB for ${gameName} on ${platform.name}:`, error);
        return makeNoneResult();
    }

    console.log("Nothing found for %s (%s)", gameName, platform.name);
    return makeNoneResult();
}
