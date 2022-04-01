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
}

type Collections = {
    "input-directory": string,
    "output-directory": string,
    "collections": Collection[],
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
type DiscFile = {
    file: string,
    dir: string,
    discNumber: string,
    discTags: Set<string>,
}
type DiscInfo = MultiDisc | NotMultiDisc;
type MultiDisc = {
    isMultiDisc: true,
    discs: DiscFile[]
}
type NotMultiDisc = {
    isMultiDisc: false,
}
type GameInfo = GameFile & GameTags & RegionInfo;

type TitleGroup = {
    title: string,
    files: GameInfo[],
};

type GameGroup = {
    title: string,
    games: (GameInfo & DiscInfo)[];
};