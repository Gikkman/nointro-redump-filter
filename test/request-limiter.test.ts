import { RequestLimiter } from "../src/metadata/igdb/request-limiter";

describe("RequestLimiter", () => {
    it("should not allow more than maxPending requests to be pending at the same time", async () => {
        const limiter = new RequestLimiter({ maxPerSecond: 100, maxPending: 4 });
        let started = 0;
        const sleepFunc = async (id: number) => {
            started += 1;
            await sleep(100); 
            return id
        };

        const promises = Array.from({ length: 10 }, (_, id) => limiter.schedule(() => sleepFunc(id)));
        expect(promises.length).toBe(10);
        
        await sleep(10); 
        expect(started).toBe(4);
        
        await sleep(100); 
        expect(started).toBe(8);
        
        await sleep(100);
        expect(started).toBe(10);
    })

    it("should not allow more than maxPerSecond requests to be sent per second", async () => {
       const limiter = new RequestLimiter({ maxPerSecond: 4, maxPending: 1000 });
        let started = 0;
        const sleepFunc = async (id: number) => {
            started += 1;
            await sleep(10); 
            return id
        };

        const promises = Array.from({ length: 10 }, (_, id) => limiter.schedule(() => sleepFunc(id)));
        expect(promises.length).toBe(10);
        
        await sleep(100); 
        expect(started).toBe(4);
        
        await sleep(100); 
        expect(started).toBe(4);
        
        await sleep(1000);
        expect(started).toBe(8);

        await sleep(100);
        expect(started).toBe(8);

        await sleep(1000);
        expect(started).toBe(10);
    })
})

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}