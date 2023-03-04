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

    it("Test multiline write for V2.0 DB", async () => {
        const payload: any = [
            { deviceId: "d008", location: "L008", type: 7, enabled: false, valueX: 100, valueY: 120, ip: "192.168.0.8" },
            { deviceId: "d009", location: "L009", type: 7, enabled: false, valueX: 200, valueY: 220, ip: "192.168.0.9" },
            { deviceId: "d0010", location: "L0010", type: 7, enabled: false, valueX: 300, valueY: 320, ip: "192.168.0.10" },
            { deviceId: "d0011", location: "L0011", type: 7, enabled: false, valueX: 400, valueY: 420, ip: "192.168.0.11" }
          ];
        await expectAsync(new InfluxDB(request).writeV2({
            measurement: "energy",
            payload,
            tags: ["deviceId", "location", "type", "enabled"]
        }, "orgtest", "demo1")).toBeResolvedTo([]);
    });
});

xdescribe("READ QUERIES", () => {
    let request: RequestSchema = {
        host: "localhost", 
        port: "8086", 
        protocol: "http"
    }
    it("Test For V1.0 DB", async () => {
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

xdescribe("BUCKET TESTS", () => {
    const request: RequestSchema = {
        host: "localhost", 
        port: "8086", 
        protocol: "http",
        token: "bNXKI6W46LqyHykW5okkx67hSnQ0NOhHHY8nAv22b5VG7B8k0Tkx-3v8f02jdzWzBRP9WtdAnRejcwtWqDJZ1Q=="
    };

    xit("Create a bucket", async () => {
        const result = await new InfluxDB(request).createBucket("640bee9277f75f2d", "testBucket007", 3600);
        expect(result).toEqual(jasmine.objectContaining({name: "testBucket007", retentionTime: 3600}));
    });

    it("List All Buckets", async () => {
        const result = await new InfluxDB(request).listBuckets("640bee9277f75f2d");
        expect(result.map(bucket => bucket.name)).toBe(["testBucket007", "demo1"]);
    });

    it("Get Bucket Details By Id", async () => {
        const result = await new InfluxDB(request).getBucket("640bee9277f75f2d", { id: "10592e2bff3d1789" });
        expect(result).toEqual({bucketId: '10592e2bff3d1789', name: 'testBucket007', createdAt: '2023-01-09T12:21:18.3806061Z', retentionTime: 3600});
    });

    it("Get Bucket Details By name", async () => {
        const result = await new InfluxDB(request).getBucket("640bee9277f75f2d", { name: "testBucket007" });
        expect(result).toEqual({bucketId: '10592e2bff3d1789', name: 'testBucket007', createdAt: '2023-01-09T12:21:18.3806061Z', retentionTime: 3600});
    });
});