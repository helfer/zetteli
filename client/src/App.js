import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import AddNoteView from './components/AddNoteView';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <div className="App-body">

          <div className="ui card centered">
            <div className="content"><div className="header">
              <div className="zetteli-date">
                <span className="date">Fr. 25.8.2017 09:50</span>
              </div>
              <div className="zetteli-tags">
                <span className="tag">log</span>
                <span className="tag">personal</span>
              </div>
            </div></div>
            <div className="zetteli-body">
              <p>This is the first hard-coded zetteli in history!</p>
            </div>
          </div>

          <div className="ui card centered">
            <div className="zetteli-header">
              <div className="zetteli-date">
                <span className="date">Fr. 25.8.2017 09:54</span>
              </div>
              <div className="zetteli-tags">
                <span className="tag">log</span>
                <span className="tag">personal</span>
              </div>
            </div>
            <div className="zetteli-body">
              <p contenteditable="true">This zetteli is currently being edited!</p>
            </div>
          </div>
          <button className="add-zetteli button">+</button>
        </div>
      </div>
    );
  }
}

export default App;
