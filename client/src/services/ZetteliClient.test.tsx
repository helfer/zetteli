import ZetteliClient from './ZetteliClient';

describe('ZetteliClient', () => {
    let client: ZetteliClient;
    let store: Storage;
    let storage: Map<string, string>;

    beforeEach(() => {
        storage = new Map();
        store = {
            getItem: key => storage.get(key) || null,
            length: storage.size,
            clear: () => { storage.clear(); },
            setItem: (key, item) => storage.set(key, item),
            removeItem: key => storage.delete(key),
            key: i => '', // not implemented
        };

        client = new ZetteliClient(store);
    });

    it('can add a Zetteli and read it back', () => {
        const zli = {
            id: '1',
            body: 'hello',
            datetime: new Date(),
            tags: ['t1', 't2'],
        };
        client.addZetteli(zli);
        expect(client.getAllZettelis()).resolves.toEqual(zli);
    });
});