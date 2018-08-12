/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL subscription operation: getNewLogEvents
// ====================================================

export interface getNewLogEvents_events {
  id: number;
  type: string;
  payload: string;
}

export interface getNewLogEvents {
  events: getNewLogEvents_events[];
}

export interface getNewLogEventsVariables {
  stackId: string;
  sinceVersionId: number;
}
