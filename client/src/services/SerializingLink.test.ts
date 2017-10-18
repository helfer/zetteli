import SerializingLink from './SerializingLink';
import {
    assertObservableSequence
} from './OptimisticLink.test';
import {
    execute,
    GraphQLRequest,
    ApolloLink,
    NextLink,
    Operation,
    Observable,
    Subscription,
} from 'apollo-link';

import {
    ExecutionResult,
} from 'graphql';

import gql from 'graphql-tag';

interface NextEvent {
    type: 'next';
    delay?: number;
    value: ExecutionResult;
}

interface ErrorEvent {
    type: 'error';
    delay?: number;
    value: Error;
}

interface CompleteEvent {
    type: 'complete';
    delay?: number;
}

type ObservableEvent = NextEvent | ErrorEvent | CompleteEvent; 

export class TestLink extends ApolloLink {
    public operations: Operation[];
    constructor() {
        super();
        this.operations = [];
    }

    request (operation: Operation, forward: NextLink) {
        if (!operation.getContext().testSequence) {
            return forward(operation);
        }
        this.operations.push(operation);
        // TODO(helfer): Throw an error if neither testError nor testResponse is defined
        return new Observable(observer => {
            operation.getContext().testSequence.forEach((event: ObservableEvent) => {
                if (event.type === 'error') {
                    setTimeout(() => observer.error(event.value), event.delay || 0);
                    return;
                }
                if (event.type === 'next') {
                    setTimeout(() => observer.next(event.value), event.delay || 0);
                }
                if (event.type === 'complete') {
                    setTimeout(() => observer.complete(), event.delay || 0);
                }
            });
        });
    }
}

export function merge(...observables: Observable<ExecutionResult>[]) {
    return new Observable(observer => {
        const numObservables = observables.length;
        let completedObservables = 0;
        observables.forEach(o => {
            o.subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: () => {
                    completedObservables++;
                    if (completedObservables === numObservables) {
                        observer.complete();
                    }
                },
            });
        });
        // TODO(helfer): unsubscribe
    });
}

function toResultValue(e: ObservableEvent): ObservableEvent {
    const obj = { ...e };
    delete obj.delay;
    return obj;
}

describe('SerializingLink', () => {
    let link: ApolloLink;
    let testLink: TestLink;

    const testResponse = {
        data: {
            hello: 'World',
        }
    };

    const testSequence = [
        {
            type: 'next',
            value: testResponse,
        },
        {
            type: 'complete',
        }
    ];

    const op: GraphQLRequest = {
        query: gql`{ hello }`,
        context: {
            serializationKey: 'key1',
            testSequence,
        },
    };

    beforeEach(() => {
        jest.useFakeTimers();
        testLink = new TestLink();
        link = ApolloLink.from([new SerializingLink(), testLink]);
    });

    it('forwards the operation', () => {
        return new Promise((resolve, reject) => {
            execute(link, op).subscribe({
                next: (data) => undefined,
                error: (error) => reject(error),
                complete: () => {
                    expect(testLink.operations.length).toBe(1);
                    expect(testLink.operations[0].query).toEqual(op.query);
                    resolve();
                },
            });
            jest.runAllTimers();
        });
    });
    it('forwards the operation if context.serializationKey is not defined', () => {
        const opWithoutKey: GraphQLRequest = {
            query: gql`{ hello }`,
            context: {
                testSequence,
            },    
        };
        return new Promise((resolve, reject) => {
            execute(link, opWithoutKey).subscribe({
                next: (data) => undefined,
                error: (error) => reject(error),
                complete: () => {
                    expect(testLink.operations.length).toBe(1);
                    expect(testLink.operations[0].query).toEqual(op.query);
                    resolve();
                },
            });
            jest.runAllTimers();
        });
    });
    it('calls next and complete as expected', () => {
        return Promise.resolve(assertObservableSequence(
            execute(link, op),
            [
                { type: 'next', value: testResponse },
                { type: 'complete' }
            ],
            () => jest.runAllTimers(),
        ));
    });
    it('passes through errors', () => {
        const testError = new Error('Hello darkness my old friend');
        const opWithError: GraphQLRequest = {
            query: gql`{ hello }`,
            context: {
                serializationKey: 'key1',
                testSequence: [{ type: 'error', value: testError }],
            },
        };
        return Promise.resolve(assertObservableSequence(
            execute(link, opWithError),
            [
                { type: 'error', value: testError },
            ],
            () => jest.runAllTimers(),
        ));
    });
    it('does not block queries with different serializationKey', () => {
        const ts1: ObservableEvent[] = [
            {
                type: 'next',
                delay: 2,
                value: { data: { q1: 'one' } },
            },
            {
                type: 'complete',
                delay: 2,
            },
        ];
        const op1: GraphQLRequest = {
            query: gql`{ q1 }`,
            context: {
                serializationKey: '1',
                testSequence: ts1,
            }
        };
        const ts2: ObservableEvent[] = [
            {
                type: 'next',
                delay: 1,
                value: { data: { q2: 'two' } },
            },
            {
                type: 'complete',
                delay: 1,
            },
        ];
        const op2: GraphQLRequest = {
            query: gql`{ q2 }`,
            context: {
                serializationKey: '2',
                testSequence: ts2,
            }
        };
        return Promise.resolve(assertObservableSequence(
            merge(
                execute(link, op1),
                execute(link, op2),
            ),
            [toResultValue(ts2[0]), ...(ts1.map(toResultValue))],
            () => jest.runAllTimers(),
        ));
    });

    it('blocks queries with identical serializationKey', () => {
        // make two queries with same key
        // first query returns slower than second, but runs first
        // make sure second query never called.
        const ts1: ObservableEvent[] = [
            {
                type: 'next',
                delay: 2,
                value: { data: { q1: 'one' } },
            },
            {
                type: 'complete',
                delay: 2,
            },
        ];
        const op1: GraphQLRequest = {
            query: gql`{ q1 }`,
            context: {
                serializationKey: 'A',
                testSequence: ts1,
            }
        };
        const ts2: ObservableEvent[] = [
            {
                type: 'next',
                delay: 1,
                value: { data: { q2: 'two' } },
            },
            {
                type: 'complete',
                delay: 1,
            },
        ];
        const op2: GraphQLRequest = {
            query: gql`{ q2 }`,
            context: {
                serializationKey: 'A',
                testSequence: ts2,
            }
        };
        return Promise.resolve(assertObservableSequence(
            merge(
                execute(link, op1),
                execute(link, op2),
            ),
            [toResultValue(ts1[0]), ...(ts2.map(toResultValue))],
            () => jest.runAllTimers(),
        ));
    });

    it('unblocks queue if first query errors', () => {
        // two with same key
        // first query returns one result, then errors.
        // second query must run (after first)
        const ts1: ObservableEvent[] = [
            {
                type: 'next',
                delay: 2,
                value: { data: { q1: 'one' } },
            },
            {
                type: 'error',
                value: new Error('oops'),
                delay: 2,
            },
        ];
        const op1: GraphQLRequest = {
            query: gql`{ q1 }`,
            context: {
                serializationKey: 'A',
                testSequence: ts1,
            }
        };
        const ts2: ObservableEvent[] = [
            {
                type: 'next',
                delay: 1,
                value: { data: { q2: 'two' } },
            },
            {
                type: 'complete',
                delay: 1,
            },
        ];
        const op2: GraphQLRequest = {
            query: gql`{ q2 }`,
            context: {
                serializationKey: 'A',
                testSequence: ts2,
            }
        };
        return Promise.all([
            Promise.resolve(assertObservableSequence(
                execute(link, op1),
                [...(ts1.map(toResultValue))],
                () => jest.runAllTimers(),
            )),
            Promise.resolve(assertObservableSequence(
                execute(link, op2),
                [...(ts2.map(toResultValue))],
                () => jest.runAllTimers(),
            )),
        ]);
    });

    it('unblocks queue if first query is unsubscribed from', () => {
        // two with same key
        // first query never returns result, is unsubscribed from soon after startng
        // second query must run
        const ts1: ObservableEvent[] = [
            {
                type: 'next',
                delay: 2,
                value: { data: { q1: 'one' } },
            },
        ];
        const op1: GraphQLRequest = {
            query: gql`{ q1 }`,
            operationName: 'op1',
            context: {
                serializationKey: 'A',
                testSequence: ts1,
            }
        };
        const ts2: ObservableEvent[] = [
            {
                type: 'next',
                delay: 1,
                value: { data: { q2: 'two' } },
            },
            {
                type: 'complete',
                delay: 1,
            },
        ];
        const op2: GraphQLRequest = {
            query: gql`{ q2 }`,
            operationName: 'op2',
            context: {
                serializationKey: 'A',
                testSequence: ts2,
            }
        };
        return Promise.all([
            Promise.resolve(assertObservableSequence(
                execute(link, op1),
                [...(ts1.map(toResultValue))],
                (sub: Subscription) => {
                    setTimeout(() => sub.unsubscribe(), 5);
                    jest.runAllTimers();
                })),
            Promise.resolve(assertObservableSequence(
                execute(link, op2),
                [...(ts2.map(toResultValue))],
                () => jest.runAllTimers(),
            )),
        ]);

    });
});