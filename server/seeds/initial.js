
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('zettelis').del()
    .then(function () {
      // Inserts seed entries
      return knex('zettelis').insert([
        {
          id: '1',
          tags: 't1 t2',
          datetime: new Date('2011-01-11T09:53:11.123'),
          body: 'Zetteli 1',
        }, {
            id: '2',
            tags: 't2 t3',
            datetime: new Date('2012-02-12T09:53:22.234'),
            body: 'Zetteli 2',
        }, {
            id: '3',
            tags: 't3 t4',
            datetime: new Date('2012-03-13T09:53:33.345'),
            body: 'Zetteli 3',
        }
      ]);
    });
};
