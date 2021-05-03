import { ApolloServer } from 'apollo-server';

import schema from './data/schema'; 

const PORT = 3010;

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  tracing: true,
});

// tslint:disable-next-line no-console-log
server.listen(PORT).then(({ url, subscriptionsUrl }: any) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscription server ready at ${subscriptionsUrl}`);
});
