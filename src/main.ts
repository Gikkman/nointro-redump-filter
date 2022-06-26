import * as C from "../collections.json"
import path from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { clonelistDirExists } from "./util";
import { ProcessResult, run, setup } from "./work";
import { exit } from "process";

if( !clonelistDirExists() ) {
    console.error("Submodule not cloned. Please initialize the git submodule using 'git submodule init --update'")
    exit(1);
}

const col = C as Collections;
const inputBaseDirectory = path.resolve(col.inputDirectory);
const collectionsDirectory = path.resolve("collections");
const outputBaseDirectory = path.resolve(col.outputDirectory);
const skipFileExtensions = col.skipFileExtensions ?? [];
const skipTagList = col.skipTags ?? [];
const skipTitlePrefixList = col.skipTitles ?? [];
verifyExists(inputBaseDirectory);
verifyExists(collectionsDirectory);
mkdirIfNotExists(outputBaseDirectory)

const processed = new Array<ProcessResult>();

for (const collection of col.collections) {
    console.log("Processing rom collection:", collection);
    const data = setup(inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipTagList, skipTitlePrefixList, collection);
    const res = run(data);
    processed.push(res);
    console.log("-----")
}
