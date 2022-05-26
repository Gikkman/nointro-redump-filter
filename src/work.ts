import { writeFile } from "fs";
import path, { join } from "path";
import { extractDiscInfo, extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat, mkdirIfNotExists, clearsTagRequirements, clearsTitlePrefixRequirements, extractTitle } from "./files";
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
    ///////////////////////////////////////////////////////////////////////
    // Find all files
    console.log("Scanning input directories for platform", data.platform);
    const files: GameFile[] = listFilesFlat(data.skipFileExtensions, ...data.inputAbsolutePaths);
    console.log("Scanning done. Files found:", files.length);

    ///////////////////////////////////////////////////////////////////////
    // Process files
    const titleGroups = new Array<FileInfo>();
    for(const file of files) {
        const tags = extractTags(file)
        if( !clearsTagRequirements(data.skipTagList, tags) )
            continue;
        const regionInfo = extractRegionInfo(tags)
        const gameTitle = extractTitle(file, tags);
        titleGroups.push({...regionInfo, ...tags, ...file, gameTitle})
    }

    const gameGroups = groupGamesByTitle(titleGroups);
    const discGroups = gameGroups.map(g => extractDiscInfo(g)).sort((a,b) => a.title.localeCompare(b.title))
    const filteredDiscGroups = discGroups.filter(g => clearsTitlePrefixRequirements(data.skipTitlePrefixList, g));
    const prioratisedGames = filteredDiscGroups.map(g => findMostSuitableVersion(g))

    ///////////////////////////////////////////////////////////////////////
    // Write all results to a file
    console.log("Grouping games done. Unique game titles:", prioratisedGames.length);
    writeFile( path.join(data.outputAbsoultePath, "all.json"), JSON.stringify(prioratisedGames, SetToJSON, 2), {encoding: 'utf8'}, () => {} );

    ///////////////////////////////////////////////////////////////////////
    // Write best results to another file
    const best = new Array<GameWriteData>();
    for(const game of prioratisedGames) {
        const fileAbsolutePaths = new Array<string>();
        const bestVersion = game.bestVersion;
        if(bestVersion.isMultiFile) {
            fileAbsolutePaths.push( ...bestVersion.files.map(f => join(f.dir, f.file)) );
        }
        else {
            fileAbsolutePaths.push( join(bestVersion.dir, bestVersion.file) );
        }
        best.push({
            title: bestVersion.gameTitle,
            languages: bestVersion.languages,
            fileAbsolutePaths
        })
    }
    writeFile( path.join(data.outputAbsoultePath, "best.json"), JSON.stringify(best, SetToJSON, 2), {encoding: 'utf8'}, () => {} );

    return {...data, games: prioratisedGames}
}
