export interface IRouteItem {
    method     : Array<string>;
    uri        : string;
    name?      : string;
    action     : string;            //maybe Closure
    parameters : Array<string>;
}