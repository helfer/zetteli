import * as express from 'express';
import * as bodyParser from "body-parser";

const PORT = 3010;

const app = express();
app.use(bodyParser.json());

app.use('/', (req, res) => {
    res.send('Hello there');
});

app.listen(PORT, () => console.log(
    `GraphiQL is now running on http://localhost:${PORT}/graphiql`
));