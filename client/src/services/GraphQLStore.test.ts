import gql from 'graphql-tag';
import GraphQLStore from './Roxy';

const state = {
    nodes: {
        'Stack:5': {
           id: '5',
           __typename: 'Stack',
           name: 'Stack 5',
           zettelis: [] as any[],
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

 state.nodes['Stack:5']['zettelis'] = [ state.nodes['Zetteli:2'], state.nodes['Zetteli:3'] ];
 state.data['stack(id: 5)'] = state.nodes['Stack:5']; 
 state.data['allStacks'] = [state.nodes['Stack:5']]

 const store = new GraphQLStore();
 const bootstrapQuery = gql`
 {
     allStacks {
         id
         __typename
         name
         zettelis(last: 2) {
             id
             __typename
             tags
             body
         }
     }
     stack(id: 5) {
         id
         __typename
         name
         zettelis(last: 2) {
             id
             __typename
             tags
             body
         }
     }
 }
 `;
const bootstrapData = {
    allStacks: state.data['allStacks'],
    stack: state.data['stack(id: 5)'],
}
 store.write(bootstrapQuery, bootstrapData);

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
                expect(result).toEqual(argResponse);
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
                expect(result).toEqual(argResponse);
                // Proxy has to do indirection here, look up the right field.
            });
        });

        
        describe('query with aliases', () => {
            it('can handle a query with aliases', () => {
                const aliasQuery = gql`
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
                expect(store.readQuery(aliasQuery)).toEqual(expectedResponse);
            });
        });

        it('query with inline fragment without type condition', () => {
            let simpleFragmentQuery = gql`
            query {
                allStacks {
                    ... {
                        id
                        name
                    }
                }
            }
            `;
            expect(store.readQuery(simpleFragmentQuery)).toEqual(simpleResponse);
        });

        it('query with inline fragment with matching type condition', () => {
            let simpleFragmentQuery = gql`
            query {
                allStacks {
                    ... on Stack {
                        id
                        name
                    }
                }
            }
            `;
            expect(store.readQuery(simpleFragmentQuery)).toEqual(simpleResponse);
        });

        it('query with nested fragments', () => {
            let simpleFragmentQuery = gql`
            query {
                allStacks {
                    ... on Stack {
                        id
                        ... {
                            name
                        }
                    }
                }
            }
            `;
            expect(store.readQuery(simpleFragmentQuery)).toEqual(simpleResponse);
        });

        it('query with inline fragment with non-matching type condition', () => {
            let simpleFragmentQuery = gql`
            query {
                allStacks {
                    ... {
                        id
                        name
                    }
                    ... on ReallyNotAStack {
                        __typename
                    }
                }
            }
            `;
            expect(store.readQuery(simpleFragmentQuery)).toEqual(simpleResponse);
        });

        it('query with a simple named fragment', () => {
            let simpleNamedFragmentQuery = gql`
            query {
                allStacks {
                    ... F1
                }
            }

            fragment F1 on Stack {
                id
                name
            }
            `;
            expect(store.readQuery(simpleNamedFragmentQuery)).toEqual(simpleResponse);
        });

        it.skip('query with inline fragment on interface or union type', () => {

        });

        it.skip('query with named fragments on interface or union type', () => {

        });

        describe('nested arrays', () => {
            it('can write + read an array nested 6 levels deep', () => {
                const data = {
                    authorNested: [[[[[[{ id: '5', __typename: 'Author', name: 'Tony Judt' }]]]]]],
                };
                const query = gql`{
                    authorNested {
                        id
                        __typename
                        name
                    }
                }`;
                store.write(query, data);
                expect(store.read(query)).toEqual(data);
            });
        });
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
        // Skipping because when I print the store this makes the output hard to read
        it.skip('Can write a looooong array', () => {
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
            const start = process.hrtime()[1];
            store.writeQuery(query, value);
            const x = store.readQuery(query).data.longArray.map((v: any) => v.id);
            console.log('plain ms', (process.hrtime()[1] - start)/ 1000000);
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
        describe('fragments', () => {
            it('Can write a query containing an inline fragment without type condition', () => {
                const query = gql`
                query {
                  inlineFragmentObj {
                      ... {
                        id
                      }
                  }
                }
              `;
              const value = {
                  data: {
                      inlineFragmentObj: {
                          id: 999,
                      },
                  },
              };
              store.writeQuery(query, value);
              expect(store.readQuery(query)).toEqual(value);
            });
            it('Can write a query containing inline fragments with type condition', () => {
                const query = gql`
                query {
                  inlineFragmentObj2 {
                      ... on Horse {
                        __typename
                        id
                        numLegs
                      }
                      ... on Camel {
                          numBumps
                      }
                  }
                }
              `;
              const value = {
                  data: {
                      inlineFragmentObj2: {
                          __typename: 'Horse',
                          id: 999,
                          numLegs: 4,
                      },
                  },
              };
              store.writeQuery(query, value);
              expect(store.readQuery(query)).toEqual(value);
            });
        });
        it('Can write a query containing named fragments', () => {
            const query = gql`
            query {
              inlineFragmentObj2 {
                  ...HF
                  ...CF
              }
            }

            fragment HF on Horse {
                __typename
                id
                numLegs
            }
            fragment CF on Camel {
                numBumps
            }
          `;
          const value = {
              data: {
                  inlineFragmentObj2: {
                      __typename: 'Horse',
                      id: 999,
                      numLegs: 4,
                  },
              },
          };
          store.writeQuery(query, value);
          expect(store.readQuery(query)).toEqual(value);
        });
        it('Can write a query containing nested named fragments', () => {
            const query = gql`
            query {
              inlineFragmentObj2 {
                  ...HF2
                  ...CF2
              }
            }

            fragment HB on Horse {
                __typename
                id
            }
            fragment HF2 on Horse {
                ...HB
                numLegs
            }
            fragment CF2 on Camel {
                numBumps
            }
          `;
          const value = {
              data: {
                  inlineFragmentObj2: {
                      __typename: 'Horse',
                      id: 999,
                      numLegs: 4,
                  },
              },
          };
          store.writeQuery(query, value);
          expect(store.readQuery(query)).toEqual(value);
        });
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
        it('Writes don\'t affect earlier reads', () => {
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
            const firstResult = store.readQuery(query, variables);
            store.writeQuery(query, value2, variables);
            expect(store.readQuery(query, variables)).toEqual(value2);
            // Read the result only after the second write succeeded.
            expect(firstResult).toEqual(value);
        });
        it('Merges new data with existing data in the store if it overlaps', () => {
            const query1 = gql`{
                mergeObj {
                    firstName
                }
            }`;
            const query2 = gql`{
                mergeObj {
                    lastName
                }
            }`;
            const fullQuery = gql`{
                mergeObj {
                    firstName
                    lastName
                }
            }`;
            const data1 = { data: { mergeObj: { firstName: 'Peter' } } };
            const data2 = { data: { mergeObj: { lastName: 'Pan' } } };
            const fullData = { data: { mergeObj: { firstName: 'Peter', lastName: 'Pan' } } };
            store.writeQuery(query1, data1);
            store.writeQuery(query2, data2);
            expect(store.readQuery(fullQuery)).toEqual(fullData);
        });
        it('normalizes objects with the same id', () => {
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
        it('Merges fields of objects with the same id across writes', () => {
            const query1 = gql`{
                alias1 {
                    __id
                    firstName
                }
            }`;
            const query2 = gql`{
                alias2 {
                    __id
                    lastName
                }
            }`;
            const fullQuery = gql`{
                alias1 {
                    firstName
                    lastName
                }
            }`;
            const data1 = { data: { alias1: { __id: 'test-128382', firstName: 'Peter' } } };
            const data2 = { data: { alias2: { __id: 'test-128382', lastName: 'Pan' } } };
            const fullData = { data: { alias1: { firstName: 'Peter', lastName: 'Pan' } } };
            store.writeQuery(query1, data1);
            store.writeQuery(query2, data2);
            expect(store.readQuery(fullQuery)).toEqual(fullData);
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
    describe('observers', () => {
        it('Can observe a simple query and get the current result', () => {
            const query = gql`
            {
                obs {
                    name
                }
            }`;
            const data = {
                obs: { name: 'Watch this.' },
            };
            const data2 = {
                obs: { name: 'Now see me change' },
            };
            store.write(query, data);
            store.observe(query).subscribe({
                next: (result) => {
                    console.log('result', result);
                },
                error: (e) => {
                    console.error(e);
                }
            });
            setTimeout(() => store.write(query, data2), 10);
            return new Promise(resolve => setTimeout(resolve, 100));
        });

    });
    describe('optimistic transactions', () => {

    });
 });