import {
    ApolloLink,
    Observable,
    Operation,
    Observer,
    FetchResult,
    NextLink,
} from 'apollo-link';

interface OperationQueueEntry {
    operation: Operation;
    forward: NextLink;
    observer: Observer<FetchResult>;
    subscription?: { unsubscribe: () => void };
}

export default class OfflineLink extends ApolloLink {
    private opQueue: OperationQueueEntry[] = [];

    enqueue(entry: OperationQueueEntry) {
        this.opQueue.push(entry);
        if (this.opQueue.length === 1) {
            // NOTE(helfer): Because of this listener, the queue must be drained
            // in order for the link to be garbage collected. Since that's quite
            // obscure, a memory leak is likely, but assuming that most people
            // don't create thousands of links it probably doesn't matter in
            // practice. If they care enough, they'll have to read the docs.
            window.addEventListener('online', this.drainQueue);
        }
    }

    drainQueue = () => {
        window.removeEventListener('online', this.drainQueue);
        this.opQueue.forEach(({ operation, forward, observer }) => {
            forward(operation).subscribe(observer);
        });
        this.opQueue = [];
    }

    cancelOperation = (entry: OperationQueueEntry) => {
        this.opQueue = this.opQueue.filter(e => e !== entry);
    }

    request(operation: Operation, forward: NextLink ) {
        if (navigator.onLine) {
            return forward(operation);
        }
        return new Observable(observer => {
            this.enqueue({ operation, forward, observer });
            return () => this.cancelOperation({ operation, forward, observer });
        });
    }
}
