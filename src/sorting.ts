export function sortVersions(group: Game) {
    if(group.games.length === 1) return group;

    const LEFT_FIRST = -1;
    const RIGHT_FIRST = 1;
    const EQUAL = 0;
    if(group.isMultiFile) {
        const newOrder: GameInfoMultiFile[] = group.games.sort((left,right) => {
            return EQUAL
        })
    }
    else {
        const newOrder: FileInfo[] = group.games.sort((left, right) => {
            return EQUAL
        })

}