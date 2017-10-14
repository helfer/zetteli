import {
    ApolloLink,
    Observable,
    Operation,
    NextLink,
} from 'apollo-link';

export default class OptimisticLink extends ApolloLink {
    request(operation: Operation, forward: NextLink ) {
        return new Observable(observer => {
            if (operation.getContext().optimisticResponse) {
                // NOTE(helfer): If an upstream link calls next synchronously, the optimistic
                // response will arrive after that one. We could prevent this by sending the
                // optimistic response synchronously as well if we see next being invoked before
                // the timeout
                setTimeout(() => observer.next(operation.getContext().optimisticResponse), 0);
            }

            const subscription = forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
            });

            return () => {
                subscription.unsubscribe();
            };
        });
    }
}
