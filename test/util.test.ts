import { substrBack, substrFront } from "../src/util";

describe("Test substrFront", function() {
    it("can handle single match with single pattern", function() {
        const input = "hello-world";
        const output = substrFront(input, "-");
        expect(output).toBe("hello");
    });
    it("can handle multiple matches with single pattern", function() {
        const input = "hello-world-com";
        const output = substrFront(input, "-");
        expect(output).toBe("hello");
    });
    it("can handle multiple matches of multiple pattern", function() {
        const input = "hello-wor.ld.co-m";
        const output = substrFront(input, ".", "-");
        expect(output).toBe("hello");
    });
    it("can handle no matches", function() {
        const input = "hello-world.com";
        const output = substrFront(input, "/", ",");
        expect(output).toBe("hello-world.com");
    });
    it("can doesn't care about order", function() {
        const input = "hello-world.com";
        const output1 = substrFront(input, ".", "-");
        const output2 = substrFront(input, ".", "-");
        expect(output1).toBe(output2);
    });
});

describe("Test substrBack", function() {
    it("can handle single match with single pattern", function() {
        const input = "hello-world.com";
        const output = substrBack(input, "-");
        expect(output).toBe("hello");
    });
    it("can handle multiple matches with single pattern", function() {
        const input = "hello-world-com";
        const output = substrBack(input, "-");
        expect(output).toBe("hello-world");
    });
    it("can handle multiple matches of multiple pattern", function() {
        const input = "hello-wor.ld.co-m";
        const output = substrBack(input, ".", "-");
        expect(output).toBe("hello-wor.ld.co");
    });
    it("can handle no matches", function() {
        const input = "hello-world.com";
        const output = substrBack(input, "/", ",");
        expect(output).toBe("hello-world.com");
    });
    it("can doesn't care about order", function() {
        const input = "hello-world.com";
        const output1 = substrBack(input, ".", "-");
        const output2 = substrBack(input, ".", "-");
        expect(output1).toBe(output2);
    });
});