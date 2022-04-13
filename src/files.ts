import fs from "fs";
import path from "path";
import { substrBack } from "./util";

export function verifyExists(path: fs.PathLike) {
    if( !fs.existsSync(path) ) {
        console.error("Input directory does not exist:", path);
        process.exit(1);
    } else {
        console.log("Input directory exists:", path);
    }
}

export function mkdirIfNotExists(path: fs.PathLike): void {
    if( fs.existsSync(path) ) {
        const stat = fs.statSync(path);
        if( stat.isDirectory() ) {
            console.log("Directory existed:", path)
            return;
        }
        else {
            console.error("A file exists, but is not a directory:", path);
            process.exit(1)
        }
    }
    fs.mkdirSync(path, {recursive: true});
    console.log("Directory created:", path)
    return;
}

export function listFilesFlat(...dirPaths: string[]): GameFile[] {
    const files: GameFile[] = [];
    for(const dirPath of dirPaths) {
        if(!fs.existsSync(dirPath)) continue;
        const dirents = fs.readdirSync(dirPath, {withFileTypes: true});
        for(const dirent of dirents) {
            if(dirent.isFile()) {
                const name = dirent.name;
                if(name.startsWith(".") || name.startsWith("_") || name.startsWith("[") || name.startsWith("~"))
                    continue;
                files.push( {dir: dirPath, file: dirent.name} )
            }
            else if(dirent.isDirectory()) {
                const childDirPath = path.join(dirPath, dirent.name);
                const childFiles = listFilesFlat( childDirPath );
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
 const ValidRegions = new Set(["Japan", "USA", "Europe", "World", "Asia", "Scandinavia", "Latin America", "Australia", "Austria", "Belgium", "Brazil", "Canada", "China", "Denmark", "Finland", "France", "Germany", "Greece", "Hong Kong", "Italy", "Israel", "Ireland", "Korea", "Netherlands", "Norway", "Poland", "Portugal", "Russia", "Spain", "Sweden", "Taiwan", "UK", "Unknown", ]);
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
    const regions = selectTags(tags, ValidRegions);
    const languages = extractLanguageTags(tags, regions);
    return {isTranslated, regions, languages};
}

function isTranslatedFunc(tags: Tags): boolean {
    const translationRegex = /T-([\w]{2})|Translated ([\w]{2})/gm;
    for(const tag of Array.from(tags.tags)) {
        const match = tag.match(translationRegex);
        if(match)
            return true;
    }
    return false;
}

function selectTags(tags: Tags, alternatives: Set<string>): Set<string> {
    const matches= new Set<string>();
    for(const tag of tags.tags) {
        if(alternatives.has(tag))
            matches.add(tag);
    }
    return matches;
}

function extractLanguageTags(tags: Tags, reg: Set<string>): Set<string> {
    const languages = new Set<string>();
    const translationRegex = /T-([\w]{2})|Translated ([\w]{2})/;
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
    
    if(reg.has("USA") || reg.has("World") || reg.has("Australia") || reg.has("UK") || reg.has("Canada") || reg.has("Ireland"))
        languages.add("En");
    // Sometimes, the region "Europe" is set on a game, and it has language tags. In those cases, we've already picked up the 
    // language tags. But sometimes, it just says "Europe" and have to language tags. In that case, we assume it is in English
    else if( reg.has("Europe") && languages.size == 0) 
        languages.add("En");
    else if(reg.has("Japan"))
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
    return languages;
}

export function groupGamesByTitle(files: FileInfo[]): TitleGroup[] {
    const games = new Map<string, TitleGroup>();
    for(const f of files) {
        // fwt = Filename Without Type-extension
        const fwt = substrBack(f.file, ".");
        const gameName = fwt.substring(0, f.tagsStartsAt).trim();
        const gameGroup = games.get(gameName) ?? {title: gameName, files: []};
        gameGroup.files.push(f);
        games.set(gameName, gameGroup);
    }
    return Array.from( games.values() );
}

export function extractDiscInfo(group: TitleGroup): Game {
    let foundMultiFileGame = false;
    for(const file of group.files) {
        for(const tag of file.tags) {
            if(tag.indexOf("Disc") != -1) {
                foundMultiFileGame = true;
            }
        }
    }

    // If it is not a multi-disc game, we just add "isMultiFile: false" to all
    // games, and return them
    if(!foundMultiFileGame) {
        return {
            title: group.title,
            versions: group.files.map(g => ({isMultiFile: false, ...g}))
        }
    }

    return messedUpMultiFileResolutionLogic(group);
}

function messedUpMultiFileResolutionLogic(group: TitleGroup): Game {
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
        const region = entry[0];
        const files = entry[1];
        const regionVersions = messedUpMultiFileResolutionLogicForSingleRegion(region, files);
        versions.push(...regionVersions);
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
                const {regions, languages, isTranslated, ..._rest} = files[0]; 
                const commonTags = new Set(tagGroup[0].split(DELIMITER).filter(a => a.length > 0))
                const e: GameMultiFile = {
                    commonTags,
                    isMultiFile: true,
                    regions,
                    languages,
                    isTranslated,
                    files
                }
           }
        }
        return games;
    }

    // If no tag groups were correctly sized, then we try to find the intersection of each index's tag maps,
    // and see if 
    const arr: (FileInfo&FileIndex)[][] = [];
    indexMap.forEach(v => arr.push(v));
    const indexes = arr.map(v => 0);
    recurseDiscs_LongestTagSequence(arr, indexes);
}

function recurseDiscs_LongestTagSequence()

function longestTagSequence(filesByIndex: Map<string,  (FileInfo&FileIndex&{tagString:string})[]>): Array<GameSingleFile | GameMultiFile> {
    
}