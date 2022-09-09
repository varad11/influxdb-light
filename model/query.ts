
interface Result {
    statement_id: number;
    series:       Array<Series>;
}

interface Series {
    name:    string;
    columns: string[];
    values:  Array<Array<number | string>>;
}

export interface QueryV1Response {
    results: Array<Result>;
}