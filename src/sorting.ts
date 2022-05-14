const PrioConfig = {
    languages: [
        "en",
        "ja",
        "sv",
        "de",
        "zh"
    ],
    regions: [
        "world",
        "usa",
        "japan",
        "europe"
    ]
}

const INF = Number.MAX_SAFE_INTEGER;
const LanguageScoreMap: Map<string, number> = new Map();
const RegionScoreMap: Map<string, number> = new Map();

for(let i = 0; i < PrioConfig.languages.length; i++) {
    LanguageScoreMap.set(PrioConfig.languages[i], i);
}
for(let i = 0; i < PrioConfig.regions.length; i++) {
    RegionScoreMap.set(PrioConfig.regions[i], i);
}


export function getLowestScore(map: Map<string, number>, keys: Set<string>): number {
    if(keys.size === 0) throw new Error("Keys must contain one or more elements");
    if(map.size === 0) throw new Error("Map must contain one or more elements");
    let bestScore = INF;
    keys.forEach(e => {
        const score = map.get(e.toLowerCase()) ?? INF
        bestScore = Math.min(bestScore, score)
    })
    return bestScore;
}

export function filterCandidatesByProperty<T>(propertyScoreMap: Map<string, number>, versions: T[], propertyAccessor: (v: T) => Set<string>): T[] {
    const scoreMap: Map<T, number> = new Map();
    for(const version of versions) {
        scoreMap.set(version, getLowestScore(propertyScoreMap, propertyAccessor(version)))
    }
    const sorted = versions.sort( (left, right) => {
        const lScore = scoreMap.get(left) ?? INF;
        const rScore = scoreMap.get(right) ?? INF;
        return lScore - rScore;
    })
    const bestScore = scoreMap.get(sorted[0]);
    return sorted.filter( e => {
        const score = scoreMap.get(e) ?? INF;
        return score === bestScore;
    })
}

export function findMostSuitableVersion(game: Game): Game & {bestVersion: GameVersion} {
    if(game.versions.length === 1) return {...game, bestVersion: game.versions[0]};

    const candidatesAfterLanguages = filterCandidatesByProperty(LanguageScoreMap, game.versions, (v: GameVersion) => v.languages);
    const candidatesAfterRegion = filterCandidatesByProperty(RegionScoreMap, candidatesAfterLanguages, (v: GameVersion) => v.regions);
    return {title: game.title, bestVersion: candidatesAfterRegion[0], versions: game.versions}
}
