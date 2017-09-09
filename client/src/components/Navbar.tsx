import * as React from 'react';

export interface Props {
  
}

export default class Navbar extends React.PureComponent<Props, never> {
    render() {
        return (
          <div
            className="ui pointing secondary menu"
            style={{
              position: 'fixed',
              top: 0,
              width: '700px',
              backgroundColor: '#CCC',
            }}
          >
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
                  <i className="search link icon" />
                </div>
              </div>
            </div>
          </div>
        );
    }
}