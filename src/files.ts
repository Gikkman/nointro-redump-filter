import fs from "fs";
import path from "path";
import { recursiveIntersection, titlefyString } from "./util";

export function verifyExists(path: fs.PathLike) {
    if( !fs.existsSync(path) ) {
        console.error("Input directory does not exist:", path);
        process.exit(1);
    } else {
        console.log("Input directory exists:", path);
    }
}

export function mkdirIfNotExists(path: fs.PathLike, printLogs: boolean = true): void {
    if( fs.existsSync(path) ) {
        const stat = fs.statSync(path);
        if( stat.isDirectory() ) {
            if(printLogs) console.log("Directory existed:", path)
            return;
        }
        else {
            console.error("A file exists, but is not a directory:", path);
            process.exit(1)
        }
    }
    fs.mkdirSync(path, {recursive: true});
    if(printLogs) console.log("Directory created:", path)
    return;
}

export function readCollectionFiles(dirPath: string) {
    const files = new Array<string>();
    const dirents = fs.readdirSync(dirPath, {withFileTypes: true});
    for(const dirent of dirents) {
        if(dirent.isFile() && dirent.name.endsWith(".yaml")) {
            files.push(dirent.name)
        }
    }
    return files;
}

export function listFilesFlat(dirRelativePath: string, skipFileExtensions: Set<string>, ...dirPaths: string[]): GameFile[] {
    const files: GameFile[] = [];
    for(const dirPath of dirPaths) {
        if(!fs.existsSync(dirPath)) continue;
        const dirents = fs.readdirSync(dirPath, {withFileTypes: true});
        for(const dirent of dirents) {
            if(dirent.isFile()) {
                const name = dirent.name;
                if(name.startsWith(".") || name.startsWith("_") || name.startsWith("[") || name.startsWith("~"))
                    continue;
                const extension = name.slice( name.lastIndexOf(".") + 1);
                if(skipFileExtensions.has(extension))
                    continue;
                files.push( {dirAbsolutePath: dirPath, dirRelativePath, file: dirent.name} )
            }
            else if(dirent.isDirectory()) {
                const childDirPath = path.join(dirPath, dirent.name);
                const childDirRelative = path.join(dirRelativePath, dirent.name)
                const childFiles = listFilesFlat(childDirRelative, skipFileExtensions, childDirPath );
                files.push(...childFiles);
            }
        }
    }
    return files;
}

/**
 * File tags are a complicated topic, but here are the basics:
 * Tags are appended after the file title.Tags is enclosed in ()
 * or [] characters. Tags comes in a certain order, and the first
 * tag is always the region. A pair of () or [] can sometimes contain
 * several tags. If that is the case, tags are separated by a ,.
 * 
 * For more info, see: https://wiki.no-intro.org/index.php?title=Naming_Convention
 */
 enum SplitState { outside, inside, building }
 const ValidRegions = new Set(["J","U","E", "Japan", "USA", "Europe", "World", "Asia", "Scandinavia", "Latin America", "Australia", "Austria", "Belgium", "Brazil", "Canada", "China", "Denmark", "Finland", "France", "Germany", "Greece", "Hong Kong", "Italy", "Israel", "Ireland", "Korea", "Netherlands", "Norway", "Poland", "Portugal", "Russia", "Spain", "Sweden", "Taiwan", "UK", "Unknown", ]);
 const RegionMappings = new Map([["J","Japan"], ["U","USA"], ["E","Europe"]])
 export function extractTags(gameFile: GameFile): Tags {
    const {file} = gameFile;
    const tags = new Set<string>();
    
    let state: SplitState = SplitState.outside;
    let buffer: string = "";
    let tagsStartsAt: number|undefined = undefined;

    /**
     * This backup-solution is a pretty ugly hack for those games that doesn't have a region assigned to them, but still has some tags.
     * See for example the game: Kart Fighter (Unl) [T-En by DvD Translations v1.0].zip
     * Normally, we require that a region tag is found before we start consuming other tags. This is to handle cases like the following 
     * game: 6-in-1 (Micro Genius) (Asia) (Unl).zip
     * In that case, the "(Mirco Genius)"" is intended to be part of the game name. So if we find a region, we skip everything that seems
     * like a tag before we find a region tag. But if we find no region tags at all, we fall back to using a "just keep all tags" kinda logic.
     */
    const backupTags = new Set<string>();
    let backupTagsStartsAt: number|undefined = undefined;
    for(let i = 0; i < file.length; i++) {
        const c = file[i];
        if( state === SplitState.outside ) {
            if(c === '(' || c === '[') {
                state = SplitState.building;
            }
        }
        else if( state === SplitState.building) {
            if(c === ')' || c === ']' || c === ",") {
                if(tagsStartsAt === undefined) {
                    if(ValidRegions.has(buffer)) {
                        // -1 to also get the index of the wrapping () or []
                        tagsStartsAt = i - buffer.length - 1
                    }
                    else {
                        if(backupTagsStartsAt === undefined) {
                            backupTagsStartsAt = i - buffer.length - 1;
                        }
                        backupTags.add(buffer);
                        buffer = "";
                    }
                }
                if (tagsStartsAt !== undefined) {
                    tags.add(buffer);
                    buffer = "";
                }
                if(c === ')' || c === ']')
                    state = SplitState.outside;
                else if( c === ',')
                    state = SplitState.inside;
            }
            else {
                buffer += c;
            }
        }
        else if( state === SplitState.inside) {
            if(c === ' ') {
                // skip spaces between tags, while inside () or []
            }
            else {
                state = SplitState.building;
                buffer += c;
            }
        }
    }
    if(tags.size === 0) {
        //If we end up using backup tags, we add region tag Unknown to all games that had no region, so the rest of the
        //program's logic runs well (ex. figuring out language)
        backupTags.add("Unknown"); 
        return {tags: backupTags, tagsStartsAt: backupTagsStartsAt}
    }
    return {tags, tagsStartsAt};
}

export function clearsTagRequirements(skipList: Set<string>, tags: Tags) {
    for(const tag of tags.tags) {
        if( skipList.has(tag.toLowerCase()) ) {
            return false;
        }
    }
    return true;
}

export function clearsTitlePrefixRequirements(skipList: Set<string>, game: Game) {
    const gameTitleLowerCase = game.title.toLowerCase();
    for(const prefix of skipList) {
        if( gameTitleLowerCase.startsWith(prefix) )
            return false;
    }
    return true;
}

export function extractRegionInfo(tags: Tags): RegionInfo {
    const isTranslated = isTranslatedFunc(tags);
    const regions = extractRegion(tags, ValidRegions, RegionMappings);
    const languages = extractLanguageTags(tags, regions);
    return {isTranslated, regions, languages};
}

function isTranslatedFunc(tags: Tags): boolean {
    const translationRegex = /T[-+]([\w]{2})|Translated ([\w]{2})/gm;
    for(const tag of Array.from(tags.tags)) {
        const match = tag.match(translationRegex);
        if(match)
            return true;
    }
    return false;
}

function selectTags(tags: Tags, alternatives: Set<string>): Set<string> {
    const matches = new Set<string>();
    for(const tag of tags.tags) {
        if(alternatives.has(tag))
            matches.add(tag);
    }
    return matches;
}

function extractRegion(tags: Tags, validRegions: Set<string>, regionMappings: Map<string, string>): Set<string> {
    const potentialRegions = selectTags(tags, validRegions);
    const regions = new Set<string>();
    for(const r of potentialRegions) {
        regions.add( regionMappings.get(r) ?? r )
    }
    return regions
}

function extractLanguageTags(tags: Tags, reg: Set<string>): Set<string> {
    const languages = new Set<string>();
    const translationRegex = /T[-+]([\w]{2})|Translated ([\w]{2})/;
    for(const tag of tags.tags) {
        const match = tag.match(translationRegex);
        if(match) {
            // If we get a match, we want to get group 2 or 3 ("T-XY" or "Translanted XY")
            if(match[1]) languages.add(match[1]);
            else if(match[2]) languages.add(match[2]);
        }
    }
    // If we found a translation, we don't check for anything else, just go with that
    if(languages.size > 0) return languages;

    const languageRegex = /^[A-Z][a-z]$/;
    for(const tag of tags.tags) {
        if(tag.match(languageRegex))
            languages.add(tag);
    }
    
    if(reg.has("USA") || reg.has("World") || reg.has("Australia") || reg.has("UK") || reg.has("Canada") || reg.has("Ireland") || reg.has("U"))
        languages.add("En");
    // Sometimes, the region "Europe" is set on a game, and it has language tags. In those cases, we've already picked up the 
    // language tags. But sometimes, it just says "Europe" and have to language tags. In that case, we assume it is in English
    else if( reg.has("Europe") && languages.size == 0) 
        languages.add("En");
    else if(reg.has("Japan") || reg.has("J"))
        languages.add("Ja");
    else if(reg.has("Brazil") || reg.has("Portugal"))
        languages.add("Pt")
    else if(reg.has("Spain") || reg.has("Latin America"))
        languages.add("Es");
    else if(reg.has("Asia") || reg.has("China") || reg.has("Hong Kong") || reg.has("Taiwan"))
        languages.add("Zh");
    else if(reg.has("Austria") || reg.has("Germany"))
        languages.add("De")
    else if(reg.has("Belgium") || reg.has("Netherlands"))
        languages.add("Nl")
    else if(reg.has("Denmark"))
        languages.add("Dk")
    else if(reg.has("Finland"))
        languages.add("Fi")
    else if(reg.has("France"))
        languages.add("Fr")
    else if(reg.has("Greece"))
        languages.add("El")
    else if(reg.has("Italy"))
        languages.add("It")
    else if(reg.has("Israel"))
        languages.add("He")
    else if(reg.has("Korea"))
        languages.add("Ko")
    else if(reg.has("Norway"))
        languages.add("No")
    else if(reg.has("Poland"))
        languages.add("Pl")
    else if(reg.has("Russia"))
        languages.add("Ru")
    else if(reg.has("Russia"))
        languages.add("Ru")
    else if(reg.has("Sweden"))
        languages.add("Sv")
    else if(reg.has("Unknown") && languages.size == 0)
        languages.add("En") // Default to 'En' if we can't find anything
    return languages;
}

export function extractTitle(file: GameFile, tags: Tags) {
    const end = tags.tagsStartsAt ?? file.file.lastIndexOf(".");
    return file.file.substring(0, end).trim();
}

export function groupGamesByTitle(files: FileInfo[], titleAliases?: Map<string, string>): TitleGroup[] {
    /*  The reason why we "titlefy" game titles to solve a lot of weird translation inconsistencies. Sometimes,
        a game can have an extra space in the title, use regular numbers over roman numbers, have an extra '!' at
        the end and so on. This tries to compensate for that.

        The other thing we do is use title aliases which we load from retrool's "rename" lists. It is basically a list
        of titles for games in other languages. So that alows us to resolve "La Adventura del Isles" to "Adventure Island"
     */
    const games = new Map<string, TitleGroup>();
    for(const f of files) {
        const aliasedName = titleAliases?.get(f.gameTitle) ?? f.gameTitle;
        const gameName = titlefyString(aliasedName)
        const gameGroup = games.get(gameName) ?? {title: gameName, files: []};
        gameGroup.files.push(f);
        games.set(gameName, gameGroup);
    }
    return Array.from( games.values() );
}

export function extractDiscInfo(group: TitleGroup): Game {
    // First, we separate all these files by region
    const regionMap = new Map<string, FileInfo[]>();
    for(const file of group.files) {
        for(const region of file.regions) {
            const arr = regionMap.get(region) ?? [];
            arr.push(file);
            regionMap.set(region, arr);
        }
    }

    const versions = new Array<GameSingleFile | GameMultiFile>()
    for(const entry of regionMap.entries()) {
        // Different regions can be single and multi file, for the same game
        // Don't ask...
        const region = entry[0];
        const files = entry[1];

        let foundMultiFileGame = false;
        for(const file of files) {
            for(const tag of file.tags) {
                if(tag.indexOf("Disc") != -1) {
                    foundMultiFileGame = true;
                }
            }
        }

        if(!foundMultiFileGame) {
            const regionVersions: GameSingleFile[] = files.map(g => ({isMultiFile: false, ...g}));
            versions.push(...regionVersions)
        }
        else {
            const regionVersions = messedUpMultiFileResolutionLogicForSingleRegion(region, files);
            versions.push(...regionVersions);
        }

    }

    return {
        title: group.title,
        versions
    }
}

function messedUpMultiFileResolutionLogicForSingleRegion(region: string, files: FileInfo[]): (GameSingleFile | GameMultiFile)[] {
    const DELIMITER = "::"
    // Group files by tags except the 'Disc X' tag
    const tagMap = new Map<string, (FileInfo&FileIndex)[]>()
    const indexMap = new Map<string,  (FileInfo&FileIndex&{tagString:string})[]>()
    for(const file of files) {
        const tagsWithoutDisc: string[] = new Array();
        let index = "";
        for(const tag of file.tags) {
            if(index == "" && tag.indexOf("Disc") != -1) {
                index = tag.substr("Disc".length).trim();
            }
            else {
                tagsWithoutDisc.push(tag);
            }
        }
        const elem = {index, ...file};

        const tagString = tagsWithoutDisc.join(DELIMITER)
        const tagEntry = tagMap.get(tagString) ?? []
        tagEntry.push(elem)
        tagMap.set(tagString, tagEntry)
        
        const indexEntry = indexMap.get(index) ?? []
        indexEntry.push( {tagString, ...elem} );
        indexMap.set(index, indexEntry)
    }
    const numberOfDiscs = indexMap.size;

    // If one or more tag groups contains a number of files equal to the number of discs, return those
    const correctSizedTagGroups = new Map<string, (FileInfo&FileIndex)[]>()
    for(const tagGroup of tagMap.entries()) {
        if(tagGroup[1].length == numberOfDiscs) {
            correctSizedTagGroups.set(tagGroup[0], tagGroup[1])
        }
    }
    if( correctSizedTagGroups.size > 0 ) {
        const games = new Array<GameSingleFile | GameMultiFile>()
        for(const tagGroup of correctSizedTagGroups.entries()) {
            const files = tagGroup[1]
            if(files.length === 1) {
                const e: GameSingleFile = {
                    isMultiFile: false,
                    ...files[0]
                }
                games.push(e);
            }
            else {
                // We take the region info from files[0], because all files will have the same region info
                const {regions, languages, isTranslated, gameTitle, ..._rest} = files[0]; 
                const commonTags = new Set(tagGroup[0].split(DELIMITER).filter(a => a.length > 0))
                const e: GameMultiFile = {
                    tags: commonTags,
                    isMultiFile: true,
                    gameTitle,
                    regions,
                    languages,
                    isTranslated,
                    files
                }
                games.push(e);
           }
        }
        return games;
    }

    // If no tag groups were correctly sized, then we try to find the intersection of each index's tag maps,
    // and see if 
    const byIndex: (FileInfo&FileIndex)[][] = [];
    indexMap.forEach(v => {
        const mapped = v.map(elem => {
            const {tagString, ...rest} = elem;
            return rest;
        })
        byIndex.push(mapped);
    });
    const indexes = byIndex.map(v => 0);
    return recurseDiscs_LongestTagSequence(byIndex, indexes, 0, 0, [] )
}

function recurseDiscs_LongestTagSequence(byIndex: (FileInfo&FileIndex)[][], indexes: number[], currIndex: number, bestLenght: number, bestIndexes: number[]): GameMultiFile[] {
    // If we've reaced the last element in currIndex, we reset the currIndex count, upp currIndex by one
    // and move on to the next element
    if(indexes[currIndex] === byIndex[currIndex].length) {
        indexes[currIndex] = 0;
        currIndex++;
        if(currIndex === indexes.length) {
            const files: (FileInfo&FileIndex)[] = []
            for(let i = 0; i < byIndex.length; i++)
                files[i] = byIndex[i][bestIndexes[i]];
            const commonTags = recursiveIntersection<string>(...files.map(f => f.tags))
            return [{
                isMultiFile: true,
                gameTitle: files[0].gameTitle,
                tags: commonTags,
                regions: files[0].regions,
                languages: files[0].languages,
                isTranslated: files[0].isTranslated, // I just give up by now but if there are some that are translated and some that aren't, fuck it
                files,
            }]
        }
        indexes[currIndex]++;
        return recurseDiscs_LongestTagSequence(byIndex, indexes, currIndex, bestLenght, bestIndexes);
    }

    const commonTags = intersectAt(byIndex, indexes, currIndex)
    if(commonTags.size > bestLenght) {
        bestLenght = commonTags.size
        bestIndexes = [...indexes] // copy
    }
    indexes[currIndex]++;
    return recurseDiscs_LongestTagSequence(byIndex, indexes, currIndex, bestLenght, bestIndexes);
}

function intersectAt(byIndex: (FileInfo&FileIndex)[][], indexes: number[], currIndex: number): Set<string> {
    const files: (FileInfo&FileIndex)[] = []
    for(let i = 0; i < byIndex.length; i++)
        files[i] = byIndex[i][indexes[i]];
    return recursiveIntersection<string>(...files.map(f => f.tags))
}