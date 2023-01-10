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

export interface CreateBucket {
    orgID:          string;
    name:           string;
    retentionRules: Array<{
        type:                      string;
        everySeconds:              number;
        shardGroupDurationSeconds: number;
    }>;
}