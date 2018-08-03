
exports.up = function (knex, Promise) {
    return knex.schema.createTable('log', (table) => {
        table.bigIncrements('id').primary();
        table.string('opId');
        table.string('type');
        table.dateTime('eventTime');
        table.integer('eventSchemaId');
        table.json('payload');
    });

    return knex.schema.table('zettelis', function(t) {
        t.bigInteger('versionId').unsigned().notNull().defaultTo(0);
    });
    return knex.schema.table('stacks', function(t) {
        t.bigInteger('versionId').unsigned().notNull().defaultTo(0);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('log');
    return knex.schema.table('zettelis', function(t) {
        t.dropColumn('versionId');
    });
    return knex.schema.table('stacks', function(t) {
        t.dropColumn('versionId');
    });
};
