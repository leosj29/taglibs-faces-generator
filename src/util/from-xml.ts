
import fs from 'fs';
import https from 'https';
import * as xml2js from 'xml2js';
import { Tag } from '../model/tag';
import { clearJson } from './clear-json';

const options = {
    mergeAttrs: true,
    trim: true,
    normalizeTags: true,
    normalize: true,
    ignoreAttrs: true,
    explicitArray: false,
    tagNameProcessors: [(name: string) => tagName(name)]
};

const tagName = (name: string) => {
    if ("facelet-taglib" === name)
        return "root";
    if ("tag-name" === name)
        return "name";
    return name;
};

const createAttr = (jsonFileName: string, xmlFileName: string) => {
    const allJson = JSON.parse(fs.readFileSync(jsonFileName, 'utf8'));
    const allTag = allJson.root.tag;
    let finalTag: Tag[] = [];
    allTag.forEach((tag: any) => {
        finalTag.push(new Tag(
            (tag.name) ? tag.name : '',
            (tag?.description) ? tag?.description : '',
            (tag?.attribute) ? tag?.attribute : []))
    });
    const json = JSON.stringify({ components: { component: finalTag } }, null, 2);
    fs.writeFileSync(jsonFileName, json);
    fs.unlinkSync(xmlFileName);
    clearJson(jsonFileName);
};

const convertJson = (xmlFileName: string, jsonFileName: string) => {
    // read XML from a file
    const xml = fs.readFileSync(xmlFileName);
    // convert XML to JSON
    xml2js.parseString(xml, options, (err, result) => {
        if (err) {
            console.log(err);
            throw err;
        }
        // `result` is a JavaScript object
        // convert it to a JSON string
        const json = JSON.stringify(result, null, 2);
        // save JSON in a file
        fs.writeFileSync(jsonFileName, json);
        createAttr(jsonFileName, xmlFileName);
    });
};

export const execute = (folder: string, fileName: string, version: string, url: string) => {
    console.log(`Generating file: ${fileName}-${version}`);
    const xmlFileName = `./src/data/${folder}/${fileName}-${version}.xml`;
    const jsonFileName = `./src/data/${folder}/${fileName}-${version}.json`;
    const file = fs.createWriteStream(xmlFileName);
    https.get(url, function (response) {
        response.pipe(file);
        file.on("finish", () => {
            file.close();
            convertJson(xmlFileName, jsonFileName);
        });
    });
};