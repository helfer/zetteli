import * as knex from 'knex';

export default class SQLLogConnector {
    private db: knex;
    
    constructor(dbConfig: knex.Config) {
        this.db =  knex(dbConfig);
    }

    public getCurrentVersionId() {
        // TODO(helfer): Add timeouts to queries
        return this.db('log')
            .max('id')
            .then( ([row]) => {
                return row['max("id")'];
            });
    }

    public getEvents(sinceVersionId: number) {
        return this.db('log')
            .select('*')
            .where('id', '>', sinceVersionId);
    }
}