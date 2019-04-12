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
import { ITranslationItem } from "./interface/translation";
import Complete from "../completion";

class TranslationProvider implements CompletionItemProvider {
    static items: Array<ITranslationItem> = [];
    static readonly wordPattern: RegExp = /[\w\-_\.\:\/]+/g;

    public static parse(obj: any) {
        function rawParse(obj: any, prefix?: string) {
            let result: Array<ITranslationItem> = [];
            for (const key in obj) {
                const value = obj[key];
                const name  = prefix ? `${prefix}.${key}` : key;
                if (value instanceof Object) {
                    result.push({name : name, value : "array(...)"});
                    result = result.concat(rawParse(value, name));
                }else {
                    result.push({ name : name, value : value});
                }
            }
            return result;
        }
        TranslationProvider.items = rawParse(obj);
    }

    private createCompletionItem(item: ITranslationItem) {
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
                Lang : {
                    has          : 0,
                    trans        : 0,
                    get          : 0,
                    getFromJson  : 0,
                    hasForLocale : 0,
                    transChoice  : 0,
                    choice       : 0,
                }
            },
            {
                __           : 0,
                trans        : 0,
                trans_choice : 0, 
            },
            {
                '@lang'      : 0,
            }
        );
        if (complete.allowCompletion(document, position)) {
            for (let item of TranslationProvider.items) {
                let completeItem =  this.createCompletionItem(item);
                completeItem.range = document.getWordRangeAtPosition(position, TranslationProvider.wordPattern);
                completionItems.push(completeItem);
            }
        }
        return completionItems;
    }

}

export = TranslationProvider;