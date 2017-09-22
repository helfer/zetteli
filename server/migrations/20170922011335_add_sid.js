exports.up = function(knex, Promise) {
    return knex.schema.table('zettelis', function(t) {
        t.string('sid', 16).notNull().defaultTo('');
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table('zettelis', function(t) {
        t.dropColumn('sid');
    });
};
