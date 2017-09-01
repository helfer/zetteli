export default class ZetteliClient {
    constructor() {
        this.zettelis = [
            {
                tags: ['log', 'personal'],
                datetime: new Date(),
                body: 'This is Zetteli #1',
                id: '0'
            },
            {
                tags: ['note'],
                datetime: new Date(),
                body: 'This is Zetteli #2',
                id: '1',
            },
        ];
    }

    createNewZetteli() {
        const newZetteli = {
            tags: ['log', 'personal'],
            datetime: new Date(),
            body: '',
            id: Math.random(),
        };
        this.zettelis = [ ...this.zettelis, newZetteli ];
        return Promise.resolve(true);
    }

    addZetteli(zli) {
        this.zettelis = [ ...this.zettelis, zli];
        return Promise.resolve(true);
    }

    removeZetteli(id) {
        this.zettelis = this.zettelis.filter( zli => zli.id !== id );
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