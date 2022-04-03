import * as C from "../collections.json"
import path from "path";
import { mkdirIfNotExists, verifyExists } from "./files";
import { run, setup } from "./work";

const col = C as Collections;
const inputBaseDirectory = path.resolve(col.inputDirectory);
const outputBaseDirectory = path.resolve(col.outputDirectory);
const skipTagList = col.skipTags ?? [];
const skipTitlePrefixList = col.skipTitles ?? [];
verifyExists(inputBaseDirectory);
mkdirIfNotExists(outputBaseDirectory)

for (const collection of col.collections) {
    console.log(">>> Processing rom collection:", collection);
    const data = setup(inputBaseDirectory, outputBaseDirectory, skipTagList, skipTitlePrefixList, collection);
    run(data);
}