import { ApolloServer } from 'apollo-server';

import schema from './data/schema'; 


const PORT = 3010;

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // for IE11 & Co. 
  }

const server = new ApolloServer({
  schema,
  cors: corsOptions,
  introspection: true,
  playground: true,
});

// tslint:disable-next-line no-console-log
server.listen(PORT).then(({ url, subscriptionsUrl }: any) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscription server ready at ${subscriptionsUrl}`);
});