import gql from 'graphql-tag';
import GraphQLStore from './GraphQLStore';

import { InMemoryCache } from 'apollo-cache-inmemory';
const apolloStore = new InMemoryCache();

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

 const store = new GraphQLStore(state);

 describe('proxy store', () => {
    describe('reading', () => {
        let simpleQuery = gql`
        query {
            allStacks {
                id
                name
            }
        }
        `;
        let simpleResponse = {
            data: {
                allStacks: [{
                    id: '5',
                    name: 'Stack 5',
                }],
            },
        };

        it('doesn\'t throw', () => {
            expect(() => store.readQuery(simpleQuery)).not.toThrow();
        });
        
        describe('simple query', () => {
            const query = simpleQuery;
            let result: any;
            const expectedResponse = simpleResponse;

            beforeEach(() => {
                result = store.readQuery(query);
            });
    
            it('can read a simple query from the store', () => {
                expect(result).toEqual(expectedResponse);
            });
            it('only lets you iterate over keys you asked for', () => {
                expect(Object.keys(result)).toEqual(Object.keys(expectedResponse));
                expect(Object.keys(result.data)).toEqual(Object.keys(expectedResponse.data));
                expect(Object.keys(result.data.allStacks)).toEqual(Object.keys(expectedResponse.data.allStacks));
                expect(Object.keys(result.data.allStacks[0])).toEqual(Object.keys(expectedResponse.data.allStacks[0]));
            });
            it('only lets you read properties you asked for', () => {
                expect(result.data.allStacks[0].name).toBeDefined();
                const simpleQuery2 = gql`
                query {
                    allStacks {
                        id
                    }
                }
                `;
                const result2 = store.readQuery(simpleQuery2);
                expect(result2.data.allStacks[0].name).toBeUndefined();
            });
            it('does not allow you to modify object properties', () => {
                expect(() => result.data.allStacks[0].name = 'NEW').toThrow();
            });
            it('does not allow you to modify array elements', () => {
                expect(() => result.data.allStacks[0] = {}).toThrow();
            });
            it('does not allow you to delete object properties', () => {
                expect(() => { delete result.data.allStacks[0].name }).toThrow();
            });
            it('does not allow you to add new object properties', () => {
                expect(() => result.data.allStacks[0].name2 = 'NEW PROP').toThrow();
            });
        });

        describe('error handling', () => {
            it.skip('sets a flag when only partial data is available', () => {
                expect(false).toBe(true);
            });
        });

        describe('query with arguments', () => {
            it('can handle a query with inline arguments', () => {
                // Proxy has to do indirection here, look up the right field.
                const query = gql`
                query {
                    stack(id: 5) {
                        id
                        name
                    }
                }
                `;
                const result = store.readQuery(query);
                const argResponse = {
                    data: {
                        stack: {
                            id: '5',
                            name: 'Stack 5',
                        },
                    },
                };
                expect(argResponse).toEqual(result);
            });
            it('can handle a query with variables', () => {
                // TODO
                const query = gql`
                query ($stackId: Int) {
                    stack(id: $stackId) {
                        id
                        name
                    }
                }
                `;
                const variables = { stackId: 5 };
                const result = store.readQuery(query, variables);
                const argResponse = {
                    data: {
                        stack: {
                            id: '5',
                            name: 'Stack 5',
                        },
                    },
                };
                expect(argResponse).toEqual(result);
                // Proxy has to do indirection here, look up the right field.
            });
        });

        /*
        describe('query with aliases', () => {
            it('can handle a query with aliases', () => {
                // TODO
                const simpleQuery = gql`
                query {
                    myStacks: allStacks {
                        id
                        __typename
                        aName: name
                    }
                }
                `;
                const expectedResponse = {
                    data: {
                        myStacks: [{
                            id: '5',
                            __typename: 'Stack',
                            aName: 'Stack 5',
                        }],
                    },
                };
            });
        });

        describe('query with inline fragments', () => {

        });

        describe('query with named fragments', () => {

        });

        describe('query with conditional fragments (non-union/interface type)', () => {

        });

        describe('query with named fragments on interface and union types', () => {

        }); */

        // TODO: Test for nested arrays etc.
    });
    describe('writing', () => {
        it('Can write a simple query without arguments and read it back', () => {
            const query = gql`
              query {
                someRandomKey { id }
              }
            `;
            const value = {
                data: {
                    someRandomKey: {
                        id: 19,
                    },
                },
            };
            store.writeQuery(query, value);
            expect(store.readQuery(query)).toEqual(value);
        });
        it('Can write a query containing inline arguments', () => {
            const query = gql`
            query {
              someRandomKey(key: "ABC") { id }
            }
          `;
          const value = {
              data: {
                  someRandomKey: {
                      id: 999,
                  },
              },
          };
          store.writeQuery(query, value);
          expect(store.readQuery(query)).toEqual(value);
        });
        it('writes to the same field with different arguments don\'t affect each other', () => {
            const query = gql`
            query A($key: String){
              someRandomKey(key: $key) { id }
            }
          `;
          const value = {
              data: {
                  someRandomKey: {
                      id: 111,
                  },
              },
          };
          const variables = { key : 'X' };
          const value2 = {
            data: {
                someRandomKey: {
                    id: 222,
                },
            },
        };
        const variables2 = { key : 'Y' }; 
          store.writeQuery(query, value, variables);
          store.writeQuery(query, value2, variables2);
          expect(store.readQuery(query, variables)).toEqual(value);
          expect(store.readQuery(query, variables2)).toEqual(value2);
        });
        // TODO: test the following inline and variable arguments:
        // - null
        // - object (including nested)
        // - enum
        // - array
        // and make sure that stuff written with variables can be read
        // with inline arguments and vice versa
        it('Can write a query containing variables', () => {
            const query = gql`
            query A($key: Boolean, $str: String) {
              someRandomKey(key: $key, str: $str) { id }
            }
            `;
            const value = {
                data: {
                    someRandomKey: {
                        id: 888,
                    },
                },
            };
            const variables = { key: true, str: 'A' };
            store.writeQuery(query, value, variables);
            // console.log(JSON.stringify(store, null, 2));
            expect(store.readQuery(query, variables)).toEqual(value);
        });
        it('Can write arrays', () => {
            const query = gql`
            query {
              someArray { id value }
            }
          `;
            const value = {
                data: {
                    someArray: [
                        {
                            id: 19,
                            value: 'val',
                        },
                        {
                            id: 20,
                            value: 'val2',
                        }
                    ],
                },
            };
            store.writeQuery(query, value);
            expect(store.readQuery(query)).toEqual(value);
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
                data: {
                    longArray: longArray,
                },
            };
            store.writeQuery(query, value);
            const x = store.readQuery(query).data.longArray.map((v: any) => v.id);
            expect(x.length).toBe(N);
            // Doing the deep comparison is slow, so we skip it.
            // expect(store.readQuery(query)).toEqual(value);
        });
        it('Can write null values', () => {
            const query = gql`
            query {
              nullIdValue { id }
            }
            `;
            const value = {
                data: {
                    nullIdValue: {
                        id: null,
                    },
                },
            };
            store.writeQuery(query, value);
            expect(store.readQuery(query)).toEqual(value);
        });
        it('Can overwrite existing values', () => {
            const query = gql`
            query A($key: String){
              someRandomKey(key: $key) { id }
            }
            `;
            const value = {
                data: {
                    someRandomKey: {
                        id: 111,
                    },
                },
            };
            const variables = { key : 'X' };
            const value2 = {
                data: {
                    someRandomKey: {
                        id: 222,
                    },
                },
            };
            store.writeQuery(query, value, variables);
            expect(store.readQuery(query, variables)).toEqual(value);
            store.writeQuery(query, value2, variables);
            expect(store.readQuery(query, variables)).toEqual(value2);
        });
        it('Merges new data with existing data in the store if it overlaps', () => {
            expect(false).toBe(true);
        });
        it('properly normalizes when writing objects', () => {
            const query = gql`
            query A{
              refA{ id __typename payload }
            }
            `;
            const value = {
                data: {
                    refA: {
                        id: 111,
                        __typename: 'OBJ',
                        payload: 'A',
                    },
                },
            };
            const query2 = gql`
            query A{
              refB{ id __typename payload }
            }
            `;
            const value2 = {
                data: {
                    refB: {
                        id: 111,
                        __typename: 'OBJ',
                        payload: 'B',
                    },
                },
            };
            store.writeQuery(query, value);
            store.writeQuery(query2, value2);
            expect(store.readQuery(query2)).toEqual(value2);
            expect(store.readQuery(query).data.refA.payload).toEqual('B');
        });
        it('throws an error if a query field is missing in the data', () => {
            const query = gql`
            query MissingData {
              nullIdValue { id }
            }
            `;
            const value = {
                data: {
                    nullIdValue: {
                        // id: null, // missing data!
                    },
                },
            };
            expect( () => store.writeQuery(query, value)).toThrow(/Missing field id/); 
        });
        it.skip('thows an error if a variable value marked as required is missing', () => {
            expect(false).toBe(true);
        })
    });
    describe('optimistic updates', () => {

    });
 });