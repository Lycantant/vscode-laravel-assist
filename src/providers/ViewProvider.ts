import path from "path";
import {  
    TextDocument,
    Position,
    CancellationToken,
    CompletionItem,
    CompletionList,
    CompletionContext,
    ProviderResult,
    CompletionItemKind,
    CompletionItemProvider,
} from "vscode";
import { walk } from "../helpers";
import { IViewItem } from "./interface/view";
import Complete from "../completion";

class ViewProvider implements CompletionItemProvider {
    static items: Array<IViewItem> = [];
    static readonly bladeSuffix: string = ".blade.php";
    static readonly wordPattern: RegExp = /[\w\-_\.\:\/]+/g;

    public static parse(obj: any) {
        ViewProvider.items = [];

        for (const path of obj.paths) {
            ViewProvider.getViews(path);
        }
        
        for (const namespace in obj.views) {
            for (const path of obj.views[namespace]) {
                ViewProvider.getViews(path, namespace);
            }
        }
    }

    private static getViews(base: string, namespace?: string){
        walk(base, (fullPath) => {
            if (fullPath.endsWith(ViewProvider.bladeSuffix)) {
                let fileName = path.relative(base, fullPath);
                fileName = fileName.replace(ViewProvider.bladeSuffix, '');
                fileName = fileName.replace('/', '.');
                if (namespace) {
                    ViewProvider.items.push({
                        name : `${namespace}::${fileName}`,
                        path : fullPath,
                    });
                }else {
                    ViewProvider.items.push({
                        name : fileName,
                        path : fullPath,
                    });
                }
            }
        });
    }

    private createCompletionItem(item: IViewItem) {
        let completeItem = new CompletionItem(item.name, CompletionItemKind.Value);
        if (item.path)
            completeItem.detail = item.path;
        return completeItem;
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let completionItems: CompletionItem[] = [];

        //complete up
        let complete = new Complete(
            {
                View: {}
            },
            {
                view        : 0,
                links       : 0,
            },
            {
                "@extends"  : 0,
                "@component": 0,
                "@include"  : 0,
                "@each"     : 0,
            }
        );
        if (complete.allowCompletion(document, position)) {
            for (let item of ViewProvider.items) {
                let completeItem =  this.createCompletionItem(item);
                completeItem.range = document.getWordRangeAtPosition(position, ViewProvider.wordPattern);
                completionItems.push(completeItem);
            }
        }
        return completionItems;
    }
}

export = ViewProvider;