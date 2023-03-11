import path, { resolve } from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { clonelistDataToCollectionRule, clonelistDirExists, loadCollection, loadYaml } from "./util";
import { ProcessResult, run, setup, SetupData } from "./work";
import { exit } from "process";
import { moveGames } from "./move";
import { guessBizhawkDiscSystemKey } from "./xml-writer";

if( !clonelistDirExists() ) {
    console.error("Submodule not cloned. Please initialize the git submodule using 'git submodule init --update'")
    exit(1);
}

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

    if(data.generateMultiDiscFile === "BizhawkXML") {
        // Validate that the platform name can be matched towards a Bizhawk core name
        // Kinda hacky to do it here, but I want to validate before running the long move process
        // This method will throw an error if it can't figure out a suitable system key
        guessBizhawkDiscSystemKey(data.platform)
    }
}

main()
.then(() => {
    console.log("Done")
})

async function main() {
    const processed = new Array<ProcessResult>();
    for (const data of collectionData) {
        const res = run(data);
        await moveGames(res);
        processed.push(res);
        console.log("-----")
    }
}

