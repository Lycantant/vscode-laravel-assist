import fs from "fs";
import path from "path";
import {  
    TextDocument,
    Position,
    CancellationToken,
    CompletionItem,
    CompletionList,
    CompletionContext,
    ProviderResult,
    DocumentLink,
    Range,
    Hover,
    workspace,
    Uri,
    Location,
} from "vscode";
import { IActionItem } from "./interface/action";
import { trim } from "../helpers";
import laravel from "../laravel";

//deprecated
class ControllerLink extends DocumentLink {
    filePath: string;
    funcName: string;
    constructor(range: Range, filePath: string, funcName: string) {
        super(range);
        this.filePath = filePath;
        this.funcName = funcName;
    }
}

class ControllerProvider {
    static items: Array<IActionItem> = [];
    static readonly controllerPattern: RegExp = /(['"])[\w\\]*Controller(@\w+)?\1/;

    public static parse(obj: any) {
        let result: Array<IActionItem> = [];
        for (const iter of obj) {
            result.push({
                baseName : iter.base,
                fullName : iter.full,
                method   : iter.method,
                script   : iter.script,
            });
        }
        ControllerProvider.items = result;
    }

    protected parseAction(action: string) {
        let split = action.split('@');
        let Controller, Method = null;
        if (split.length === 2) {
            Method      = split[1];
            Controller  = split[0];
        } else {
            Controller  = action;
        }
        return { Controller, Method };
    }

    protected getControllerPath(workspacePath: string ,controller: string): string | undefined {
        for (const iter of ControllerProvider.items) {
            if (iter.baseName === controller || iter.fullName.endsWith(controller)) {
                return iter.script;
            }
        }

        let configuration = workspace.getConfiguration('LaravelAssist');
        let pathControllers: Array<string>|undefined = configuration.get('pathControllers');
        if (Array.isArray(pathControllers)) {
            for (const iter of pathControllers) {
                let script = path.join(workspacePath, iter, controller);
                if (path.isAbsolute(iter)) {
                    script = path.join(iter, controller);
                }
                script += ".php";
                if (fs.existsSync(script)) {
                    return script;
                }
            }
        }
    }

    provideHover(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<Hover> {
        let linkRange = document.getWordRangeAtPosition(position, ControllerProvider.controllerPattern);
        if (linkRange) {
            let action = trim(document.getText(linkRange), ["'", '"']);
            const { Controller } = this.parseAction(action);
            const workspacePath = laravel.workspacePath();
            if (workspacePath) {
                const script = this.getControllerPath(workspacePath, Controller);
                if (script) return new Hover(path.relative(workspacePath, script));
            }
        }
    }

    async provideDefinition(document: TextDocument, position: Position, token: CancellationToken) {
        let linkRange = document.getWordRangeAtPosition(position, ControllerProvider.controllerPattern);
        if (linkRange) {
            let action = trim(document.getText(linkRange), ["'", '"']);
            const { Controller, Method } = this.parseAction(action);
            const workspacePath = laravel.workspacePath();
            if (workspacePath) {
                const script = this.getControllerPath(workspacePath, Controller);
                if (script) {
                    let document = await workspace.openTextDocument(script);
                    let pattern  = new RegExp(`function\\s+${Method}\\s*\\(([^)]*)`);
                    let target   = Uri.file(script);
                    let result   = pattern.exec(document.getText());
                    if (result) {
                        const line = document.positionAt(result.index);
                        return new Location(target, new Position(line.line, 0));
                    }
                    return new Location(target, new Position(0, 0));
                }
            }
        }
    }

    //deprecated
    provideDocumentLinks(document: TextDocument, token: CancellationToken): ProviderResult<DocumentLink[]> {
        let links: Array<DocumentLink> = [];
        let fullText: string = document.getText();

        let result : RegExpExecArray | null;
        let pattern = new RegExp(ControllerProvider.controllerPattern, 'g');

        const workspacePath = laravel.workspacePath();
        if (workspacePath) {
            while (result = pattern.exec(fullText)) {
                const action = trim(result[0], ["'", '"']);
                const line   = document.positionAt(result.index);
                const start  = new Position(line.line, line.character + 1);
                const end    = new Position(line.line, start.character + action.length);
                
                const { Controller, Method } = this.parseAction(action);
                const script = this.getControllerPath(workspacePath, Controller);

                if (script && fs.existsSync(script)) {
                    const range = new Range(start, end);
                    links.push(new ControllerLink(range , script, Method || "index"));
                }
            }
        }
        return links;
    }

    //deprecated
    async resolveDocumentLink(link: ControllerLink, token: CancellationToken){
        link.target = Uri.parse(`file:${link.filePath}`);

        let document = await workspace.openTextDocument(link.target);
        let pattern  = new RegExp(`function\\s+${link.funcName}\\s*\\(([^)]*)`);
        let result   = pattern.exec(document.getText());
        if (result) {
            const line = document.positionAt(result.index);
            link.target = Uri.parse(`file:${link.filePath}#${line.line + 1}`);
        } 
        return link;
    }
    
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let completionItems: CompletionItem[] = [];


        return completionItems;
    }
}

export = ControllerProvider;