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
    if(opts.launchbox.enabled) {
        await queryLaunchBoxGenreAndLocalMultiplayer("", "", opts.launchbox);
    }
    if(opts.igdb.enabled) {
        await queryIgdbGenreAndLocalMultiplayer("", "", opts.igdb);
    }
}

export async function queryMetadata(config: any, pastResult: WorkResult): Promise<MetadataResult> {
    const games: GameWithMetadata[] = [];
    const newCopy: MetadataResult = { 
        ...pastResult,
        games
    };

    for(const game of pastResult.games) {
        queryGameGenreAndLocalMultiplayer(game.title, pastResult.platform, config)
        .then(md => {
            games.push({
                ...game,
                metadata: md
            });
        })

    }
    
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
        lb = await queryLaunchBoxGenreAndLocalMultiplayer(gameName, system, opts.launchbox);
    }

    if (lb) {
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
        let igdb: IgdbGameGenreAndMultiplayerResult | undefined;
        if(opts.igdb.enabled) {
            igdb = await queryIgdbGenreAndLocalMultiplayer(gameName, system, opts.igdb);
        }
        if (igdb) {
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
        else {
            return makeNoneResult();
        }
    } catch (error) {
        console.log(`Failed to query IGDB for ${gameName} on ${system}:`, error);
        return makeNoneResult();
    }
}
