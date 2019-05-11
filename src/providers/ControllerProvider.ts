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

class ControllerLink extends DocumentLink {
    script: string;
    controller: string;
    method: string | null;
    constructor(range: Range, script: string, controller: string, method: string | null) {
        super(range);
        this.script = script;
        this.controller = controller;
        this.method = method;
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

    protected basename(namespace: string) {
        return namespace.split('\\').reverse()[0];
    }

    protected getControllerPath(workspacePath: string ,controller: string): string | undefined {
        for (const iter of ControllerProvider.items) {
            if (
                iter.baseName === controller ||
                this.basename(iter.fullName) === this.basename(controller)
            ) {
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

    protected getMethodPosition(document: TextDocument, methodName: string) {
        let pattern = new RegExp(`function\\s+${methodName}\\s*\\(([^)]*)`);
        let result  = pattern.exec(document.getText());
        if (result) {
            return document.positionAt(result.index);
        }
    }

    protected getClassPosition(document: TextDocument, className: string) {
        let pattern = new RegExp(`class\\s+${className}\\s+`);
        let result  = pattern.exec(document.getText());
        if (result) {
            return document.positionAt(result.index);
        }
    }

    protected getPosition(document: TextDocument, Controller: string, Method: string | null) {
        if (Method) {
            let position = this.getMethodPosition(document, Method);
            if (position) return position;
        }
        return this.getClassPosition(document, Controller) || new Position(0, 0);
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
                    let target   = Uri.file(script);
                    let document = await workspace.openTextDocument(script);
                    let position = this.getPosition(document, Controller, Method);
                    return new Location(target, position);
                }
            }
        }
    }

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

                const { Controller, Method } = this.parseAction(action);
                const script = this.getControllerPath(workspacePath, Controller);
                if (script) {
                    const start     = new Position(line.line, line.character + 1);
                    const end       = new Position(line.line, start.character + action.length);
                    const linkRange = new Range(start, end);
                    links.push(new ControllerLink(linkRange, script, Controller, Method));
                }
            }
        }
        return links;
    }

    async resolveDocumentLink(link: ControllerLink, token: CancellationToken){
        let target   = Uri.file(link.script);
        let document = await workspace.openTextDocument(target);
        let position = this.getPosition(document, link.controller, link.method);

        link.target = Uri.parse(`file:${link.script}#${position.line + 1}`);
        return link;
    }
    
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let completionItems: CompletionItem[] = [];


        return completionItems;
    }
}

export = ControllerProvider;