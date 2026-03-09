import path from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { clonelistDataToCollectionRule, clonelistDirExists, loadCollection, loadYaml } from "./util";
import { run, setup, SetupData } from "./work";
import { exit } from "process";
import { moveGames } from "./move";
import { MetadataResult, preHeatMetadata, queryMetadata } from "./metadata/game-metadata";

main()
.then(() => {
    console.log("Done")
})

async function main() {
    if( !clonelistDirExists() ) {
        console.error("Submodule not cloned. Please initialize the git submodule using 'git submodule update --init --recursive .'")
        exit(1);
    }

    // TODO: We should somehow consider Launchbox's list of alternate titles too, when we group games.
    // For example, X Games Pro Boarder, has several alternate titles in Launchbox. Abe '99 is another example.

    const config = loadYaml("config.yaml") as any;

    const col = loadYaml("collections.yaml") as Collections;
    const inputBaseDirectory = path.resolve(col.inputRootDirectory);
    const collectionFiles = col.collectionFiles.map(f => path.resolve(f))
    const outputBaseDirectory = path.resolve(col.outputRootDirectory);
    const skipFileExtensions = col.skipFileExtensions ?? [];
    const skipFileTags = col.skipFileTags ?? [];
    const skipTitlePrefixes = col.skipFilePrefixes ?? [];
    verifyExists(inputBaseDirectory);
    collectionFiles.forEach(f => verifyExists(f))
    mkdirIfNotExists(outputBaseDirectory)

    const collectionData: SetupData[] = [];
    for (const collectionFile of collectionFiles) {
        console.log("Processing rom collection:", collectionFile);
        
        const collection = loadCollection(collectionFile);
        const collectionRules = clonelistDataToCollectionRule(collection.clonelists)
        const data = setup({inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipFileTags, skipTitlePrefixes, collection, collectionRules});
        collectionData.push(data);
    }

    const processed = new Array<MetadataResult>();
    for (const data of collectionData) {
        const grouped = run(data);
        await preHeatMetadata(config);
        const withMeta = await queryMetadata(config, grouped);
        await moveGames(withMeta);
        processed.push(withMeta);
        console.log("-----")
    }
}

