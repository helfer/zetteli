import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import App from './App';
import GraphQLClient from './services/GraphQLClient';

// TODO(helfer): Pull this out into a config file
const URI = 'http://localhost:3010/graphql';

// Uncomment this for debugging
// window['Client'] = new GraphQLClient({ uri: URI });

ReactDOM.render(
    <App client={new GraphQLClient({ uri: URI })}/>,
    document.getElementById('root') as HTMLElement,
);
