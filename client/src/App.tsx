import * as React from 'react';
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
      <div className="ui text container">
        <Navbar /> 
        <ZetteliList client={this.props.client}/>
      </div>
    );
  }
}

export default App;
