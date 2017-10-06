import {
    GraphQLRequest,
    ApolloFetch,
} from 'apollo-fetch';

const MIN_DELAY = 200;
const MAX_DELAY = 20000;

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
                .catch( err => {
                    // TODO(helfer): reject if it's not a network error?
                    return requestWithRetry(
                        operation,
                        fetch,
                        Math.min(Math.max(delay, MIN_DELAY) * 2, MAX_DELAY),
                    );
                })
                .then(resolve);
            }, 
            delay
        );
    });
}