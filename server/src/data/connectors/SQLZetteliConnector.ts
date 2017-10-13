import * as knex from 'knex';

import { Connector } from './ConnectorInterface';
import { ZetteliType } from '../models/Zetteli';


export default class SQLZetteliConnector implements Connector<ZetteliType> {
    private db: knex;
    
    constructor(dbConfig: knex.Config) {
        this.db =  knex(dbConfig);
    }

    static serialize(zli: any) {
        return {
            ...zli,
            tags: zli.tags ? zli.tags.join(' ') : undefined,
        };
    }

    static parse(zli: any) {
        // NOTE(helfer): If performance becomes an issue we could copy instead of mutating
        return {
            ...zli,
            datetime: new Date(zli.datetime),
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

    getAll(sid: string) {
        return this.db('zettelis')
            .select('*')
            .where({ sid })
            .then(rows => 
                rows.map(SQLZetteliConnector.parse)
            );
    }

    create(sid: string, zli: ZetteliType) {
        return this.db('zettelis')
            .insert(SQLZetteliConnector.serialize({ ...zli, sid }))
            .then( ids => zli.id );
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