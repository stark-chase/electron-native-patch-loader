# electron-native-patch-loader
This plugin helps to solve the incompatibility issues between **WebPack** and various Node native modules. It is designed to work with [node-native-plugin](https://github.com/evonox/electron-native-plugin) for **WebPack** and **Electron**. It does its job simply by text replacements of JS source code configured by JSON notation. The loader itself **does not modify** any JS source code. All text replacements **run only in memory** during the Webpack build process.
## Levels of configuration
The **electron-native-patch-loader** is equipped with three levels of configuration for text replacements. These are:
1. **patches.json** file placed in the directory where the loader is installed
2. **user-defined JSON files** mentioned in the configuration in **webpack.config.js**
3. directly injected replacement rules in the **webpack.config.js** file.

The precedence of the configuration levels is as follows:
1. Injected rules have the highest priority
2. Then comes the configuration in user-defined files
3. **patches.json** file provided with the NPM module has the lowest precedence.

## JSON configuration of replacement rules
Given below is an example of replacement rules for **sqlite3** native module.
```javascript
{
    "sqlite3": {
        "test": "sqlite3\\.js$",
        "patches": [
            {
                "find": "var binding_path = binary.find(path.resolve(path.join(__dirname,'../package.json')));",
                "isFindRegExp": false,
                "replace": ""
            },
            {
                "find": "require(binding_path);",
                "isFindRegExp": false,
                "replace": "require('./binding/node-v57-win32-x64/node_sqlite3.node')"
            }
        ]
    }
}
```
Every native module has a unique identifier for its rule definition. Then comes the **test** property which should be a regular expression for testing the file name where patches should be applied. In the property **patches** comes the array of concrete substitutions. Each substitution rule has a **find** and **isFindRegExp** property. **isFindRegExp** attribute defines the type of the **find** property. If it is **true** then **find** must be a regular expression otherwise **find** contains plain text to be searched. Finally **replace** property contains the text to be placed instead of the text defined by **find** property.

## Configuration of the loader in webpack.config.js file
The configuration of this loader in **webpack.config.js** file is quite simple. 
```javascript
rules: 
    [
        {
            test: /\.js$/,
            use: { 
                loader: "electron-native-patch-loader",
                options: {
                    files: ["file1.json", "file2.json"],
                    custom: {
                        ...
                    }
                }
            }
        }
    ]   
```
First the **test** property should be applied to all Javascript files. The options of the loader are simple. The **files** property defines the list of JSON files containing the replacement rules. The **custom** property is used for injecting these rules directly into the **webpack.config.js**.
