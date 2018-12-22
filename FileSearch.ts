import fs = require("fs");
import path = require("path");

// This function is taken from the URL given below:
// URL: https://gist.github.com/victorsollozzo/4134793
export class FileSearch {

    search(base, ext, excludedDirs = []) {
        return this.recFindByExt(base, ext, excludedDirs, undefined, undefined);
    }

    searchFiles(base: string, file: string, excludeDirs: string[]) {
        return this.searchFilesRecursive(base, file, excludeDirs, undefined, undefined);
    }

    private searchFilesRecursive(base: string, searchedFile: string, excludeDirs: string[], files, result) {
        files = files || fs.readdirSync(base) 
        result = result || [] 

        files.forEach(file =>
             {
                var newbase = path.join(base,file)
                if ( fs.statSync(newbase).isDirectory() )
                {
                    if(excludeDirs.includes(file) == false) {
                        result = this.searchFilesRecursive(newbase,searchedFile, excludeDirs,fs.readdirSync(newbase),result)
                    }
                }
                else
                {
                    if (file == searchedFile)
                    {
                        result.push(newbase)
                    } 
                }
            }
        )
        return result
    }

    private recFindByExt(base,ext,excludedDirs,files,result)
    {
        files = files || fs.readdirSync(base) 
        result = result || [] 

        files.forEach(file =>
             {
                var newbase = path.join(base,file)
                if ( fs.statSync(newbase).isDirectory() && !excludedDirs.includes(file))
                {
                    result = this.recFindByExt(newbase,ext,excludedDirs,fs.readdirSync(newbase),result)
                }
                else
                {
                    if ( file.substr(-1*(ext.length+1)) == '.' + ext )
                    {
                        result.push(newbase)
                    } 
                }
            }
        )
        return result
    }
}