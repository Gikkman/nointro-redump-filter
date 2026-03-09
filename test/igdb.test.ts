import { normalizeLocalMultiplayer, pickBestByName, scoreGame } from "../src/metadata/igdb/igdb";
import { distance } from "fastest-levenshtein";

describe("igdb", () => {
    describe("normalizeLocalMultiplayer", () => {
        it("should detect local coop from offlinecoop", () => {
            const res = normalizeLocalMultiplayer([
                {
                    offlinecoop: true,
                    offlinecoopmax: 2,
                    offlinemax: 2,
                },
            ]);
            expect(res.supportsLocalMultiplayer).toBeTrue();
            expect(res.localCoop).toBeTrue();
        });

        it("should detect local vs from offlinemax when coop is false", () => {
            const res = normalizeLocalMultiplayer([
                {
                    offlinemax: 2,
                },
            ]);
            expect(res.supportsLocalMultiplayer).toBeTrue();
            expect(res.localVs).toBeTrue();
            expect(res.localCoop).toBeFalse();
        });

        it("should be false when no modes", () => {
            const res = normalizeLocalMultiplayer(undefined);
            expect(res.supportsLocalMultiplayer).toBeFalse();
            expect(res.localCoop).toBeFalse();
            expect(res.localVs).toBeFalse();
        });
    });

    describe("name scoring helpers", () => {
        it("scoreGame should prefer alternative name if it's closer", () => {
            const base = { name: "Foo", alternative_names: [{ name: "Bar" }] };
            const q = "Bar";
            const scoreBase = scoreGame(q, base);
            const direct = distance(q.toLowerCase(), base.name.toLowerCase());
            const alt = distance(q.toLowerCase(), base.alternative_names![0].name!.toLowerCase());
            expect(scoreBase).toBe(alt);
            expect(alt).toBeLessThan(direct);
        });

        it("pickBestByName should return the game with the closest name or alt", () => {
            const games = [
                { name: "Game One", alternative_names: [{ name: "Uno Game" }] },
                { name: "Other Game" },
            ];
            const picked = pickBestByName("Uno Game", games);
            expect(picked).toBe(games[0]);
        });

        it("pickBestByName returns undefined for empty query or list", () => {
            expect(pickBestByName("", [{ name: "anything" }])).toBeUndefined();
            expect(pickBestByName("something", [])).toBeUndefined();
        });
    });
});
