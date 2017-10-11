import * as React from 'react';
import moment from 'moment';
import { 
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';

import './App.css';

import Navbar from './components/Navbar';
import StackContainer from './components/StackContainer';
import { ZetteliType } from './components/Zetteli';
import GraphQLClient from './services/GraphQLClient';

// TODO(helfer): This is definitely in the wrong place
// const today = (z: ZetteliType) => {
//   return moment().isSame(moment(z.datetime), 'd');
// }
export const last2days = (z: ZetteliType) => {
  return moment(z.datetime).isAfter(moment().subtract(1, 'd').startOf('day'));
};

// TODO(helfer): Pull this out into a config file
const URI = 'http://localhost:3010/graphql';

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
              exact={true}
              path="/s/:sid"
              render={({match}) =>
                <StackContainer
                  client={new GraphQLClient({ sid: match.params.sid, uri: URI })}
                  filterBy={last2days}
                />}
            />
            <Route
              exact={true}
              path="/s/:sid/archive"
              render={({match}) =>
                <StackContainer 
                  client={new GraphQLClient({ sid: match.params.sid, uri: URI })}
                  filterBy={this.searchFilter}
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
