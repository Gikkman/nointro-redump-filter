import {queryGameGenreAndLocalMultiplayer} from "../src/metadata/game-metadata"
import { PlatformEnum } from "../src/types/platform-enum";
import { loadYaml } from "../src/util";

async function main() {
    const args = process.argv.slice(2);
    console.log("Usage: npx tsx scripts/test-igdb-query.ts \"<gameName>\" \"<systemName>\"");
    console.log("Args:", args);

    const clientId = process.env.IGDB_CLIENT_ID as string;
    const clientSecret = process.env.IGDB_CLIENT_SECRET as string;
    
    let config = {enabled: true as const, clientId, clientSecret}
    if (!clientId || !clientSecret) {
        console.error("Env variables IGDB_CLIENT_ID and IGDB_CLIENT_SECRET not set, loading config.yaml");
 
        config = loadYaml("config.yaml").igdb;
    }

    const platform = PlatformEnum.fromName(args[1]);
    const res = await queryGameGenreAndLocalMultiplayer(args[0], platform, {
        launchbox: {enabled: false}, 
        igdb: config
    });
    console.log("Result:", res);
}

main();
