import * as React from 'react';
import './App.css';

import Navbar from './components/Navbar';
import ZetteliList from './components/ZetteliList';

class App extends React.Component {
  render() {
    return (
      <div className="ui text container">
        <Navbar /> 
        <ZetteliList />
      </div>
    );
  }
}

export default App;
