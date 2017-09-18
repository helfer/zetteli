import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import App from './App';

import LocalStorageClient from './services/LocalStorageClient';

ReactDOM.render(
    <App client={new LocalStorageClient(localStorage)}/>,
    document.getElementById('root') as HTMLElement,
);
