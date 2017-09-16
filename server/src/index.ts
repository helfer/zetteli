import * as express from 'express';
import * as bodyParser from 'body-parser';
import {
    graphqlExpress,
    graphiqlExpress
} from 'apollo-server-express';

import schema from './schema'; 

const PORT = 3010;

const app = express();

app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

// tslint:disable-next-line no-console-log
app.listen(PORT, () => console.log(
    `GraphiQL is now running on http://localhost:${PORT}/graphiql`
));