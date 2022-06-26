import { constants } from "fs";
import { copyFile } from "fs/promises";
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

function unzipGameToOutputLocation() {

}

export async function copyGameToOutputLocation(game: GameWriteData, outputLocation: string) {
    const promises = new Array<Promise<void>>();
    for(const src of game.fileAbsolutePaths) {
        const filename = basename(src)
        const dest = join(outputLocation, filename);
        const cf = copyFile(src, dest, constants.COPYFILE_EXCL)
        promises.push(cf);
    }
    return Promise.all(promises);
}