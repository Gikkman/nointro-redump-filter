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
   

    for(const game of bestGames) {
        if(data.unzip) {
            const createGameFolder = data.unzip === 'sub-folder'
            unzipGameToOutputLocation(game, data.outputAbsoultePath, createGameFolder)
            if(data.generateMultiDiscXML === 'BizhawkXML') {
                // TODO: Generate XML file
            }
        }
        else {
            copyGameToOutputLocation(game, data.outputAbsoultePath);
        }
    }
    // TODO: Write "best.json" with info from what we copied or extracted
    writeJsonToDisc(bestGames, data.outputAbsoultePath, "best.json")
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
 * @returns Relative file path to all concerned game files (copied or already preset), and true if any files were copied
 */
export async function copyGameToOutputLocation(game: GameWriteData, outputDirectoryPath: string) {
    const promises = new Array<Promise<void>>();
    const gameFiles = new Array<string>();
    for(const src of game.fileAbsolutePaths) {
        const filename = basename(src)
        const dest = join(outputDirectoryPath, filename);
        if (!existsSync(dest)) {
            const cf = copyFile(src, dest, constants.COPYFILE_EXCL)
            promises.push(cf);
        }
        gameFiles.push(filename);
    }

    if(promises.length > 0) {
        await Promise.all(promises);
    }
    return {gameFiles, changesMade: promises.length > 0};
}

/** Tries to unzip a game to an output directory. If a file with the same name already exists at the output
 * location, no unzip is made.
 * 
 * @param game                  The game data
 * @param outputDirectoryPath   Path to the directory to unzip to
 * @param createGameFolder      Shall the function create a folder named after the zip file and unzip to that
 * @returns Relative file path to all concerned game files (unzipped or already preset), and true if any files were unzipped
 */
export async function unzipGameToOutputLocation(game: GameWriteData, outputDirectoryPath: string, createGameFolder = false) {
    const gameFiles = new Array<string>();
    let changesMade = false;
    for(const src of game.fileAbsolutePaths) {
        const filename = basename(src);
        const filenameNoExtension = filename.slice(0, filename.lastIndexOf("."));
        const outputDirectoryPathEnhanced = createGameFolder 
            ? join(outputDirectoryPath, filenameNoExtension) 
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
                changesMade = true;
            }
            if(!entry.isDirectory){
                if(createGameFolder)
                    gameFiles.push(join(filenameNoExtension, entry.name));
                else
                    gameFiles.push(entry.name);
            } 
        }
        await zip.close()
    }
    return {gameFiles, changesMade};
}