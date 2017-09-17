
exports.up = function(knex, Promise) {
    return knex.schema.createTable('zettelis', (table) => {
        table.string('id').primary();
        table.string('tags');
        table.dateTime('datetime');
        table.text('body');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable('zettelis');
};
