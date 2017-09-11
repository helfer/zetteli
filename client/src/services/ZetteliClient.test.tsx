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

    describe('basics', () => {
        let zli: ZetteliType;
        beforeEach(() => {
            zli = {
                id: '1',
                body: 'hello',
                datetime: new Date(),
                tags: ['t1', 't2'],
            };
            client.addZetteli(zli);
        });

        it('can read a single zetteli', () => {
            expect(client.getZetteli('1')).resolves.toBe(zli);
        });

        it('can delete a zetteli', () => {
            return client.deleteZetteli('1').then(() => {
                expect(client.getZetteli('1')).resolves.toBeUndefined();
            });
        });

        it('can update a zetteli', () => {
            return client.updateZetteli('1', { ...zli, body: 'uhu' }).then(() => {
                expect(client.getZetteli('1')).resolves.toEqual({ ...zli, body: 'uhu' });
            });   
        });

        it('can create a new blank zetteli', () => {
            return client.createNewZetteli().then(() => {
                expect(client.getAllZettelis()).resolves.toHaveLength(2);
            });
        });
    });

});