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

type GameFile = {
    dir: string,
    file: string,
}
type GameGroup = {
    title: string,
    files: GameFile[],
}