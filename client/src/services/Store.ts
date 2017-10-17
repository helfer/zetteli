type RollbackHandle = () => void;

export default class Store<T> {
    private state: T;
    private optimisticActions: ((state: T) => T)[];

    // We lazily compute the optimistic state, so it's basically free if you don't use it.
    private optimisticState: T;
    private optimisticStateIsDirty = true;
    private subscribers: { 
        subscriber: () => void,
        includeOptimisticUpdates: boolean,
    }[];

    // To make sure we only call each subscriber once per tick.
    private notified: { [optimistic: string]: boolean } = {
        'true': false,
        'false': false,
    };

    public constructor(initialState: T) {
        this.state = initialState;
        this.optimisticActions = [];
        this.subscribers = [];
    }

    public dispatch(action: (state: T) => T, isOptimistic: boolean = false): RollbackHandle {
        this.optimisticStateIsDirty = true;
        let rollback: () => void;
        if (isOptimistic) {
            this.optimisticActions.push(action);
            rollback = () => this.rollback(action);
        } else {
            this.state = action(this.state);
            rollback = () => { throw new Error('non-optimistic actions cannot be rolled back'); };
        }
        this.notify(isOptimistic);
        return rollback;
    }

    // NOTE(helfer): Subscribers are not notified only once per tick, even if multiple
    // actions are dispatched or rolled back in that tick. If you need to know the stream of
    // actions that happen, then build yourself a store middleware.
    public subscribe(subscriber: () => void, includeOptimisticUpdates: boolean = true) {
        // TODO(helfer): is it confusing that for actions the default is optimistic=false, but for
        // subscribers the default is optimistic = true?
        // TODO: should I change this to an observable model where the store is just a normal
        // observable stream of states?
        const subscriberEntry = { subscriber, includeOptimisticUpdates };
        this.subscribers.push(subscriberEntry);
        return () => this.subscribers.filter(s => s !== subscriberEntry);
    }

    public getState(): T {
        return this.state;
    }

    public getOptimisticState(): T {
        if (this.optimisticStateIsDirty) {
            this.optimisticState = this.optimisticActions.reduce(
                (state, action) => action(state),
                this.state,
            );
            this.optimisticStateIsDirty = false;
        }
        return this.optimisticState;
    }

    private notify(isOptimisticAction: boolean = false): void {
        // notify only once per tick
        if (this.notified[String(isOptimisticAction)]) { return; }
        this.notified[String(isOptimisticAction)] = true;
        setTimeout(() => this.notified[String(isOptimisticAction)] = false, 0);

        this.subscribers.forEach(s => {
            if (isOptimisticAction && !s.includeOptimisticUpdates) {
                return;
            }
            // NOTE(helfer): We call setTimeout here so that errors thrown
            // from subscribers don't have to be caught by the store.
            setTimeout(() => s.subscriber(), 0);
        });
    }

    private rollback(action: (state: T) => T): void {
        this.optimisticActions = this.optimisticActions.filter(a => a !== action);
        this.optimisticStateIsDirty = true;
        this.notify(true);
    }
}