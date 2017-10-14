import {
    ApolloLink,
    Observable,
    Observer,
    FetchResult,
    Operation,
    NextLink,
} from 'apollo-link';

interface OperationQueueEntry {
    operation: Operation;
    forward: NextLink;
    observer: Observer<FetchResult>;
    subscription?: { unsubscribe: () => void };
}

export default class DebounceLink extends ApolloLink {
    private delay: number;
    // TODO(helfer): nodejs and browser typings seem incompatible here. setTimeout returns NodeJS.Timer,
    // but clearTimeout wants a number. If I use window.setTimeout, I can't test as easily any more.
    // tslint:disable-next-line no-any
    private timeout: any;
    private runningSubscriptions: {
        [key: string]: {
            observers: Observer<FetchResult>[];
            subscription: { unsubscribe: () => void };
        }
    } = {};
    private queuedObservers: Observer<FetchResult>[] = [];

    // NOTE(helfer): In theory we could run out of numbers for debounceKey, but it's not a realistic use-case
    // If the debouncer fired once every ms, it would take about 300,000 years to run out of safe integers.
    // Safe to say, most people will close their browser tabs more frequenly than that.
    private debounceKey: number = 0;
    private lastRequest: { operation: Operation, forward: NextLink };
    constructor(delay: number) {
        super();
        this.delay = delay;
    }

    // Add a request to the debounce queue
    enqueueRequest = ({ operation, forward, observer }: OperationQueueEntry) => {
        this.queuedObservers.push(observer);
        this.lastRequest = { operation, forward };
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(this.flush, this.delay);
        return this.debounceKey;
    }

    // flush the currently queued requests
    flush = () => {
        if (this.queuedObservers.length === 0 ) {
            // This can happen if they all unsubscribed
            return;
        }
        const { operation, forward } = this.lastRequest;
        const currentObservers = [...this.queuedObservers];
        const sub = forward(operation).subscribe({
            next: (v: FetchResult) => { 
                currentObservers.forEach(observer => observer.next && observer.next(v));
            },
            error: (e: Error) => {
                currentObservers.forEach(observer => observer.error && observer.error(e));
            },
            complete: () => {
                currentObservers.forEach(observer => observer.complete && observer.complete());
            }
        });
        this.runningSubscriptions[this.debounceKey] = {
            subscription: sub,
            observers: currentObservers,
        };
        this.queuedObservers = [];
        this.debounceKey++;
    }

    unsubscribe = (debounceGroupId: number, observer: Observer<FetchResult>) => {
        // NOTE(helfer): This breaks if the same observer is
        // used for multiple subscriptions to the same observable.
        // To be fair, I think all Apollo Links will currently execute the request
        // once for every subscriber, so it wouldn't really work anyway.

        // TODO(helfer): Test this extensively

        // if this observer is in the queue that hasn't been executed yet, remove it
        if (debounceGroupId === this.debounceKey) {
            this.queuedObservers = this.queuedObservers.filter( obs => obs !== observer);
            return;
        }

        // if this observer's observable has already been forwarded, cancel it
        const observerGroup = this.runningSubscriptions[debounceGroupId];
        if (observerGroup) {
            observerGroup.observers = observerGroup.observers.filter(obs => obs !== observer);

            // if this was the last observer listening to the forwarded value, unsubscribe
            // from the subscription entirely
            if (observerGroup.observers.length === 0) {
                observerGroup.subscription.unsubscribe();
            }
        }
    }

    request(operation: Operation, forward: NextLink ) {
        if (!operation.getContext().debounce) {
            return forward(operation);
        }
        return new Observable(observer => {
            const debounceGroupId = this.enqueueRequest({ operation, forward, observer });
            return () => {
                this.unsubscribe(debounceGroupId, observer);
            };
        });
    }
}
