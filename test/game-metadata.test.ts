import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { queryGameGenreAndLocalMultiplayer } from "../src/metadata/game-metadata";
import { PlatformEnum } from "../src/types/platform-enum";

describe("game-metadata", () => {
    it("should prefer LaunchBox over IGDB when LaunchBox match exists", async () => {
        const xmlPath = path.join(os.tmpdir(), `launchbox-test-${Date.now()}.xml`);
        const xml = `<?xml version="1.0" standalone="yes"?>\n<LaunchBox>\n  <Game>\n    <Name>Some Game</Name>\n    <MaxPlayers>2</MaxPlayers>\n    <Cooperative>false</Cooperative>\n    <Platform>Nintendo Entertainment System</Platform>\n    <Genres>Action</Genres>\n  </Game>\n</LaunchBox>\n`;
        await fs.writeFile(xmlPath, xml, "utf8");

        const platform = PlatformEnum.NES;
        const res = await queryGameGenreAndLocalMultiplayer("Some Game", platform, {
            launchbox: {xmlPath: xmlPath, enabled: true},
            igdb: {enabled: false}
        });

        expect(res.source).toBe("launchbox");
        expect(res.genres).toEqual(["Action"]);
        expect(res.localMultiplayer).toBeTruthy();
        expect(res.localMultiplayer.coop).toBeFalse();
        expect(res.localMultiplayer.vs).toBeTrue();
    });
});
