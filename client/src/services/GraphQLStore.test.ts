import gql from 'graphql-tag';
import GraphQLStore from './GraphQLStore';

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

        it('doesn\'t throw any errors', () => {
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
        });

        describe('error handling', () => {

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
            it('can handle a query with variable arguments', () => {
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

        });

        describe('query with inline fragments', () => {

        });

        describe('query with named fragments', () => {

        });

        describe('query with named fragments on interface and union types', () => {

        }); */

        /* it('can handle a query with aliases', () => {
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
        }); */
        // it('can handle a query with inline fragments', () => {
            // Proxy has to go into the fragment here to know the full selection set.
        // });
        // it('can handle a query with named fragments', () => {
            // Proxy has to go into the fragment here to know the full selection set.
        // });
        // it('can handle a query with conditional fragments (non-union)', () => {
            // Proxy needs to match typename
        // });
        // it('can handle a query with fragments on union types', () => {
            // Proxy needs to have schema knowledge and match typename
        // });

        // TODO: Test for nested arrays.
    });
    describe('writing', () => {
        it('', () => {});
        it('', () => {});
        it('', () => {});
        it('normalizes', () => {});
    });
    describe('optimistic updates', () => {

    });
 });