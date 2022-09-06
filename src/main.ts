import path from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { clonelistDirExists, loadYaml } from "./util";
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
const collectionsDirectory = path.resolve("collections");
const outputBaseDirectory = path.resolve(col.outputRootDirectory);
const skipFileExtensions = col.skipFileExtensions ?? [];
const skipFileTags = col.skipFileTags ?? [];
const skipFilePrefixes = col.skipFilePrefixes ?? [];
verifyExists(inputBaseDirectory);
verifyExists(collectionsDirectory);
mkdirIfNotExists(outputBaseDirectory)


const collectionData: SetupData[] = [];
for (const collection of col.collections) {
    console.log("Processing rom collection:", collection);
    const data = setup(inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipFileTags, skipFilePrefixes, collection);
    collectionData.push(data);

    if(data.generateMultiDiscFile === "BizhawkXML") {
        // Validate that the platform name can be matched towards a Bizhawk core name
        // Kinda hacky to do it here, but I want to validate before running the long move process
        // This method will throw an error if it can't figure out a suitable system key
        guessBizhawkDiscSystemKey(data.platform)
    }
}

const processed = new Array<ProcessResult>();
for (const data of collectionData) {
    const res = run(data);
    moveGames(res);
    processed.push(res);
    console.log("-----")
}


