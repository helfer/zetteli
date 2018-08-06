import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import {
    graphqlExpress,
    graphiqlExpress
} from 'apollo-server-express';

import schema from './data/schema'; 


import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { execute, subscribe } from 'graphql';

const PORT = 3010;

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // for IE11 & Co. 
  }
app.use(cors(corsOptions));

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql' }));

const server = createServer(app);

// tslint:disable-next-line no-console-log
server.listen(PORT, () => console.log(
    `GraphiQL is now running on http://localhost:${PORT}/graphiql`
));

SubscriptionServer.create(
  {
    schema,
    execute,
    subscribe,
  },
  {
    server,
    path: '/subscriptions',
  },
);