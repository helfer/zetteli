import * as React from 'react';
import moment from 'moment';
import { 
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';

import './App.css';

import Navbar from './components/Navbar';
import Stack from './components/Stack';
import { ZetteliType } from './components/Zetteli';
import { ZetteliClient } from './services/ZetteliClient';

export interface Props {
  client: (sid: string) => ZetteliClient;
}

// TODO(helfer): This is definitely in the wrong place
// const today = (z: ZetteliType) => {
//   return moment().isSame(moment(z.datetime), 'd');
// }
export const last2days = (z: ZetteliType) => {
  return moment(z.datetime).isAfter(moment().subtract(1, 'd').startOf('day'));
};

class App extends React.Component<Props, {}> {
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
              render={({match}) => <Stack client={this.props.client(match.params.sid)} filterBy={last2days} />}
            />
            <Route
              exact={true}
              path="/s/:sid/archive"
              render={({match}) => <Stack client={this.props.client(match.params.sid)} filterBy={this.searchFilter}/>}
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
