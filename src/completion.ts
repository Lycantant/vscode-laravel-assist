import {  
    TextDocument,
    Position,
} from "vscode";
import { isEmpty } from "./helpers";
import parser from "./parser";
import {
    CompletionClass,
    CompletionFunction,
} from "./interface";

class Completion {
    private classItems : CompletionClass;
    private funcItems  : CompletionFunction;
    private bladeItems : CompletionFunction;

    constructor(c: CompletionClass, f: CompletionFunction, b: CompletionFunction = {}) {
        this.funcItems  = f;
        this.classItems = c;
        this.bladeItems = b;
    }
 
    public allowCompletion(document: TextDocument, position: Position) {
        let fullText: string = document.getText();
        return (
            this.testClass(document, position, fullText) ||  
            this.testFunction(document, position, fullText) ||
            this.testBladeFunction(document, position, fullText)
        );
    }

    public testClass(document: TextDocument, current: Position, content: string) {
        let result : RegExpExecArray | null;
        let pattern = parser.regexCallClass(Object.keys(this.classItems));
        if (isEmpty(this.classItems)) return false;

        while (result = pattern.exec(content)) {
            let start = document.positionAt(result.index);
            let end   = document.positionAt(pattern.lastIndex);

            //In section
            if (current.isAfterOrEqual(start) && current.isBeforeOrEqual(end)) {
                let items = this.classItems[result[3]];
                let funName = result[4];
                let argIndex = items[funName];

                //The regular expression search skips the beginning of the string,
                //Fill in whitespace characters so that the position is not offset
                let characters = " ".repeat(start.character) + result[0];
                let tokens = parser.phpParser.parseEval(characters);
                for (const i in tokens.children) {
                    let value = tokens.children[i];
                    let expression = value['expression'];
                    if (expression.kind === "call" && expression.what.kind === 'staticlookup') {
                        if (expression.what.offset.name === funName) {
                            argIndex = Array.isArray(argIndex) ? argIndex : [argIndex];
                            let expr = this.findCall(expression, argIndex, start, current);
                            if (expr) return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    public testFunction(document: TextDocument, current: Position, content: string) {
        let result : RegExpExecArray | null;
        let pattern = parser.regexCallFunction(Object.keys(this.funcItems));
        if (isEmpty(this.funcItems)) return false;

        while (result = pattern.exec(content)) {
            let start = document.positionAt(result.index);
            let end   = document.positionAt(pattern.lastIndex);
            
            //In section
            if (current.isAfterOrEqual(start) && current.isBeforeOrEqual(end)) {
                let funName = result[1];
                let argIndex = this.funcItems[funName];

                //The regular expression search skips the beginning of the string,
                //Fill in whitespace characters so that the position is not offset
                let characters = " ".repeat(start.character) + result[0];
                let tokens = parser.phpParser.parseEval(characters);
                for (const i in tokens.children) {
                    let value = tokens.children[i];
                    let expression = value['expression'];
                    if (expression.kind === "call" && expression.what.kind === 'classreference') {
                        if (expression.what.name === funName) {
                            argIndex = Array.isArray(argIndex) ? argIndex : [argIndex];
                            let expr = this.findCall(expression, argIndex, start, current);
                            if (expr) return true;
                        }
                    }
                }
            }
        }
        return false;
    } 

    public testBladeFunction(document: TextDocument, current: Position, content: string) {
        let result : RegExpExecArray | null;
        let pattern = parser.regexCallFunction(Object.keys(this.bladeItems));
        if (isEmpty(this.bladeItems)) return false;
        
        while (result = pattern.exec(content)) {
            let start = document.positionAt(result.index);
            let end   = document.positionAt(pattern.lastIndex);
            
            //In section
            if (current.isAfterOrEqual(start) && current.isBeforeOrEqual(end)) {
                let funName = result[1];
                let argIndex = this.bladeItems[funName];

                //The regular expression search skips the beginning of the string,
                //Fill in whitespace characters so that the position is not offset
                let characters = " ".repeat(start.character) + result[0];
                if (funName.startsWith('@')) {              //Blade function special.
                    const regex = new RegExp(funName,"gm");
                    funName = funName.replace('@', '_');    //Unable to parse @ character
                    characters = characters.replace(regex, funName);
                }
                let tokens = parser.phpParser.parseEval(characters);
                for (const i in tokens.children) {
                    let value = tokens.children[i];
                    let expression = value['expression'];
                    if (expression.kind === "call" && expression.what.kind === 'classreference') {
                        if (expression.what.name === funName) {
                            argIndex = Array.isArray(argIndex) ? argIndex : [argIndex];
                            let expr = this.findCall(expression, argIndex, start, current);
                            if (expr) return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    protected findCall(expression: any, argIndex: Number[], start: Position, current: Position) {
        function findArgs(expr: any): any {
            for (const key in expr.arguments) {
                if (~argIndex.indexOf(Number(key))) {
                    let val = expr.arguments[key];
                    if (val.kind === 'string') {
                        let loc = val.loc;
                        let p1 = new Position(start.line + loc.start.line - 1, loc.start.column - 1);
                        let p2 = new Position(start.line + loc.end.line - 1, loc.end.column - 1);
                        if (current.isAfterOrEqual(p1) && current.isBeforeOrEqual(p2)) {
                            return expr;
                        }
                    }

                    if (val.kind === 'call') {
                        return findArgs(val);
                    }
                }
            }
        }
        return findArgs(expression);
    }

}

export = Completion;