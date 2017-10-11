import gql from 'graphql-tag';
import {
    ApolloLink,
    GraphQLRequest,
    makePromise,
    execute,
} from 'apollo-link';
import {
    ExecutionResult,
} from 'graphql';
import { HttpLink } from 'apollo-link-http';
import uuid from 'uuid';
import debounce from 'debounce';

import OptimisticLink from './OptimisticLink';
import { ZetteliClient } from './ZetteliClient';
import { ZetteliType } from '../components/Zetteli';
import requestWithRetry from './requestWithRetry';
import queuedInvocation from './queuedInvocation';

const UPDATE_DEBOUNCE_MS = 400;
const BROADCAST_DEBOUNCE_MS = 2000; // TODO(helfer): There should be a delay on optimistic.

// TODO(helfer): Put these queries in a different file
const getAllZettelisQuery = gql`
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

interface GetAllZettelisResult {
    data: {
        stack: {
            zettelis: SerializedZetteli[],
        }
    };
}

const createZetteliMutation = gql`
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

interface CreateZetteliResult {
    data: {
        createZetteli: number;
    };
}

const deleteZetteliMutation = gql`
  mutation del($id: String!) {
    deleteZetteli(id: $id)
  }`;

interface DeleteZetteliResult {
    data: {
        deleteZetteli: boolean;
    };
}

const updateZetteliMutation = gql`
  mutation update($z: ZetteliInput!){
    updateZetteli(z: $z)
  }`;

// TODO(helfer): Generate these typings from the query
interface UpdateZetteliVariables {
    z: ZetteliType;
}

// TODO(helfer): how do I keep this in sync with ZetteliType?
// TODO(helfer): This is a common type with LocalStorageClient move it to separate file
interface SerializedZetteli {
    id: string;
    body: string;
    tags: string[];
    datetime: string;
}

export default class GraphQLClient implements ZetteliClient {
    private sid: string; // The stack ID (collection of zettelis)
    private localShadow: ZetteliType[];
    private shadowLoading: boolean;
    private shadowReady: boolean;
    private shadowPromise: Promise<ZetteliType[]>;
    private incompleteOps: number;

    private debouncedRequest: Function;
    private debouncedBroadcast: Function;

    private subscribers: Function[];

    private simpleRequest: (op: GraphQLRequest) => Promise<ExecutionResult>;

    constructor({ sid, uri }: { sid: string, uri: string }) {
        this.sid = sid;
        this.localShadow = [];
        this.shadowLoading = false;
        this.shadowReady = false;
        this.incompleteOps = 0;
        
        this.subscribers = [];

        this.debouncedRequest = debounce(
            queuedInvocation(this.request, (op: GraphQLRequest) => {
                const id = op.variables && (op.variables as UpdateZetteliVariables).z.id;
                return id;
            }),
            UPDATE_DEBOUNCE_MS,
        );

        this.debouncedBroadcast = debounce(
            this.broadcastUpdate,
            BROADCAST_DEBOUNCE_MS,
        );

        const link = ApolloLink.from([
            new OptimisticLink(),
            new HttpLink({ uri }),
        ]);

        this.simpleRequest = (op: GraphQLRequest) => makePromise(execute(link, op));
    }

    subscribe = (func: () => void) => {
        this.subscribers.push(func);
    }

    unsubscribe = (func: () => void) => {
        this.subscribers = this.subscribers.filter( f => f !== func);
    }

    broadcastUpdate = () => {
        this.subscribers.forEach(subscriber => subscriber());
    }

    getShadowIndexById = (id: string) => {
        return this.localShadow.findIndex(z => z.id === id);
    }

    request = (operation: GraphQLRequest) => {
        // TODO(helfer): Find a good way of surfacing GraphQL errors
        // TODO(helfer): This is too hacky
        if ((operation.variables as UpdateZetteliVariables).z) {
            const shadowIndex =
                this.getShadowIndexById((operation.variables as UpdateZetteliVariables).z.id);
            if (shadowIndex >= 0) {
                const count = this.localShadow[shadowIndex].optimisticCount || 0;
                this.localShadow[shadowIndex].optimisticCount = count + 1;
            }
            // TODO(helfer): Think about where you need to put these.
            this.debouncedBroadcast();
        }

        // console.log('update started. remaining: ', this.incompleteOps);
        return requestWithRetry(operation, this.simpleRequest)
            .then(res => res.data && res.data.updateZetteli)
            .then( success => {
                // TODO(helfer): This assumes there are no errors!
                // TODO(helfer): This is too hacky
                if ((operation.variables as UpdateZetteliVariables).z) {
                    const shadowIndex = 
                        this.getShadowIndexById((operation.variables as UpdateZetteliVariables).z.id);
                    if (shadowIndex >= 0) {
                        const count = this.localShadow[shadowIndex].optimisticCount || 1;
                        this.localShadow[shadowIndex].optimisticCount = count - 1;
                    }
                    this.debouncedBroadcast();
                }
                // if (success) {
                //     console.log('update succeeded. remaining:', this.incompleteOps);
                // } else {   
                //     console.log('update failed');
                // }
                return success;
            });
    }

    createNewZetteli(): Promise<string> {
        const operation = {
            query: createZetteliMutation,
            // TODO(helfer): Should these be decided here?
            variables: {
                sid: this.sid,
                id: uuid.v4(),
                tags: ['log', 'zetteli'],
                body: '',
                datetime: new Date(),
            },
        };

        // Add it to the shadow copy
        this.localShadow = [ ...this.localShadow, operation.variables ];

        // TODO(helfer): Better error handling
        this.simpleRequest(operation)
          .then((res: CreateZetteliResult) => res.data.createZetteli);

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

        this.simpleRequest(operation)
          .then((res: DeleteZetteliResult) => res.data.deleteZetteli);

        // Yep, never fails ...
        return Promise.resolve(true);
    }

    updateZetteli(id: string, data: ZetteliType): Promise<boolean> {
        this.localShadow = this.localShadow.map( zli => {
            if (zli.id === data.id) {
                return { ...zli, ...data };
            }
            return zli;
        });

        const operation = {
            query: updateZetteliMutation,
            variables: { z: data },
        };

        // TODO(helfer): Figure out why this returns undefined.
        this.debouncedRequest(operation); 

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
            variables: {
                sid: this.sid,
            },
        };

        this.shadowPromise = this.simpleRequest(operation)
            .then( (res: GetAllZettelisResult) => res.data.stack.zettelis.map(this.parseZetteli))
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
