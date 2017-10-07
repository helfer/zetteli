type RollbackHandle = () => void;

export default class Store<T> {
    private state: T;
    private optimisticActions: ((state: T) => T)[];
    private subscribers: { 
        subscriber: () => void,
        includeOptimisticUpdates: boolean,
    }[];

    public constructor(initialState: T) {
        this.state = initialState;
        this.optimisticActions = [];
        this.subscribers = [];
    }

    public dispatch(action: (state: T) => T, isOptimistic = false): RollbackHandle {
        let rollback: () => void;
        if (isOptimistic) {
            this.optimisticActions.push(action);
            rollback = () => this.rollback(action);
        } else {
            this.state = action(this.state);
            rollback = () => { throw new Error('non-optimistic actions cannot be rolled back'); }
        }
        this.notify(isOptimistic);
        return rollback;
    }

    // TODO(helfer): is it confusing that for actions the default is optimistic=false, but for
    // subscribers the default is optimistic = true?
    public subscribe(subscriber: () => void, includeOptimisticUpdates = true) {
        const subscriberEntry = { subscriber, includeOptimisticUpdates };
        this.subscribers.push(subscriberEntry);
        return () => this.subscribers.filter(s => s !== subscriberEntry);
    }

    public getState(): T {
        return this.state;
    }

    public getOptimisticState(): T {
        return this.optimisticActions.reduce(
            (state, action) => action(state),
            this.state,
        );
    }

    private notify(isOptimisticAction = false): void {
        this.subscribers.forEach(s => {
            if (isOptimisticAction && !s.includeOptimisticUpdates) {
                return;
            }
            // NOTE(helfer): We call setTimeout here so that errors thrown
            // from subscribers don't have to be caught by the store.
            setTimeout(() => s.subscriber(), 0);
        })
    }

    private rollback(action: (state: T) => T): void {
        this.optimisticActions = this.optimisticActions.filter(a => a !== action);
        this.notify(true)
    }
}