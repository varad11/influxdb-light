export interface DataPayload {
    [index: string]: string | boolean | number 
};
export interface RequestPayload {    
    measurement: string;
    tags: Array<string>;
    payload: Array<DataPayload>;
}