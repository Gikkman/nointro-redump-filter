import path from "path";
import { extractDiscInfo, extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat, mkdirIfNotExists, clearsTagRequirements, clearsTitlePrefixRequirements, extractTitle } from "./files";
import { findMostSuitableVersion } from "./sorting";
import { loadClonelist, loadCollection, titlefyString, writeJsonToDisc } from "./util";

export type ProcessResult = ReturnType<typeof setup> & {games: ProcessedGame[]}

export function setup(
        inputBaseDirectory: string, 
        outputBaseDirectory: string, 
        skipFileExtensions: string[], 
        skipTagList: string[], 
        skipTitlePrefixList: string[], 
        collectionFile: string
        ) {
    const collection = loadCollection(collectionFile);
    console.log(collection);
    
    const inputDirectory = collection.inputDirectoryOverride ?? inputBaseDirectory;
    const outputAbsoultePath = path.join(outputBaseDirectory, collection.output);
    const inputAbsolutePaths = collection.input.map(elem => path.join(inputDirectory, elem));
    mkdirIfNotExists(outputAbsoultePath);

    const collectionRules = clonelistDataToCollectionRule(collection.clonelists)
    return {
        skipFileExtensions: new Set<string>( skipFileExtensions.map(s => s.toLowerCase()) ),
        skipTagList: new Set<string>( [...skipTagList].map(s => s.toLowerCase()) ), 
        skipTitlePrefixList: new Set<string>( [...collectionRules.removeTitles, ...skipTitlePrefixList, ...collection.skipTitles ?? []].map(titlefyString) ),
        inputAbsolutePaths,
        outputAbsoultePath,
        collectionRules,
        unzip: collection.unzip ?? false,
        platform: collection.platform,
    }
}

function clonelistDataToCollectionRule(clonelists?: string[]): CollectionRules {
    const foreignTitleToEnglishTitle = new Map<string, string>();
    const englishTitleToForeignTitles = new Map<string, string[]>();
    const removeTitles = new Array<string>();
    
    for(const clonelist of clonelists ?? []) {
        const data = loadClonelist(clonelist);
    
        if(data.renames) {
            for( const entries of Object.entries(data.renames)) {
                const title: string = entries[0];
                const mappings = entries[1] as [string, number][];
                for(const mapping of mappings) {
                    foreignTitleToEnglishTitle.set( mapping[0], title )
                }
                englishTitleToForeignTitles.set(title, mappings.map(m => m[0]))
            }
        }
    
        if(data.removes) {
            for( const entries of Object.entries(data.removes)) {
                const title: string = entries[0];
                removeTitles.push( title )
            }
        }
    }

    return {removeTitles, foreignTitleToEnglishTitle, englishTitleToForeignTitles}
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

    const gameGroups = groupGamesByTitle(titleGroups, data.collectionRules.foreignTitleToEnglishTitle);
    const discGroups = gameGroups.map(g => extractDiscInfo(g)).sort((a,b) => a.title.localeCompare(b.title))
    const filteredDiscGroups = discGroups.filter(g => clearsTitlePrefixRequirements(data.skipTitlePrefixList, g));
    const prioratisedGames = filteredDiscGroups.map(g => findMostSuitableVersion(g))

    ///////////////////////////////////////////////////////////////////////
    // Write all results to a file
    console.log("Grouping games done. Unique game titles:", prioratisedGames.length);
    writeJsonToDisc(prioratisedGames, data.outputAbsoultePath, "all.json")

    return {...data, games: prioratisedGames}
}
