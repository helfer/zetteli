import gql from 'graphql-tag';
import { SerializedZetteli, ZetteliType } from '../components/Zetteli';
import { BaseState } from '../services/GraphQLClient';
// TODO(helfer): Generate the typings in this file from the queries
import { StackType } from '../components/StackList';

export const stackListQuery = gql`
  query getStackList {
      stacks {
          id
          name
          createdAt
      }
  }
`;

export interface StackListQueryResult {
    data: {
        stacks: StackType[];
    };
}

export const getAllZettelisQuery = gql`
query getStack($sid: String!) {
  stack(id: $sid) {
      id
      name
      public
      settings {
          defaultTags
      }
      zettelis {
        id
        datetime
        tags
        body
      }
      log { currentVersionId }
  }
}`;

export interface GetAllZettelisResult {
  data: {
      stack: {
          id: string,
          name: string,
          public: boolean,
          settings: {
              defaultTags: string[],
          },
          zettelis: SerializedZetteli[],
          log: { currentVersionId: number },
      }
  };
}

export const getLogEventsQuery = gql`
query getLogEvents($sinceVersionId: Int!) {
    log {
        events(sinceVersionId: $sinceVersionId) {
          id
          type
          payload
        }
    }
}
`;

export interface LogEvent {
    id: number;
    type: string;
    payload: string; // TODO: make this JSON and determined type based on `type` field
}

export interface GetLogEventsResult {
    data: {
        log: {
            events: LogEvent[],
        },
    };
}

export function makeProcessLogEventAction(event: LogEvent) {
    // TODO: Make the payload JSON so you don't have to do this.
    const payload: any = JSON.parse(event.payload);

    // TODO: Unify these actions with the actions used to process queries and mutations
    return (state: BaseState) => {
        if (event.type === 'ZetteliCreated') {
            // TODO: Make this support multiple stacks.

            // make sure the zetteli doesn't already exist
            if (state.zettelis.find( z => z.id === payload.zetteli.id)) {
                return state;
            }
            return {
                ...state,
                zettelis: [ ...state.zettelis, payload.zetteli ],
            }; 
        } else if (event.type === 'ZetteliUpdated') {
            return {
                ...state,
                zettelis: state.zettelis.map(z => {
                    if (z.id === payload.id) {
                        return { ...z, ...payload };
                    }
                    return z;
                }),
            };
        } else if (event.type === 'ZetteliDeleted') {
            return {
                ...state,
                zettelis: state.zettelis.filter(z => z.id !== payload.id),
            };
        } else {
            // ignore unknown event types
            console.warn('Unkown event type:', event.type);
            return state;
        }
    };
}

export const createZetteliMutation = gql`
mutation create($sid: String!, $id: String!, $tags : [String!]!, $datetime: DateTime!, $body: String!) {
  createZetteli(
    sid: $sid,
    z: {
      id: $id,
      body: $body,
      tags: $tags,
      datetime: $datetime,
    }
  )
}`;

export interface CreateZetteliResult {
  data: {
      createZetteli: string;
  };
  context: {
      isOptimistic: boolean;
  };
}

export function makeCreateZetteliAction(zli: ZetteliType, result: CreateZetteliResult) {
    return (state: BaseState) => {
        return {
            ...state,
            zettelis: [ ...state.zettelis, { ...zli, id: result.data.createZetteli }],
        };
    };
}

export const deleteZetteliMutation = gql`
mutation del($id: String!) {
  deleteZetteli(id: $id)
}`;

export interface DeleteZetteliResult {
  data: {
      deleteZetteli: boolean;
  };
  context: {
      isOptimistic: boolean;
  };
}

export function makeDeleteZetteliAction(id: string, result: DeleteZetteliResult) {
    return (state: BaseState) => {
        if (!result.data.deleteZetteli) {
            return state;
        }
        return {
            ...state,
            zettelis: state.zettelis.filter(z => z.id !== id),
        };
    };
}

export const updateZetteliMutation = gql`
mutation update($z: ZetteliInput!){
  updateZetteli(z: $z)
}`;

export interface UpdateZetteliVariables {
  z: ZetteliType;
}

export interface UpdateZetteliResult {
    data: {
        updateZetteli: boolean,
    };
    context: {
        isOptimistic: boolean,
    };
}

export function makeUpdateZetteliAction(zli: ZetteliType, result: UpdateZetteliResult) {
    return (state: BaseState) => {
        if (!result.data.updateZetteli) {
            return state;
        }
        return {
            ...state,
            zettelis: state.zettelis.map(z => {
                if (z.id === zli.id) {
                    return { ...z, ...zli };
                }
                return z;
            }),
        };
    };
}