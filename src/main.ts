import * as C from "../collections.json"
import path from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { ProcessResult, run, setup } from "./work";

const col = C as Collections;
const inputBaseDirectory = path.resolve(col.inputDirectory);
const outputBaseDirectory = path.resolve(col.outputDirectory);
const skipFileExtensions = col.skipFileExtensions ?? [];
const skipTagList = col.skipTags ?? [];
const skipTitlePrefixList = col.skipTitles ?? [];
verifyExists(inputBaseDirectory);
mkdirIfNotExists(outputBaseDirectory)

const processed = new Map<string, ProcessResult>();

for (const collection of col.collections) {
    console.log("Processing rom collection:", collection);
    const data = setup(inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipTagList, skipTitlePrefixList, collection);
    const res = run(data);
    processed.set(collection.platform, res);
}

