import * as React from 'react';

import { Link } from 'react-router-dom';

export interface Props {
  search: string;
  onSearchChange: (search: string) => void;
}

export default class Navbar extends React.PureComponent<Props, never> {

    onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {  
        const newText = e.currentTarget.value;  
        this.props.onSearchChange(newText); 
    }

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
            <Link className="item" to="/">Home</Link>
            <Link className="item" to="./archive">Archive</Link>
            <Link className="item" to="./settings">Settings</Link>
            <div className="right menu">
              <div className="item">
                <div className="ui transparent icon input">
                  <input 
                    type="text"
                    placeholder="Search..."
                    value={this.props.search}
                    onChange={this.onChange}
                  />
                  <i className="search link icon" />
                </div>
              </div>
            </div>
          </div>
        );
    }
}