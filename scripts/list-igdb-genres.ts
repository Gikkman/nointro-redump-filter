
import { fetchAllGenresFromIgdb } from "../src/metadata/igdb/igdb";

async function main() {
    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error("Env variables IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set");
        process.exit(1);
    }

    const genres = await fetchAllGenresFromIgdb({enabled: true, clientId, clientSecret});
    console.log(JSON.stringify(genres, null, 2));
    process.exit(0);
}

main();
