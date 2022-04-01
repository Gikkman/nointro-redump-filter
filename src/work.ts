import { writeFile } from "fs";
import path from "path";
import { extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat, mkdirIfNotExists } from "./files";
import { substrBack, substrFront } from "./util";


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
    console.log("Scanning input directories for platform", data.platform);
    const files: GameFile[] = listFilesFlat(...data.inputAbsolutePaths);
    console.log("Scanning done. Files found:", files.length);

    const gameGroups = groupGamesByTitle( 
        files.map(g => ({...extractTags(g),...g}))
             .map(g => ({...extractRegionInfo(g), ...g}))
    )
    console.log("Grouping games done. Unique game titles:", gameGroups.length);
    writeFile( path.join(data.outputAbsoultePath, "data.json"), JSON.stringify(gameGroups, null, 2), {encoding: 'utf8'}, () => {} );
}
