import {
    ApolloLink,
    Observable,
    GraphQLRequest,
    makePromise,
    execute,
} from 'apollo-link';
import {
    ExecutionResult,
} from 'graphql';
import { HttpLink } from 'apollo-link-http';
import uuid from 'uuid';
import debounce from 'debounce-promise';

import OptimisticLink from './OptimisticLink';
import { ZetteliClient } from './ZetteliClient';
import { ZetteliType, SerializedZetteli } from '../components/Zetteli';
import {
    UpdateZetteliVariables,
    updateZetteliMutation,
    UpdateZetteliResult,
    makeUpdateZetteliAction,
    createZetteliMutation,
    makeCreateZetteliAction,
    CreateZetteliResult,
    deleteZetteliMutation,
    DeleteZetteliResult,
    makeDeleteZetteliAction,
    getAllZettelisQuery,
    GetAllZettelisResult,
} from '../queries/queries';
import requestWithRetry from './requestWithRetry';
import queuedInvocation from './queuedInvocation';

import Store from './Store';

export interface BaseState {
    loading: boolean;
    ready: boolean;
    zettelis: ZetteliType[];
}

const UPDATE_DEBOUNCE_MS = 400;

export default class GraphQLClient implements ZetteliClient {
    private sid: string; // The stack ID (collection of zettelis)
    private store: Store<BaseState>;
    private incompleteOps: number;

    private debouncedRequest: Function;

    private subscribers: Function[];

    private simpleRequest: (op: GraphQLRequest) => Promise<ExecutionResult>;
    private observableRequest: (op: GraphQLRequest) => Observable<ExecutionResult>;

    constructor({ sid, uri }: { sid: string, uri: string }) {
        this.sid = sid;
        this.store = new Store({
            loading: false,
            ready: false,
            zettelis: [],
        });
        // NOTE(helfer): We don't need to unsubscribe if the store lives
        // within the client, and we shouldn't subscribe from within the
        // client if the store lives outside.
        this.store.subscribe(this.broadcastUpdate);
        this.incompleteOps = 0;
        
        this.subscribers = [];

        const makeRequest = (op: GraphQLRequest) => requestWithRetry(op, this.simpleRequest);
        this.debouncedRequest = debounce(
            queuedInvocation(makeRequest, (op: GraphQLRequest) => {
                const id = op.variables && (op.variables as UpdateZetteliVariables).z.id;
                return id;
            }),
            UPDATE_DEBOUNCE_MS,
        );

        const link = ApolloLink.from([
            new OptimisticLink(),
            new HttpLink({ uri }),
        ]);

        this.simpleRequest = (op: GraphQLRequest) => makePromise(execute(link, op));
        this.observableRequest = (op: GraphQLRequest) => execute(link, op);
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

    createNewZetteli(): Promise<string> {
        const zli = {
            sid: this.sid,
            id: uuid.v4(),
            tags: ['log', 'zetteli'],
            body: '',
            datetime: new Date(),
        };
        const operation = {
            query: createZetteliMutation,
            variables: { ...zli },
        };

        // Add it to the shadow copy
        const optimisticResponse = {
            data: {
                createZetteli: zli.id,
            }
        };
        const optimisticAction = makeCreateZetteliAction(zli, optimisticResponse);
        const rollback = this.store.dispatch(optimisticAction, true);

        // TODO(helfer): Better error handling
        this.simpleRequest(operation)
          .then((res: CreateZetteliResult) => {
              rollback();
              const action = makeCreateZetteliAction(zli, res);
              this.store.dispatch(action);
              return res.data.createZetteli;
          });

        // Yep, never fails
        return Promise.resolve(zli.id);
    }

    // This function is not used yet. We'll need it for importing
    addZetteli(zli: ZetteliType): Promise<boolean> {
        return Promise.resolve(false);
    }

    deleteZetteli(id: string): Promise<boolean> {
        const operation = {
            query: deleteZetteliMutation,
            variables: { id },
            context: {
                optimisticResponse: {
                    data: {
                        deleteZetteli: true,
                    },
                    context: {
                        isOptimistic: true,
                    }
                },
            },
        };

        let rollback: () => void;
        this.observableRequest(operation)
          .map((res: DeleteZetteliResult) => {
              if (rollback) { rollback(); }
              rollback = this.store.dispatch(
                makeDeleteZetteliAction(id, res),
                res.context && res.context.isOptimistic
              );
          }).subscribe({
              error(e: Error) {
                  if (rollback) { rollback(); }
                  throw e;
              },
          });

        // Yep, never fails ...
        return Promise.resolve(true);
    }

    updateZetteli(id: string, data: ZetteliType): Promise<boolean> {
        const operation = {
            query: updateZetteliMutation,
            variables: { z: data },
        };

        const optimisticResponse: UpdateZetteliResult = {
            data : {
                updateZetteli: true,
            },
        };
        const optimisticAction = makeUpdateZetteliAction(data, optimisticResponse);
        const rollback = this.store.dispatch(optimisticAction, true);

        this.debouncedRequest(operation).then((res: UpdateZetteliResult) => {
            rollback();
            this.store.dispatch(makeUpdateZetteliAction(data, res));
        }); 

        return Promise.resolve(true);
    }

    getZetteli(id: string): Promise<ZetteliType | undefined> {
        return Promise.resolve(undefined);
    }

    getAllZettelis(): Promise<ZetteliType[]> {
        if (this.store.getState().ready) {
            return Promise.resolve(this.store.getOptimisticState().zettelis);
        }

        const operation = {
            query: getAllZettelisQuery,
            variables: {
                sid: this.sid,
            },
        };

        this.simpleRequest(operation)
            .then( (res: GetAllZettelisResult) => 
                res.data.stack.zettelis.map(this.parseZetteli))
            .then( zettelis => {
                this.store.dispatch(state => ({
                    ready: true,
                    loading: false,
                    zettelis,
                }));
            });
        return new Promise((resolve) => {
            const unsubscribe = this.store.subscribe(() => {
                if (this.store.getOptimisticState().ready === true) {
                    unsubscribe();
                    resolve(this.store.getOptimisticState().zettelis);
                }
            });
        });
    }

    // TODO(helfer): Shared with LocalStorage client
    private parseZetteli(zli: SerializedZetteli): ZetteliType {
        return {
            ...zli,
            datetime: new Date(zli.datetime),
        };
    }
}
