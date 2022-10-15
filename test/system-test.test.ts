import { existsSync, readFileSync, readSync, rmSync } from "fs";
import path from "path";
import { mkdirIfNotExists } from "../src/files";
import { BestWriteData, moveGames } from "../src/move";
import { run } from "../src/work";
import { XMLParser } from 'fast-xml-parser'

function getGameByTitle(title: string, data: BestWriteData[]): BestWriteData | undefined {
    for(const d of data) {
        if(d.title == title || d.aliases?.includes(title))
        return d;
    }
    return undefined;
}

function assertFileExists(dirPath: string[], ...files: string[]): boolean {
    return existsSync( path.join(__dirname, "system-test-created", ...dirPath, ...files) )
}

function parseXml(file: string) {
    const parser = new XMLParser({ignoreAttributes: false, parseAttributeValue: true});
    const data = readFileSync(path.join(__dirname, "system-test-created", file), 'utf8')
    const xml = parser.parse(data);

    const name = xml["BizHawk-XMLGame"]["@_Name"] as string;
    const system = xml["BizHawk-XMLGame"]["@_System"] as string;
    const files = Array.isArray(xml["BizHawk-XMLGame"].LoadAssets.Asset) 
                ? xml["BizHawk-XMLGame"].LoadAssets.Asset.map((e: any) => e['@_FileName'])
                : [ xml["BizHawk-XMLGame"].LoadAssets.Asset['@_FileName'] ]
    return {
        name, system, files: files as string[]
    }
}

describe("Test disc-based", function() {
    const outputDir = path.join(__dirname, "system-test-created");
    const inputDir = path.join(__dirname, "system-test-input", "disc-based");

    // Pre conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. Can't run tests. Dir already exists: " + outputDir)
    }

    it("Can handle disc based games", async () => {
        mkdirIfNotExists(outputDir, false);
        
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
        const writeData: BestWriteData[] = JSON.parse( readFileSync( path.join(outputDir, "best.json"), 'utf8') );
        expect(writeData.length).toBe(3);

        assertFileExists(["game-a (USA) (Disc 1) (Rev A)"], "game-a (USA) (Disc 1) (Rev A).cue", "game-a (USA) (Disc 1) (Rev A).bin")
        assertFileExists(["game-a (USA) (Disc 2)"], "game-a (USA) (Disc 2).cue", "game-a (USA) (Disc 2).bin")
        const gameA = getGameByTitle("game-a", writeData);
        expect(gameA).toBeTruthy()
        expect(gameA?.languages).toContain("En")
        expect(gameA?.languages.length).toBe(1)
        expect(gameA?.title).toBe("game-a")
        expect(gameA?.files).toContain("game-a.xml")
        const xmlA = parseXml("game-a.xml")
        expect(xmlA.name).toBe("game-a")
        expect(xmlA.system).toBe("PSX")
        expect(xmlA.files).toContain(path.join("game-a (USA) (Disc 1) (Rev A)", "game-a (USA) (Disc 1) (Rev A).cue"))
        expect(xmlA.files).toContain(path.join("game-a (USA) (Disc 2)", "game-a (USA) (Disc 2).cue"))
        expect(xmlA.files.length).toBe(2)

        assertFileExists(["game-b (USA)"], "game-b (USA).bin", "game-b (USA).cue")
        const gameB = getGameByTitle("game-b", writeData);
        expect(gameB).toBeTruthy()
        expect(gameB?.languages).toContain("En")
        expect(gameB?.languages.length).toBe(1)
        expect(gameB?.title).toBe("game-b")
        expect(gameB?.files).toContain("game-b.xml")
        const xmlB = parseXml("game-b.xml")
        expect(xmlB.name).toBe("game-b")
        expect(xmlB.system).toBe("PSX")
        expect(xmlB.files).toContain(path.join("game-b (USA)", "game-b (USA).cue"))
        expect(xmlB.files.length).toBe(1)

        assertFileExists(["game-s"], "game-s.bin", "game-s.cue")
        const gameS = getGameByTitle("game-s", writeData);
        expect(gameS).toBeTruthy()
        expect(gameS?.languages).toContain("En")
        expect(gameS?.languages.length).toBe(1)
        expect(gameS?.title).toBe("game-s")
        expect(gameS?.files).toContain("game-s.xml")
        const xmlS = parseXml("game-s.xml")
        expect(xmlS.name).toBe("game-s")
        expect(xmlS.system).toBe("PSX")
        expect(xmlS.files).toContain(path.join("game-s", "game-s.cue"))
        expect(xmlS.files.length).toBe(1)

        // Clean up
        rmSync(outputDir, {recursive: true, force: true})
    })

    // Post conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. A test did not clean up dir: " + outputDir)
    }
})

describe("Test cart-based", function() {
    const outputDir = path.join(__dirname, "system-test-created");
    const inputDir = path.join(__dirname, "system-test-input", "cart-based");

    // Pre conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. Can't run tests. Dir already exists: " + outputDir)
    }

    it("Can handle cart based games", async () => {
        mkdirIfNotExists(outputDir, false);
        
        // Run everything
        const cr: CollectionRules = {
            englishTitleToForeignTitles: new Map(), // Should map game-b to game-bb
            foreignTitleToEnglishTitle: new Map(),  // Should map game-bb to game-b
            removeTitles: []
        }
        const res = run({
            generateMultiDiscFile: undefined,
            inputAbsolutePaths: [inputDir],
            outputAbsoultePath: outputDir,
            platform: "NES",
            unzip: undefined,
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
        expect(writeData.length).toBe(3);   // Should be 4

        // Clean up
        rmSync(outputDir, {recursive: true, force: true})
    })

    // Post conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. A test did not clean up dir: " + outputDir)
    }
})