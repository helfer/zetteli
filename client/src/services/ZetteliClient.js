const LOCAL_STORAGE_KEY = 'Zetteli.zettelis';

export default class ZetteliClient {
    // XXX reading from and writing to local storage
    // will only work in one tab at a time, because
    // writes are not synced and overwrite current contents.
    // That could be solved very easily, but it's not a goal
    // right now.


    constructor() {
        this.zettelis = this.readFromLocalStorage();
    }

    writeToLocalStorage() {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.zettelis));
    }

    readFromLocalStorage() {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    }

    createNewZetteli() {
        const newZetteli = {
            tags: ['log', 'personal'],
            datetime: new Date(),
            body: '',
            id: Math.random(),
        };
        this.zettelis = [ ...this.zettelis, newZetteli ];
        this.writeToLocalStorage();
        return Promise.resolve(true);
    }

    addZetteli(zli) {
        this.zettelis = [ ...this.zettelis, zli];
        this.writeToLocalStorage();
        return Promise.resolve(true);
    }

    removeZetteli(id) {
        this.zettelis = this.zettelis.filter( zli => zli.id !== id );
        this.writeToLocalStorage();
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
        this.writeToLocalStorage();
        return Promise.resolve(true);
    }

    getZetteli(id) {
        // TODO: reject when Zetteli cannot be found?
        return Promise.resolve(this.zettelis.find( zli => zli.id === id ));
    }

    getAllZettelis() {
        return new Promise( (resolve, reject) => {
            setTimeout(() => resolve(this.zettelis), 1000);
        });
    }
}