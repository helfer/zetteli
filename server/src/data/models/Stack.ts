import { Connector, ID } from '../connectors/ConnectorInterface';
import { isValidStackId } from '../../utils/random';

export interface StackType {
    id: string;
    versionId: number;
    name: string;
    public: boolean;
    createdAt: Date;
    settings: {
        defaultTags: string;
    };
}

export default class Stack {
    constructor(private connector: Connector<StackType>) {}

    get(id: ID) {
        return this.connector.get(id);
    }

    getAll(sid: string) {
        return this.connector.getAll(sid);
    }

    // TODO(helfer): Remove ID argument here and for zettelis
    create(id: string, stack: StackType) {
        if (!isValidStackId(stack.id)) {
            throw new Error(`Invalid stack id: ${stack.id}`);
        }
        return this.connector.create(stack.id, stack);
    }

    update(stack: StackType) {
        return this.connector.update(stack);
    }

    delete(id: ID) {
        return this.connector.delete(id);
    }
}