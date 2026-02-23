import { SetupData, WorkResult } from "../work";
import { fetchAllPlatformsFromIgdb, IgdbGameGenreAndMultiplayerResult, IgdbMetadataConfig, queryIgdbGenreAndLocalMultiplayer } from "./igdb/igdb";
import { LaunchBoxMetadataConfig, queryLaunchBoxGenreAndLocalMultiplayer } from "./launchbox/launchbox";
import { LaunchBoxGameMetadataResult } from "./launchbox/types";

export type MetadataResult = SetupData & {games: GameWithMetadata[]}

// TODO: Some kind of class / enum for platforms, so we map input platform to their Launchbox and IGDB names, and their BizhawkDiscName (if it has one)

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
    const promises = [];
    if(opts.launchbox.enabled) {
        const p = queryLaunchBoxGenreAndLocalMultiplayer("", "", opts.launchbox);
        promises.push(p);
    }
    if(opts.igdb.enabled) {
        const p = await fetchAllPlatformsFromIgdb(opts.igdb);
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
    system: string,
    opts: {
        launchbox: LaunchBoxMetadataConfig;
        igdb: IgdbMetadataConfig;
    }
): Promise<GameGenreAndMultiplayer> {
    let lb: LaunchBoxGameMetadataResult | undefined;
    if(opts.launchbox.enabled) {
        console.log("Looking up %s (%s) in Launchbox database", gameName, system);
        lb = await queryLaunchBoxGenreAndLocalMultiplayer(gameName, system, opts.launchbox);
    }
    
    if (lb) {
        console.log("Found %s (%s) in Launchbox database", gameName, system);
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
        console.log("Looking up %s (%s) in IGDB database", gameName, system);
        let igdb: IgdbGameGenreAndMultiplayerResult | undefined;
        if(opts.igdb.enabled) {
            igdb = await queryIgdbGenreAndLocalMultiplayer(gameName, system, opts.igdb);
        }
        if (igdb) {
            console.log("Found %s (%s) in IGDB database", gameName, system);
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
        console.log(`Failed to query IGDB for ${gameName} on ${system}:`, error);
        return makeNoneResult();
    }

    console.log("Nothing found for %s (%s)", gameName, system);
    return makeNoneResult();
}
