"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var process = require("process");
var child_process = require("child_process");
var fs_extra = require("fs-extra");
var rimraf = require("rimraf");
var FileSearch_1 = require("./FileSearch");
var ModuleAutoDiscoverEngine_1 = require("./ModuleAutoDiscoverEngine");
var os = require("os");
var NativeModuleBuilder = /** @class */ (function () {
    function NativeModuleBuilder(options, distPath) {
        this.options = options;
        this.distPath = distPath;
        this.autoDiscover = null;
    }
    NativeModuleBuilder.prototype.compile = function (moduleOptions) {
        // discover the native module
        var moduleDir = this.discoverBindingGyp(moduleOptions.source);
        if (moduleDir == null) {
            console.error("[ERROR]: Cannot find a native module: " + moduleOptions.source);
            process.abort();
            return;
        }
        // build the native module
        var moduleFiles = this.buildNativeModule(moduleDir, moduleOptions.debugBuild);
        if (moduleFiles == null)
            return null;
        // copy the resulting binary
        this.copyBinaryOutput(moduleFiles, moduleOptions);
        moduleFiles.nodeFile = path.basename(moduleFiles.nodeFile); // TODO: Remove, should be done in SaveDependency
        return moduleFiles;
    };
    NativeModuleBuilder.prototype.copyBinaryOutput = function (moduleFiles, moduleOptions) {
        var targetDir = path.join(this.distPath, moduleOptions.outputPath);
        fs_extra.ensureDirSync(targetDir);
        var targetFilePath = path.join(targetDir, path.basename(moduleFiles.electronFile));
        fs.copyFileSync(moduleFiles.electronFile, targetFilePath);
    };
    NativeModuleBuilder.prototype.buildNativeModule = function (source, debugBuild) {
        // if debugBuild is unspecified in the module config, then use the global version
        if (debugBuild == null)
            debugBuild = this.options.debugBuild;
        // go to the native module directory
        var projectDir = process.cwd();
        this.saveCurrentPath(source);
        // clean the all binary output to make sure all changes in C/C++ code will get compiled
        this.cleanBinaryOutput();
        this.checkPackageFile();
        // check if node_modules subdirectory does exist
        var nodeModuleDir = path.join(projectDir, source, "node_modules");
        fs_extra.ensureDirSync(nodeModuleDir);
        // check if Python path is specified
        console.info("Compiling native module in: " + source + "...");
        var pythonFlag = this.options.pythonPath != null ? "--python=" + this.options.pythonPath : "";
        var debugBuildFlag = debugBuild ? "--debug" : "";
        var parallelBuildFlag = this.options.parallelBuild ? "--jobs " + os.cpus().length : "";
        // compile with node-gyp
        var nodeGypExecutable = path.join(projectDir, "./node_modules/.bin/node-gyp");
        child_process.execSync(nodeGypExecutable + " configure " + debugBuildFlag + " " + pythonFlag + " " + parallelBuildFlag, { stdio: [0, 1, 2] });
        child_process.execSync(nodeGypExecutable + " build " + debugBuildFlag + " " + parallelBuildFlag, { stdio: [0, 1, 2] });
        // rebuild it for Electron
        console.info("Rebuilding native module in: " + source + "...");
        parallelBuildFlag = this.options.parallelBuild ? "--parallel" : "";
        var electronRebuildExecutable = path.join(projectDir, "./node_modules/.bin/electron-rebuild");
        child_process.execSync(electronRebuildExecutable + " " + debugBuildFlag + " " + parallelBuildFlag + " --module-dir ./", { stdio: [0, 1, 2] });
        // find Node and Electron native module files
        var electronModuleFile = this.searchForElectronNativeFile();
        if (electronModuleFile == null) {
            this.restoreSavedPath();
            return null;
        }
        electronModuleFile = path.resolve(electronModuleFile);
        var nodeModuleFile = this.searchForNodeNativeFile();
        if (nodeModuleFile == null) {
            this.restoreSavedPath();
            return null;
        }
        // restore the previous path
        this.restoreSavedPath();
        return {
            nodeFile: nodeModuleFile,
            electronFile: electronModuleFile
        };
    };
    NativeModuleBuilder.prototype.checkPackageFile = function () {
        if (fs.existsSync("./package.json"))
            return;
        // if the NPM package.json file does not exist, then create the default one
        var config = {};
        var bindingConfig = JSON.parse(fs.readFileSync("./binding.gyp").toString());
        config.name = bindingConfig.targets[0].target_name || "default-name";
        config.version = "1.0.0";
        config.gypFile = true;
        config.main = "index.js";
        fs.writeFileSync("./package.json", JSON.stringify(config, null, 4));
    };
    NativeModuleBuilder.prototype.searchForElectronNativeFile = function () {
        var fileSearch = new FileSearch_1.FileSearch();
        var files = fileSearch.search("./bin", "node");
        if (files.length == 0) {
            console.log("[ERROR]: Cannot find the Electron native module file.");
            process.abort();
            return null;
        }
        return files[0];
    };
    NativeModuleBuilder.prototype.searchForNodeNativeFile = function () {
        var fileSearch = new FileSearch_1.FileSearch();
        var files = fileSearch.search("./build", "node");
        if (files.length == 0) {
            console.log("[ERROR]: Cannot find the NodeJS native module file.");
            process.abort();
            return null;
        }
        return files[0];
    };
    NativeModuleBuilder.prototype.saveCurrentPath = function (path) {
        this.savedCurrentPath = process.cwd();
        process.chdir(path);
    };
    NativeModuleBuilder.prototype.restoreSavedPath = function () {
        process.chdir(this.savedCurrentPath);
    };
    NativeModuleBuilder.prototype.cleanBinaryOutput = function () {
        rimraf.sync("./bin");
        rimraf.sync("./build");
    };
    NativeModuleBuilder.prototype.discoverBindingGyp = function (source) {
        var pathToCheck = path.join(source, "binding.gyp");
        if (fs.existsSync(pathToCheck))
            return source;
        if (this.autoDiscover == null)
            this.autoDiscover = new ModuleAutoDiscoverEngine_1.ModuleAutoDiscoverEngine();
        var filename = this.autoDiscover.findModuleByPackageName(source);
        if (filename != null)
            return path.dirname(filename);
        filename = this.autoDiscover.findModuleByDirectoryName(source);
        if (filename != null)
            return path.dirname(filename);
        return null;
    };
    return NativeModuleBuilder;
}());
exports.NativeModuleBuilder = NativeModuleBuilder;
//# sourceMappingURL=NativeModuleBuilder.js.map