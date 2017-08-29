import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import Navbar from './components/Navbar';
import ZetteliList from './components/ZetteliList';

class App extends Component {
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
