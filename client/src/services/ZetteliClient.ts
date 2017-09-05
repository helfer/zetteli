const LOCAL_STORAGE_KEY = 'Zetteli.zettelis';

export interface Zetteli {
    id: string,
    body: string,
    tags: string[],
    datetime: Date,
}

export default class ZetteliClient {
    // XXX reading from and writing to local storage
    // will only work in one tab at a time, because
    // writes are not synced and overwrite current contents.
    // That could be solved very easily, but it's not a goal
    // right now.
    private zettelis: Zetteli[]

    constructor(private store: Storage) {
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

    addZetteli(zli) {
        this.zettelis = [ ...this.zettelis, zli];
        this.writeToStore();
        return Promise.resolve(true);
    }

    deleteZetteli(id) {
        this.zettelis = this.zettelis.filter( zli => zli.id !== id );
        this.writeToStore();
        return Promise.resolve(true);
    }

    updateZetteli(id, data) {
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

    getZetteli(id) {
        // TODO: reject when Zetteli cannot be found?
        return Promise.resolve(this.zettelis.find( zli => zli.id === id ));
    }

    getAllZettelis() {
        return new Promise( (resolve, reject) => {
            setTimeout(() => resolve(this.zettelis), 300);
        });
    }
}