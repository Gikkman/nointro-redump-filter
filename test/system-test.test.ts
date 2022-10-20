import { existsSync, readFileSync, readSync, rmSync } from "fs";
import path, { join } from "path";
import { mkdirIfNotExists } from "../src/files";
import { BestWriteData, moveGames } from "../src/move";
import { run, setup } from "../src/work";
import { XMLParser } from 'fast-xml-parser'
import { titlefyString } from "../src/util";

describe("Test disc-based", function() {
    const outputDir = path.join(__dirname, "system-test-created");
    const inputDir = path.join(__dirname, "system-test-input");

    // Pre conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. Can't run tests. Dir already exists: " + outputDir)
    }

    it("Can handle disc based games", async () => {        
        // Run everything
        const collection: Collection = {
            input: ["disc-based"],
            output: ".",
            platform: "Playstation",
            generateMultiDiscFile: "BizhawkXML",
            unzip: "sub-folder",
        }
        const collectionRules: CollectionRules = {
            englishTitleToForeignTitles: new Map(),
            foreignTitleToEnglishTitle: new Map(),
            removeTitles: []
        }
        const data = setup({
            inputBaseDirectory: inputDir,
            outputBaseDirectory: outputDir,
            skipFileExtensions: ["rar"],
            skipFileTags: [],
            skipTitlePrefixes: [],
            collection,
            collectionRules,
        })
        const res = run(data)
        await moveGames(res)

        // Do checks 
        const writeData: BestWriteData[] = JSON.parse( readFileSync( path.join(outputDir, "best.json"), 'utf8') );
        expect(writeData.length).toBe(3);

        assertDiscGame(writeData, {
            title: "game-a",
            system: "PSX",
            languages: ["En"],
            filesInXml: [
                path.join("game-a (USA) (Disc 1) (Rev A)", "game-a (USA) (Disc 1) (Rev A).cue"),
                path.join("game-a (USA) (Disc 2)", "game-a (USA) (Disc 2).cue")
            ]
        })

        assertDiscGame(writeData, {
            title: "game-b",
            system: "PSX",
            languages: ["En"],
            filesInXml: [
                path.join("game-b (USA)", "game-b (USA).cue")
            ]
        })

        assertDiscGame(writeData, {
            title: "game-s",
            system: "PSX",
            languages: ["En"],
            filesInXml: [
                path.join("game-s", "game-s.cue")
            ]
        })

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
    const inputDir = path.join(__dirname, "system-test-input");

    // Pre conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. Can't run tests. Dir already exists: " + outputDir)
    }

    it("Can handle cart based games", async () => {        
        // Run everything
        const collection: Collection = {
            input: ["cart-based-1", "cart-based-2"],
            output: ".",
            platform: "Nintendo Entertainment System",
        }
        const collectionRules: CollectionRules = {
            englishTitleToForeignTitles: new Map([
                ['game-dd', ['game-d', 'game-ddd']]
            ]),
            foreignTitleToEnglishTitle: new Map([
                ['game-d', 'game-dd'],
                ['game-ddd', 'game-dd']
            ]),
            removeTitles: ['game-remove-me'],
        }
        const data = setup({
            inputBaseDirectory: inputDir,
            outputBaseDirectory: outputDir,
            skipFileExtensions: [],
            skipFileTags: [],
            skipTitlePrefixes: [],
            collection,
            collectionRules,
        })
        const res = run(data)
        await moveGames(res)

        // Do checks
        const writeData: BestWriteData[] = JSON.parse( readFileSync( path.join(outputDir, "best.json"), 'utf8') );
        expect(writeData.length).toBe(5);

        assertCartGame(writeData, {
            title: "game-a",
            languages: ["En", "Es", "De"],
            fileRelativePath: "game-a (Europe) (En, Es, De).nes",
        })

        assertCartGame(writeData, {
            title: "game-b",
            languages: ["En"],
            fileRelativePath: "game-b.nes",
        })

        assertCartGame(writeData, {
            title: "game-c",
            languages: ["En"],
            fileRelativePath: "game-c (Japan) [T-En ABC 123].nes",
        })

        assertCartGame(writeData, {
            title: "game-dd",
            languages: ["En"],
            fileRelativePath: "game-dd (USA).nes",
            aliases: ["game-d", "game-ddd"]
        })

        assertCartGame(writeData, {
            title: "game-s",
            languages: ["En"],
            fileRelativePath: join("special", "game-s (USA).nes"),
        })
        

        // Clean up
        rmSync(outputDir, {recursive: true, force: true})
    })

    // Post conditions
    if(existsSync(outputDir)) {
        throw new Error("Error. A test did not clean up dir: " + outputDir)
    }
})

// *******************************************************************************************************
//  Util functions
// *******************************************************************************************************
function getGameByTitle(title: string, data: BestWriteData[]): BestWriteData | undefined {
    for(const d of data) {
        if(d.title == title || d.aliases?.includes(title))
        return d;
    }
    return undefined;
}

function fileExists(...segments: string[]): boolean {
    return existsSync( path.join(__dirname, "system-test-created", ...segments) )
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

type DiscGameAssert = {title: string, system: string, languages: string[], filesInXml: string[], }
function assertDiscGame(writeData: BestWriteData[], data: DiscGameAssert) {
    // Check we can find the game in WriteData
    const game = getGameByTitle(data.title, writeData);
    expect(game).withContext(`Game ${data.title} should be in WriteData`).toBeTruthy()
    
    // Check that the actual files got unzipped
    for(const file of data.filesInXml) {
        expect(fileExists(".", file)).toBeTrue()
    }

    // Check language data in WriteData
    expect(game?.languages.length).toEqual(data.languages.length)
    for(const lang of data.languages) {
        expect(game?.languages).toContain(lang)
    }

    // Check title in WriteData
    expect(game?.title).toBe(data.title)

    // Check game's xml file to match in WriteData
    expect(game?.files).toContain(`${data.title}.xml`)

    // Check that the xml file exists
    expect(fileExists(`${data.title}.xml`)).toBeTrue()
    
    // Read xml file
    const xml = parseXml(`${data.title}.xml`)
    expect(xml.name).toBe(data.title)
    expect(xml.system).toBe(data.system)
    expect(xml.files.length).toBe(data.filesInXml.length)
    for(const file of data.filesInXml) {
        expect(xml.files).toContain(file)
    }
}

type CartGameAssert = {title: string, languages: string[], fileRelativePath: string, aliases?: string[], }
function assertCartGame(writeData: BestWriteData[], data: CartGameAssert) {
    const game = getGameByTitle(data.title, writeData);
    expect(game).withContext(`Game ${data.title} should be in write data`).toBeTruthy();

    // Check file was moved
    expect(fileExists(data.fileRelativePath)).toBeTrue()
    for(const f of game?.files ?? []) {
        expect(fileExists(f)).toBeTrue()
    }

    // Check title match
    expect(game?.title).toEqual(data.title)
    
    // Check aliases match
    for(const alias of data.aliases ?? []) {
        expect(game?.aliases).toContain(alias)
    }
    expect(game?.aliases?.length).toEqual(data.aliases?.length)

    // Check languages
    expect(game?.languages.length).toEqual(data.languages.length)
    for(const lang of data.languages) {
        expect(game?.languages).toContain(lang)
    }
}