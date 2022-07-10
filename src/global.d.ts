declare module NodeJS {
    interface Global {
        DryRun: boolean;
    }
}
declare const DryRun: boolean;

type Collection = {
    platform: string,
    output: string,
    input: string[],
    unzip?: 'sub-folder' | 'same-folder',
    clonelists?: string[],
    inputDirectoryRootOverride?: string,
    skipFilePrefixes?: string[],
    generateMultiDiscXML?: "BizhawkXML",
}

type Collections = {
    inputRootDirectory: string,
    outputRootDirectory: string,
    skipFileExtensions?: string[],
    skipFileTags?: string[],
    skipFilePrefixes?: string[]
    collections: string[],
}

type CollectionRules = {
    foreignTitleToEnglishTitle: Map<string, string>,
    englishTitleToForeignTitles: Map<string, string[]>,
    removeTitles: Array<string>,
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
type FileInfo = GameFile & Tags & RegionInfo & {gameTitle: string};

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
    gameTitle: string,
    isMultiFile: true,
    tags: Set<string>,
    files: (FileInfo & FileIndex)[]
}
type FileIndex = {
    index: string
}

type ProcessedGame = Game & {bestVersion: GameVersion}

type GameWriteData = {
    title: string,
    aliases?: string[],
    languages: Set<string>,
    fileAbsolutePaths: string[],
};