import Store from './Store';

describe('Store', () => {
    let state: { objects: Array<object> };
    let store: Store<typeof state>;

    beforeEach(() => {
        state = { objects: [] };
        store = new Store(state);
    });

    describe('normal actions', () => {
        let action: (state: any) => any;
        let obj: object;
        beforeEach(() => {
            obj = {
                body: 'Hello',
                tags: ['a', 'b'],
            };
            action = (state) => {
               state.objects.push(obj);
               return state;
            }
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
            expect(subscriber).toHaveBeenCalledWith(state);
            expect(optimisticSubscriber).toHaveBeenCalledWith(state);

            store.dispatch(action);
            expect(subscriber).toHaveBeenCalledTimes(2);
            expect(optimisticSubscriber).toHaveBeenCalledTimes(2);
        });
    });
});