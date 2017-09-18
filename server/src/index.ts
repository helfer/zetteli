import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import {
    graphqlExpress,
    graphiqlExpress
} from 'apollo-server-express';

import schema from './data/schema'; 

const PORT = 3010;

const app = express();

const corsOptions = {
    origin: 'http://localhost:3020',
    optionsSuccessStatus: 200 // for IE11 & Co. 
  }
app.use(cors(corsOptions));

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// tslint:disable-next-line no-console-log
app.listen(PORT, () => console.log(
    `GraphiQL is now running on http://localhost:${PORT}/graphiql`
));