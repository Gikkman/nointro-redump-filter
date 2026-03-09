import {queryGameGenreAndLocalMultiplayer} from "../src/metadata/game-metadata"
import { stat } from "fs/promises";
import { PlatformEnum } from "../src/types/platform-enum";

async function main() {
    const args = process.argv.slice(2);
    console.log("Args:", args);
    if (args.length < 3) {
        console.log("Usage: npx tsx scripts/test-launchbox-query.ts \"<gameName>\" \"<systemName>\" \"<xmlPath>\"");
        return;
    }
    
    const xmlPath = args[2];
    try {
        await stat(xmlPath);
    } catch (e) {
        console.error("LaunchBox XML path does not exist");
        process.exit(1);
    }

    const platform = PlatformEnum.fromName(args[1]);
    const res = await queryGameGenreAndLocalMultiplayer(args[0], platform, {
        launchbox: {enabled: true, xmlPath}, 
        igdb: {enabled: false}
    });
    console.log("Result:", res);
}

main();
