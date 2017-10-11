import OptimisticLink from './OptimisticLink';
import {
    execute,
    GraphQLRequest,
    ApolloLink,
    Operation,
    Observable,
} from 'apollo-link';
import {
    ExecutionResult,
} from 'graphql';
import gql from 'graphql-tag';

class TestLink extends ApolloLink {
    public operations: Operation[];
    constructor() {
        super();
        this.operations = [];
    }

    request (operation: Operation) {
        this.operations.push(operation);
        // TODO(helfer): Throw an error if neither testError nor testResponse is defined
        return new Observable(observer => {
            if (operation.getContext().testError) {
                setTimeout(() => observer.error(operation.getContext().testError), 0);
                return;
            }
            setTimeout(() => observer.next(operation.getContext().testResponse), 0);
            setTimeout(() => observer.complete(), 0);
        });
    }
}

interface ObservableValue {
    value?: ExecutionResult | Error;
    type: 'next' | 'error' | 'complete';
}

const assertObservableSequence = (
    observable: Observable<ExecutionResult>,
    sequence: ObservableValue[],
    initializer = () => undefined,
): Promise<boolean | Error> => {
    let index = 0;
    if (sequence.length === 0) {
        throw new Error('Observable sequence must have at least one element');
    }
    return new Promise((resolve, reject) => {
        observable.subscribe({
            next: (value) => {
                expect({ type: 'next', value }).toEqual(sequence[index]);
                index++;
            },
            error: (value) => {
                expect({ type: 'error', value }).toEqual(sequence[index]);
                index++;
                // This check makes sure that there is no next element in
                // the sequence. If there is, it will print a somewhat useful error
                expect(undefined).toEqual(sequence[index]);
                resolve(true);
            },
            complete: () => {
                expect({ type: 'complete' }).toEqual(sequence[index]);
                index++;
                // This check makes sure that there is no next element in
                // the sequence. If there is, it will print a somewhat useful error
                expect(undefined).toEqual(sequence[index]);
                resolve(true);
            }
        });
        initializer();
    });

};

describe('OptimisticLink', () => {
    let link: ApolloLink;
    let testLink: TestLink;

    const optimisticResponse = {
        data: {
            hello: 'Optimism',
        },
    };
    const testResponse = {
        data: {
            hello: 'World',
        }
    };

    const op: GraphQLRequest = {
        query: gql`{ hello }`,
        context: {
            optimisticResponse,
            testResponse,
        },
    };

    beforeEach(() => {
        jest.useFakeTimers();
        testLink = new TestLink();
        link = ApolloLink.from([new OptimisticLink(), testLink]);
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
    it('returns the optimistic response before the real response', () => {
        return new Promise((resolve, reject) => {
            resolve(assertObservableSequence(
                execute(link, op),
                [
                    { type: 'next', value: optimisticResponse },
                    { type: 'next', value: testResponse },
                    { type: 'complete' }
                ],
                () => jest.runAllTimers(),
            ));
        });
    });
    it('passes through errors', () => {
        const testError = new Error('Hello darkness my old friend');
        const opWithError: GraphQLRequest = {
            query: gql`{ hello }`,
            context: {
                optimisticResponse,
                testError,
            },
        };
        return new Promise((resolve, reject) => {
            resolve(assertObservableSequence(
                execute(link, opWithError),
                [
                    { type: 'next', value: optimisticResponse },
                    { type: 'error', value: testError },
                ],
                () => jest.runAllTimers(),
            ));
        });
    });
});