import { existsSync, readFileSync, writeFile, writeFileSync } from "fs";
import { basename, join, resolve } from "path";
import * as yaml from "yaml";

/** Search a string for each pattern. For the pattern that is found furthest from the
 * start of the string, create a substring from 0 to that point.
 * 
 * For example: substrBack("hello-world.com", ".", "-")
 * Would return "hello-world", because the "." is the first matching from behind
 * 
 * @param input input string
 * @param patterns patterns to search for
 * @returns substring of input, from the last matching till the start of the stringn
 */
 export function substrBack(input: string, ...patterns: string[]) {
    let highest: number = -1;
    for(const p of patterns) {
        const finding = input.lastIndexOf(p);
        if(finding >= 0 && finding > highest) highest = finding;
    }
    if(highest === -1) return input;
    return input.substring(0, highest);
}

/** Search a string for each pattern. For the pattern that is found closest from the
 * start of the string, create a substring from 0 to that point.
 * 
 * For example: substrBack("hello-world.com", ".", "-")
 * Would return "hello", because the "-" is the first matching from the start
 * 
 * @param input input string
 * @param patterns patterns to search for
 * @returns substring of input, from the first matching till the start of the stringn
 */
export function substrFront(input: string, ...patterns: string[]) {
    let lowest: number = Number.MAX_VALUE;
    for(const p of patterns) {
        const finding = input.indexOf(p);
        if(finding >= 0 && finding < lowest) lowest = finding;
    }
    return input.substring(0, lowest);
}

export function SetToJSON(key: any, value: any[]) {
    if (typeof value === 'object' && value instanceof Set) {
      return Array.from(value);
    }
    return value;
}

export function recursiveIntersection<T>(...cols: Set<T>[]): Set<T> {
    if(cols.length < 2 ) {
        return new Set();
    }
    if(cols.length == 2) {
        const arrA = [...cols[0]]
        const arrB = [...cols[1]]
        return new Set(arrA.filter(e => arrB.indexOf(e) !== -1))
    }
    const colsShort = cols.slice(0, cols.length-1);
    const colsLast = cols[cols.length-1];
    return recursiveIntersection( recursiveIntersection(...colsShort), colsLast )
}

const clonelistDirLocation = join(".", "retool-submodule", "clonelists");
export function clonelistDirExists() {
    return existsSync(clonelistDirLocation);
}

export function loadCollection(path: string): Collection {
    if(!existsSync(path)) {
        console.error(`Can't load collection file: ${basename(path)}. File not found at ${path}`)
        process.exit(1);
    }
    const collection = loadYaml(path);
    if( !isValidCollection(collection) ) {
        console.error(`Invalid collection definition found at ${path}. Please check the file structure.`)
        console.error(collection);
        process.exit(1);
    }
    return collection;
}

export function clonelistDataToCollectionRule(clonelists?: string[]): CollectionRules {
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

        if(data.categories) {
            for( const entries of Object.entries(data.categories)) {
                const title: string = entries[0];
                removeTitles.push( title )
            }
        }
    }

    return {removeTitles, foreignTitleToEnglishTitle, englishTitleToForeignTitles}
}

export function loadYaml(path: string) : any {
    return yaml.parse( readFileSync(path, 'utf-8'), { strict: true} )
}

function isValidCollection(data: any): data is Collection {
    const baseInfo = !!data.platform 
        && !!data.output
        && !!data.input
        && data.input.length > 0;
    const unzipInfo = data.unzip !== undefined ? (data.unzip === 'sub-folder' || data.unzip === 'same-folder') : true;
    const clonelistInfo = data.clonelist !== undefined ? Array.isArray(data.clonelist) : true;
    const iOverideInfo = data.inputDirectoryOverride !== undefined ? typeof data.inputDirectoryOverride === 'string' : true;
    const iSkipFilePrefixes = data.skipFilePrefixes !== undefined ? Array.isArray(data.skipFilePrefixes) : true
    const discConfig = data.generateMultiDiscXML !== undefined ? data.generateMultiDiscXML === 'BizhawkXML' : true
    return baseInfo && unzipInfo && clonelistInfo && iOverideInfo && iSkipFilePrefixes && discConfig;
}

export function loadClonelist(filename: string): any {
    const fileLocation = join(clonelistDirLocation, filename);
    if(!existsSync(fileLocation))
        return {}
    return JSON.parse(readFileSync(fileLocation, 'utf8'));
}

export function titlefyString(s: string) {
    const numberRegex = /[0-9]/g;
    const characterRegex = /[^a-zA-Z]/g;
    return s.replace(numberRegex, numberToRoman).replace(characterRegex, "").toLowerCase();
}
function numberToRoman(s: string) {
    switch (s) {
        case '1': return 'i';
        case '2': return 'ii';
        case '3': return 'iii';
        case '4': return 'iv';
        case '5': return 'v';
        case '6': return 'vi';
        case '7': return 'vii';
        case '8': return 'viii';
        case '9': return 'ix';
        case '10': return 'x';
        case '11': return 'xi';
        case '12': return 'xii';
        case '13': return 'xiii';
        case '14': return 'xiv';
        case '15': return 'xv';
        case '16': return 'xvi';
        case '17': return 'xvii';
        case '18': return 'xviii';
        case '19': return 'xix';
        case '20': return 'xx';
        case '21': return 'xxi';
        case '22': return 'xxii';
        case '23': return 'xxiii';
        case '24': return 'xxiv';
        case '25': return 'xxv';
        default: return s;
    }
}

export function writeJsonToDisc(json: object, filepath: string, filename: string) {
    writeFileSync( join(filepath, filename), JSON.stringify(json, SetToJSON, 2));
}