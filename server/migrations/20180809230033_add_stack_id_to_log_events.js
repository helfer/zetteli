exports.up = function(knex, Promise) {
    return knex.schema.table('log', function(t) {
        t.string('sid', 16).notNull().defaultTo('');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('log', function(t) {
        t.dropColumn('sid');
    });
};
