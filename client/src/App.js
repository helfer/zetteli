import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import AddNoteView from './components/AddNoteView';

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
          <div className="ui card centered fluid">
            <div className="extra content">
              <span className="left floated">
                Friday, 8/25/2017 09:50
              </span>
              <span className="right floated">
                <a className="ui label small">
                  log
                </a>
                <a className="ui label small">
                  personal
                </a>
              </span>
            </div>
            <div className="left aligned content">
              <p>This is the first hard-coded zetteli in history!</p>
            </div>
          </div>

          <div className="ui card centered fluid">
            <div className="extra content">
                <span className="left floated">Friday, 8/25/2017 09:54</span>
              <span className="right floated">
                <span className="ui label small">
                  log
                </span>
                <span className="ui label small">
                  personal
                </span>
              </span>
            </div>
            <div className="left aligned content">
              <p contentEditable="true">This zetteli is currently being edited!</p>
            </div>
          </div>
          <button className="ui circular icon button">
            <i className="plus icon"></i>
          </button>
        </div>
      </div>
    );
  }
}

export default App;
