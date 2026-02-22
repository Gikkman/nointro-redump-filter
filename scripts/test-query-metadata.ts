import {queryGameGenreAndLocalMultiplayer} from "../src/metadata/game-metadata"
import { stat } from "fs/promises";

async function main() {
    const args = process.argv.slice(2);
    console.log("Args:", args);
    if (args.length < 2) {
        console.log("Usage: ts-node --transpile-only scripts/test-query-metadata.ts \"<gameName>\" \"<systemName>");
        return;
    }
    
    const xmlPath = args[2] ?? undefined;
    try {
        await stat(xmlPath);
    } catch (e) {
        console.error("LaunchBox XML path does not exist");
        process.exit(1);
    }

    const res = await queryGameGenreAndLocalMultiplayer(args[0], args[1], {
        launchbox: {enabled: true, xmlPath}, 
        igdb: {enabled: false}
    });
    console.log("Result:", res);
}

main();
