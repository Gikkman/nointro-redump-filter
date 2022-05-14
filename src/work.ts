import { writeFile } from "fs";
import path from "path";
import { extractDiscInfo, extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat, mkdirIfNotExists, clearsTagRequirements, clearsTitlePrefixRequirements } from "./files";
import { findMostSuitableVersion } from "./sorting";
import { SetToJSON } from "./util";

export type ProcessResult = ReturnType<typeof setup> & {games: ProcessedGame[]}

export function setup(
        inputBaseDirectory: string, 
        outputBaseDirectory: string, 
        skipFileExtensions: string[], 
        skipTagList: string[], 
        skipTitlePrefixList: string[], 
        collection: Collection
        ) {
    const inputDirectory = collection.inputDirectoryOverride ?? inputBaseDirectory;
    const outputAbsoultePath = path.join(outputBaseDirectory, collection.output);
    const inputAbsolutePaths = collection.input.map(elem => path.join(inputDirectory, elem));
    mkdirIfNotExists(outputAbsoultePath);
    return {
        skipFileExtensions: new Set<string>(skipFileExtensions),
        skipTagList: new Set<string>(skipTagList), 
        skipTitlePrefixList: new Set<string>(skipTitlePrefixList),
        inputAbsolutePaths,
        outputAbsoultePath,
        unzip: collection.unzip ?? false,
        platform: collection.platform,
    }
}

export function run(data: ReturnType<typeof setup>) : ProcessResult{
    console.log("Scanning input directories for platform", data.platform);
    const files: GameFile[] = listFilesFlat(data.skipFileExtensions, ...data.inputAbsolutePaths);
    console.log("Scanning done. Files found:", files.length);

    const titleGroups = new Array<FileInfo>();
    for(const file of files) {
        const tags = extractTags(file)
        if( !clearsTagRequirements(data.skipTagList, tags) )
            continue;
        const regionInfo = extractRegionInfo(tags)
        titleGroups.push({...regionInfo, ...tags, ...file})
    }

    const gameGroups = groupGamesByTitle(titleGroups);
    const discGroups = gameGroups.map(g => extractDiscInfo(g)).sort((a,b) => a.title.localeCompare(b.title))
    const filteredDiscGroups = discGroups.filter(g => clearsTitlePrefixRequirements(data.skipTitlePrefixList, g));
    const prioratisedGames = filteredDiscGroups.map(g => findMostSuitableVersion(g))

    console.log("Grouping games done. Unique game titles:", prioratisedGames.length);
    writeFile( path.join(data.outputAbsoultePath, "data.json"), JSON.stringify(prioratisedGames, SetToJSON, 2), {encoding: 'utf8'}, () => {} );

    return {...data, games: prioratisedGames}
}
