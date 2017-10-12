import gql from 'graphql-tag';
import { SerializedZetteli, ZetteliType } from '../components/Zetteli';
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
      createZetteli: number;
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

export const updateZetteliMutation = gql`
mutation update($z: ZetteliInput!){
  updateZetteli(z: $z)
}`;

export interface UpdateZetteliVariables {
  z: ZetteliType;
}