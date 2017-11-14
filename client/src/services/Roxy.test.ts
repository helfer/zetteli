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
            authorZ: {
                id: '1',
                __typename: 'Author',
                name: 'Hermann Hesse',
            },
        };
        store.write(query, data);
        console.log(store.nodeIndex);
        const earlyValue = store.read(query);
        store.write(query2, data2);
        console.log(store.nodeIndex);
        console.log('--------');
        console.log(store.read(query));
        console.log(store.read(query2));
        console.log('early value', earlyValue);
    });

    // Read the query
    // Write an array
    // Read an array
 });