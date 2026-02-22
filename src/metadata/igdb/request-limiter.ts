type Task<T> = {
    run: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (reason: unknown) => void;
};

export class RequestLimiter {
    private readonly maxPerSecond: number;
    private readonly maxPending: number;
    private readonly queue: Array<Task<unknown>> = [];

    private pending = 0;
    private startTimes: Array<number> = [];

    constructor(opts: { maxPerSecond: number; maxPending: number }) {
        this.maxPerSecond = opts.maxPerSecond;
        this.maxPending = opts.maxPending;
    }

    schedule<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({run: fn, resolve, reject} as Task<unknown>);
            setTimeout(() => this.loop(), 0);
        })

    }

    private loop() {
        if(this.queue.length <= 0) {
            return;
        }

        // If we have too many pending requests, wait a bit.
        if(this.pending >= this.maxPending) {
            setTimeout(() => this.loop(), 10);
            return;
        }

        // Whenever a request is started, it's start time is stored. 
        // If there are more start times than maxPerSecond, and the oldest start time
        // is less than a second ago, that means that we've reached the maxPerSecond limit
        // and we should wait a bit before starting another request
        if(this.startTimes.length >= this.maxPerSecond && this.startTimes[0] > Date.now() - 1000) {
            setTimeout(() => this.loop(), 10);
            return;
        }

        // Fetch the next task from the queue
        // If it isn't defined, then the element must've been undefined
        // and we'll try with the next element
        const task = this.queue.shift()
        if(!task) {
            setTimeout(() =>this.loop(), 0);
            return;
        }

        if(this.startTimes.length >= this.maxPerSecond) {
            this.startTimes.shift();
        }
        this.startTimes.push(Date.now());
        this.pending += 1;

        task.run()
            .then(t => {
                this.pending -= 1;
                task.resolve(t);
                setTimeout(() => this.loop(), 0);
            })
            .catch(e => {
                this.pending -= 1;
                task.reject(e);
                setTimeout(() => this.loop(), 0);
            })

        // If there's anything more in the queue, wait a bit before checking again
        if(this.queue.length > 1) {
            setTimeout(() => this.loop(), 10);
            return;
        }
    }
}