import uuid from 'uuid';

import { ZetteliClient } from './ZetteliClient';
import { ZetteliType } from '../components/Zetteli';

const LOCAL_STORAGE_KEY = 'Zetteli.zettelis';

// TODO(helfer): how do I keep this in sync with ZetteliType?
interface SerializedZetteli {
    id: string;
    body: string;
    tags: string[];
    datetime: string;
}

export default class LocalStorageClient implements ZetteliClient {
    // XXX reading from and writing to local storage
    // will only work in one tab at a time, because
    // writes are not synced and overwrite current contents.
    // That could be solved very easily, but it's not a goal
    // right now.
    private zettelis: ZetteliType[];

    constructor(private store: Storage, private delay: number = 300) {
        this.pullFromStore();
    }

    createNewZetteli(): Promise<string> {
        const newZetteli = {
            tags: ['log', 'personal'],
            datetime: new Date(),
            body: '',
            id: uuid.v4(), // TODO(helfer): this is just asking for trouble
        };
        this.zettelis = [ ...this.zettelis, newZetteli ];
        this.writeToStore();
        return Promise.resolve(newZetteli.id);
    }

    addZetteli(zli: ZetteliType): Promise<boolean> {
        this.zettelis = [ ...this.zettelis, zli];
        this.writeToStore();
        return Promise.resolve(true);
    }

    deleteZetteli(id: string): Promise<boolean> {
        this.zettelis = this.zettelis.filter( zli => zli.id !== id );
        this.writeToStore();
        return Promise.resolve(true);
    }

    updateZetteli(id: string, data: ZetteliType): Promise<boolean> {
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

    getZetteli(id: string): Promise<ZetteliType | undefined> {
        this.pullFromStore();
        // TODO: reject when Zetteli cannot be found?
        return Promise.resolve(this.zettelis.find( zli => zli.id === id ));
    }

    getAllZettelis(): Promise<ZetteliType[]> {
        this.pullFromStore();
        // NOTE(helfer): Using a delay here to simulate network roundtrip
        return new Promise( (resolve, reject) => {
            setTimeout(() => { resolve(this.zettelis); }, this.delay);
        });
    }

    private writeToStore(): void {
        this.store.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.zettelis));
    }

    private readFromStore(): ZetteliType[] {
        return JSON.parse(this.store.getItem(LOCAL_STORAGE_KEY) || '[]')
        .map(this.parseZetteli);
    }

    private parseZetteli(zli: SerializedZetteli): ZetteliType {
        return {
            ...zli,
            datetime: new Date(zli.datetime),
        };
    }

    private pullFromStore(): void {
        this.zettelis = this.readFromStore();
    }
}