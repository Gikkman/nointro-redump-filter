import { extractTags, extractRegionInfo, groupGamesByTitle, extractDiscInfo, extractTitle } from "../src/files";
import { filterCandidatesByProperty, findMostSuitableVersion, getLowestScore, filterAwayBadTagsIfPossible } from "../src/sorting"

type TestData = {title: string, languages: Set<string>, regions: Set<string>}
function mkData(...data: [string, string[], string[]][]): TestData[] {
    return data.map(e => {
        return {
            title: e[0],
            languages: new Set(e[1] ?? []),
            regions: new Set(e[2] ?? []),
        }
    })
}

function toGameWithVerions(...versions: string[]) {
    const g = versions.map(g => ({file:g, dir: ""}))
                 .map(g => ({...extractTags(g),...g}))
                 .map(g => ({...extractRegionInfo(g), ...g}))
                 .map(g => ({gameTitle: extractTitle(g,g), ...g}));
    const group = groupGamesByTitle(g);
    return extractDiscInfo(group[0]);
}

describe( "Test getLowestScore", () => {
    it("can handle empty map", () => {
        const scoreMap: Map<string, number> = new Map();
        const keys: Set<string> = new Set(["a", "b", "c"]);
        expect( () => getLowestScore(scoreMap, keys) ).toThrow()
    })
    it("can handle no keys", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 2], ["c", 3]]);
        const keys: Set<string> = new Set();
        expect( () => getLowestScore(scoreMap, keys) ).toThrow()
    })
    it("can handle handle missing mappings", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 2], ["c", 3]]);
        const keys: Set<string> = new Set(["x", "y", "z"]);
        expect( getLowestScore(scoreMap, keys) ).toBe(Number.MAX_SAFE_INTEGER)
    })
    it("can handle existing mappings correct", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 2], ["c", 3]]);
        const keys: Set<string> = new Set(["a", "b", "c"]);
        expect( getLowestScore(scoreMap, keys) ).toBe(1)    
    })
    it("can handle existing and missing mappings together correct", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 2], ["c", 3]]);
        const keys: Set<string> = new Set(["b", "c", "x", "y"]);
        expect( getLowestScore(scoreMap, keys) ).toBe(2)    
    })
})

describe("Test filterCandidatesByScore", () => {
    it("when nothing matches, should return all item in same order", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 2], ["c", 3]]);
        const gameVersions = mkData(
            ["X", ["En"], ["USA"]],         // Score HUGE
            ["Y", ["En"], ["World"]],       // Score HUGE
            ["Z", ["Jp"], ["Japan"]],       // Score HUGE
        )
        
        const filtered = filterCandidatesByProperty(scoreMap, gameVersions, (v) => v.languages);
        expect(filtered.length).toBe(3)
        expect(filtered[0].title ).toBe("X")
        expect(filtered[1].title ).toBe("Y")
        expect(filtered[2].title ).toBe("Z")
    })
    it("when one has best score, should return only that", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 2], ["c", 3]]);
        const gameVersions = mkData(
            ["X", ["c"], ["USA"]],          // Score 3
            ["Y", ["a"], ["World"]],        // Score 1
            ["Z", ["b"], ["Japan"]],        // Score 2
        )
        const filtered = filterCandidatesByProperty(scoreMap, gameVersions, (v) => v.languages);
        expect( filtered.length ).toBe(1)
        expect( filtered[0].title).toBe("Y")
    })
    it("when several has best score, should return all and retain order", () => {
        const scoreMap: Map<string, number> = new Map([["a", 1], ["b", 1], ["c", 2]]);
        const gameVersions = mkData(
            ["Q", ["b"], ["Japan"]],        // Score 1
            ["U", ["En"], ["World"]],       // Score HUGE
            ["V", ["Ja"], ["Japan"]],       // Score HUGE
            ["W", ["c"], ["Spain"]],        // Score 2
            ["Y", ["a"], ["World"]],        // Score 1
            ["X", ["c"], ["USA"]],          // Score 2
            ["Z", ["a"], ["Japan"]],        // Score 1
        )
        const filtered = filterCandidatesByProperty(scoreMap, gameVersions, (v) => v.languages);
        expect(filtered.length).toBe(3)
        expect(filtered[0].title).toBe("Q")
        expect(filtered[1].title).toBe("Y")
        expect(filtered[2].title).toBe("Z")
    })
})

describe("Test findMostSuitableVersion", () => {
    it("can handle game with Ja and En langs", () => {
        const game = toGameWithVerions(
            "Ghostbusters (Japan) (Beta).zip",
            "Ghostbusters (USA).zip"
        )
        const best = findMostSuitableVersion(game).bestVersion;
        expect(best.languages).toContain("En")
        expect(best.regions).toContain("USA")
    }),
    it("can handle game with Ja and En langs with EU game", () => {
        const game = toGameWithVerions(
            "Ghostbusters (Japan) (Beta).zip",
            "Ghostbusters (Europe).zip"
        )
        const best = findMostSuitableVersion(game).bestVersion;
        expect(best.languages).toContain("En")
        expect(best.regions).toContain("Europe")
    })
    it("prioratises En JP games over En EU games, but sort away [i] tags", () => {
        const game = toGameWithVerions(
            "Ghostbusters (Japan) [T-En] [i].zip",
            "Ghostbusters (Europe).zip"
        )
        const best = findMostSuitableVersion(game).bestVersion;
        expect(best.languages).toContain("En")
        expect(best.regions).toContain("Europe")
    })
    it("prioratises En JP games over En EU games", () => {
        const game = toGameWithVerions(
            "Ghostbusters (Japan) [T-En].zip",
            "Ghostbusters (Europe).zip"
        )
        const best = findMostSuitableVersion(game).bestVersion;
        expect(best.languages).toContain("En")
        expect(best.regions).toContain("Japan")
    })
})