import * as C from "../collections.json"
import path from "path";
import { mkdirIfNotExists, titlefyString, verifyExists } from "./files";
import { ProcessResult, run, setup } from "./work";

const col = C as Collections;
const inputBaseDirectory = path.resolve(col.inputDirectory);
const outputBaseDirectory = path.resolve(col.outputDirectory);
const skipFileExtensions = col.skipFileExtensions?.map(s => s.toLowerCase()) ?? [];
const skipTagList = col.skipTags?.map(s => s.toLowerCase()) ?? [];
const skipTitlePrefixList = col.skipTitles?.map(s => titlefyString(s)) ?? [];
verifyExists(inputBaseDirectory);
mkdirIfNotExists(outputBaseDirectory)

const args = process.argv.slice(2);
const processed = new Array<ProcessResult>();

for (const collection of col.collections) {
    console.log("Processing rom collection:", collection);
    const data = setup(inputBaseDirectory, outputBaseDirectory, skipFileExtensions, skipTagList, skipTitlePrefixList, collection);
    const res = run(data);
    processed.push(res);
}
