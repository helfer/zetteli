import gql from 'graphql-tag';
import { 
    createApolloFetch,
    ApolloFetch
} from 'apollo-fetch';
import uuid from 'uuid';

import { ZetteliClient } from './ZetteliClient';
import { ZetteliType } from '../components/Zetteli';

// TODO(helfer): Put these queries in a different file
const getAllZettelisQuery = gql`
  query getAllZettelis {
    zettelis {
      id
      datetime
      tags
      body
    }
  }`;

const createZetteliMutation = gql`
  mutation create($id: String!, $tags : [String!]!, $datetime: DateTime!, $body: String!) {
    createZetteli(z: {
      id: $id,
      body: $body,
      tags: $tags,
      datetime: $datetime,
    })
  }`;

const deleteZetteliMutation = gql`
  mutation del($id: String!) {
    deleteZetteli(id: $id)
  }`;

const updateZetteliMutation = gql`
  mutation update($z: ZetteliInput!){
    updateZetteli(z: $z)
  }`;

// TODO(helfer): how do I keep this in sync with ZetteliType?
// TODO(helfer): This is a common type with LocalStorageClient move it to separate file
interface SerializedZetteli {
    id: string;
    body: string;
    tags: string[];
    datetime: string;
}

export default class GraphQLClient implements ZetteliClient {
    private client: ApolloFetch;

    constructor({ uri }: { uri: string }) {
        this.client = createApolloFetch({ uri });
    }

    createNewZetteli(): Promise<string> {
        const operation = {
            query: createZetteliMutation,
            // TODO(helfer): Should these be decided here?
            variables: {
                id: uuid.v4(),
                tags: ['log', 'zetteli'],
                body: '',
                datetime: new Date(),
            },
        };
        // TODO(helfer): Better error handling
        return this.client(operation)
          .then(res => res.data.createZetteli);
    }

    // TODO(helfer): What is this function? Do we need it?
    addZetteli(zli: ZetteliType): Promise<boolean> {
        return Promise.resolve(false);
    }

    deleteZetteli(id: string): Promise<boolean> {
        const operation = {
            query: deleteZetteliMutation,
            variables: { id },
        };
        return this.client(operation)
          .then(res => res.data.deleteZetteli);
    }

    updateZetteli(id: string, data: ZetteliType): Promise<boolean> {
        const operation = {
            query: updateZetteliMutation,
            variables: { z: data },
        };

        // TODO(helfer): Find a good way of surfacing GraphQL errors
        return this.client(operation)
          .then(res => res.data.updateZetteli);
    }

    getZetteli(id: string): Promise<ZetteliType | undefined> {
        return Promise.resolve(undefined);
    }

    getAllZettelis(): Promise<ZetteliType[]> {
        const operation = {
            query: getAllZettelisQuery,
        };

        return this.client(operation)
            .then( res => res.data.zettelis.map(this.parseZetteli));
    }

    // TODO(helfer): Shared with LocalStorage client
    private parseZetteli(zli: SerializedZetteli): ZetteliType {
        return {
            ...zli,
            datetime: new Date(zli.datetime),
        };
    }
}
