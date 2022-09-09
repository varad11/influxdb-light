/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
import { InfluxDB } from "../lib/index";
import { RequestSchema } from "../model/request";

//test suite disabled after successful testing
xdescribe("WRITE QUERY", () => {
    const request: RequestSchema = {
        host: "localhost", 
        port: "8086", 
        protocol: "http",
        token: "bNXKI6W46LqyHykW5okkx67hSnQ0NOhHHY8nAv22b5VG7B8k0Tkx-3v8f02jdzWzBRP9WtdAnRejcwtWqDJZ1Q=="
    };
    it("Test for V2.0 DB", async () => {
        await expectAsync(new InfluxDB(request).writeV2({
            measurement: "energy",
            payload: [{
                deviceId: "d007",
                location: "L007",
                type: 7,
                enabled: false,
                valueX: 100,
                valueY: 120,
                ip: "192.168.0.2"
            }],
            tags: ["deviceId", "location", "type", "enabled"]
        }, "orgtest", "demo1")).toBeResolvedTo([]);
    });
});

describe("READ QUERIES", () => {
    let request: RequestSchema = {
        host: "localhost", 
        port: "8086", 
        protocol: "http"
    }
    xit("Test For V1.0 DB", async () => {
        await expectAsync(new InfluxDB(request).queryV1("demo1", `SELECT * FROM "energy" WHERE "deviceId"='d001'`)).toBeResolvedTo([
            {
                "statement_id": 0,
                "series": [
                    {
                        "name": "energy",
                        "columns": [
                            "time",
                            "deviceId",
                            "enabled",
                            "invert",
                            "ip",
                            "location",
                            "type",
                            "valueX",
                            "valueY"
                        ],
                        "values": [
                            [
                                "2022-09-08T06:55:35.679933Z",
                                "d001",
                                "true",
                                null,
                                "192.168.0.1",
                                "L001",
                                "2",
                                20,
                                40
                            ]
                        ]
                    }
                ]
            }
        ])
    });

    it("Test For V2.0 DB", async () => {
        request.token = "bNXKI6W46LqyHykW5okkx67hSnQ0NOhHHY8nAv22b5VG7B8k0Tkx-3v8f02jdzWzBRP9WtdAnRejcwtWqDJZ1Q==";
        await expectAsync(new InfluxDB(request).queryV2("orgtest", `from(bucket:"demo1") |> 
                        range(start: -60d) |> 
                        filter(fn: (r) => r._measurement == "energy") |> 
                        filter(fn: (r) => r.deviceId == "d007") |> 
                        pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")`))
            .toBeResolvedTo(`,result,table,_start,_stop,_time,_measurement,deviceId,enabled,location,type,ip,valueX,valueY,_result,0,2022-07-11T10:50:17.6390562Z,2022-09-09T10:50:17.6390562Z,2022-09-09T10:46:09.3298829Z,energy,d007,false,L007,7,192.168.0.2,100,120`);
    });
});