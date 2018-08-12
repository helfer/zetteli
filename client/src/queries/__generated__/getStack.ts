/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getStack
// ====================================================

export interface getStack_stack_settings {
  defaultTags: (string | null)[] | null;
}

export interface getStack_stack_zettelis {
  id: string;
  datetime: any;
  tags: string[];
  body: string;
}

export interface getStack_stack_log {
  currentVersionId: number | null;
}

export interface getStack_stack {
  id: string;
  name: string;
  public: boolean;
  settings: getStack_stack_settings;
  zettelis: (getStack_stack_zettelis | null)[] | null;
  log: getStack_stack_log | null;
}

export interface getStack {
  stack: getStack_stack | null;
}

export interface getStackVariables {
  sid: string;
}
