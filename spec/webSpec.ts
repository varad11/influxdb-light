/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
import { post, get } from "../lib/web";
import { OptionsSchema } from "../model/request";

//test suite disabled after successful testing
xdescribe("Method POST", () => {
    let options: OptionsSchema = {
        host: "localhost",
        port: "8086",
        protocol: "http",
        path: "/write?db=demo1"
    };

    it("POST 1", async () => {
        await expectAsync(post(options, 'energy,deviceId=d004,location=L001,type=2,enabled=true valueX=20,valueY=40,ip="192.168.0.1"')).toBeResolvedTo([]);
    });

    it("POST 2", async () => {
        await expectAsync(post(options, 'energy,deviceId=d005,location=L002,type=2 valueX=30,valueY=40,invert=false,ip="192.168.1.1"')).toBeResolvedTo([]);
    });

});

describe("Method GET", () => {
    let options: OptionsSchema = {
        host: "localhost",
        port: "8086",
        protocol: "http",
        path: "/ping"
    };
    it("Ping Test", async () => {
        await expectAsync(get(options)).toBeResolvedTo([])
    });
})
