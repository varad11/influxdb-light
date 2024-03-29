# influxdb-light
A light-weight client to read and write data to InfluxDb V1 and V2.  
It supports both InfluxQL(SQL) and Flux queries.  
This light-weight client is incredibly easy to use.  
Handling of tags and fields is straightforward with no additional complexity.  

## Good to know
You have to create a DBRP mapping if you want to use InfluxQL(SQL) on your V2 buckets.  
For more details on DBRP mapping please read this [guide](https://varad11.medium.com/using-influxql-sql-with-influxdb-2-x-x-fddb5549dc0).  
## Installation
```sh
npm i influxdb-light
```

## Usage
### InfluxDb Version 1 Example
```typescript
import { InfluxDB } from "influxdb-light";

const request = { 
    host: "localhost", 
    port: "8086", 
    protocol: "http", 
    username: "<username>", 
    password: "<password>" 
};
const influxDb = new InfluxDB(request);
const dbName = "demo1";
const measurement = "energy";

//Write to InfluxDb
influxDb.writeV1({
            measurement: measurement,
            payload: [{ //You can store multiple data point at once.
                deviceId: "d007",
                location: "L007",
                type: 7,
                enabled: true,
                valueX: 100,
                valueY: 120,
                ip: "192.168.0.2"
            }, {
                deviceId: "d009",
                location: "L009",
                type: 9,
                enabled: false,
                valueX: 110,
                valueY: 130,
                ip: "192.168.0.3"
            }],
            tags: ["deviceId", "location", "type", "enabled"],
            timestamp: 1664821800000000000 //timestamp is optional. Use this if you want to explicitly set different time.
        }, 
        dbName,
        // queryParams is optional. see WriteV1QueryParams
        {
            rp: 'autogen', // retention policy
            consistency: 'all'
        })
        .then(res => {
            console.log(res);
            //Output: [] //Empty array indicates data added
        }).catch(err => {
            console.error(err);
        });

//Read from InfluxDb
influxDb.queryV1(dbName, `SELECT * FROM ${measurement} WHERE "deviceId"='d007'`)
    .then(res => {
        console.log(res);
        //Output: 
        // [
        //     {
        //         "statement_id": <number>,
        //         "series": [
        //             {
        //                 "name": <string>,
        //                 "columns": Array<string>,
        //                 "values": Array<Array<string | number | boolean | null>>
        //             }
        //         ]
        //     }
        // ]
    }).catch(err => {
        console.error(err);
    });
```

### InfluxDb Version 2 Example
```typescript
import { InfluxDB } from "influxdb-light";

const request = { 
    host: "localhost", 
    port: "8086", 
    protocol: "http", 
    token: "<token_value>" 
};
const influxDb = new InfluxDB(request);
const org = "demo_org";
const dbName = "demo1";
const measurement = "energy";
const precision = "ns"; // precision is unit about timestamp of payload. and it's optional parameter.

//Write to InfluxDb
influxDb.writeV2({
            measurement: measurement,
            payload: [{ //You can store multiple data point at once.
                deviceId: "d007",
                location: "L007",
                type: 7,
                enabled: true,
                valueX: 100,
                valueY: 120,
                ip: "192.168.0.2"
            }, {
                deviceId: "d009",
                location: "L009",
                type: 9,
                enabled: false,
                valueX: 110,
                valueY: 130,
                ip: "192.168.0.3"
            }],
            tags: ["deviceId", "location", "type", "enabled"],
            timestamp: 1664821800000000000 //timestamp is optional. Use this if you want to explicitly set different time.
        }, org, dbName, precision)
        .then(res => {
            console.log(res);            
            //Output: [] //Empty array indicates data added
        }).catch(err => {
            console.error(err);
        });

//Read from InfluxDb
influxDb.queryV2("orgtest", `from(bucket:"demo1") |> 
    range(start: -60d) |> 
    filter(fn: (r) => r._measurement == "energy") |> 
    filter(fn: (r) => r.deviceId == "d007") |> 
    pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")`))
    .then(res => {
        console.log(res);
        //Output: /*Returns string with comma separation. To be parsed as csv*/
        //,result,table,_start,_stop,_time,_measurement,deviceId,enabled,location,type,ip,valueX,valueY
        //,_result,0,2022-07-11T10:50:17.6390562Z,2022-09-09T10:50:17.6390562Z,
            //2022-09-09T10:46:09.3298829Z,energy,d007,false,L007,7,192.168.0.2,100,120
    }).catch(err => {
        console.error(err);
    });
```

### Examples of Bucket operations on InfluxDB V2.x.x
```typescript
import { InfluxDB } from "influxdb-light";
const influxDb = new InfluxDB({ host: "localhost", port: "8086", protocol: "http", token: "<token_value>" });

//Create a Bucket
influxDb.createBucket(<org_ID>, <bucket_name>, <retention_in_seconds>)
    //output: { bucketId: <string>, name: <string>, createdAt: <string>, retentionTime: <number> }

//Get specific bucket
//i). By Bucket ID
influxDb.getBucket("640bee9277f75f2d", { id: "10592e2bff3d1789" }).then(result => console.log(result));
//ii). By Bucket Name
influxDb.getBucket("640bee9277f75f2d", { name: "testBucket007" }).then(result => console.log(result));
    //output: { bucketId: <string>, name: <string>, createdAt: <string>, retentionTime: <number> }

//List All Buckets
influxDb.listBuckets("640bee9277f75f2d").then(result => console.log(result));
    //output: Array<{ bucketId: <string>, name: <string>, createdAt: <string>, retentionTime: <number> }>
```
