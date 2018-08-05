import {
    ApolloLink,
    GraphQLRequest,
    makePromise,
    execute,
} from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import {
    RetryLink,
} from 'apollo-link-retry';
import uuid from 'uuid';

import OptimisticLink from 'apollo-link-optimistic';
import SerializingLink from 'apollo-link-serialize';
import QueueLink from 'apollo-link-queue';
import DebounceLink from 'apollo-link-debounce';
import { ZetteliClient } from './ZetteliClient';
import { ZetteliType, SerializedZetteli } from '../components/Zetteli';
import {
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
    getLogEventsQuery,
    GetLogEventsResult,
    makeProcessLogEventAction,
} from '../queries/queries';

import Store from './Store';

export interface BaseState {
    loading: boolean;
    ready: boolean;
    error?: string;
    stack: {
        id?: string;
        name?: string;
        public?: boolean;
        settings?: {
            defaultTags: string[];
        }
    };
    zettelis: ZetteliType[];
}

const UPDATE_DEBOUNCE_MS = 400;
const POLLING_INTERVAL = 5000;

export default class GraphQLClient implements ZetteliClient {
    // TODO(helfer): Rename to stackId.
    private sid: string; // The stack ID (collection of zettelis)
    private store: Store<BaseState>;

    private subscribers: Function[];

    private link: ApolloLink;

    constructor({ sid, uri }: { sid: string, uri: string }) {
        this.sid = sid;
        this.store = new Store({
            loading: false,
            ready: false,
            stack: {},
            zettelis: [],
        });
        // NOTE(helfer): We don't need to unsubscribe if the store lives
        // within the client, and we shouldn't subscribe from within the
        // client if the store lives outside.
        this.store.subscribe(this.broadcastUpdate);
        
        this.subscribers = [];

        const offlineLink = new QueueLink();

        // TODO(helfer): Technically I should remove the listeners when the app closes,
        // but since I only create one it shouldn't matter in practice.
        window.addEventListener('offline', () => offlineLink.close());
        window.addEventListener('online', () => offlineLink.open());

        this.link = ApolloLink.from([
            new OptimisticLink(),
            new DebounceLink(UPDATE_DEBOUNCE_MS),
            new SerializingLink(),
            new RetryLink({
                // TODO(helfer): What's up with the types here?
                max: () => Number.POSITIVE_INFINITY,
                delay: () => 50,
                interval: (delay, count) => Math.min(delay * 2 ** count, 10000),
            }),
            offlineLink,
            new HttpLink({ uri }),
        ]);

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

    subscribeToEventLog(startVersionId: number): void {
        // TODO: Clean up the naming in these functions.
        this.pollEventLog(startVersionId)
        .then((versionId: number) => {
            setTimeout(() => this.subscribeToEventLog(versionId), POLLING_INTERVAL);
        });
    }

    createNewZetteli(): Promise<string> {
        const settings = this.store.getOptimisticState().stack.settings;
        const zli = {
            sid: this.sid,
            id: uuid.v4(),
            tags: (settings && settings.defaultTags) || [],
            body: '',
            datetime: new Date(),
        };
        const operation = {
            query: createZetteliMutation,
            variables: { ...zli },
            context: {
                serializationKey: zli.id,
                optimisticResponse: {
                    data: {
                        createZetteli: zli.id,
                    },
                    context: {
                        isOptimistic: true,
                    },
                },
            },
        };

        let rollback: () => void;
        this.observableRequest(operation)
            .map((res: CreateZetteliResult) => {
                if (rollback) { rollback(); }
                rollback = this.store.dispatch(
                    makeCreateZetteliAction(zli, res),
                    res.context && res.context.isOptimistic,
                );
            })
            .subscribe({
                error(e: Error) {
                    if (rollback) { rollback(); }
                    throw e;
                },
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
                serializationKey: id,
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
            context: {
                debounceKey: id,
                serializationKey: id,
                optimisticResponse: {
                    data : {
                        updateZetteli: true,
                    },
                    context: {
                        isOptimistic: true,
                    }
                }
            }
        };

        let rollback: () => void;
        this.observableRequest(operation).map((res: UpdateZetteliResult) => {
            if (rollback) { rollback(); }
            rollback = this.store.dispatch(
              makeUpdateZetteliAction(data, res),
              res.context && res.context.isOptimistic
            );
        }).subscribe({
            error(e: Error) {
                if (rollback) { rollback(); }
                throw e;
            },
        });

        return Promise.resolve(true);
    }

    getZetteli(id: string): Promise<ZetteliType | undefined> {
        return Promise.resolve(undefined);
    }

    getAllZettelis(): Promise<ZetteliType[]> {
        if (this.store.getState().error) {
            return Promise.reject(this.store.getState().error);
        }
        if (this.store.getState().ready) {
            return Promise.resolve(this.store.getOptimisticState().zettelis);
        }

        const operation = {
            query: getAllZettelisQuery,
            variables: {
                sid: this.sid,
            },
        };

        makePromise(this.observableRequest(operation))
            .then( (res: GetAllZettelisResult) => {
                if (res.data.stack === null) {
                    return this.store.dispatch(state => ({
                        ...state,
                        ready: true,
                        loading: false,
                        error: 'stack not found',
                        stack: {},
                        zettelis: [],
                    }));
                }

                // TODO: Start the subscription in a better place
                this.subscribeToEventLog(res.data.stack.log.currentVersionId);

                return this.store.dispatch(state => ({
                    ...state,
                    ready: true,
                    loading: false,
                    stack: {
                        ...res.data.stack,
                        zettelis: undefined
                    },
                    zettelis: res.data.stack.zettelis.map(this.parseZetteli),
                }));
            });
        return new Promise((resolve, reject) => {
            const unsubscribe = this.store.subscribe(() => {
                if (this.store.getState().error) {
                    reject(this.store.getState().error);
                }
                if (this.store.getOptimisticState().ready === true) {
                    unsubscribe();
                    resolve(this.store.getOptimisticState().zettelis);
                }
            });
        });
    }

    private pollEventLog(sinceVersionId: number): Promise<number> {
        const operation = {
            query: getLogEventsQuery,
            variables: { sinceVersionId },
        };
        return makePromise(this.observableRequest(operation))
        .then( (result: GetLogEventsResult) => {
            const events = result.data.log.events;

            events.forEach(event => {
                this.store.dispatch(makeProcessLogEventAction(event));
            });

            if (events.length === 0) {
                return sinceVersionId;
            }
            return events[events.length - 1].id;
        });
    }

    private observableRequest(op: GraphQLRequest) {
        return execute(this.link, op);
    }

    // TODO(helfer): Shared with LocalStorage client
    private parseZetteli(zli: SerializedZetteli): ZetteliType {
        return {
            ...zli,
            datetime: new Date(zli.datetime),
        };
    }
}
