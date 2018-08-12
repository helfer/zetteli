export type LogEvent = {
    id: number;
    opId: string;
    type: string;
    sid: string;
    eventTime: Date,
    eventSchemaId: number;
    payload: string; // technically JSON
}