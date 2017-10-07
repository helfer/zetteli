import ZetteliLink from './ZetteliLink';
import { execute, GraphQLRequest } from 'apollo-link';
import gql from 'graphql-tag';

describe('ZetteliLink', () => {
    let link;

    beforeEach(() => {
        jest.useFakeTimers();
        link = ZetteliLink;
    });

    describe('basics', () => {
        it('can make a test request that returns data', (done) => {
            const op: GraphQLRequest = {
                query: gql`{ hello }`,
                context: {
                    optimisticResponse: {
                        data: {
                            hello: 'Hi',
                        },
                    },
                },
            };
            execute(ZetteliLink, op).subscribe({
                next: (data) => {
                    console.log('next');
                    console.log(data);
                },
                error: console.log,
                complete: () => {
                    console.log('complete');
                    done();
                },
            });
            jest.runAllTimers();
        });
    });
});