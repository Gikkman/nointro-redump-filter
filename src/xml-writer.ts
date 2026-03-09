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

/** Writes a BizhawkXML file for a multi-file game.
 * 
 * @param files The files to include in the XML file
 * @param xmlWriteAbsolutePath Absolute path for where to write the file 
 * @param gameName Name of the game 
 * @param platform Platform object containing the Bizhawk system key
 */
export async function writeBizhawkXmlFile(files: string[], xmlWriteAbsolutePath: string, gameName: string, platform: Platform) {
    const filesXmlList = files
        .filter(f => DiscFileExtensions.has(path.extname(f).toLowerCase()) )
        .map(f => xmlEscape(f))
        .map(f => ListItemTemplate.replace("#FILE_PATH_KEY#", f))
        .join(os.EOL)
    const bizhawkSystemKey = platform.bizhawkId;
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