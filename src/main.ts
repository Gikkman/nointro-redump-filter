import path from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { clonelistDirExists, loadYaml } from "./util";
import { ProcessResult, run, setup } from "./work";
import { exit } from "process";

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

const processed = new Array<ProcessResult>();

for (const collection of col.collections) {
    console.log("Processing rom collection:", collection);
    const data = setup(inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipFileTags, skipFilePrefixes, collection);
    const res = run(data);
    processed.push(res);
    console.log("-----")
}
