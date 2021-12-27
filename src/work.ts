import fs, { writeFile } from "fs";
import path from "path";
import { mkdirIfNotExists, substrBack, substrFront } from "./files";

type GameFile = {
    dir: string,
    file: string,
}
type GameGroup = {
    title: string,
    files: GameFile[],
}

export function setup(inputBaseDirectory: string, outputBaseDirectory: string, collection: Collection) {
    const outputAbsoultePath = path.join(outputBaseDirectory, collection.output);
    const inputAbsolutePaths = collection.input.map(elem => path.join(inputBaseDirectory, elem));
    mkdirIfNotExists(outputAbsoultePath);
    return {
        inputAbsolutePaths,
        outputAbsoultePath,
        platform: collection.platform,
    }
}

export function run(data: ReturnType<typeof setup>) {
    const files: GameFile[] = [];
    console.log("Scanning input directories for platform", data.platform);
    for(const input of data.inputAbsolutePaths) {
        const dirents = fs.readdirSync(input, {withFileTypes: true});
        for(const dirent of dirents) {
            if(dirent.isFile() && !dirent.name.startsWith(".") ) {
                files.push( {dir: input, file: dirent.name} )
            }
        }
    }
    console.log("Scanning done. Files found:", files.length);

    const gameGroups = groupGames(files);
    console.log("Grouping games done. Unique game titles:", gameGroups.length);
    writeFile( path.join(data.outputAbsoultePath, "data.json"), JSON.stringify(gameGroups, null, 2), {encoding: 'utf8'}, () => {} );
}

function groupGames(files: GameFile[]) {
    const games = new Map<string, GameGroup>();
    for(const f of files) {
        // Skip docs and bios
        if(f.file.startsWith("_") || f.file.startsWith("[")) continue;

        // fwt = Filename Without Type-extension
        const fwt = substrBack(f.file, ".");
        const gameName = substrFront(fwt, "(", "[").trim();
        
        const gameGroup = games.get(gameName) ?? {title: gameName, files: []};
        gameGroup.files.push(f);
        games.set(gameName, gameGroup);
    }
    return Array.from( games.values() );
}