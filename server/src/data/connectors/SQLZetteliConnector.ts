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

    // TODO: rename sid to stackId
    static makeCreateZetteliEvent(zli: ZetteliType, stackId: string, opId: string = '' ) {
        return {
            type: 'ZetteliCreated',
            eventSchemaId: 1,
            opId,
            eventTime: new Date(),
            sid: stackId,
            payload: JSON.stringify({ zetteli: zli, stackId }),
        };
    }

    // zli is only a fragment of the zetteli
    static makeUpdateZetteliEvent(zli: ZetteliType, opId: string = '') {
        return {
            type: 'ZetteliUpdated',
            eventSchemaId: 0,
            opId,
            eventTime: new Date(),
            sid: '',
            payload: JSON.stringify(zli),
        };
    }

    // zli is only a fragment of the zetteli
    static makeDeleteZetteliEvent(id: string, opId: string = '') {
        return {
            type: 'ZetteliDeleted',
            eventSchemaId: 0,
            opId,
            eventTime: new Date(),
            sid: '',
            payload: JSON.stringify({ id }),
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
        return this.db.transaction( tx => {
            return tx.insert(SQLZetteliConnector.makeCreateZetteliEvent(zli, sid))
            .into('log')
            .then( ([versionId]) => {
                return tx.insert(SQLZetteliConnector.serialize({ ...zli, sid, versionId }))
                .into('zettelis')
                .then( ids => zli.id );
            });
        });
    }

    update(zli: ZetteliType) {
        // TODO: strictly speaking we should do this in the following order:
        // 1. verify that the zetteli exists (and check permissions if applicable)
        // 2. add the log event
        // 3. update the zetteli
        // That's a lot more work than before!
        return this.db.transaction( tx => {
            return tx.insert(SQLZetteliConnector.makeUpdateZetteliEvent(zli))
            .into('log')
            .then( ([versionId]) => {
                return tx('zettelis')
                .where('id', zli.id)
                .update(SQLZetteliConnector.serialize({ ...zli, versionId }))
                .then(numRows => numRows > 0);
            });
        });
    }

    delete(id: string) {
        // TODO: strictly speaking we should do this in the following order:
        // 1. verify that the zetteli exists (and check permissions if applicable)
        // 2. add the log event
        // 3. delete the zetteli
        // That's a lot more work than just straight out deleting!
        return this.db.transaction( tx => {
            return tx.insert(SQLZetteliConnector.makeDeleteZetteliEvent(id))
            .into('log')
            .then( ([versionId]) => {
                return tx('zettelis')
                .where('id', id)
                .del()
                .then(numRows => numRows > 0);
            });
        });
    }
}