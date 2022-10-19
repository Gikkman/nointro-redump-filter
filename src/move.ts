import { closeSync, constants, existsSync, openSync } from "fs";
import { copyFile } from "fs/promises";
import StreamZip from "node-stream-zip";
import path, { join, basename, resolve } from "path";
import { mkdirIfNotExists } from "./files";
import { writeJsonToDisc } from "./util";
import { ProcessResult } from "./work";
import { writeBizhawkXmlFile } from "./xml-writer";

export type MoveResult = {movedFilesRelativePaths: string[], changesMade: boolean}
export type BestWriteData = {files: string[], title: string, aliases?: string[], languages: string[]}

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
    const finalOutput: BestWriteData[] = new Array();
    let progressCounter = 0;+
    console.log(`Moving ${data.platform}. ${bestGames.length} files.`)
    console.log(`Processed 0/${bestGames.length} `)
    for(const game of bestGames) {
        let moveResult: MoveResult;
        if(data.unzip) {
            const createGameFolder = data.unzip === 'sub-folder'
            moveResult = await unzipGameToOutputLocation(game, data.outputAbsoultePath, createGameFolder)
        }
        else {
            moveResult = await copyGameToOutputLocation(game, data.outputAbsoultePath);
        }
        
        let writeData: BestWriteData;
        if(moveResult.changesMade && data.generateMultiDiscFile === 'BizhawkXML') {
            const fileName = await writeBizhawkXmlFile(moveResult.movedFilesRelativePaths, data.outputAbsoultePath, game.title, data.platform);
            writeData = {title: game.title, aliases: game.aliases, languages: [...game.languages], files: [fileName]};
        }
        else {
            writeData = {title: game.title, aliases: game.aliases, languages: [...game.languages], files: moveResult.movedFilesRelativePaths};
        }
        finalOutput.push(writeData);

        if(++progressCounter % 10 === 0) {
            console.log(`Processed ${progressCounter}/${bestGames.length} `)
        }
    }



    // TODO: Write "best.json" with info from what we copied or extracted
    writeJsonToDisc(finalOutput, data.outputAbsoultePath, "best.json")
}

function buildBestGamesJson(data: ProcessResult) {
    ///////////////////////////////////////////////////////////////////////
    // Write best results to another file
    const best = new Array<GameWriteData>();
    for(const game of data.games) {
        const fileAbsolutePaths = new Array<string>();
        const bestVersion = game.bestVersion;
        let shortestCommonRelativePath: string = "";
        if(bestVersion.isMultiFile) {
            fileAbsolutePaths.push( ...bestVersion.files.map(f => join(f.dirAbsolutePath, f.file)) );
            shortestCommonRelativePath = bestVersion.files.map(f => f.dirRelativePath).reduce( (prev, curr) => prev.length <= curr.length ? prev : curr)
        }
        else {
            fileAbsolutePaths.push( join(bestVersion.dirAbsolutePath, bestVersion.file) );
            shortestCommonRelativePath = bestVersion.dirRelativePath
        }
        best.push({
            title: bestVersion.gameTitle,
            aliases: data.collectionRules.englishTitleToForeignTitles.get(bestVersion.gameTitle),
            languages: bestVersion.languages,
            readAbsolutePaths: fileAbsolutePaths,
            writeRelativePath: shortestCommonRelativePath
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
export async function copyGameToOutputLocation(game: GameWriteData, outputDirectoryPath: string): Promise<MoveResult> {
    const promises = new Array<Promise<void>>();
    const gameFiles = new Array<string>();
    for(const src of game.readAbsolutePaths) {
        const filename = basename(src)
        const destDir = join(outputDirectoryPath, game.writeRelativePath);
        const destFile = join(destDir, filename);
        if (!existsSync(destFile)) {
            if(!existsSync(destDir))
                mkdirIfNotExists(destDir, false)
            const cf = copyFile(src, destFile, constants.COPYFILE_EXCL)
            promises.push(cf);
        }
        gameFiles.push( join(game.writeRelativePath, filename) );
    }

    if(promises.length > 0) {
        await Promise.all(promises);
    }
    return {movedFilesRelativePaths: gameFiles, changesMade: promises.length > 0};
}

/** Tries to unzip a game to an output directory. If a file with the same name already exists at the output
 * location, no unzip is made.
 * 
 * @param game                  The game data
 * @param outputDirectoryPath   Path to the directory to unzip to
 * @param createGameFolder      Shall the function create a folder named after the zip file and unzip to that
 * @returns Relative file path to all concerned game files (unzipped or already preset), and true if any files were unzipped
 */
export async function unzipGameToOutputLocation(game: GameWriteData, outputDirectoryPath: string, createGameFolder = false): Promise<MoveResult> {
    const gameFiles = new Array<string>();
    let changesMade = false;
    for(const src of game.readAbsolutePaths) {
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
    return {movedFilesRelativePaths: gameFiles, changesMade};
}
