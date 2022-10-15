import { existsSync, readFileSync, readSync, rmSync } from "fs";
import path from "path";
import { mkdirIfNotExists } from "../src/files";
import { BestWriteData, moveGames } from "../src/move";
import { run } from "../src/work";

describe("Test disc-based", function() {
    const outputDir = path.join(__dirname, "system-test-created");
    const inputDir = path.join(__dirname, "system-test-input", "disc-based");

    // Pre conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. Can't run tests for 'createDirIfNotExists'. Dir already exists: " + outputDir)
    }

    it("Can handle disc based games", async () => {
        mkdirIfNotExists(outputDir);
        
        // Run everything
        const cr: CollectionRules = {
            englishTitleToForeignTitles: new Map(),
            foreignTitleToEnglishTitle: new Map(),
            removeTitles: []
        }
        const res = run({
            generateMultiDiscFile: "BizhawkXML",
            inputAbsolutePaths: [inputDir],
            outputAbsoultePath: outputDir,
            platform: "PS1",
            unzip: "sub-folder",
            skipFileTags: new Set(),
            skipFileExtensions: new Set(),
            skipTitlePrefixes: new Set(),
            collectionRules: cr
        })
        await moveGames(res)

        // Do checks
        const readPath = path.join(outputDir, "best.json")
        const data = readFileSync( readPath, 'utf8')
        const writeData: BestWriteData[] = JSON.parse(data);
        expect(writeData.length).toBe(3);

        // Clean up
        rmSync(outputDir, {recursive: true, force: true})
    })

    // Post conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. A test did not clean up dir: " + outputDir)
    }
})