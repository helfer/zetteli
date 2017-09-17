
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('zettelis').del()
    .then(function () {
      // Inserts seed entries
      return knex('zettelis').insert([
        {
          id: '1',
          tags: 't1 t2',
          datetime: new Date(1500000005000),
          body: 'Zetteli 1',
        }, {
            id: '2',
            tags: 't2 t3',
            datetime: new Date(1500000505000),
            body: 'Zetteli 2',
        }, {
            id: '3',
            tags: 't3 t4',
            datetime: new Date(1500050005000),
            body: 'Zetteli 3',
        }
      ]);
    });
};
