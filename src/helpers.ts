import fs from "fs";
import path from "path";
import {  } from "vscode";

function mkdirsSync(dirname: string) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

function toInteger(num: number) {
    return num * 1 | 0 || 0;
}

function randomNumber(Min: number, Max: number): number {
    const Range = Max - Min;
    const Rand = Math.random();
    return (Min + Math.round(Rand * Range));
}

function randomString(len: number) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let text = "";
    for (let i = 0; i < len; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function stringToBoolean(src: string): boolean {
    switch (src.toLowerCase().trim()) {
        case "true": case "yes": case "1": case "on": return true;
        case "false": case "no": case "0": case "off": case undefined: case null: return false;
        default: return Boolean(src);
    }
}

function deleteFile(dir: string, file: string) {
    return new Promise(function (resolve, reject) {
        let filePath = path.join(dir, file);
        fs.lstat(filePath, function (err, stats) {
            if (err) {
                return reject(err);
            }
            if (stats.isDirectory()) {
                resolve(deleteDirectory(filePath));
            } else {
                fs.unlink(filePath, function (err2) {
                    if (err2) {
                        return reject(err2);
                    }
                    resolve();
                });
            }
        });
    });
}

function deleteDirectory(dir: string) {
    return new Promise(function (resolve, reject) {
        fs.access(dir, function (err) {
            if (err) {
                return reject(err);
            }
            fs.readdir(dir, function (err2, files) {
                if (err2) {
                    return reject(err2);
                }
                Promise.all(files.map(function (file) {
                    return deleteFile(dir, file);
                })).then(function () {
                    fs.rmdir(dir, function (err3) {
                        if (err3) {
                            return reject(err3);
                        }
                        resolve();
                    });
                }).catch(reject);
            });
        });
    });
}

function walk(srcDir: string, callback: (path: string, stat: fs.Stats) => void) {
    fs.readdir(srcDir, function (err, files) {
        if (err) {
            throw new Error(err.message);
        }
        files.forEach(function (name) {
            const filePath = path.join(srcDir, name);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                callback(filePath, stat);
            } else if (stat.isDirectory()) {
                walk(filePath, callback);
            }
        });
    });
}

function tryParseJSON(jsonString: string) {
    try {
        let o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    } catch (e) { }
    return false;
}

function wordContains(word: string, str: string) {
    let reg = eval("/" + word + "/ig");
    return reg.test(str);
}

function trim(str: string, charList: string | Array<string>) {
    let whitespace = [
        ' ',
        '\n',
        '\r',
        '\t',
        '\f',
        '\x0b',
        '\xa0',
        '\u2000',
        '\u2001',
        '\u2002',
        '\u2003',
        '\u2004',
        '\u2005',
        '\u2006',
        '\u2007',
        '\u2008',
        '\u2009',
        '\u200a',
        '\u200b',
        '\u2028',
        '\u2029',
        '\u3000'
    ].join('');
    let l = 0;
    let i = 0;
    str += '';

    if (charList) {
        whitespace = (charList + '').replace(/([[\]().?/*{}+$^:])/g, '$1')
    }

    l = str.length;
    for (i = 0; i < l; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(i)
            break;
        }
    }

    l = str.length;
    for (i = l - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1)
            break;
        }
    }

    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
}

function isEmpty(v: any) {
    switch (typeof v) {
        case "undefined":
            return true;
        case "string":
            if (v.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, "").length == 0)
                return true;
            break;
        case "boolean":
            if (!v) return true;
            break;
        case "number":
            if (0 === v || isNaN(v)) return true;
            break;
        case "object":
            if (null === v || v.length === 0) return true;
            for (var i in v) {
                return false;
            }
            return true;
    }
    return false;
}


export {
    mkdirsSync,
    toInteger,
    randomNumber,
    randomString,
    stringToBoolean,
    deleteDirectory,
    walk,
    tryParseJSON,
    wordContains,
    trim,
    isEmpty,
};