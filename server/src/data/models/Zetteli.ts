import { Connector, ID } from '../connectors/ConnectorInterface';
import { isValidStackId } from '../../utils/random';

export interface ZetteliType {
    id: string;
    tags: string[];
    datetime: Date;
    body: string;
}

export default class Zetteli {
    constructor(private connector: Connector<ZetteliType>) {}

    get(id: ID) {
        return this.connector.get(id);
    }

    getAll(sid: string) {
        return this.connector.getAll(sid);
    }

    create(sid: string, zli: ZetteliType) {
        if (!isValidStackId(sid)) {
            throw new Error(`Invalid stack id: ${sid}`);
        }
        return this.connector.create(sid, zli);
    }

    update(zli: ZetteliType) {
        return this.connector.update(zli);
    }

    delete(id: ID) {
        return this.connector.delete(id);
    }
}