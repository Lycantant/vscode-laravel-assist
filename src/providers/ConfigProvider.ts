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
import {  } from "../helpers";
import { IConfigItem } from "./interface/config";
import Complete from "../completion";

class ConfigProvider implements CompletionItemProvider {
    static items: Array<IConfigItem> = [];
    static readonly wordPattern: RegExp = /[\w\-_\.\:\/]+/g;

    public static parse(obj: any) {
        function rawParse(obj: any, prefix?: string) {
            let result: Array<IConfigItem> = [];
            for (const key in obj) {
                const value = obj[key];
                const name  = prefix ? `${prefix}.${key}` : key;
                if (value instanceof Array) {
                    result.push({name : name, value : "array(...)"});
                }else if (value instanceof Object) {
                    result.push({name : name, value : "array(...)"});
                    result = result.concat(rawParse(value, name));
                }else {
                    result.push({ name : name, value : value});
                }
            }
            return result;
        }
        ConfigProvider.items = rawParse(obj);
    }

    private createCompletionItem(item: IConfigItem) {
        let completeItem = new CompletionItem(item.name, CompletionItemKind.Value);
        if (item.value)
            completeItem.detail = item.value.toString();
        return completeItem;
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let completionItems: CompletionItem[] = [];
        
        //complete up
        let complete = new Complete(
            {
                Config : {
                    get      : 0,
                    set      : 0,
                    has      : 0,
                    prepend  : 0,
                    push     : 0,
                }
            },
            {
                config : 0
            }
        );
        if (complete.allowCompletion(document, position)) {
            for (let item of ConfigProvider.items) {
                let completeItem =  this.createCompletionItem(item);
                completeItem.range = document.getWordRangeAtPosition(position, ConfigProvider.wordPattern);
                completionItems.push(completeItem);
            }
        }
        return completionItems;
    }
}

export = ConfigProvider;