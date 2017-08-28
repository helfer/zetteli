import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import ZetteliList from './components/ZetteliList';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="ui text container">
          <div className="ui pointing secondary menu">
            <a className="active item">
              Home
            </a>
            <a className="item">
              Archive
            </a>
            <a className="item">
              Settings
            </a>
            <div className="right menu">
              <div className="item">
                <div className="ui transparent icon input">
                  <input type="text" placeholder="Search..." />
                  <i className="search link icon"></i>
                </div>
              </div>
            </div>
          </div>
          <ZetteliList />
          <button className="ui circular icon button">
            <i className="plus icon"></i>
          </button>
        </div>
      </div>
    );
  }
}

export default App;
