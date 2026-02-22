import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { queryLaunchBoxGenreAndLocalMultiplayer } from "../src/metadata/launchbox";

describe("launchbox", () => {
    it("should lookup genres + local multiplayer from a minimal Metadata.xml", async () => {
        const xmlPath = path.join(os.tmpdir(), `launchbox-test-${Date.now()}.xml`);
        const xml = `<?xml version="1.0" standalone="yes"?>\n<LaunchBox>\n  <Game>\n    <Name>3D Atlas</Name>\n    <MaxPlayers>1</MaxPlayers>\n    <Cooperative>false</Cooperative>\n    <Platform>3DO Interactive Multiplayer</Platform>\n    <Genres>Education</Genres>\n  </Game>\n  <Game>\n    <Name>Some Game</Name>\n    <MaxPlayers>2</MaxPlayers>\n    <Cooperative>true</Cooperative>\n    <Platform>Nintendo Entertainment System</Platform>\n    <Genres>Action, Adventure</Genres>\n  </Game>\n</LaunchBox>\n`;
        await fs.writeFile(xmlPath, xml, "utf8");

        const res = await queryLaunchBoxGenreAndLocalMultiplayer("Some Game", "Nintendo Entertainment System", { xmlPath });
        expect(res).toBeDefined();
        expect(res?.genres).toEqual(["Action", "Adventure"]);
        expect(res?.localMultiplayer.supportsLocalMultiplayer).toBeTrue();
        expect(res?.localMultiplayer.localCoop).toBeTrue();
    });
});
