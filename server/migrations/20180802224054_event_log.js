
exports.up = function (knex, Promise) {
    return knex.schema.createTable('log', (table) => {
        table.increments('id').primary();
        table.string('opId');
        table.string('type');
        table.dateTime('eventTime');
        table.integer('eventSchemaId');
        table.json('payload');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('log');
};
