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
    makeUpdateZetteliAction,
    createZetteliMutation,
    makeCreateZetteliAction,
    deleteZetteliMutation,
    makeDeleteZetteliAction,
    getAllZettelisQuery,
    makeProcessLogEventAction,
    getNewLogEventsSubscription,
} from '../queries/queries';

import { getNewLogEvents } from '../queries/__generated__/getNewLogEvents';
import { createZetteli } from '../queries/__generated__/createZetteli';
import { updateZetteli } from '../queries/__generated__/updateZetteli';
import { deleteZetteli } from '../queries/__generated__/deleteZetteli';
import { getAllZettelis } from '../queries/__generated__/getAllZettelis';

import Store from './Store';

import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
const WS_GRAPHQL_ENDPOINT = 'ws://localhost:3010/graphql';

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

export default class GraphQLClient implements ZetteliClient {
    // TODO(helfer): Rename to stackId.
    private sid: string; // The stack ID (collection of zettelis)
    private store: Store<BaseState>;

    private subscribers: Function[];

    private link: ApolloLink;
    private wsSubscriptionLink: ApolloLink;

    private currentVersionId: number;

    private eventLogSubscription: ZenObservable.Subscription | null = null;

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

        const wsclient = new SubscriptionClient(WS_GRAPHQL_ENDPOINT, {
            reconnect: true
          });
        this.wsSubscriptionLink = new WebSocketLink(wsclient);

        wsclient.onDisconnected(() => {
            if (this.eventLogSubscription && !this.eventLogSubscription.closed) {
                this.eventLogSubscription.unsubscribe();
                this.eventLogSubscription = null;
            }
        });
        wsclient.onReconnected(() => {
            this.subscribeToEventLog();
        });

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

    subscribeToEventLog(): void {

        // TODO: rerun query on disconnect if query is no longer active.

        // subscriptions !!!
        const op = {
            query: getNewLogEventsSubscription,
            variables: {
                stackId: this.sid,
                sinceVersionId: this.currentVersionId,
            },
        };

        this.eventLogSubscription = execute(this.wsSubscriptionLink, op).subscribe({
            next: (result: { data: getNewLogEvents }) => {
                const events = result.data.events;
                events.forEach(event => {
                    this.store.dispatch(makeProcessLogEventAction(event));
                    this.currentVersionId = event.id;
                });
            },
            error: (e) => { throw new Error(e); },
            complete: () => { throw new Error('Subscription complete. Wait? Why does this happen?'); },
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
            .map((res: { data: createZetteli, context: { isOptimistic: boolean } }) => {
                if (rollback) { rollback(); }
                if (res.data.createZetteli === null) {
                    return;
                } else {
                    rollback = this.store.dispatch(
                        makeCreateZetteliAction(zli, res.data.createZetteli),
                        res.context && res.context.isOptimistic,
                    );
                }

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
          .map((res: { data: deleteZetteli, context: { isOptimistic: boolean } }) => {
              if (rollback) { rollback(); }
              rollback = this.store.dispatch(
                makeDeleteZetteliAction(id, res.data.deleteZetteli || false),
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
        this.observableRequest(operation).map((res: { data: updateZetteli, context: { isOptimistic: boolean } }) => {
            if (rollback) { rollback(); }
            rollback = this.store.dispatch(
              makeUpdateZetteliAction(data, res.data.updateZetteli || false),
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
            .then( (res: { data: getAllZettelis }) => {
                const stack = res.data.stack;
                if (stack === null) {
                    return this.store.dispatch(state => ({
                        ...state,
                        ready: true,
                        loading: false,
                        error: 'stack not found',
                        stack: {},
                        zettelis: [],
                    }));
                } else {
                    // TODO: Start the subscription in a better place
                    this.currentVersionId = stack.log.currentVersionId;
                    this.subscribeToEventLog();
                    return this.store.dispatch(state => ({
                        ...state,
                        ready: true,
                        loading: false,
                        stack,
                        zettelis: stack.zettelis.map(this.parseZetteli),
                    }));
                }
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
