import { Connector, ID } from '../connectors/ConnectorInterface';

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

    getAll() {
        return this.connector.getAll();
    }

    create(zli: ZetteliType) {
        return this.connector.create(zli);
    }

    update(zli: ZetteliType) {
        return this.connector.update(zli);
    }

    delete(id: ID) {
        return this.connector.delete(id);
    }
}