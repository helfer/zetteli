import OnOffLink from './OnOffLink';
import {
    TestLink,
    assertObservableSequence,
} from './OptimisticLink.test';
import {
    execute,
    GraphQLRequest,
    ApolloLink,
} from 'apollo-link';
import gql from 'graphql-tag';

describe('OnOffLink', () => {
    let link: ApolloLink;
    let onOffLink: OnOffLink;
    let testLink: TestLink;

    const testResponse = {
        data: {
            hello: 'World',
        }
    };

    const op: GraphQLRequest = {
        query: gql`{ hello }`,
        context: {
            testResponse,
        },
    };

    beforeEach(() => {
        jest.useFakeTimers();
        testLink = new TestLink();
        onOffLink = new OnOffLink();
        link = ApolloLink.from([onOffLink, testLink]);
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
    it('passes through errors', () => {
        const testError = new Error('Hello darkness my old friend');
        const opWithError: GraphQLRequest = {
            query: gql`{ hello }`,
            context: {
                testError,
            },
        };
        return new Promise((resolve, reject) => {
            resolve(assertObservableSequence(
                execute(link, opWithError),
                [
                    { type: 'error', value: testError },
                ],
                () => jest.runAllTimers(),
            ));
        });
    });
    it('holds requests when you close it', () => {
        onOffLink.close();
        const sub = execute(link, op).subscribe(() => null);
        expect(testLink.operations.length).toBe(0);
        sub.unsubscribe();
    });
    it('releases held requests when you open it', () => {
        onOffLink.close();
        return assertObservableSequence(
            execute(link, op),
            [
                { type: 'next', value: testResponse },
                { type: 'complete' },
            ],
            () => {
                expect(testLink.operations.length).toBe(0);
                onOffLink.open();
                jest.runAllTimers();
            },
        );
    });
});