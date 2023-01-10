export interface QueryV1Response {
    results: Array<{
        statement_id: number;
        series:       Array<{
            name:    string;
            columns: string[];
            values:  Array<Array<number | string>>;
        }>;
    }>;
}

export interface CreateBucketDBResponse {
    id:             string;
    orgID:          string;
    type:           string;
    schemaType:     string;
    name:           string;
    retentionRules: Array<{
        type:         string;
        everySeconds: number;
    }>;
    storageType:    string;
    createdAt:      string;
    updatedAt:      string;
    links:          {
        labels:  string;
        members: string;
        org:     string;
        owners:  string;
        self:    string;
        write:   string;
    };
    labels:         any[];
}

export interface BucketsDBResponse {
    links:   {
        self: string;
    };
    buckets: Array<CreateBucketDBResponse>;
}

