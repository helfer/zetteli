import { ZetteliType } from '../components/Zetteli';

export interface ZetteliClient {
    createNewZetteli(): Promise<string>;
    addZetteli(zli: ZetteliType): Promise<boolean>;
    deleteZetteli(id: string): Promise<boolean>;
    updateZetteli(id: string, data: ZetteliType): Promise<boolean>;
    getZetteli(id: string): Promise<ZetteliType | undefined>;
    getAllZettelis(): Promise<ZetteliType[]>;
    subscribe(func: () => void): void;
    unsubscribe(func: () => void): void;
}