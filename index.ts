import { getOptions } from 'loader-utils';
import { validateOptions } from 'schema-utils';
import fs = require("fs");
import path = require("path");

// configuration variables
const loaderName = "Electron Native Patch Loader";
const loaderPackageName = "electron-native-patch-loader";
const defaultOptionFile = "patches.json";

// Options schema
const schema = {
    type: 'object',
    additionalProperties: {
        type: "object",
        properties: {
            test: "string",
            patches: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        find: "string",
                        isFindRegExp: "boolean",
                        replace: "string"
                    }
                }
            }
        }
    }
}

// Deep object merge taken from this post:
// URL: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
  
 function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return mergeDeep(target, ...sources);
}

function applyPatches(patches: any[], content: string) {
    for(let patch of patches) {
        if(patch.isFindRegExp) {
            let findRegExp = new RegExp(patch.find);
            content = content.replace(findRegExp, patch.replace);
        } else {
            content = content.replace(patch.find, patch.replace);
        }
    }
    return content;
}

function shouldBeRuleApplied(testPattern: string, filename: string) {
    let testRegExp = new RegExp(testPattern);
    return testRegExp.test(filename)
}

function transformContentForRule(rule: any, filename: string, content: string) {
    if(shouldBeRuleApplied(rule.test, filename)) {
        return applyPatches(rule.patches, content);
    } else {
        return content;
    }
}

function transformContent(options: any, filename: string, content: string) {
    for(let ruleName in options) {
        content = transformContentForRule(options[ruleName], filename, content);
    }
    return content;
}

function loadDefaultOptions() {
    const modulePath = path.dirname(require.resolve(loaderPackageName));
    const filePath = path.join(modulePath, defaultOptionFile);
    if(fs.existsSync(filePath) == false) {
        console.log("Warning: default options file was not found.");
        return {};
    }
    let options = fs.readFileSync(filePath).toString();
    return JSON.parse(options);
}

const defaultOptions = loadDefaultOptions();

let optionsFromFiles = {};
let optionsLoadedFlag = false;

function loadOptionsFromFile(filePath: string) {
    if(fs.existsSync(filePath) == false) {
        console.log(`File "${filePath}" containing options was not found.`);
        return {};
    }
    let options = fs.readFileSync(filePath).toString();
    return JSON.parse(options);
}

function loadOptionsFromFiles(files: string[]) {
    // To prevent loading options from files again and again
    if(optionsLoadedFlag)
        return;
    // load and merge options
    for(let file of files) {
        let options = loadOptionsFromFile(file);
        let targetOptions = {};
        mergeDeep(targetOptions, optionsFromFiles, options);
        optionsFromFiles = targetOptions;
    }
    // set the loaded flag
    optionsLoadedFlag = true;
}

  // TODO: 
  // 3. Check, how to validate each options by the schema
export default function(source) {
    // get options and set defaults
    let options = getOptions(this);
    options = options || {};
    options.files = options.files || [];
    options.custom = options.custom || {};
    
    // load options from file
    loadOptionsFromFiles(options.files);

    // merge patch options from various sources
    let patchOptions = {};
    mergeDeep(patchOptions, defaultOptions, optionsFromFiles, options.custom);

    // validateOptions(schema, options, loaderName);

    let target = transformContent(patchOptions, this.resourcePath, source)
    return target;
};