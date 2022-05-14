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
    unzip?: boolean,
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
type Tags = {
    tagsStartsAt?: number,
    tags: Set<string>,
}
type RegionInfo = {
    regions: Set<string>,
    languages: Set<string>,
    isTranslated: boolean,
}
type FileInfo = GameFile & Tags & RegionInfo;

type TitleGroup = {
    title: string,
    files: FileInfo[],
};


type Game = {
    title: string,
    versions: GameVersion[],
}
type GameVersion = (GameSingleFile | GameMultiFile);
type GameSingleFile = FileInfo & {
    isMultiFile: false,
}
type GameMultiFile = RegionInfo & {
    isMultiFile: true,
    commonTags: Set<string>,
    files: (FileInfo & FileIndex)[]
}
type FileIndex = {
    index: string
}