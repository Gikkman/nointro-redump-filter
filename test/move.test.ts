import { copyFileSync, existsSync, fstat, readFileSync, rmSync } from "fs";
import path from "path";
import { mkdirIfNotExists } from "../src/files";
import { copyGameToOutputLocation, unzipGameToOutputLocation } from "../src/move";

describe("Test createDirIfNotExists", function() {
    const newDir = path.join(__dirname, "test-created");
    const LOGGING = false;
    
    // Pre conditions
    if(existsSync(newDir)) {
        throw new Error("Error. Can't run tests for 'createDirIfNotExists'. Dir already exists: " + newDir)
    }
    
    it("should create a directory if not exists", () => {
        try {
            expect(existsSync(newDir)).toBeFalse()
            mkdirIfNotExists(newDir, LOGGING);
            expect(existsSync(newDir)).toBeTrue()
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })
    it("should not create a dir, but not throw errors, if exists", () => {
        try {
            expect(existsSync(newDir)).toBeFalse()
            mkdirIfNotExists(newDir, LOGGING);
            expect(existsSync(newDir)).toBeTrue()
            mkdirIfNotExists(newDir, LOGGING);
            expect(existsSync(newDir)).toBeTrue()
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    // Post conditions
    if(existsSync(newDir)) {
        throw new Error("Error. A test did not clean up dir: " + newDir)
    }
});

describe("Test move file", () => {
    const LOGGING = false;
    const newDir = path.join(__dirname, "test-created");
    const inputDir = path.join(__dirname, "test-input");

    // Pre conditions
    if(existsSync(newDir)) {
        throw new Error("Error. Can't run tests for 'move fiel'. Dir doesn't exists: " + newDir)
    }
    
    it("should copy file if no file existed", async () => {
        try {
            mkdirIfNotExists(newDir, LOGGING);

            const input = [path.join(inputDir, "game-a.zip"), path.join(inputDir, "game-b.zip")];
            const expected = [path.join(newDir, "game-a.zip"), path.join(newDir, "game-b.zip")];
            const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: input };
            expect(await copyGameToOutputLocation(gwd, newDir)).toBeTrue();
            
            for(let i = 0; i < expected.length; i++) {
                expect(existsSync(expected[i])).withContext(`Expected ${input[i]} to be copied to ${newDir}`).toBeTrue()
            }
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    it("should noop if the files existed", async () => {
        const input = [path.join(inputDir, "game-a.zip"), path.join(inputDir, "game-b.zip")];
        const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: input };
        expect(await copyGameToOutputLocation(gwd, inputDir)).toBeFalse();
    })

    // Post conditions
    if(existsSync(newDir)) {
        throw new Error("Error. A test did not clean up dir: " + newDir)
    }
})

describe("Test unzip file", () => {
    const LOGGING = false;
    const zipFileContentGameA = "content-a";
    const zipFileContentGameB = "content-b";
    const newDir = path.join(__dirname, "test-created");
    const inputDir = path.join(__dirname, "test-input");

     // Pre conditions
     if(existsSync(newDir)) {
        throw new Error("Error. Can't run tests for 'move fiel'. Dir doesn't exists: " + newDir)
    }

    it("should unzip file if no file existed", async () => {
        try {
            mkdirIfNotExists(newDir, LOGGING);

            const input = [path.join(inputDir, "game-a.zip"), path.join(inputDir, "game-b.zip")];
            const expected = [path.join(newDir, "game-a.txt"), path.join(newDir, "game-b.txt")];
            const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: input };
            expect(await unzipGameToOutputLocation(gwd, newDir)).toBeTrue();
            
            for(let i = 0; i < expected.length; i++) {
                expect(existsSync(expected[i])).withContext(`Expected ${input[i]} to be unzipped to ${newDir}`).toBeTrue()
            }
            
            expect( readFileSync(expected[0], 'utf8') ).toBe(zipFileContentGameA)
            expect( readFileSync(expected[1], 'utf8') ).toBe(zipFileContentGameB)
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    it("should not unzip file if file existed", async () => {
        try {
            mkdirIfNotExists(newDir, LOGGING);

            const input = [path.join(inputDir, "game-a.zip"), path.join(inputDir, "game-b.zip")];
            const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: input };
            expect(await unzipGameToOutputLocation(gwd, newDir)).toBeTrue();
            //2nd time should give false, since everything already existed
            expect(await unzipGameToOutputLocation(gwd, newDir)).toBeFalse();   
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    it("can handle nested unzips", async () => {
        try {
            mkdirIfNotExists(newDir, LOGGING);

            const input = [path.join(inputDir, "nested.zip")];
            const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: input };
            expect(await unzipGameToOutputLocation(gwd, newDir)).toBeTrue();            
            expect(existsSync(path.join(newDir, "outer.txt"))).withContext("Expected outer.txt to be extracted").toBeTrue();
            expect(existsSync(path.join(newDir, "nested", "inner.txt"))).withContext("Expected inner.txt to be extracted").toBeTrue();
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    it("can create folders named after files if requested", async () => {
        try {
            mkdirIfNotExists(newDir, LOGGING);

            const input = [path.join(inputDir, "game-a.zip"), path.join(inputDir, "game-b.zip")];
            const expected = [path.join(newDir, "game-a", "game-a.txt"), path.join(newDir, "game-b", "game-b.txt")];
            const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: input };
            expect(await unzipGameToOutputLocation(gwd, newDir, true)).toBeTrue();
            
            for(let i = 0; i < expected.length; i++) {
                expect(existsSync(expected[i])).withContext(`Expected ${input[i]} to be unzipped to ${newDir}`).toBeTrue()
            }
            
            expect( readFileSync(expected[0], 'utf8') ).toBe(zipFileContentGameA)
            expect( readFileSync(expected[1], 'utf8') ).toBe(zipFileContentGameB)
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    // Post conditions
    if(existsSync(newDir)) {
        throw new Error("Error. A test did not clean up dir: " + newDir)
    }
})
