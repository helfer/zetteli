import * as knex from 'knex';

import { Connector } from './ConnectorInterface';
import { ZetteliType } from '../models/Zetteli';


export default class SQLZetteliConnector implements Connector<ZetteliType> {
    private db: knex;
    
    constructor(dbConfig: knex.Config) {
        this.db =  knex(dbConfig);
    }

    // TODO(helfer): Get the types right here. Add them to the schema
    static serialize(zli: any) {
        return {
            ...zli,
            datetime: new Date(parseInt(zli.datetime)),
            tags: zli.tags.join(' '),
        };
    }

    static parse(zli: any) {
        return {
            ...zli,
            tags: (zli.tags as string).split(' '),
        };
    }

    get(id: string) {
        // TODO(helfer): Add timeouts to queries
        return this.db('zettelis')
            .select('*')
            .where('id', id)
            .then( rows => {
                return SQLZetteliConnector.parse(rows[0]);
            });
    }

    getAll() {
        return this.db('zettelis')
            .select('*')
            .then(rows => 
                rows.map(SQLZetteliConnector.parse)
            );
    }

    create(zli: ZetteliType) {
        return this.db('zettelis').debug()
            .insert(SQLZetteliConnector.serialize(zli))
            .then( ids => 
                ids[0]
            );
    }

    update(zli: ZetteliType) {
        return this.db('zettelis')
            .where('id', zli.id)
            .update(SQLZetteliConnector.serialize(zli))
            .then(numRows => numRows > 0);
    }

    delete(id: string) {
        return this.db('zettelis')
            .where('id', id)
            .del()
            .then(numRows => numRows > 0);
    }
}