export interface CompletionFunction {
    [name : string] : number | number[];
}

export interface CompletionClass {
    [name : string] : CompletionFunction;
}


