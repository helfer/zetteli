type RollbackHandle = () => void;

export default class Store<T> {
    private state: T;
    private optimisticActions: ((state: T) => T)[];
    private subscribers: { 
        subscriber: (state: T) => void,
        includeOptimisticUpdates: boolean,
    }[];

    public constructor(initialState: T) {
        this.state = initialState;
        this.optimisticActions = [];
        this.subscribers = [];
    }

    public dispatch(action: (state: T) => T, isOptimistic = false): RollbackHandle | void {
        if (isOptimistic) {
            this.optimisticActions.push(action);
            return () => this.rollback(action);
        } else {
            this.state = action(this.state);
        }
        this.notify(true);
    }

    public subscribe(subscriber: (state: T) => void, includeOptimisticUpdates = true) {
        const subscriberEntry = { subscriber, includeOptimisticUpdates };
        this.subscribers.push(subscriberEntry);
        return () => this.subscribers.filter(s => s !== subscriberEntry);
    }

    public getState(): T {
        return this.state;
    }

    private notify(isOptimisticAction = false): void {
        const optimisticState = this.optimisticActions.reduce(
            (state, action) => action(state),
            this.state,
        );
        this.subscribers.forEach(s => {
            if (isOptimisticAction && !s.includeOptimisticUpdates) {
                return;
            }
            if (s.includeOptimisticUpdates) {
                s.subscriber(optimisticState);
            } else {
                s.subscriber(this.state);
            }
        })
    }

    private rollback(action: (state: T) => T): void {
        this.optimisticActions.filter(a => a !== action);
        this.notify(true)
    }
}