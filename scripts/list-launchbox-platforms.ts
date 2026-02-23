import { listLaunchBoxPlatforms } from "../src/metadata/launchbox/launchbox";
import { stat } from "fs/promises";

async function main() {
    const args = process.argv.slice(2);
    const xmlPath = args[0];
    
    if (!xmlPath) {
        console.error("LaunchBox XML path must be provided as argument");
        process.exit(1);
    }
    
    try {
        await stat(xmlPath);
    } catch (e) {
        console.error("LaunchBox XML path does not exist");
        process.exit(1);
    }
    
    const genres = await listLaunchBoxPlatforms({ enabled: true, xmlPath });
    console.log(JSON.stringify(genres, null, 2));
    process.exit(0);
}

main();