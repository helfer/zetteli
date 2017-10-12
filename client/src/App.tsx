import * as React from 'react';
import { 
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';

import './App.css';

import Navbar from './components/Navbar';
import StackContainer from './components/StackContainer';
import { ZetteliType } from './components/Zetteli';

class App extends React.Component<{}, { search: string }> {
  state = {
    search: '',
  };

  onSearchChange = (newSearch: string) => {
    this.setState({ search: newSearch });
  }

  searchFilter = (z: ZetteliType) => {
    if (this.state.search.length < 3) {
      return true;
    }
    return z.body.includes(this.state.search);
  }

  render() {
    return (
      <Router>
        <div className="ui text container">
            <Navbar search={this.state.search} onSearchChange={this.onSearchChange}/>
            <Route 
              exact={true}
              path="/"
              render={() => <div className="contentContainer">Hi, are you lost?</div>}
            />
            <Route
              path="/s/:sid"
              render={({match}) =>
                <StackContainer
                  stackId={match.params.sid}
                />}
            />
            <Route
              exact={true}
              path="/settings"
              render={() => <div className="contentContainer">Settings doth go here</div>}
            />
        </div>
      </Router>
    );
  }
}

export default App;
