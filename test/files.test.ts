import path from "path"
import { extractDiscInfo, extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat } from "../src/files";

function toGameFile(...str: string[]): GameInfo[] {
    const g = str.map(g => ({file:g, dir: ""}))
                 .map(g => ({...extractTags(g),...g}))
                 .map(g => ({...extractRegionInfo(g), ...g}));
    return g;
}

function groupByTitle(...str: string[]): TitleGroup[] {
    const g = toGameFile(...str);
    return groupGamesByTitle(g);
}

describe("Test listFilesFlat", () => {
    it("can handle nested directories", () => {
        const testInputPath = path.join(__dirname, "test-input");
        const testInputFileList = listFilesFlat(testInputPath);
        expect(testInputFileList.length).toBe(9)
    });
    it("can handle flat directories", () => {
        const testInputPath = path.join(__dirname, "test-input", "inner-2");
        const testInputFileList = listFilesFlat(testInputPath);
        expect(testInputFileList.length).toBe(2)
    });
    it("can give empty list on missing directory", () => {
        const testInputPath = path.join(__dirname, "test-input", "inner-3");
        const testInputFileList = listFilesFlat(testInputPath);
        expect(testInputFileList.length).toBe(0)
    });
})

describe("Test extractTags", () => {
    it("can handle single region", () => {
        const file = "Barbie - Ocean Discovery (USA).zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("USA");
        expect(output.tags.size).toBe(1);
        expect(output.tagsStartsAt).toBe( file.indexOf("(USA") );
    })
    it("can handle multiple regions", () => {
        const file = "Asteroids (USA,Europe).zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("Europe");
        expect(output.tags).toContain("USA");
        expect(output.tags.size).toBe(2);
        expect(output.tagsStartsAt).toBe( file.indexOf("(USA") );
    })
    it("can handle multiple regions with space in between", () => {
        const file = "Asteroids (USA, Europe).zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("Europe");
        expect(output.tags).toContain("USA");
        expect(output.tags.size).toBe(2);
        expect(output.tagsStartsAt).toBe( file.indexOf("(USA") );
    })
    it("can handle paranthesis before region", () => {
        const file = "6-in-1 (Micro Genius) (Asia).zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("Asia");
        expect(output.tags.size).toBe(1);
        expect(output.tagsStartsAt).toBe( file.indexOf("(Asia") );
    })
    it("can handle tags in trailing groups", () => {
        const file = "Animaniacs (The Series) (USA) (En,Es) (SGB Enhanced).zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("USA");
        expect(output.tags).toContain("SGB Enhanced");
        expect(output.tags).toContain("En");
        expect(output.tags).toContain("Es");
        expect(output.tags.size).toBe(4);
        expect(output.tagsStartsAt).toBe( file.indexOf("(USA") );
    })
    it("can handle tags in brackets", () => {
        const file = "King of Kings (Japan) [T-En by MrRichard999 v0.99b].zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("Japan");
        expect(output.tags).toContain("T-En by MrRichard999 v0.99b");
        expect(output.tags.size).toBe(2);
        expect(output.tagsStartsAt).toBe( file.indexOf("(Japan") );
    })
    it("can handle no region info", () => {
        const file = "Batman [T-En by Gikkman v1.01].zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("Unknown");
        expect(output.tags).toContain("T-En by Gikkman v1.01");
        expect(output.tags.size).toBe(2);
        expect(output.tagsStartsAt).toBe( file.indexOf("[T-En") );
    })
    it("can handle no tags at all", () => {
        const file = "Batman.zip";
        const input: GameFile = {file, dir: ""}
        const output = extractTags(input);
        expect(output.tags).toContain("Unknown");
        expect(output.tags.size).toBe(1);
        expect(output.tagsStartsAt).toBe( undefined );
    })
})

describe("Test extractRegionInfo", () => {
    it("can get language from just region (USA -> En)", () => {
        const arr = ["USA"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(1); 
        expect(region.regions).toContain("USA");
        expect(region.languages.size).toBe(1); 
        expect(region.languages).toContain("En");
        expect(region.isTranslated).toBeFalse();
    });
    it("can get language from just region (Spain -> Es)", () => {
        const arr = ["Spain"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(1); 
        expect(region.regions).toContain("Spain");
        expect(region.languages.size).toBe(1); 
        expect(region.languages).toContain("Es");
        expect(region.isTranslated).toBeFalse();
    });
    it("can handle the 'only Europe' case", () => {
        const arr = ["Europe"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(1); 
        expect(region.regions).toContain("Europe");
        expect(region.languages.size).toBe(1); 
        expect(region.languages).toContain("En");
        expect(region.isTranslated).toBeFalse();
    });
    it("can handle the 'Europe and language' case", () => {
        const arr = ["Europe", "Fr", "De"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(1); 
        expect(region.regions).toContain("Europe");
        expect(region.languages.size).toBe(2);
        expect(region.languages).toContain("De");
        expect(region.languages).toContain("Fr");
        expect(region.isTranslated).toBeFalse();
    });
    it("can handle multiple region", () => {
        const arr = ["Europe", "USA", "Brazil"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(3); 
        expect(region.regions).toContain("Europe");
        expect(region.regions).toContain("USA");
        expect(region.regions).toContain("Brazil");
        expect(region.languages.size).toBe(1);
        expect(region.languages).toContain("En");
        expect(region.isTranslated).toBeFalse();
    });
    it("can handle multiple region and multiple languages", () => {
        const arr = ["Japan", "USA", "En", "Ja"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(2); 
        expect(region.regions).toContain("Japan");
        expect(region.regions).toContain("USA");
        expect(region.languages.size).toBe(2);
        expect(region.languages).toContain("En");
        expect(region.languages).toContain("Ja");
        expect(region.isTranslated).toBeFalse();
    });
    it("can handle [T-XY] translation tags", () => {
        const arr = ["Japan", "T-En by Gikkman v1.0.1"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(1); 
        expect(region.regions).toContain("Japan");
        expect(region.languages.size).toBe(1);
        expect(region.languages).toContain("En");
        expect(region.isTranslated).toBeTrue();
    });
    it("can handle (Translated XY) translation tags", () => {
        const arr = ["Japan", "Translated En"];
        const tags = new Set(arr);
        const region = extractRegionInfo({tags});
        expect(region.regions.size).toBe(1); 
        expect(region.regions).toContain("Japan");
        expect(region.languages.size).toBe(1);
        expect(region.languages).toContain("En");
        expect(region.isTranslated).toBeTrue();
    });
})

describe("Test groupGamesByTitle", () => {
    it("can handle groupings", () => {
        const files = toGameFile(
            "Final Fantasy VII (USA) (Disc 1).zip",
            "Final Fantasy VII (USA) (Disc 2).zip",
            "Final Fantasy Tactics (Japan).zip",
        );
        const groups = groupGamesByTitle(files);
        expect(groups.length).toBe(2);
        expect(groups.map(f => f.title)).toContain("Final Fantasy VII")
        expect(groups.map(f => f.title)).toContain("Final Fantasy Tactics")
        expect(groups.find(v => v.title === 'Final Fantasy VII')?.files.length).toBe(2)
        expect(groups.find(v => v.title === 'Final Fantasy Tactics')?.files.length).toBe(1)
    })
    it("can handle files that forms no groups", () => {
        const files = toGameFile(
            "Final Fantasy VII (USA) (Disc 1).zip",
            "Final Fantasy VIII (USA) (Disc 2).zip",
            "Final Fantasy Tactics (Japan).zip",
        );
        const groups = groupGamesByTitle(files);
        expect(groups.length).toBe(3);
        expect(groups.map(f => f.title)).toContain("Final Fantasy VII")
        expect(groups.map(f => f.title)).toContain("Final Fantasy VIII")
        expect(groups.map(f => f.title)).toContain("Final Fantasy Tactics")
        expect(groups.find(v => v.title === 'Final Fantasy VII')?.files.length).toBe(1)
        expect(groups.find(v => v.title === 'Final Fantasy VIII')?.files.length).toBe(1)
        expect(groups.find(v => v.title === 'Final Fantasy Tactics')?.files.length).toBe(1)
    })
    it("can handle empty arrays", () => {
        const files: GameInfo[] = []
        const output = groupGamesByTitle(files);
        expect(output.length).toBe(0);
    })
})

describe("Test extractDiscInfo", () => {
    it("can handle single-disc games", () => {
        const output = groupByTitle(
            "Final Fantasy Tactics (USA).zip",
            "Final Fantasy VII (USA) (Disc 1).zip",
            "Final Fantasy VII (USA) (Disc 2).zip",
        ).map(extractDiscInfo);
        expect(output.length).toBe(2);
        
        const group1 = output[0];
        expect(group1.title).toBe("Final Fantasy Tactiscs");
        expect(group1.games.length).toBe(1);
        const gameFft = group1.games[1];
        expect(gameFft.isMultiDisc).toBeFalse();
        
        const group2 = output[0];
        expect(group2.title).toBe("Final Fantasy VII");
        expect(group2.games.length).toBe(1);
        const gameFf7 = group1.games[1];
        expect(gameFf7.isMultiDisc).toBeTrue();
    })
    it("can handle multiple discs with no disc tags", () => {
        const output = groupByTitle(
            "Final Fantasy VII (USA) (Disc 1).zip",
            "Final Fantasy VII (USA) (Disc 2).zip",
        ).map(extractDiscInfo);
        expect(output.length).toBe(1);
        
        const group = output[0];
        expect(group.title).toBe("Final Fantasy VII");
        expect(group.games.length).toBe(1);
        
        const game = group.games[0] as (GameInfo & DiscInfo);
        if(game.isMultiDisc) {
            expect(game.discs.length).toBe(2);
            expect(game.discs[0].discNumber).toBe("1");
            expect(game.discs[0].file).toBe("Final Fantasy VII (USA) (Disc 1).zip");
            expect(game.discs[0].discTags.size).toBe(0);
            expect(game.discs[1].discNumber).toBe("2");
            expect(game.discs[1].file).toBe("Final Fantasy VII (USA) (Disc 2).zip");
            expect(game.discs[1].discTags.size).toBe(0);
        } else {
            fail("Game was not multi-disc")
        }
    })
    it("can handle one game with mutliple discs and with different disc tags", () => {
        const output = groupByTitle(
            "Final Fantasy VII (USA) (Disc 1) (Rev A).zip",
            "Final Fantasy VII (USA) (Disc 2) (Rev A).zip",
            "Final Fantasy VII (USA) (Disc 1) (Rev B).zip",
            "Final Fantasy VII (USA) (Disc 2) (Rev B).zip",
        ).map(extractDiscInfo);
        expect(output.length).toBe(1);
        
        const group = output[0];
        expect(group.title).toBe("Final Fantasy VII");
        expect(group.games.length).toBe(2);
        
        const gameRevA = group.games[0];
        if(gameRevA.isMultiDisc) {
            expect(gameRevA.discs.length).toBe(2);
            expect(gameRevA.discs[0].discNumber).toBe("1");
            expect(gameRevA.discs[0].file).toBe("Final Fantasy VII (USA) (Disc 1) (Rev A).zip");
            expect(gameRevA.discs[0].discTags.size).toBe(1);
            expect(gameRevA.discs[0].discTags.has("Rev A")).toBeTrue();
            expect(gameRevA.discs[1].discNumber).toBe("2");
            expect(gameRevA.discs[1].file).toBe("Final Fantasy VII (USA) (Disc 2) (Rev A).zip");
            expect(gameRevA.discs[1].discTags.size).toBe(1);
            expect(gameRevA.discs[1].discTags.has("Rev A")).toBeTrue();
        } else
            fail("Game was not multi-disc")

        const gameRevB = group.games[1];
        if(gameRevB.isMultiDisc) {
            expect(gameRevB.discs.length).toBe(2);
            expect(gameRevB.discs[0].discNumber).toBe("1");
            expect(gameRevB.discs[0].file).toBe("Final Fantasy VII (USA) (Disc 1).zip");
            expect(gameRevB.discs[0].discTags.size).toBe(1);
            expect(gameRevB.discs[0].discTags.has("Rev B")).toBeTrue();
            expect(gameRevB.discs[1].discNumber).toBe("2");
            expect(gameRevB.discs[1].file).toBe("Final Fantasy VII (USA) (Disc 2).zip");
            expect(gameRevB.discs[1].discTags.size).toBe(1);
            expect(gameRevB.discs[1].discTags.has("Rev B")).toBeTrue();
        } else
            fail("Game was not multi-disc")
    })
})