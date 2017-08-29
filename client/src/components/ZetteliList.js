import React from 'react';
import Zetteli from './Zetteli';

export default class ZetteliList extends React.Component {
    state = {
        zettelis: [
            {
                tags: ['log', 'personal'],
                datetime: new Date(),
                body: 'This is Zetteli #1',
            },
            {
                tags: ['note'],
                datetime: new Date(),
                body: 'This is Zetteli #2',
            },
        ],
    }
    render() {
        return (
          <div>
              {this.state.zettelis.map( zli => 
                 <Zetteli
                   tags={zli.tags}
                   datetime={zli.datetime}
                   body={zli.body}
                 />
              )}
              <div>
                <button className="ui circular icon button">
                    <i className="plus icon"></i>
                </button>
              </div>
          </div>
        );
    }
}