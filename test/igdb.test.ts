import { normalizeLocalMultiplayer } from "../src/metadata/igdb/igdb";

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
});
