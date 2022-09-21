/*
 * Generated type guards for "types.ts".
 * WARNING: Do not manually change this file.
 */

export function isCollection(obj: unknown): obj is Collection {
    const typedObj = obj as Collection
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typeof typedObj["platform"] === "string" &&
        typeof typedObj["output"] === "string" &&
        Array.isArray(typedObj["input"]) &&
        typedObj["input"].every((e: any) =>
            typeof e === "string"
        ) &&
        (typeof typedObj["unzip"] === "undefined" ||
            typedObj["unzip"] === "sub-folder" ||
            typedObj["unzip"] === "same-folder") &&
        (typeof typedObj["clonelists"] === "undefined" ||
            Array.isArray(typedObj["clonelists"]) &&
            typedObj["clonelists"].every((e: any) =>
                typeof e === "string"
            )) &&
        (typeof typedObj["inputDirectoryRootOverride"] === "undefined" ||
            typeof typedObj["inputDirectoryRootOverride"] === "string") &&
        (typeof typedObj["skipFilePrefixes"] === "undefined" ||
            Array.isArray(typedObj["skipFilePrefixes"]) &&
            typedObj["skipFilePrefixes"].every((e: any) =>
                typeof e === "string"
            )) &&
        (typeof typedObj["generateMultiDiscFile"] === "undefined" ||
            typedObj["generateMultiDiscFile"] === "BizhawkXML")
    )
}
