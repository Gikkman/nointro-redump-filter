import fs from "fs";
import path from "path";

export function verifyExists(path: fs.PathLike) {
    if( !fs.existsSync(path) ) {
        console.error("Input directory does not exist:", path);
        process.exit(1);
    } else {
        console.log("Input directory exists:", path);
    }
}

export function mkdirIfNotExists(path: fs.PathLike): void {
    if( fs.existsSync(path) ) {
        const stat = fs.statSync(path);
        if( stat.isDirectory() ) {
            console.log("Directory existed:", path)
            return;
        }
        else {
            console.error("A file exists, but is not a directory:", path);
            process.exit(1)
        }
    }
    fs.mkdirSync(path, {recursive: true});
    console.log("Directory created:", path)
    return;
}

export function listFilesFlat(...dirPaths: string[]): GameFile[] {
    const files: GameFile[] = [];
    for(const dirPath of dirPaths) {
        if(!fs.existsSync(dirPath)) continue;
        const dirents = fs.readdirSync(dirPath, {withFileTypes: true});
        for(const dirent of dirents) {
            if(dirent.isFile()) {
                files.push( {dir: dirPath, file: dirent.name} )
            }
            else if(dirent.isDirectory()) {
                const childDirPath = path.join(dirPath, dirent.name);
                const childFiles = listFilesFlat( childDirPath );
                files.push(...childFiles);
            }
        }
    }
    return files;
}