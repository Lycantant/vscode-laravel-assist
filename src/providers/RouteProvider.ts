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
import { IRouteItem } from "./interface/route";
import Complete from "../completion";

class RouteProvider implements CompletionItemProvider {
    static items: Array<IRouteItem> = [];
    static readonly wordPattern: RegExp = /[\w\-_\.\:\/]+/g;

    public static parse(obj: any) {
        let result: Array<IRouteItem> = [];
        for (const i in obj) {
            const value = obj[i];
            result.push({
                name       : value.name,
                action     : value.action,
                method     : value.method,
                parameters : value.parameters,
                uri        : value.uri,
            });
        }
        RouteProvider.items = result;
    }
    private createCompletionItem(item: IRouteItem) {
        if (item.name) {
            let completeItem = new CompletionItem(item.name, CompletionItemKind.Value);
            completeItem.detail = `${item.action}\n\n${item.method}:${item.uri}`;
            return completeItem;
        }
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let completionItems: CompletionItem[] = [];

        //complete up
        let complete = new Complete(
            {
                URL : {
                    route : 0,
                    signedRoute : 0,
                    temporarySignedRoute :0,
                }
            },
            {
                route : 0
            }
        );
        if (complete.allowCompletion(document, position)) {
            for (let item of RouteProvider.items) {
                let completeItem =  this.createCompletionItem(item);
                if (completeItem instanceof CompletionItem) {
                    completeItem.range = document.getWordRangeAtPosition(position, RouteProvider.wordPattern);
                    completionItems.push(completeItem);
                }
            }
        }
        return completionItems;
    }
}

export = RouteProvider;