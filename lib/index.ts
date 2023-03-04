import { RequestPayload } from "../model/storage";
import { CreateBucket, OptionsSchema, RequestSchema } from "../model/request";
import { post, toInfluxFormat, get } from "./web";
import { toBase64 } from "./util";
import { QueryV1Response, CreateBucketDBResponse, BucketsDBResponse } from "../model/response";

export interface WriteV1QueryParams {
    precision?: 'n' | 'u' | 'ms' | 's' | 'm' | 'h'
    /** password */
    p?: string 
    /** username */
    u?: string
    /** retention policy */
    rp?:string
    consistency?:'any' | 'one' | 'quorum' | 'all'
}

export class InfluxDB {
    private request: RequestSchema;
    constructor(request: RequestSchema) {
        this.request = request;
    }

    /**
     * To write points to v1 db.
     * @param payload : RequestPayload
     * @param db : string
     * @param queryParams : Record<string, string> - optional
     * @returns : Promise<any>
     */
    writeV1(payload: RequestPayload, db: string, queryParams?: WriteV1QueryParams) : Promise<any> {
        let options: OptionsSchema = { ...this.request, path: `/write?db=${db}`, headers: this.setHeaders("text/plain") };
        if (queryParams) {
            const qs = Object.entries(queryParams).map(([k, v]) => `${k}=${v}`).join("&");
            options.path += "&" + qs
        }
        options = { ...options, headers: this.setHeaders("text/plain") };
        return post<String>(options, toInfluxFormat(payload));
    }

    /**
     * To write points V2 db.
     * @param payload 
     * @param org 
     * @param bucket 
     * @param precision
     * @returns : Promise<any>
     */
    writeV2(payload: RequestPayload, org: string, bucket: string, precision?: 'ns' | 'ms' | 'us') : Promise<any> {
        const options: OptionsSchema = { 
            ...this.request, 
            path: `/api/v2/write?org=${org}&bucket=${bucket}`,
            headers: this.setHeaders("text/plain")
        }
        
        if (precision) {
            options.path += `&precision=${precision}`
        }

        return post<String>(options, toInfluxFormat(payload));
    }


    /**
     * Get records from InfluxDB >V1.0
     * @param db : string
     * @param influxQuery : string (accepts influxQuery(SQL style)) 
     * @returns : Promise<any>
     */
    queryV1(db: string, influxQuery: string) : Promise<any> {
        let options: OptionsSchema = { ...this.request, ...{ path: `/query?db=${db}&q=${influxQuery}` } };
        options = { ...options, headers: this.setHeaders() };
        return new Promise((resolve, reject) => {
            get<QueryV1Response>(options)
                .then((result: QueryV1Response) => {
                    if(result.results.length && result.results[0].series.length) {
                        resolve(result.results);
                    } else {
                        resolve([]);
                    }
                }).catch(error => {
                    reject(error);
                });
        })
    }

    /**
     * Get records from InfluxDB V2.0
     * @param org : string
     * @param fluxQuery : string (accepts flux query only)
     * @returns : Promise<any>
     */
    queryV2(org: string, fluxQuery: string) : Promise<any> {
        let options: OptionsSchema = { ...this.request, ...{ path: `/api/v2/query?org=${org}` } };
        options = { ...options, headers: this.setHeaders("application/vnd.flux") };
        return post<String>(options, fluxQuery)
    }

    private setHeaders(contentType?: string) {
        let headers: object = this.request.username && this.request.password 
            ? { "Authorization": `Basic ${toBase64(this.request.username + ":" + this.request.password)}` }
            : this.request.token
            ? { "Authorization": `Token ${this.request.token}` }
            : {};
        headers = contentType ? { ...headers, "Content-Type": contentType } : headers;
        headers = { 
            ...headers,
            "Host": this.request.host,
            "Accept": "*/*",
            "Connection": "keep-alive",
            "Cache-Control": "no-cache" 
        };
        return headers;
    }

    /**
     * Create A Bucket
     * @param orgID  : string (Organisation ID)
     * @param name : string (Name of the bucket)
     * @param duration : numner (In seconds)
     * @returns : Promise<{bucketId: string, name: string, createdAt: string}>
     */
    createBucket(orgID: string, name: string, duration: number): Promise<{bucketId: string, name: string, createdAt: string, retentionTime: number}> {
        return new Promise((resolve, reject) => {
            const payload: CreateBucket = {
                orgID,
                name,
                retentionRules: [{
                    type: "expire",
                    everySeconds: duration,
                    shardGroupDurationSeconds: 0
                }],
            }
            const options: OptionsSchema = { ...this.request,  path: `/api/v2/buckets`, headers: this.setHeaders() };
            post<CreateBucket>(options, payload)
                .then(value => {
                    const bucket: CreateBucketDBResponse = JSON.parse(value);
                    resolve({ bucketId: bucket.id, name: bucket.name, createdAt: bucket.createdAt, retentionTime: bucket.retentionRules[0].everySeconds });
                }).catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Returns a list of all the user created buckets
     * @param orgID : string (Organisation ID)
     * @returns : Promise<Array<{bucketId: string, name: string, createdAt: string}>>
     */
    listBuckets(orgID: string): Promise<Array<{bucketId: string, name: string, createdAt: string, retentionTime: number}>> {
        const options: OptionsSchema = { ...this.request, path: `/api/v2/buckets?orgID=${orgID}`, headers: this.setHeaders() };
        return new Promise((resolve, reject) => {
            get<BucketsDBResponse>(options)
                .then((response: BucketsDBResponse) => {
                    if(response.buckets && response.buckets.length) {
                        //return array of user created buckets with their id and name
                        resolve(response.buckets.filter(bucket => bucket.type !== "system").map(bucket => { return { bucketId: bucket.id, name: bucket.name, createdAt: bucket.createdAt, retentionTime: bucket.retentionRules[0].everySeconds } }));
                    } else {
                        resolve([])
                    }
                }).catch(error => {
                    reject(error);
                });
        })
    }

    /**
     * Returns the bucket details.
     * @param orgID : string (Organisation ID)
     * @param bucket : { id?: string, name?: string } (Fetch by either bucket id or bucket name)
     * @returns : Promise<{bucketId: string, name: string, createdAt: string}>
     */
    getBucket(orgID: string, bucket: { id?: string, name?: string }): Promise<{bucketId: string, name: string, createdAt: string, retentionTime: number} | null> {
        const options: OptionsSchema = { ...this.request, path: `/api/v2/buckets?orgID=${orgID}`, headers: this.setHeaders() };
        options.path += bucket.id ? `&id=${bucket.id}` : bucket.name ? `&name=${bucket.name}` : "";
        return new Promise((resolve, reject) => {
            get<BucketsDBResponse>(options)
                .then((response: BucketsDBResponse) => {
                    if(response.buckets && response.buckets.length) {
                        const bucket = response.buckets[0];
                        //return array of user created buckets with their id and name
                        resolve({ bucketId: bucket.id, name: bucket.name, createdAt: bucket.createdAt, retentionTime: bucket.retentionRules[0].everySeconds });
                    } else {
                        resolve(null);
                    }
                }).catch(error => {
                    reject(error);
                });
        })
    }
}
