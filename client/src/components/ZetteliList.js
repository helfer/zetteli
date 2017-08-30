import React from 'react';
import Zetteli from './Zetteli';

export default class ZetteliList extends React.Component {
    state = {
        zettelis: [
            {
                tags: ['log', 'personal'],
                datetime: new Date(),
                body: 'This is Zetteli #1',
                id: '0'
            },
            {
                tags: ['note'],
                datetime: new Date(),
                body: 'This is Zetteli #2',
                id: '1',
            },
        ],
    }

    createNewZetteli = () => {
        this.setState( state => ({
            zettelis: [ ...state.zettelis, {
                tags: ['log', 'personal'],
                datetime: new Date(),
                body: '',
                id: Math.random()
            }]
        }));
    };

    updateZetteli = (modifiedZetteli) => {
        this.setState( state => ({
            zettelis: state.zettelis.map( zli => {
                if (zli.id === modifiedZetteli.id) {
                    return { ...zli, ...modifiedZetteli };
                } else {
                    return zli;
                }
            }),
        }));
    }

    render() {
        return (
          <div>
              {this.state.zettelis.map( zli => 
                 <Zetteli
                   tags={zli.tags}
                   datetime={zli.datetime}
                   body={zli.body}
                   key={zli.id}
                   id={zli.id}
                   onUpdate={this.updateZetteli}
                 />
              )}
              <div className="ui center aligned segment">
                <button className="ui circular icon button" onClick={this.createNewZetteli}>
                    <i className="plus icon"></i>
                </button>
              </div>
          </div>
        );
    }
}