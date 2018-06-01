# electron-native-plugin
This is a plugin for WebPack 4 and higher. It is used to bundle Node native modules for the Electron platform. It was developed mainly to provide this ability for the [electron-angular-webpack](https://github.com/lbassin/electron-angular-webpack) project. 
It consists of three separate NPM packages:
1. **electron-native-plugin**
2. [**electron-native-loader**](https://github.com/evonox/electron-native-loader)
3. [**electron-native-patch-loader**](https://github.com/evonox/electron-native-patch-loader)

The role of these packages is given further in the text.

## Installation
I presume you have Node and NPM installed. 
Then it is necessary to install node-gyp which is a Node native module compiler.
```bash
npm install -g node-gyp
```
Then it is necessary to install a C++ compiler and Python 2.7 specific to your platform. Windows users can use this package to install Python and Microsoft C++ compiler.
```bash
npm install --global windows-build-tools
```
Then it might be to setup some enviroment variables, please consult [windows-build-tools](https://www.npmjs.com/package/windows-build-tools) page.

Linux and MacOS users need to install GCC or CLang tool-chain.

Next we need electron-rebuild NPM package. This can be installed by command.
```bash
npm install --save-dev electron-rebuild
```

Finally we can install electron-native-plugin packages.
```bash
npm install --save-dev electron-native-plugin
npm install --save-dev electron-native-loader
npm install --save-dev electron-native-patch-loader
```
## Algorithm
This subclause describes briefly what in fact electron-native-plugin is doing.
The plugin expects you have already your Node native module compiled by node-gyp and it is written as a dependency in your package.json file. Then it performs the following steps.
1. When the webpack launches it parses your package.json file.
2. Then reads your dependencies and checks which modules are native ones.
3. Then it runs electron-rebuild command for each native module to convert it for Electron V8 machine.
4. Write a substitution map into the file. This map is simply a key/value pair between the old NodeGyp file and the Electron native module file.
5. This map is read then by electron-native-loader which is used to update the references in your project to the Electron binaries which are then bundled by WebPack.
## How to setup webpack.config.js
To setup this set of NPM modules for the use in WebPack is quite simple.
First load and add the ElectronNativePlugin as follows:
```javascript
const Webpack = require('webpack');
const ElectronNativePlugin = require("electron-native-plugin");
...
plugins: 
    [
        new ElectronNativePlugin(),
        new Webpack.IgnorePlugin(/node-gyp/)
    ]
...
```
Finally setup the module rules as follows:
```javascript
...
 module: 
    {
        rules: [
            {
                test: /\.js$/,
                use: { loader: "electron-native-patch-loader" }
            },
            { 
                test: /\.node$/, 
                use: "electron-native-loader" 
            }
        ]
    }
...
```
## Things get a bit tough
Some Node native libraries are not directly compatible with Webpack and cannot be so easily bundled. It is maily due to the fact that they load dependencies in various ways which WebPack cannot detect and parse. One of the examples is sqlite3 database. As a rescue to solve this incompatibility comes electron-native-patch-loader NPM module. It works simply by text replacement of the JS source files based on its JSON configuration. Its description is found at [electron-native-patch-loader](https://github.com/evonox/electron-native-patch-loader) page.