/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getLogEvents
// ====================================================

export interface getLogEvents_log_events {
  id: number;
  type: string;
  payload: string;
}

export interface getLogEvents_log {
  events: (getLogEvents_log_events | null)[] | null;
}

export interface getLogEvents {
  log: getLogEvents_log | null;
}

export interface getLogEventsVariables {
  sinceVersionId: number;
}
