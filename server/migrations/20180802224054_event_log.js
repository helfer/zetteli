
exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTable('log', (table) => {
            table.bigIncrements('id').primary();
            table.string('opId');
            table.string('type');
            table.dateTime('eventTime');
            table.integer('eventSchemaId');
            table.json('payload');
        }),

        knex.schema.table('zettelis', function(t) {
            t.bigInteger('versionId').unsigned().notNull().defaultTo(0);
        }),
        knex.schema.table('stacks', function(t) {
            t.bigInteger('versionId').unsigned().notNull().defaultTo(0);
        }),
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('log'),
        knex.schema.table('zettelis', function(t) {
            t.dropColumn('versionId');
        }),
        knex.schema.table('stacks', function(t) {
            t.dropColumn('versionId');
        }),
    ]);
};
