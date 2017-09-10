import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'semantic-ui-css/semantic.min.css';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import ZetteliClient from './services/ZetteliClient';

ReactDOM.render(
    <App client={new ZetteliClient(localStorage)}/>,
    document.getElementById('root') as HTMLElement,
);
registerServiceWorker();
