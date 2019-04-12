import fs from "fs";
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
    workspace,
} from "vscode";
import {  } from "../helpers";
import { IMixItem } from "./interface/mix";
import laravel from "../laravel";
import Complete from "../completion";

class MixProvider implements CompletionItemProvider {
    static items: Array<IMixItem> = [];
    static readonly wordPattern: RegExp = /[\w\-_\.\:\/]+/g;

    public static parse() {
        let result: Array<IMixItem> = [];
        
        let configuration = workspace.getConfiguration('LaravelAssist');
        let mix_manifest: string|undefined = configuration.get('mix-manifest');
        if (mix_manifest) {
            let filePath = laravel.workspacePath(mix_manifest);
            if (filePath && fs.existsSync(filePath)) {
                const mixes = JSON.parse(fs.readFileSync(filePath, {encoding : "utf8"}));
                for (const key in mixes) {
                    result.push({
                        path: key.startsWith('/') ? key.slice(1) : key,
                        value : mixes[key]
                    });
                }
            }
        }
        MixProvider.items = result;
    }

    private createCompletionItem(item: IMixItem) {
        let completeItem = new CompletionItem(item.path, CompletionItemKind.Value);
        if (item.value)
            completeItem.detail = item.value;
        return completeItem;
    }

    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): ProviderResult<CompletionItem[] | CompletionList> {
        let completionItems: CompletionItem[] = [];

        //complete up
        let complete = new Complete(
            {

            },
            {
                mix : 0
            }
        );
        if (complete.allowCompletion(document, position)) {
            for (let item of MixProvider.items) {
                let completeItem =  this.createCompletionItem(item);
                completeItem.range = document.getWordRangeAtPosition(position, MixProvider.wordPattern);
                completionItems.push(completeItem);
            }
        }
        return completionItems;
    }
}

export = MixProvider;