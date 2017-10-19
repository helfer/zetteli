
exports.up = function(knex, Promise) {
    return knex.schema.createTable('stacks', (table) => {
        table.string('id').primary();
        table.string('name');
        table.dateTime('createdAt');
        table.boolean('public');
        table.json('settings');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('stacks');
};
