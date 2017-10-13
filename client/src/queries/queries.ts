import gql from 'graphql-tag';
import { SerializedZetteli, ZetteliType } from '../components/Zetteli';
import { BaseState } from '../services/GraphQLClient';
// TODO(helfer): Generate the typings in this file from the queries

export const getAllZettelisQuery = gql`
query getAllZettelis($sid: String!) {
  stack(id: $sid) {
      zettelis {
      id
      datetime
      tags
      body
      }
  }
}`;

export interface GetAllZettelisResult {
  data: {
      stack: {
          zettelis: SerializedZetteli[],
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
}

export function makeDeleteZetteliAction(id: string, result: DeleteZetteliResult) {
    if (!result.data.deleteZetteli) {
        return (state: BaseState) => state;
    }
    return (state: BaseState) => {
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