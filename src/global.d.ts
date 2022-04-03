declare module NodeJS {
    interface Global {
        DryRun: boolean;
    }
}
declare const DryRun: boolean;

type Collection = {
    platform: string,
    inputDirectoryOverride?: string
    output: string,
    input: string[],
}

type Collections = {
    skipTags?: string[],
    skipTitles?: string[]
    inputDirectory: string,
    outputDirectory: string,
    collections: Collection[],
}

type GameFile = {
    dir: string,
    file: string,
};
type GameTags = {
    tagsStartsAt?: number,
    tags: Set<string>,
}
type RegionInfo = {
    regions: Set<string>,
    languages: Set<string>,
    isTranslated: boolean,
}
type GameInfo = GameFile & GameTags & RegionInfo;

type TitleGroup = {
    title: string,
    files: GameInfo[],
};


type GameGroupSingleFile = {
    title: string,
    isMultiFile: false,
    games: GameInfo[]
}
type GameGroupMultiFile = {
    title: string,
    isMultiFile: true,
    games: GameInfoMultiFile[]
}
type GameGroup = GameGroupSingleFile | GameGroupMultiFile;

type GameInfoMultiFile = {
    commonTags: Set<string>
    files: (GameInfo & MultiFileGameInfo)[]
}
type MultiFileGameInfo = {
    index: string,
}