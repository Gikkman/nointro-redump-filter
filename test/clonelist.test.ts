import { loadClonelist } from "../src/util"

const clonelistName = "Nintendo - Game Boy Advance.json"
describe("Test clonelists", () => {
    it("can load clonelist", () => {
        const clonelist = loadClonelist(clonelistName);
        expect(typeof clonelist).toBe("object");
    })
    it("has renames property", () => {
        const clonelist = loadClonelist(clonelistName);
        expect(typeof clonelist.renames).toBe("object");
        expect(Object.entries(clonelist.renames).length).toBeGreaterThan(0);
    })
    it("has removes property", () => {
        const clonelist = loadClonelist(clonelistName);
        expect(typeof clonelist.removes).toBe("object");
        expect(Object.entries(clonelist.removes).length).toBeGreaterThan(0);
    })
})