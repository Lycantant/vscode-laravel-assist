const engine = require('php-parser');
const phpParser = new engine({
    parser: {
        extractDoc: true,
        php7: true,
        suppressErrors: true,
    },
    ast: {
        withPositions: true
    }
});

class Parser {
    static phpParser = phpParser;

    public static regexCallClass(classes: Array<string>) {
        //https://stackoverflow.com/a/35271017/5134885
        var regexPattern = `(((${classes.join('|')})::)([@A-Za-z0-9_]+))((\\()((?:[^)(]+|\\((?:[^)(]+|\\([^)(]*\\))*\\))*)(\\)|$))`;
        for (var counter = 0; counter < 12; counter++) {
            regexPattern = regexPattern.replace("\\([^)(]*\\)", "\\((?:[^)(]+|\\([^)(]*\\))*(\\)|$)");
        }
        return new RegExp(regexPattern, "g");
    }
    
    public static regexCallFunction(funcs: Array<string>) {
        //https://stackoverflow.com/a/35271017/5134885
        var regexPattern = `(${funcs.join('|')})((\\()((?:[^)(]+|\\((?:[^)(]+|\\([^)(]*\\))*\\))*)(\\)|$))`;
        for (var counter = 0; counter < 12; counter++) {
            regexPattern = regexPattern.replace("\\([^)(]*\\)", "\\((?:[^)(]+|\\([^)(]*\\))*(\\)|$)");
        }
        return new RegExp(regexPattern, "g");
    }
}

export = Parser;