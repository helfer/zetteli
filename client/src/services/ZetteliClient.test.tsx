import ZetteliClient from './ZetteliClient';
import { ZetteliType } from '../components/Zetteli';

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

        client = new ZetteliClient(store, 1);
    });

    it('can add a Zetteli and read it back', () => {
        const zli = {
            id: '1',
            body: 'hello',
            datetime: new Date(),
            tags: ['t1', 't2'],
        };
        client.addZetteli(zli);
        expect(client.getAllZettelis()).resolves.toEqual([zli]);
    });

    describe('basics', () => {
        let zli: ZetteliType;
        let zli2: ZetteliType;
        beforeEach(() => {
            zli = {
                id: '1',
                body: 'hello',
                datetime: new Date(),
                tags: ['t1', 't2'],
            };
            zli2 = {
                id: '2',
                body: 'bye',
                datetime: new Date(),
                tags: ['t3', 't2'],
            };
            client.addZetteli(zli);
            client.addZetteli(zli2);
        });

        it('can read a single zetteli', () => {
            return expect(client.getZetteli('1')).resolves.toBe(zli);
        });

        it('can delete a zetteli', () => {
            return client.deleteZetteli('1').then(() => {
                expect(client.getZetteli('1')).resolves.toBeUndefined();
                expect(client.getAllZettelis()).resolves.toHaveLength(1);
            });
        });

        it('can update a zetteli', () => {
            return client.updateZetteli('1', { ...zli, body: 'uhu' }).then(() => {
                expect(client.getZetteli('1')).resolves.toEqual({ ...zli, body: 'uhu' });
                expect(client.getZetteli('2')).resolves.toEqual(zli2);
            });   
        });

        it('can create a new blank zetteli', () => {
            return client.createNewZetteli().then(() => {
                return expect(client.getAllZettelis()).resolves.toHaveLength(3);
            });
        });
    });

});