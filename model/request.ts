export interface RequestSchema {
    host: string;
    port?: string;
    protocol: string;
    username?: string;
    password?: string;
    token?: string;
}

export interface OptionsSchema extends RequestSchema {
    path: string;
    headers?: {}
}