import Store from './Store';

describe('Store', () => {
    let state: { objects: Array<object> };
    let store: Store<typeof state>;

    beforeEach(() => {
        jest.useFakeTimers()
    });

    describe('normal actions', () => {
        let action: (state: any) => any;
        let obj: object;
        beforeEach(() => {
            state = { objects: [] };
            store = new Store(state);
            obj = {
                body: 'Hello',
                tags: ['a', 'b'],
            };
            action = (state) => ({
               objects: [...state.objects, obj],
            });
        });

        it('are applied to state', () => {
            store.dispatch(action);
            expect(store.getState().objects.length).toBe(1);

            store.dispatch(action);
            expect(store.getState().objects.length).toBe(2);
        });

        it('cause all subscribers to be notified', () => {
            const subscriber = jest.fn();
            const optimisticSubscriber = jest.fn();
            store.subscribe(subscriber);
            store.subscribe(optimisticSubscriber, true);
            store.dispatch(action);
            jest.runAllTimers();
            expect(subscriber).toHaveBeenCalled();
            expect(optimisticSubscriber).toHaveBeenCalled();

            store.dispatch(action);
            jest.runAllTimers();
            expect(subscriber).toHaveBeenCalledTimes(2);
            expect(optimisticSubscriber).toHaveBeenCalledTimes(2);
        });
    });

    describe('optimistic actions', () => {
        let action: (state: any) => any;
        let optimisticAction: (state: any) => any;
        let obj: object;
        let obj2: object;
        beforeEach(() => {
            state = { objects: [] };
            store = new Store(state);
            obj = {
                body: 'Hello',
                tags: ['a', 'b'],
            };
            obj2 = {
                optimistic: true,
            };
            action = (state) => ({
               objects: [...state.objects, obj],
            });
            optimisticAction = (state) => ({
                objects: [...state.objects, obj2],
            })
        });
        it('are not applied to state directly', () => {
            store.dispatch(optimisticAction, true);
            expect(store.getState()).toBe(state);
        });

        it('are applied to state optimistically', () => {
            store.dispatch(optimisticAction, true);
            expect(store.getOptimisticState().objects[0]).toBe(obj2);
        });

        it('do not notify non-optimistic subscribers', () => {
            const subscriber = jest.fn();
            store.subscribe(subscriber, false);
            store.dispatch(optimisticAction, true);
            jest.runAllTimers();
            expect(subscriber).not.toHaveBeenCalled();
        });

        it('notify default (optimistic) subscribers', () => {
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            store.dispatch(optimisticAction, true);
            jest.runAllTimers();
            expect(subscriber).toHaveBeenCalled();
            expect(store.getOptimisticState().objects[0]).toBe(obj2);
        });

        it('can be rolled back', () => {
            const rollback = store.dispatch(optimisticAction, true);
            expect(store.getOptimisticState().objects.length).toBe(1);
            rollback();
            expect(store.getOptimisticState()).toBe(state);
        });

        it('rollback notifies optimistic subscribers', () => {
            const subscriber = jest.fn();
            store.subscribe(subscriber);
            const rollback = store.dispatch(optimisticAction, true);
            jest.runAllTimers();
            expect(subscriber).toHaveBeenCalled();
            rollback();
            jest.runAllTimers();
            expect(subscriber).toHaveBeenCalledTimes(2);
        });

        it('rollback does not notify non-optimistic subscribers', () => {
            const subscriber = jest.fn();
            store.subscribe(subscriber, false);
            const rollback = store.dispatch(optimisticAction, true);
            expect(subscriber).not.toHaveBeenCalled();
            rollback();
            expect(subscriber).not.toHaveBeenCalled();
        });
    });
});