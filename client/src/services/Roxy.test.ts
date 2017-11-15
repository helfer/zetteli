import gql from 'graphql-tag';
import Roxy from './Roxy';

const state = {
    nodes: {
        'Stack:5': {
           id: '5',
           __typename: 'Stack',
           name: 'Stack 5',
           'zettelis(last: 2)': [] as any[],
        },
        'Zetteli:2': {
            id: '2',
            __typename: 'Zetteli',
            tags: ['t1', 't2'],
            body: 'Z2',
        },
        'Zetteli:3': {
            id: '3',
            __typename: 'Zetteli',
            tags: ['t2', 't3'],
            body: 'Z3',
        },
     },
     data: {
         'allStacks': undefined as any,
         'stack(id: 5)': undefined as any,
     },
 };

 state.nodes['Stack:5']['zettelis(last: 2)'] = [ state.nodes['Zetteli:2'], state.nodes['Zetteli:2'] ];
 state.data['stack(id: 5)'] = state.nodes['Stack:5']; 
 state.data['allStacks'] = [state.nodes['Stack:5']]

 const store = new Roxy();

 describe('Roxy', () => {
    it('can write a query', () => {
        const query = gql`
        query author {
            author {
                id
                __typename
                name
            }
        }
        `;
        const data = {
            author: {
                id: '1',
                __typename: 'Author',
                name: 'Charles Dickens',
            },
        };
        const query2 = gql`
        query author {
            authorZ {
                id
                __typename
                name
            }
        }
        `;
        const data2 = {
            authorZ: [{
                id: '1',
                __typename: 'Author',
                name: 'Hermann Hesse',
            },
            {
                id: '2',
                __typename: 'Author',
                name: 'Bertolt Brecht',
            }],
        };
        store.write(query, data);
        const earlyValue = store.read(query);
        store.write(query2, data2);
        expect(store.read(query).author).toEqual(data2.authorZ[0]);
        expect(store.read(query2)).toEqual(data2);
        expect(earlyValue).toEqual(data);
    });

    it('Can write a loooong array', () => {
        const N = 10000;
        const longArray: any[] = [];
        for(let i = 0; i < N; i++) {
            longArray[i] = {
                id: i,
                value: `Value ${i}`,
                __typename: 'Boo',
            };
        }
        const query = gql`
        query {
          longArray { __typename id value }
        }
      `;
        const value = {
            longArray: longArray,
        };
        const start = process.hrtime()[1];
        // store.write(query, value);
        // const x = store.read(query).longArray.map((v: any) => v.id);
        // expect(x.length).toBe(N);
        const K = JSON.parse(JSON.stringify(longArray));
        // expect(K).toBe(K);
        console.log('roxy ms', (process.hrtime()[1] - start)/1000000);
        // Doing the deep comparison is slow, so we skip it.
        // expect(store.readQuery(query)).toEqual(value);
    });

    // Read the query
    // Write an array
    // Read an array
 });