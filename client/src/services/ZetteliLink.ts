import { ApolloLink, Observable, Operation, NextLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';

class OptimisticLink extends ApolloLink {
    request(operation: Operation, forward: NextLink ) {
        return new Observable(observer => {
            if (operation.getContext().optimisticResponse) {
                // NOTE(helfer): TS should really know here that operation.context is defined...
                setTimeout(() => observer.next(operation.getContext().optimisticResponse), 0);
            }

            const observable = forward(operation);
            const subscription = observable.subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
            });

            return () => {
                subscription.unsubscribe();
            }
        });
    }
}

/*
class LogLink extends ApolloLink {
  request (operation: Operation, forward: NextLink) {
    console.log(operation);
    //Apollo Link's Observable has a map for side effects or can modify the data in a next call
    return forward(operation).map(data => {
      console.log(data);
      return data;
    });
  }
}
*/

class TestLink extends ApolloLink {
    request (operation: Operation) {
      return new Observable(observer => {
        const data = { data: { hello: 'World' } };
        setTimeout( () => {
            observer.next(data);
            observer.complete();
        }, 0);
      });
    }
  }
  

// const logLink = new LogLink();
const optimisticLink = new OptimisticLink();
const httpLink = new HttpLink({ uri: 'http://localhost:3010/graphql' });
// const testLink = new TestLink();

export default optimisticLink.concat(httpLink);
