import * as http from "http";
import * as https from "https";
import { OptionsSchema } from "../model/request";
import { RequestPayload, DataPayload } from "../model/storage";

function setRequestOptions(requestOptions: OptionsSchema) {
    //set the options
    let options: any = {
        hostname: requestOptions.host,
        path: encodeURI(requestOptions.path),
        headers: requestOptions.headers    
    }
    options = requestOptions.port ? { ...options, ...{ port: requestOptions.port } } : options;
    return options;
}
/**
 * Write the data to influxdb through its http api interface
 * @param requestOptions : OptionsSchema
 * @param data : T
 * @returns 
 */
export async function post<T>(requestOptions: OptionsSchema, data: T): Promise<any> {
    //set protocol
    const module = requestOptions.protocol === "http" ? http : https;
    const options = { ...setRequestOptions(requestOptions), method: "POST" };
    const chunks: Array<any> = [];
    //add content-length header
    options.headers["Content-Length"] = Buffer.byteLength(JSON.stringify(data), "utf-8");

    //return promise of the response
    return new Promise((resolve: any, reject: any) => {
        const request = module.request(options, (listener: any) => {
            listener.on("data", (data: any) => {
                chunks.push(data);
            });
            listener.on("error", (error: any) => {
                reject(error);
            });
            listener.on("end", () => {
                let result = chunks.length ? Buffer.concat(chunks).toString() : chunks;
                if(listener.statusCode >= 300)
                    reject(result);
                else
                    resolve(result);
            });
        });

        request.on("error", (error: any) => {
            reject(error);
        });
        //write data
        const payload = typeof data === "string" ? data : JSON.stringify(data);
        request.write(payload);
        request.end();
    });
}

/**
 * Query the data from influxdb with its http api interface
 * @param requestOptions : OptionsSchema
 * @returns Promise<any>
 */
export async function get<T>(requestOptions: OptionsSchema): Promise<any> {
    //set protocol
    const module = requestOptions.protocol === "http" ? http : https;
    //set request options
    const options = setRequestOptions(requestOptions);
    const chunks: Array<any> = [];
    //return promise
    return new Promise((resolve, reject) => {
        module.get(options, (listener) => {
            listener.on("data", (data: any) => {
                chunks.push(data);
            });
            listener.on("error", (error: any) => {
                reject(error);
            });
            listener.on("end", () => {
                //return result at the end of readable stream
                let result : T = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : [];
                resolve(result);
            });
        });
    });
}

/**
* Transform any object to influxdb supported format
* @param inputData : RequestPayload
*/
export function toInfluxFormat(inputData: RequestPayload) {
    let result = "";
    const inputPayloadList: Array<DataPayload> = [ ...inputData.payload ];
    //itereate over the points
    for( let i = 0; i < inputPayloadList.length; i++ ) {
        const serializedTags : Array<string> = [];
        const serializedFields : Array<string> = [];
        const inputPayload = {...inputPayloadList[i] };
        //iterate over the keys
        for (const key in inputPayload) {
            if (Object.prototype.hasOwnProperty.call(inputPayload, key)) {
                if(inputData.tags.includes(key)) {
                    //array of tags. Eg.: ["tag1=value1", "tag2=value2",....]
                    serializedTags.push(`${key}=${inputPayload[key]}`);
                } else {
                    //array of fields. Eg.: ["field1=value1", "field2=value2",....]
                    let field = inputPayload[key];
                    if (typeof inputPayload[key] === "string") {
                        if (!(inputPayload[key] as string).match(/\d+i/)) {
                            field = `"${inputPayload[key]}"`;
                        }
                    }
                    serializedFields.push(`${key}=${field}`);
                }
                //delete the entry from input
                delete inputPayload[key];
            }
        }
        //if result already contains an entry, then it's multi data insertion, hence first append "\n" to the end
        result = result ? result + "\n" : result;

        //if tags present then comma after measurement field.
        result += inputData.tags.length 
            ? `${inputData.measurement},${serializedTags.join(",")} ${serializedFields.join(",")}` 
            : `${inputData.measurement} ${serializedFields.join(",")}`;
        
        result += inputData.timestamp ? ` ${inputData.timestamp}` : ""; //update timestamp if explicitely provided
    }
    return result;
}

