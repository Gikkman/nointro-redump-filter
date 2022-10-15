import os from 'os';
import path from 'path';
import fs from 'fs';

const DiscFileExtensions = new Set<string>([".cue", ".mds", ".ccd"]);
const FileTemplate = `
<BizHawk-XMLGame System="#SYSTEM_KEY#" Name="#NAME_KEY#">
  <LoadAssets>
#FILES_LIST_KEY#
  </LoadAssets>
</BizHawk-XMLGame>`;
const ListItemTemplate = `    <Asset FileName="#FILE_PATH_KEY#" />`
enum DiscSystemKey {
    Playstation = "PSX",
    Saturn = "SAT",
    PcFx = "PCFX",
    SegaCD = "SEGACD",
    TG16CD = "TG16CD",
}

/** Writes a BizhawkXML file for a multi-file game.
 * 
 * @param files The files to include in the XML file
 * @param xmlWriteAbsolutePath Absolute path for where to write the file 
 * @param gameName Name of the game 
 * @param systemName Name of the system 
 */
export async function writeBizhawkXmlFile(files: string[], xmlWriteAbsolutePath: string, gameName: string, systemName: string) {
    const filesXmlList = files
        .filter(f => DiscFileExtensions.has(path.extname(f).toLowerCase()) )
        .map(f => xmlEscape(f))
        .map(f => ListItemTemplate.replace("#FILE_PATH_KEY#", f))
        .join(os.EOL)
    const bizhawkSystemKey = guessBizhawkDiscSystemKey(systemName);
    const xmlContent = FileTemplate.replace("#FILES_LIST_KEY#", filesXmlList)
                                    .replace("#NAME_KEY#", xmlEscape(gameName))
                                    .replace("#SYSTEM_KEY#", xmlEscape(bizhawkSystemKey));
    const xmlFileName = gameName + ".xml"
    const xmlFilePath = path.join(xmlWriteAbsolutePath, xmlFileName)
    await writeFileAsync(xmlFilePath, xmlContent);
    return xmlFileName;
}

function xmlEscape(str: string) {
    return str.split('&').join('&amp;')
              .split('<').join('&lt;')
              .split('>').join('&gt;')
              .split('"').join('&quot;')
              .split("'").join('&apos;')
}

async function writeFileAsync(filePath: string, fileContent: string) {
    return new Promise( (res, rej) => {
        fs.writeFile(filePath, fileContent, (err) => {
            if(err) rej(err);
            else res("");
        })
    });
};

export function guessBizhawkDiscSystemKey(platformName: string): DiscSystemKey {
    const sys = platformName.replaceAll(/[^a-zA-Z\d]/g, "").toLowerCase()
    if (sys.includes("playstation") || sys.includes("psx") ||sys.includes("ps1") )
        return DiscSystemKey.Playstation

    if (sys.includes("saturn") || (sys.includes("sat") && sys.includes("sega")))
        return DiscSystemKey.Saturn

    if (sys.includes("pc") && sys.includes("fx"))
        return DiscSystemKey.PcFx

    if (sys.includes("sega") && sys.includes("cd"))
        return DiscSystemKey.SegaCD

    if (sys.includes("cd") && (sys.includes("16") || sys.includes("turbo") || sys.includes("tg") || sys.includes("engine")))
        return DiscSystemKey.TG16CD

    throw new Error("Could not map platform name " + platformName + " to a mappable Bizhawk core key. Please use a more descriptive platform name (e.g. Playstation or TurboGrafx16 CD)")
}