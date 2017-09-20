import {
    GraphQLRequest,
    ApolloFetch,
} from 'apollo-fetch';

const MIN_DELAY = 100;
const MAX_DELAY = 3000;

export interface RequestWithContext extends GraphQLRequest {
    context?: {};
}

export default function requestWithRetry(
    operation: RequestWithContext,
    fetch: ApolloFetch,
    delay: number = 0,
): Promise<any> {
    // If the request fails, schedule it for a retry with exponential backoff
    return new Promise( (resolve, reject) => {
        setTimeout(
            () => {
                fetch(operation)
                .then(res => {
                    // TODO(helfer): This whole block is unnecessary
                    console.log('success!');
                    resolve(res)
                })
                .catch( err => {
                    // TODO(helfer): reject if it's not a network error
                    console.log(err);
                    console.log('retrying with delay', Math.min(Math.max(delay, MIN_DELAY) * 2, MAX_DELAY));
                    return requestWithRetry(
                        operation,
                        fetch,
                        Math.min(Math.max(delay, MIN_DELAY) * 2, MAX_DELAY),
                    );
                })
                .then(res => {
                    console.log('done');
                    resolve(res);
                });
            }, 
            delay
        );
    });
}