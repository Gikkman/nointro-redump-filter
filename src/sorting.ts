/**
 * Overview of sorting:
 * 1) Throw away all that doesn't have the best language
 * 2) Throw away those with bad tags (if that'd leave us with more than 1 left)
 * 3) Throw away all that doesn't have the best region
 * 4) Throw away those with translations (if that'd leave us with more than 1 left)
 * 5) Sort by number of tags
 */

const PrioConfig = {
    languages: [
        "en",
        "ja",
        "sv",
        "de",
        "zh",
    ],
    regions: [
        "world",
        "usa",
        "japan",
        "europe",
    ],
}
const BadTags = new Set([
    "i",
    "undub",
    "hack",
    "alpha",
    "beta",
    "proto"
])

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

export function filterByBadTags<T>(badTags: Set<string>, versions: T[], tagAccessor: (v: T) => Set<string>): T[] {
    const filtered = versions.filter(v => {
        const tags = tagAccessor(v);
        for(const tag of tags) {
            if(badTags.has(tag.toLowerCase())) return false;
        }
        return true;
    })
    return filtered.length > 0 ? filtered : versions;
}

export function filterAwayTranslations(versions: GameVersion[]): GameVersion[] {
    const filtered = versions.filter(v => {
        if(v.isTranslated)
            return false;
        return true;
    })
    return filtered.length > 0 ? filtered : versions;
}

export function findMostSuitableVersion(game: Game): Game & {bestVersion: GameVersion} {
    if(game.versions.length === 1) return {...game, bestVersion: game.versions[0]};

    const candidatesAfterLanguages = filterCandidatesByProperty(LanguageScoreMap, game.versions, (v: GameVersion) => v.languages);
    const candidatesAfterBadTags = filterByBadTags(BadTags, candidatesAfterLanguages, (v: GameVersion) => v.tags)
    const candidatesAfterRegion = filterCandidatesByProperty(RegionScoreMap, candidatesAfterBadTags, (v: GameVersion) => v.regions);
    const candidatesAfterTranslations = filterAwayTranslations(candidatesAfterRegion);
    const candidatesAfterTagNumber = [...candidatesAfterTranslations].sort( (a,b)=> a.tags.size-b.tags.size );
    return {title: game.title, bestVersion: candidatesAfterTagNumber[0], versions: game.versions}
}
