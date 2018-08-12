/* tslint:disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: getAllZettelis
// ====================================================

export interface getAllZettelis_stack_settings {
  defaultTags: string[];
}

export interface getAllZettelis_stack_zettelis {
  id: string;
  datetime: any;
  tags: string[];
  body: string;
}

export interface getAllZettelis_stack_log {
  currentVersionId: number;
}

export interface getAllZettelis_stack {
  id: string;
  name: string;
  public: boolean;
  settings: getAllZettelis_stack_settings;
  zettelis: getAllZettelis_stack_zettelis[];
  log: getAllZettelis_stack_log;
}

export interface getAllZettelis {
  stack: getAllZettelis_stack | null;
}

export interface getAllZettelisVariables {
  sid: string;
}
