import * as React from 'react';
import { 
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';

import './App.css';

import Navbar from './components/Navbar';
import ZetteliList from './components/ZetteliList';
import ZetteliClient from './services/ZetteliClient';

export interface Props {
  client: ZetteliClient;
}

class App extends React.Component<Props, never> {
  render() {
    return (
      <Router>
        <div className="ui text container">
            <Navbar />
            <Route 
              exact={true}
              path="/"
              render={() => <ZetteliList client={this.props.client} />}
            />
            <Route
              exact={true}
              path="/archive"
              render={() => <ZetteliList client={this.props.client} />}
            />
            <Route
              exact={true}
              path="/settings"
              render={() => <div className="content">Settings doth go here</div>}
            />
        </div>
      </Router>
    );
  }
}

export default App;
