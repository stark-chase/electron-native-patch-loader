"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var loader_utils_1 = require("loader-utils");
var fs = require("fs");
var path = require("path");
// configuration variables
var loaderName = "Electron Native Patch Loader";
var loaderPackageName = "electron-native-patch-loader";
var defaultOptionFile = "patches.json";
// Options schema
var schema = {
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
};
// Deep object merge taken from this post:
// URL: https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
function mergeDeep(target) {
    var sources = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
    }
    if (!sources.length)
        return target;
    var source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (var key in source) {
            if (isObject(source[key])) {
                if (!target[key])
                    Object.assign(target, (_a = {}, _a[key] = {}, _a));
                mergeDeep(target[key], source[key]);
            }
            else {
                Object.assign(target, (_b = {}, _b[key] = source[key], _b));
            }
        }
    }
    return mergeDeep.apply(void 0, [target].concat(sources));
    var _a, _b;
}
function prepareReplaceString(replaceString) {
    var pluginPath = __dirname;
    pluginPath = JSON.stringify(pluginPath);
    pluginPath = pluginPath.substring(1, pluginPath.length - 1);
    replaceString = replaceString.replace("[plugin_path]", pluginPath);
    return replaceString;
}
function applyPatches(patches, content) {
    for (var _i = 0, patches_1 = patches; _i < patches_1.length; _i++) {
        var patch = patches_1[_i];
        var replace = prepareReplaceString(patch.replace);
        if (patch.isFindRegExp) {
            var findRegExp = new RegExp(patch.find);
            content = content.replace(findRegExp, replace);
        }
        else {
            content = content.replace(patch.find, replace);
        }
    }
    return content;
}
function shouldBeRuleApplied(testPattern, filename) {
    var testRegExp = new RegExp(testPattern);
    return testRegExp.test(filename);
}
function transformContentForRule(rule, filename, content) {
    if (shouldBeRuleApplied(rule.test, filename)) {
        return applyPatches(rule.patches, content);
    }
    else {
        return content;
    }
}
function transformContent(options, filename, content) {
    for (var ruleName in options) {
        content = transformContentForRule(options[ruleName], filename, content);
    }
    return content;
}
function loadDefaultOptions() {
    var modulePath = path.dirname(require.resolve(loaderPackageName));
    var filePath = path.join(modulePath, defaultOptionFile);
    if (fs.existsSync(filePath) == false) {
        console.log("Warning: default options file was not found.");
        return {};
    }
    var options = fs.readFileSync(filePath).toString();
    return JSON.parse(options);
}
var defaultOptions = loadDefaultOptions();
var optionsFromFiles = {};
var optionsLoadedFlag = false;
function loadOptionsFromFile(filePath) {
    if (fs.existsSync(filePath) == false) {
        console.log("File \"" + filePath + "\" containing options was not found.");
        return {};
    }
    var options = fs.readFileSync(filePath).toString();
    return JSON.parse(options);
}
function loadOptionsFromFiles(files) {
    // To prevent loading options from files again and again
    if (optionsLoadedFlag)
        return;
    // load and merge options
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var options = loadOptionsFromFile(file);
        var targetOptions = {};
        mergeDeep(targetOptions, optionsFromFiles, options);
        optionsFromFiles = targetOptions;
    }
    // set the loaded flag
    optionsLoadedFlag = true;
}
// TODO: 
// 3. Check, how to validate each options by the schema
function default_1(source) {
    // get options and set defaults
    var options = loader_utils_1.getOptions(this);
    options = options || {};
    options.files = options.files || [];
    options.custom = options.custom || {};
    // load options from file
    loadOptionsFromFiles(options.files);
    // merge patch options from various sources
    var patchOptions = {};
    mergeDeep(patchOptions, defaultOptions, optionsFromFiles, options.custom);
    // validateOptions(schema, options, loaderName);
    var target = transformContent(patchOptions, this.resourcePath, source);
    return target;
}
exports.default = default_1;
;
//# sourceMappingURL=index.js.map