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
    private client: ApolloFetch
    private localShadow: ZetteliType[];
    private shadowLoading: boolean;
    private shadowReady: boolean;
    private shadowPromise: Promise<ZetteliType[]>;
    private incompleteOps: number;

    constructor({ uri }: { uri: string }) {
        this.client = createApolloFetch({ uri });
        this.localShadow = [];
        this.shadowLoading = false;
        this.shadowReady = false;
        this.incompleteOps = 0;
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

        // Add it to the shadow copy
        this.localShadow = [ ...this.localShadow, operation.variables ];

        // TODO(helfer): Better error handling
        this.client(operation)
          .then(res => res.data.createZetteli);

        // Yep, never fails
        return Promise.resolve(operation.variables.id);
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

        // Remove it from the shadow copy
        // Technically we could return here already.
        this.localShadow = this.localShadow.filter(zli => zli.id !== id);

        this.client(operation)
          .then(res => res.data.deleteZetteli);

        // Yep, never fails ...
        return Promise.resolve(true);
    }

    updateZetteli(id: string, data: ZetteliType): Promise<boolean> {

        this.localShadow.map( zli => {
            if (zli.id === data.id) {
                return { ...zli, ...data };
            }
            return zli;
        })

        const operation = {
            query: updateZetteliMutation,
            variables: { z: data },
        };

        // TODO(helfer): Find a good way of surfacing GraphQL errors
        this.incompleteOps++;
        this.client(operation)
          .then(res => res.data.updateZetteli)
          .then( success => {
              // TODO(helfer): This assumes there are no errors!
              this.incompleteOps--;
              if (success) {
                  console.log('update succeeded. remaining:', this.incompleteOps);
              } else {
                  console.log('update failed');
              }
          });

        return Promise.resolve(true);
    }

    getZetteli(id: string): Promise<ZetteliType | undefined> {
        return Promise.resolve(undefined);
    }

    getAllZettelis(): Promise<ZetteliType[]> {
        if (this.shadowReady) {
            return Promise.resolve(this.localShadow);
        }

        if (this.shadowLoading) {
            return this.shadowPromise;
        }
        this.shadowLoading = true;

        const operation = {
            query: getAllZettelisQuery,
        };

        this.shadowPromise = this.client(operation)
            .then( res => res.data.zettelis.map(this.parseZetteli))
            .then( zettelis => {
                this.localShadow = zettelis;
                this.shadowReady = true;
                this.shadowLoading = false;
                return zettelis;
            });

        return this.shadowPromise;
    }

    // TODO(helfer): Shared with LocalStorage client
    private parseZetteli(zli: SerializedZetteli): ZetteliType {
        return {
            ...zli,
            datetime: new Date(zli.datetime),
        };
    }
}
