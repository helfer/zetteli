import { Connector } from './ConnectorInterface';
import { ZetteliType } from '../models/Zetteli';

export default class InMemoryZetteliConnector implements Connector<ZetteliType> {
    private zettelis: ZetteliType[];
    
    constructor(zettelis: ZetteliType[] = []) {
        this.zettelis = zettelis;
    }

    get(id: string) {
        return this.zettelis.find(z => z.id === id);
    }

    getAll() {
        return this.zettelis;
    }

    create(zli: ZetteliType) {
        this.zettelis.push(zli);
        return zli.id;
    }

    // TODO(helfer): Use a ZetteliInputType, which may not have all the fields
    update(zli: ZetteliType) {
        let updated = false;
        this.zettelis = this.zettelis.map( z => {
            if (z.id === zli.id) {
                updated = true;
                return zli;
            }
            return z;
        });
        return updated;
    }

    delete(id: string) {
        let deleted = false;
        this.zettelis = this.zettelis.filter( z => {
            if (z.id === id) {
                deleted = true;
                return false;
            }
            return true;
        });
        return deleted;
    }
}