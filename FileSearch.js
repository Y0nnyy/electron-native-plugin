"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
// This function is taken from the URL given below:
// URL: https://gist.github.com/victorsollozzo/4134793
var FileSearch = /** @class */ (function () {
    function FileSearch() {
    }
    FileSearch.prototype.search = function (base, ext, excludedDirs) {
        if (excludedDirs === void 0) { excludedDirs = []; }
        return this.recFindByExt(base, ext, excludedDirs, undefined, undefined);
    };
    FileSearch.prototype.searchFiles = function (base, file, excludeDirs) {
        return this.searchFilesRecursive(base, file, excludeDirs, undefined, undefined);
    };
    FileSearch.prototype.searchFilesRecursive = function (base, searchedFile, excludeDirs, files, result) {
        var _this = this;
        files = files || fs.readdirSync(base);
        result = result || [];
        files.forEach(function (file) {
            var newbase = path.join(base, file);
            if (fs.statSync(newbase).isDirectory()) {
                if (excludeDirs.includes(file) == false) {
                    result = _this.searchFilesRecursive(newbase, searchedFile, excludeDirs, fs.readdirSync(newbase), result);
                }
            }
            else {
                if (file == searchedFile) {
                    result.push(newbase);
                }
            }
        });
        return result;
    };
    FileSearch.prototype.recFindByExt = function (base, ext, excludedDirs, files, result) {
        var _this = this;
        files = files || fs.readdirSync(base);
        result = result || [];
        files.forEach(function (file) {
            var newbase = path.join(base, file);
            if (fs.statSync(newbase).isDirectory() && !excludedDirs.includes(file)) {
                result = _this.recFindByExt(newbase, ext, excludedDirs, fs.readdirSync(newbase), result);
            }
            else {
                if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
                    result.push(newbase);
                }
            }
        });
        return result;
    };
    return FileSearch;
}());
exports.FileSearch = FileSearch;
