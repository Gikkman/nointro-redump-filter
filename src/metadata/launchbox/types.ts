export type LaunchBoxGameMetadataResult = {
    matchedName: string;
    matchedSystem: string;
    genres: string[];
    localMultiplayer: {
        supportsLocalMultiplayer: boolean;
        localCoop: boolean;
        localVs: boolean;
    };
};


export type LaunchBoxGameEntry = {
    name: string;
    platform: string;
    genres: string[];
    maxPlayers?: number;
    cooperative?: boolean;
};