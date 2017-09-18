import gql from 'graphql-tag';
import { 
    createApolloFetch,
    ApolloFetch
} from 'apollo-fetch';

// import uuid from 'uuid';

import { ZetteliClient } from './ZetteliClient';
import { ZetteliType } from '../components/Zetteli';

const getAllZettelisQuery = gql`
query getAllZettelis {
    zettelis {
      id
      datetime
      tags
      body
    }
  }
`;

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

    createNewZetteli(): Promise<boolean> {
        return Promise.resolve(false);
    }

    addZetteli(zli: ZetteliType): Promise<boolean> {
        return Promise.resolve(false);
    }

    deleteZetteli(id: string): Promise<boolean> {
        return Promise.resolve(false);
    }

    updateZetteli(id: string, data: ZetteliType): Promise<boolean> {
        return Promise.resolve(false);
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
