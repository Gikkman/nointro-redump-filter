import path from "path"
import { listFilesFlat } from "../src/files";

describe("Test listFilesFlag", function() {
    it("can handle nested directories", function() {
        const testInputPath = path.join(__dirname, "test-input");
        const testInputFileList = listFilesFlat(testInputPath);
        expect(testInputFileList.length).toBe(9)
    });
    it("can handle flat directories", function() {
        const testInputPath = path.join(__dirname, "test-input", "inner-2");
        const testInputFileList = listFilesFlat(testInputPath);
        expect(testInputFileList.length).toBe(2)
    });
    it("can give empty list on missing directory", function() {
        const testInputPath = path.join(__dirname, "test-input", "inner-3");
        const testInputFileList = listFilesFlat(testInputPath);
        expect(testInputFileList.length).toBe(0)
    });
})