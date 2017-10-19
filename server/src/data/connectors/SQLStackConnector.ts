import * as knex from 'knex';

import { Connector } from './ConnectorInterface';
import { StackType } from '../models/Stack';


export default class SQLStackConnector implements Connector<StackType> {
    private db: knex;
    
    constructor(dbConfig: knex.Config) {
        this.db =  knex(dbConfig);
    }

    static serialize(stack: any) {
        return {
            ...stack,
            settings: stack.settings ? JSON.stringify(stack.settings) : undefined,
        };
    }

    static parse(stack: any) {
        if (!stack) {
            return null;
        }
        // NOTE(helfer): If performance becomes an issue we could copy instead of mutating
        return {
            ...stack,
            createdAt: stack.createdAt && new Date(stack.createdAt),
            settings: stack.settings && JSON.parse(stack.settings as string),
        };
    }

    get(id: string) {
        // TODO(helfer): Add timeouts to queries
        return this.db('stacks')
            .select('*')
            .where('id', id)
            .then( rows => {
                return SQLStackConnector.parse(rows[0]);
            });
    }

    getAll(sid: string) {
        return this.db('stacks')
            .select('*')
            .where({ sid })
            .then(rows => 
                rows.map(SQLStackConnector.parse)
            );
    }

    // TODO(helfer): remove the id argument here and for ZetteliType
    create(id: string, stack: StackType) {
        return this.db('stacks')
            .insert(SQLStackConnector.serialize({ ...stack }))
            .then( ids => stack.id );
    }

    update(stack: StackType) {
        return this.db('stacks')
            .where('id', stack.id)
            .update(SQLStackConnector.serialize(stack))
            .then(numRows => numRows > 0);
    }

    delete(id: string) {
        return this.db('stacks')
            .where('id', id)
            .del()
            .then(numRows => numRows > 0);
    }
}