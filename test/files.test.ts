import path from "path"
import { extractDiscInfo, extractRegionInfo, extractTags, groupGamesByTitle, listFilesFlat, clearsTagRequirements, clearsTitlePrefixRequirements, sortBadTagedFilesLast, extractTitle } from "../src/files";

function toGameFile(...str: string[]): FileInfo[] {
    const g = str.map(g => ({file:g, dir: ""}))
                 .map(g => ({...extractTags(g),...g}))
                 .map(g => ({...extractRegionInfo(g), ...g}))
                 .map(g => ({ gameTitle: extractTitle(g, g), ...g}))
    return g;
}

function groupByTitle(...str: string[]): TitleGroup[] {
    const g = toGameFile(...str);
    return groupGamesByTitle(g);
}

describe("Test listFilesFlat", () => {
    it("can handle nested directories", () => {
        const testInputPath = path.join(__dirname, "test-input");
        const testInputFileList = listFilesFlat(new Set(), testInputPath);
        expect(testInputFileList.length).toBe(9)
    });
    it("can handle flat directories", () => {
        const testInputPath = path.join(__dirname, "test-input", "inner-2");
        const testInputFileList = listFilesFlat(new Set(),testInputPath);
        expect(testInputFileList.length).toBe(2)
    });
    it("can give empty list on missing directory", () => {
        const testInputPath = path.join(__dirname, "test-input", "inner-3");
        const testInputFileList = listFilesFlat(new Set(),testInputPath);
        expect(testInputFileList.length).toBe(0)
    });
    it("skips file extensions as requested", () => {
        const testInputPath = path.join(__dirname, "test-input", "inner-1");
        const testInputFileList = listFilesFlat(new Set(["rar", "tar"]),testInputPath);
        expect(testInputFileList.length).toBe(3)
    })
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
    it("can handle (1M, 2M) version tags", () => {
        const files = toGameFile(
            "Sakura Taisen (Japan) (Disc 1) (7M, 9M).7z"
        )
        const file = files[0];
        expect(file.regions.size).toBe(1); 
        expect(file.regions).toContain("Japan");
        expect(file.languages.size).toBe(1);
        expect(file.languages).toContain("Ja");
        expect(file.isTranslated).toBeFalse();
    });
    it("can handle one-character regions", () => {
        const file = toGameFile("Advanced Dungeons & Dragons - Dragons of Flame (J) [T+Eng1.03_DvD_Trans].nes")[0];
        expect(file.regions.size).toBe(1);
        expect(file.regions).toContain("Japan");
        expect(file.languages.size).toBe(1);
        expect(file.languages).toContain("En")
        expect(file.isTranslated).toBeTrue()
    });
    it("uses fallback language when none is known", () => {
        const file = toGameFile("Airball (Unknown) (Proto 1).zip")[0];
        expect(file.regions.size).toBe(1);
        expect(file.regions).toContain("Unknown");
        expect(file.languages.size).toBe(1);
        expect(file.languages).toContain("??")
        expect(file.isTranslated).toBeFalse()
    })
})

describe("Test extractTitle", () => {
    it("can handle tags", () => {
        const file = toGameFile("Advanced Dungeons & Dragons - Dragons of Flame (J) [T+Eng1.03_DvD_Trans].nes")[0];
        const title = extractTitle(file, file);
        expect(title).toBe("Advanced Dungeons & Dragons - Dragons of Flame") 
    });
    it("can handle no tags", () => {
        const file = toGameFile("Advanced Dungeons & Dragons - Dragons of Flame.nes")[0];
        const title = extractTitle(file, file);
        expect(title).toBe("Advanced Dungeons & Dragons - Dragons of Flame")
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
        const files: FileInfo[] = []
        const output = groupGamesByTitle(files);
        expect(output.length).toBe(0);
    })
})

describe("Test sortBadTagedFilesLast", () => {
    it("does nothing if none has bad tag", () => {
        const files = [
            "Final Fantasy (USA).zip",
            "Final Fantasy (USA) (Rev A).zip",
            "Final Fantasy (USA) (Rev B).zip",
        ]
        const game = groupByTitle(...files)[0];
        sortBadTagedFilesLast(game, ["Beta"])
        expect(game.files[0].file).toBe("Final Fantasy (USA).zip")
        expect(game.files[1].file).toBe("Final Fantasy (USA) (Rev A).zip")
        expect(game.files[2].file).toBe("Final Fantasy (USA) (Rev B).zip")
    })
    it("sorts bad tags last", () => {
        const files = [
            "Final Fantasy (USA) (Beta).zip",
            "Final Fantasy (USA) (Rev A).zip",
            "Final Fantasy (USA) (Rev A) (Beta).zip",
            "Final Fantasy (USA) (Rev B).zip",
        ]
        const game = groupByTitle(...files)[0];
        sortBadTagedFilesLast(game, ["Beta"])
        expect(game.files[0].file).toBe("Final Fantasy (USA) (Rev A).zip")
        expect(game.files[1].file).toBe("Final Fantasy (USA) (Rev B).zip")
        expect(game.files[2].file).toBe("Final Fantasy (USA) (Beta).zip")
        expect(game.files[3].file).toBe("Final Fantasy (USA) (Rev A) (Beta).zip")
    });
    it("does nothing if everything has bad tags", () => {
        const files = [
            "Final Fantasy (USA).zip",
            "Final Fantasy (USA) (Rev A).zip",
            "Final Fantasy (USA) (Rev B).zip",
        ]
        const game = groupByTitle(...files)[0];
        sortBadTagedFilesLast(game, ["USA"])
        expect(game.files[0].file).toBe("Final Fantasy (USA).zip")
        expect(game.files[1].file).toBe("Final Fantasy (USA) (Rev A).zip")
        expect(game.files[2].file).toBe("Final Fantasy (USA) (Rev B).zip")
    })
})

describe("Test extractDiscInfo", () => {
    it("can handle single-disc games", () => {
        const games = groupByTitle(
            "Final Fantasy Tactics (USA).zip",
            "Final Fantasy VII (USA) (Disc 1).zip",
            "Final Fantasy VII (USA) (Disc 2).zip",
        ).map(extractDiscInfo);
        expect(games.length).toBe(2);

        const game1 = games[0];
        expect(game1.title).toBe("Final Fantasy Tactics");
        expect(game1.versions.length).toBe(1);
        expect((game1.versions[0] as GameSingleFile).isMultiFile).toBeFalse()
        expect((game1.versions[0] as GameSingleFile).file).toBe("Final Fantasy Tactics (USA).zip")
        
        const game2 = games[1];
        expect(game2.title).toBe("Final Fantasy VII");
        expect(game2.versions.length).toBe(1);
        expect((game2.versions[0] as GameMultiFile).isMultiFile).toBeTrue()
        expect((game2.versions[0] as GameMultiFile).files[0].file).toBe("Final Fantasy VII (USA) (Disc 1).zip")
        expect((game2.versions[0] as GameMultiFile).files[1].file).toBe("Final Fantasy VII (USA) (Disc 2).zip")
    })
    it("can handle multiple discs with no disc tags", () => {
        const games = groupByTitle(
            "Final Fantasy VII (USA) (Disc 1).zip",
            "Final Fantasy VII (USA) (Disc 2).zip",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.title).toBe("Final Fantasy VII");
        expect(game.versions.length).toBe(1);
        
        const version = game.versions[0];
        if(version.isMultiFile) {
            expect(version.files.length).toBe(2);
            expect(version.tags.size).toBe(1);
            expect(version.tags.has("USA")).toBeTrue();
            expect(version.files[0].index).toBe("1");
            expect(version.files[0].file).toBe("Final Fantasy VII (USA) (Disc 1).zip");
            expect(version.files[1].index).toBe("2");
            expect(version.files[1].file).toBe("Final Fantasy VII (USA) (Disc 2).zip");
        }
        else {
            fail("Version was not multi-file")
        }
    })
    it("can handle one game with mutliple discs and with different disc tags", () => {
        const games = groupByTitle(
            "Final Fantasy VII (USA) (Disc 1) (Rev A).zip",
            "Final Fantasy VII (USA) (Disc 2) (Rev A).zip",
            "Final Fantasy VII (USA) (Disc 1) (Rev B).zip",
            "Final Fantasy VII (USA) (Disc 2) (Rev B).zip",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.title).toBe("Final Fantasy VII");
        expect(game.versions.length).toBe(2);
        
        const versionA = game.versions[0]
        const versionB = game.versions[1]
        if(versionA.isMultiFile && versionB.isMultiFile) {
            expect(versionA.files.length).toBe(2);
            expect(versionA.tags.size).toBe(2)
            expect(versionA.tags.has("Rev A")).toBeTrue();
            expect(versionA.tags.has("USA")).toBeTrue();
            expect(versionA.files[0].index).toBe("1");
            expect(versionA.files[0].file).toBe("Final Fantasy VII (USA) (Disc 1) (Rev A).zip");
            expect(versionA.files[1].index).toBe("2");
            expect(versionA.files[1].file).toBe("Final Fantasy VII (USA) (Disc 2) (Rev A).zip");
            
            expect(versionB.files.length).toBe(2);
            expect(versionB.tags.size).toBe(2)
            expect(versionB.tags.has("Rev B")).toBeTrue()
            expect(versionB.tags.has("USA")).toBeTrue()
            expect(versionB.files[0].index).toBe("1");
            expect(versionB.files[0].file).toBe("Final Fantasy VII (USA) (Disc 1) (Rev B).zip");
            expect(versionB.files[1].index).toBe("2");
            expect(versionB.files[1].file).toBe("Final Fantasy VII (USA) (Disc 2) (Rev B).zip");
        } 
        else {
            fail("A game was not multi-file")
        }
    })
    it("can handle 'Minakata Hakudou Toujou' for Saturn", () => {
        const games = groupByTitle(
            "Minakata Hakudou Toujou (Japan) (Disc 1) (2M).7z",
            "Minakata Hakudou Toujou (Japan) (Disc 2).zip",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.title).toBe("Minakata Hakudou Toujou");
        expect(game.versions.length).toBe(1);
        
        const version = game.versions[0];
        if(version.isMultiFile) {
            expect(version.files.length).toBe(2);
            expect(version.tags.size).toBe(1);
            expect(version.tags.has("Japan")).toBeTrue();
            expect(version.files[0].index).toBe("1");
            expect(version.files[0].file).toBe("Minakata Hakudou Toujou (Japan) (Disc 1) (2M).7z");
            expect(version.files[1].index).toBe("2");
            expect(version.files[1].file).toBe("Minakata Hakudou Toujou (Japan) (Disc 2).zip");
        }
        else {
            fail("Version was not multi-file")
        }
    })
    it("can handle 'Nanatsu no Hikan' for Saturn", () => {
        const games = groupByTitle(
            "Nanatsu no Hikan (Japan) (Disc 1) (1M).7z",
            "Nanatsu no Hikan (Japan) (Disc 1) (2M).7z",
            "Nanatsu no Hikan (Japan) (Disc 2) (2M).7z",
            "Nanatsu no Hikan (Japan) (Disc 3) (1M, 2M).7z",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.title).toBe("Nanatsu no Hikan");
        expect(game.versions.length).toBe(1);
        
        const version = game.versions[0]
        if(version.isMultiFile) {
            expect(version.files.length).toBe(3);
            expect(version.tags.size).toBe(2);
            expect(version.tags.has("Japan")).toBeTrue();
            expect(version.tags.has("2M")).toBeTrue();
            expect(version.files[0].index).toBe("1");
            expect(version.files[0].file).toBe("Nanatsu no Hikan (Japan) (Disc 1) (2M).7z");
            expect(version.files[1].index).toBe("2");
            expect(version.files[1].file).toBe("Nanatsu no Hikan (Japan) (Disc 2) (2M).7z");
            expect(version.files[2].index).toBe("3");
            expect(version.files[2].file).toBe("Nanatsu no Hikan (Japan) (Disc 3) (1M, 2M).7z");
        } 
        else {
            fail("Version was not multi-file")
        }
    })
    it("can handle 'Sentimental Graffiti' for Saturn", () => {
        const games = groupByTitle(
            "Sentimental Graffiti (Japan) (Disc 1) (Game Disc) (1M).7z",
            "Sentimental Graffiti (Japan) (Disc 1) (Game Disc) (2M).7z",
            "Sentimental Graffiti (Japan) (Disc 1) (Game Disc) (4M).7z",
            "Sentimental Graffiti (Japan) (Disc 1) (Game Disc) (5M).7z",
            "Sentimental Graffiti (Japan) (Disc 2) (Second Window) (1M, 2M).7z",
            "Sentimental Graffiti (Japan) (Disc 2) (Second Window) (4M).7z",
            "Sentimental Graffiti (Japan) (Disc 2) (Second Window) (5M).7z",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.title).toBe("Sentimental Graffiti");
        expect(game.versions.length).toBe(1);
        
        const version = game.versions[0]
        if(version.isMultiFile) {
            expect(version.files.length).toBe(2);
            expect(version.tags.size).toBe(2);
            expect(version.tags.has("Japan")).toBeTrue();
            expect(version.tags.has("1M")).toBeTrue();
            expect(version.files[0].index).toBe("1");
            expect(version.files[0].file).toBe("Sentimental Graffiti (Japan) (Disc 1) (Game Disc) (1M).7z");
            expect(version.files[1].index).toBe("2");
            expect(version.files[1].file).toBe("Sentimental Graffiti (Japan) (Disc 2) (Second Window) (1M, 2M).7z");
        } 
        else {
            fail("Version was not multi-file")
        }
    })
    it("can handle 'Ace Combat 3 - Electrosphere' for PS1", () => {
        const games = groupByTitle(
            "Ace Combat 3 - Electrosphere (USA).zip",
            "Ace Combat 3 - Electrosphere (Europe).zip",
            "Ace Combat 3 - Electrosphere (Japan) (Disc 1).zip",
            "Ace Combat 3 - Electrosphere (Japan) (Disc 2).zip",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.versions.length).toBe(3)

        const usVersion = game.versions.find(g => g.regions.has("USA"))
        expect(usVersion?.isMultiFile).toBeFalse()

        const euVersion = game.versions.find(g => g.regions.has("Europe"))
        expect(euVersion?.isMultiFile).toBeFalse();

        const jpVersion = game.versions.find(g => g.regions.has("Japan"))
        expect(jpVersion?.isMultiFile).toBeTrue()
    })
    it("can handle 'Street Fighter Collection' and its many regions", () => {
        const games = groupByTitle(
            "Street Fighter Collection (Europe) (Disc 1).7z",
            "Street Fighter Collection (Europe) (Disc 2).7z",
            "Street Fighter Collection (Japan) (Disc 1).7z",
            "Street Fighter Collection (Japan) (Disc 2).7z",
            "Street Fighter Collection (USA) (Disc 1).7z",
            "Street Fighter Collection (USA) (Disc 2).7z",
        ).map(extractDiscInfo);
        expect(games.length).toBe(1);
        
        const game = games[0];
        expect(game.versions.length).toBe(3);
        expect(game.title).toBe("Street Fighter Collection")
        for(const version of game.versions) {
            if(version.isMultiFile) {
                expect(version.regions).toEqual(version.tags)
            } else {
                fail(`Version ${version.file} was not multi-file`)
            }
        }
    })
})

describe("Test skipTags", () => {
    it("skips games with banned tags", () => {
        const skips = new Set<string>(["demo", "r1"])
        expect( clearsTagRequirements(skips, toGameFile("Virtua Fighter 2 (Japan) (Demo).7z")[0]) ).toBeFalse();
        expect( clearsTagRequirements(skips, toGameFile("Code R (Japan) (R1).7z")[0]) ).toBeFalse();
        expect( clearsTagRequirements(skips, toGameFile("16t (Japan) (SegaNet).zip")[0]) ).toBeTrue();
    })

    it("keeps games without banned tags", () => {
        const skips = new Set<string>(["demo", "r1"])
        const games = toGameFile(
            "Virtua Fighter 2 (Japan) (Demo).7z",
            "Code R (Japan) (R1).7z",
            "Vatlva (Japan) (R2).7z",
        )
        const filtered = games.filter(g => clearsTagRequirements(skips, g))        
        expect(filtered.length).toBe(1);
        expect(filtered.map(g => g.file)).toContain("Vatlva (Japan) (R2).7z")
    })
})

describe("Test skipTitlePrefix", () => {
    it("skips games with banned prefix", () => {
        const skips = new Set<string>(["virtua", "code"])
        const games = groupByTitle(
            "Virtua Fighter 2 (Japan) (Demo).7z",
            "Code R (Japan) (R1).7z",
            "Vatlva (Japan) (R2).7z",
        ).map(extractDiscInfo)
        expect( clearsTitlePrefixRequirements(skips, games[0]) ).toBeFalse();
        expect( clearsTitlePrefixRequirements(skips, games[1]) ).toBeFalse();
        expect( clearsTitlePrefixRequirements(skips, games[2]) ).toBeTrue();
    })

    it("keeps games without banned prefix", () => {
        const skips = new Set<string>(["vi", "co"])
        const games = groupByTitle(
            "Virtua Fighter 2 (Japan) (Demo).7z",
            "Code R (Japan) (R1).7z",
            "Vatlva (Japan) (R2).7z",
        ).map(extractDiscInfo)
        const filtered = games.filter(g => clearsTitlePrefixRequirements(skips, g))        
        expect(filtered.length).toBe(1);
        expect(filtered.map(g => g.title)).toContain("Vatlva")
    })
})