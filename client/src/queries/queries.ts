import gql from 'graphql-tag';
import { ZetteliType } from '../components/Zetteli';
import { BaseState } from '../services/GraphQLClient';
// TODO(helfer): Generate the typings in this file from the queries

export const stackListQuery = gql`
  query getStackList {
      stacks {
          id
          name
          createdAt
      }
  }
`;

export const getAllZettelisQuery = gql`
query getAllZettelis($sid: String!) {
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

export const getNewLogEventsSubscription = gql`
subscription getNewLogEvents($stackId: String!, $sinceVersionId: Int!) {
    events(stackId: $stackId, sinceVersionId: $sinceVersionId) {
        id
        type
        payload
    }
}
`;

export interface LogEvent {
    id: number;
    type: string;
    payload: string; // TODO: make this JSON and determined type based on `type` field
}

export function makeProcessLogEventAction(event: LogEvent) {
    // TODO: Make the payload JSON so you don't have to do this.
    const payload: Record<string, any> = JSON.parse(event.payload);

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
mutation createZetteli(
    $sid: String!
    $id: String!
    $tags : [String!]!
    $datetime: DateTime!
    $body: String!) @serialize(key: [$id]) {
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

export function makeCreateZetteliAction(zli: ZetteliType, id: string) {
    return (state: BaseState) => {
        return {
            ...state,
            zettelis: [ ...state.zettelis, { ...zli, id }],
        };
    };
}

export const deleteZetteliMutation = gql`
mutation deleteZetteli($id: String!) @serialize(key: [$id]) {
  deleteZetteli(id: $id)
}`;

export function makeDeleteZetteliAction(id: string, success: boolean) {
    return (state: BaseState) => {
        if (!success) {
            return state;
        }
        return {
            ...state,
            zettelis: state.zettelis.filter(z => z.id !== id),
        };
    };
}

export const updateZetteliMutation = gql`
mutation updateZetteli($key: String, $z: ZetteliInput!) @serialize(key: [$key]) {
  updateZetteli(z: $z)
}`;

export function makeUpdateZetteliAction(zli: ZetteliType, success: boolean) {
    return (state: BaseState) => {
        if (!success) {
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