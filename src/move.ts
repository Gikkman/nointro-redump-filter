import { constants, existsSync } from "fs";
import { access, copyFile, stat } from "fs/promises";
import StreamZip from "node-stream-zip";
import { join, basename } from "path";
import { mkdirIfNotExists } from "./files";
import { writeJsonToDisc } from "./util";
import { ProcessResult } from "./work";

export async function moveGames(data: ProcessResult) {
    /* Create output folder if needed
     * Write the best.json file there
     * if we should unzip:
     *      create a folder to unzip into
     *      unzip game into the new directory
     * else
     *      copy the game over to the target directory   
     */ 
    mkdirIfNotExists(data.outputAbsoultePath);
    
    const bestGames = buildBestGamesJson(data);
    writeJsonToDisc(bestGames, data.outputAbsoultePath, "best.json")

    for(const game of bestGames) {
        if(data.unzip) {

        }
        else {
            copyGameToOutputLocation(game, data.outputAbsoultePath);
        }
    }
}

function buildBestGamesJson(data: ProcessResult) {
    ///////////////////////////////////////////////////////////////////////
    // Write best results to another file
    const best = new Array<GameWriteData>();
    for(const game of data.games) {
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
            aliases: data.collectionRules.englishTitleToForeignTitles.get(bestVersion.gameTitle),
            languages: bestVersion.languages,
            fileAbsolutePaths
        })
    }
    return best;
}

/** Tries to copy a game to an output directory. If a file with the same name already exists at the output
 * location, no copy is made.
 * 
 * @param game 
 * @param outputDirectoryPath 
 * @returns true if one or more files were copied
 */
export async function copyGameToOutputLocation(game: GameWriteData, outputDirectoryPath: string) {
    const promises = new Array<Promise<void>>();

    for(const src of game.fileAbsolutePaths) {
        const filename = basename(src)
        const dest = join(outputDirectoryPath, filename);
        if (!existsSync(dest)) {
            const cf = copyFile(src, dest, constants.COPYFILE_EXCL)
            promises.push(cf);
        }
    }

    if(promises.length > 0) {
        await Promise.all(promises);
        return true;
    }
    return false;
}

/** Tries to unzip a game to an output directory. If a file with the same name already exists at the output
 * location, no unzip is made.
 * 
 * @param game                  The game data
 * @param outputDirectoryPath   Path to the directory to unzip to
 * @param createGameFolder      Shall the function create a folder named after the zip file and unzip to that
 * @returns true if one or more files were unzipped
 */
export async function unzipGameToOutputLocation(game: GameWriteData, outputDirectoryPath: string, createGameFolder = false) {
    let modified = false;
    
    for(const src of game.fileAbsolutePaths) {
        const filename = basename(src);
        const outputDirectoryPathEnhanced = createGameFolder 
            ? join(outputDirectoryPath, filename.slice(0, filename.lastIndexOf("."))) 
            : outputDirectoryPath;
        mkdirIfNotExists(outputDirectoryPathEnhanced, false);
        
        const zip = new StreamZip.async({ file: src });
        const entries = await zip.entries();
        for (const entry of Object.values(entries)) {
            const path = join(outputDirectoryPathEnhanced, entry.name);
            if(!existsSync(path)) {
                if(entry.isDirectory) {
                    mkdirIfNotExists(path, false)
                }
                else {
                    await zip.extract(entry, path);
                }
                modified = true;
            }
        }
        await zip.close()
    }
    return modified;
}