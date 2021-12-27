type Collection = {
    platform: string,
    output: string,
    input: string[],
}

type Collections = {
    "input-directory": string,
    "output-directory": string,
    "collections": Collection[],
}