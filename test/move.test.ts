import { existsSync, rmSync } from "fs";
import path from "path";
import { mkdirIfNotExists } from "../src/files";
import { copyGameToOutputLocation } from "../src/move";

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
    
    it("should copy file if no file existed", () => {
        try {
            mkdirIfNotExists(newDir, LOGGING);

            const games = [path.join(inputDir, "game-a.zip"), path.join(inputDir, "game-b.zip")];
            const gwd: GameWriteData = {title: "Game", languages: new Set(["en"]), fileAbsolutePaths: games };
            copyGameToOutputLocation(gwd, newDir)
            
            for(const game of games) {
                expect(existsSync(game)).withContext(`Expected ${game} to be copied to ${newDir}, but it wasn't`).toBeTrue()
            }
        } finally {
            rmSync(newDir, {recursive: true, force: true})
        }
    })

    // Post conditions
    rmSync(newDir, {recursive: true, force: true})
    if(existsSync(newDir)) {
        throw new Error("Error. A test did not clean up dir: " + newDir)
    }
})
