import { ZetteliType } from '../components/Zetteli';

const LOCAL_STORAGE_KEY = 'Zetteli.zettelis';

export default class ZetteliClient {
    // XXX reading from and writing to local storage
    // will only work in one tab at a time, because
    // writes are not synced and overwrite current contents.
    // That could be solved very easily, but it's not a goal
    // right now.
    private zettelis: ZetteliType[];

    constructor(private store: Storage, private delay: number = 300) {
        // NOTE(helfer): Using a delay here to simulate network roundtrip
        this.zettelis = this.readFromStore();
    }

    writeToStore() {
        this.store.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.zettelis));
    }

    readFromStore() {
        return JSON.parse(this.store.getItem(LOCAL_STORAGE_KEY) || '[]');
    }

    createNewZetteli() {
        const newZetteli = {
            tags: ['log', 'personal'],
            datetime: new Date(),
            body: '',
            id: Math.random().toString(),
        };
        this.zettelis = [ ...this.zettelis, newZetteli ];
        this.writeToStore();
        return Promise.resolve(true);
    }

    addZetteli(zli: ZetteliType) {
        this.zettelis = [ ...this.zettelis, zli];
        this.writeToStore();
        return Promise.resolve(true);
    }

    deleteZetteli(id: string) {
        this.zettelis = this.zettelis.filter( zli => zli.id !== id );
        this.writeToStore();
        return Promise.resolve(true);
    }

    updateZetteli(id: string, data: ZetteliType) {
        this.zettelis = this.zettelis.map( zli => {
            if (zli.id === id) {
                return { ...zli, ...data };
            } else {
                return zli;
            }
        });
        this.writeToStore();
        return Promise.resolve(true);
    }

    getZetteli(id: string) {
        // TODO: reject when Zetteli cannot be found?
        return Promise.resolve(this.zettelis.find( zli => zli.id === id ));
    }

    getAllZettelis() {
        return new Promise( (resolve, reject) => {
            setTimeout(() => { resolve(this.zettelis); }, this.delay);
        });
    }
}