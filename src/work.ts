import path from "path";
import { extractDiscInfo, extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat, mkdirIfNotExists, clearsTagRequirements, clearsTitlePrefixRequirements, extractTitle } from "./files";
import { findMostSuitableVersion } from "./sorting";
import { loadClonelist, loadCollection, titlefyString, writeJsonToDisc } from "./util";

export type SetupData =  ReturnType<typeof setup>;
export type ProcessResult = SetupData & {games: ProcessedGame[]}

export function setup(data: {
        inputBaseDirectory: string, 
        outputBaseDirectory: string, 
        skipFileExtensions: string[], 
        skipFileTags: string[], 
        skipTitlePrefixes: string[], 
        collection: Collection,
        collectionRules: CollectionRules,
    }) {
    const {inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipFileTags, skipTitlePrefixes, collection, collectionRules} = data;
    console.log(collection);

    const inputRootDirectory = collection.inputDirectoryRootOverride ?? inputBaseDirectory;
    const inputAbsolutePaths = collection.input.map(elem => path.join(inputRootDirectory, elem));
    const outputAbsoultePath = path.join(outputBaseDirectory, collection.output);
    mkdirIfNotExists(outputAbsoultePath);
    return {
        skipFileExtensions: new Set<string>( skipFileExtensions.map(s => s.toLowerCase()) ),
        skipFileTags: new Set<string>( [...skipFileTags].map(s => s.toLowerCase()) ), 
        skipTitlePrefixes: new Set<string>( [...collectionRules.removeTitles, ...skipTitlePrefixes, ...collection.skipFilePrefixes ?? []].map(titlefyString) ),
        inputAbsolutePaths,
        outputAbsoultePath,
        collectionRules,
        unzip: collection.unzip,
        platform: collection.platform,
        generateMultiDiscFile: collection.generateMultiDiscFile
    }
}

export function run(data: ReturnType<typeof setup>) : ProcessResult{
    ///////////////////////////////////////////////////////////////////////
    // Find all files
    console.log("Scanning input directories for platform", data.platform);
    const files: GameFile[] = listFilesFlat(".", data.skipFileExtensions, ...data.inputAbsolutePaths);
    console.log("Scanning done. Files found:", files.length);

    ///////////////////////////////////////////////////////////////////////
    // Process files
    const titleGroups = new Array<FileInfo>();
    for(const file of files) {
        const tags = extractTags(file)
        if( !clearsTagRequirements(data.skipFileTags, tags) )
            continue;
        const regionInfo = extractRegionInfo(tags)
        const gameTitle = extractTitle(file, tags);
        titleGroups.push({...regionInfo, ...tags, ...file, gameTitle})
    }

    const gameGroups = groupGamesByTitle(titleGroups, data.collectionRules.foreignTitleToEnglishTitle);
    const discGroups = gameGroups.map(g => extractDiscInfo(g)).sort((a,b) => a.title.localeCompare(b.title))
    const filteredDiscGroups = discGroups.filter(g => clearsTitlePrefixRequirements(data.skipTitlePrefixes, g));
    const prioratisedGames = filteredDiscGroups.map(g => findMostSuitableVersion(g))

    ///////////////////////////////////////////////////////////////////////
    // Write all results to a file
    console.log("Grouping games done. Unique game titles:", prioratisedGames.length);
    writeJsonToDisc(prioratisedGames, data.outputAbsoultePath, "_all.json")

    return {...data, games: prioratisedGames}
}
