import React from 'react';

export default class Navbar extends React.Component {
    render() {
        return <div className="ui pointing secondary menu">
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
          </div>;
    }
}