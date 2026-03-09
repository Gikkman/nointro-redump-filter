import { fetchAllPlatformsFromIgdb } from "../src/metadata/igdb/igdb";
import { loadYaml } from "../src/util";

async function main() {
    const clientId = process.env.IGDB_CLIENT_ID as string;
    const clientSecret = process.env.IGDB_CLIENT_SECRET as string;
    
    let config = {enabled: true as const, clientId, clientSecret}
    if (!clientId || !clientSecret) {
        console.error("Env variables IGDB_CLIENT_ID and IGDB_CLIENT_SECRET not set, loading config.yaml");

        config = loadYaml("config.yaml").config.igdb;
    }

    console.log(config)

    const res = await fetchAllPlatformsFromIgdb(config);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}

main()
