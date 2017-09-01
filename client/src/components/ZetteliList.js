import React from 'react';
import Zetteli from './Zetteli';

import ZetteliClient from '../services/ZetteliClient';

const client = new ZetteliClient();

export default class ZetteliList extends React.Component {
    state = {
        loading: true,
        zettelis: [],
    }

    refetchZettelis() {
        // TODO: Because this will only work if the call doesn't take too long.
        client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis });
        });
    }

    createNewZetteli = () => {
        client.createNewZetteli()
        .then(() => this.refetchZettelis());
    };

    updateZetteli = (modifiedZetteli) => {
        client.updateZetteli(modifiedZetteli.id, modifiedZetteli)
        .then(() => this.refetchZettelis());
    }

    componentWillMount(){
        client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis, loading: false });
        });
    }

    render() {
        if (this.state.loading) {
            return (
                <div className="ui active inverted dimmer">
                    <div className="ui text loader">Loading</div>
                </div>
            );
        }
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