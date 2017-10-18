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

export default class OnOffLink extends ApolloLink {
    private opQueue: OperationQueueEntry[] = [];
    private isOpen: boolean = true;

    enqueue(entry: OperationQueueEntry) {
        console.log('enqueue');
        this.opQueue.push(entry);
    }

    open = () => {
        console.log('open');
        this.isOpen = true;
        this.opQueue.forEach(({ operation, forward, observer }) => {
            forward(operation).subscribe(observer);
        });
        this.opQueue = [];
    }

    close = () => {
        console.log('close');
        this.isOpen = false;
    }

    cancelOperation = (entry: OperationQueueEntry) => {
        this.opQueue = this.opQueue.filter(e => e !== entry);
    }

    request(operation: Operation, forward: NextLink ) {
        if (this.isOpen) {
            return forward(operation);
        }
        return new Observable(observer => {
            this.enqueue({ operation, forward, observer });
            return () => this.cancelOperation({ operation, forward, observer });
        });
    }
}
