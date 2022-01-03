/** Search a string for each pattern. For the pattern that is found furthest from the
 * start of the string, create a substring from 0 to that point.
 * 
 * For example: substrBack("hello-world.com", ".", "-")
 * Would return "hello-world", because the "." is the first matching from behind
 * 
 * @param input input string
 * @param patterns patterns to search for
 * @returns substring of input, from the last matching till the start of the stringn
 */
 export function substrBack(input: string, ...patterns: string[]) {
    let highest: number = -1;
    for(const p of patterns) {
        const finding = input.lastIndexOf(p);
        if(finding >= 0 && finding > highest) highest = finding;
    }
    if(highest === -1) return input;
    return input.substring(0, highest);
}

/** Search a string for each pattern. For the pattern that is found closest from the
 * start of the string, create a substring from 0 to that point.
 * 
 * For example: substrBack("hello-world.com", ".", "-")
 * Would return "hello", because the "-" is the first matching from the start
 * 
 * @param input input string
 * @param patterns patterns to search for
 * @returns substring of input, from the first matching till the start of the stringn
 */
export function substrFront(input: string, ...patterns: string[]) {
    let lowest: number = Number.MAX_VALUE;
    for(const p of patterns) {
        const finding = input.indexOf(p);
        if(finding >= 0 && finding < lowest) lowest = finding;
    }
    return input.substring(0, lowest);
}