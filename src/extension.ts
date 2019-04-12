// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import fs from "fs";
import path from "path";
import {
    languages,
    ExtensionContext,
    window,
    commands,
    workspace,
    TextDocument,
} from 'vscode';
import {
    mkdirsSync, randomString, tryParseJSON
} from "./helpers";
import laravel from "./laravel";

import RouteProvider from "./providers/RouteProvider";
import ConfigProvider from "./providers/ConfigProvider";
import MixProvider from "./providers/MixProvider";
import ViewProvider from "./providers/ViewProvider";
import TranslationProvider from "./providers/TranslationProvider";
import ControllerProvider from "./providers/ControllerProvider";

let updateTimer: NodeJS.Timeout;
let updatePending: Boolean = false;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
    if (laravel.workspaceVerify()) {
        const LANGUAGES =
        [
            { scheme: 'file', language: 'php' },
            { scheme: 'file', language: 'blade' },
        ];
        const TRIGGER_CHARACTERS = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"'.`;

        const cachePath = path.join(__dirname, './../assets/cache');
        fs.existsSync(cachePath) || mkdirsSync(cachePath);

        //Script file
        const fileName = randomString(8);
        const kernelPath = path.join(cachePath, fileName);
        fs.writeFileSync(kernelPath, laravel.getKernel());     
        new laravel(kernelPath);

        updateIntellisense();
  
        //Providers loader
        context.subscriptions.push(languages.registerCompletionItemProvider(LANGUAGES, new RouteProvider, ...TRIGGER_CHARACTERS));
        context.subscriptions.push(languages.registerCompletionItemProvider(LANGUAGES, new ConfigProvider, ...TRIGGER_CHARACTERS));
        context.subscriptions.push(languages.registerCompletionItemProvider(LANGUAGES, new MixProvider, ...TRIGGER_CHARACTERS));
        context.subscriptions.push(languages.registerCompletionItemProvider(LANGUAGES, new ViewProvider, ...TRIGGER_CHARACTERS));
        context.subscriptions.push(languages.registerCompletionItemProvider(LANGUAGES, new TranslationProvider, ...TRIGGER_CHARACTERS));
        context.subscriptions.push(languages.registerCompletionItemProvider(LANGUAGES, new ControllerProvider, ...TRIGGER_CHARACTERS));
        
        context.subscriptions.push(languages.registerHoverProvider(LANGUAGES, new ControllerProvider));
        context.subscriptions.push(languages.registerDefinitionProvider(LANGUAGES, new ControllerProvider));

        //Commands register
        let disposable = [];
        disposable[0] = commands.registerCommand('extension.updateIndexing', updateIntellisense);

        //Events register
        workspace.onDidSaveTextDocument(function(event: TextDocument) {
            if (isNeedUpdate(event.fileName)) {
                if (!updatePending) {
                    clearTimeout(updateTimer);
                    updateTimer = setTimeout(() => {
                        updatePending = true;
                        updateIntellisense();
                        updatePending = false;
                    }, 3000);
                }
            }
        });
    }
}

function isNeedUpdate(fileName: string): boolean {
    return (
        fileName.endsWith("Controller.php") || fileName.endsWith(".blade.php") ||
        !!fileName.match(/\/config\/\w+\.php/) || !!fileName.match(/\/routes\/\w+\.php/)
    );
}

function updateIntellisense() {
    try {
        const data = laravel.runnerKernel();
        const result = tryParseJSON(data);
        if (result) {
            ConfigProvider.parse(result.config);
            RouteProvider.parse(result.route);
            ViewProvider.parse(result.view);
            TranslationProvider.parse(result.trans);
            ControllerProvider.parse(result.actions);
        }else {
            window.showErrorMessage(data);
        }
        MixProvider.parse();
    } catch (error) {
        console.error(error);
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
    fs.unlinkSync(laravel.kernelPath);
}


