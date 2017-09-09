import * as React from 'react';
import Mousetrap from 'mousetrap';

import Zetteli from './Zetteli';
import ZetteliClient from '../services/ZetteliClient';
import { ZetteliType } from '../types/Zetteli';

Mousetrap.prototype.stopCallback = () => false;

const client = new ZetteliClient(localStorage);

export default class ZetteliList extends React.Component<object, object> {
    state = {
        loading: true,
        zettelis: [] as ZetteliType[],
    };

    refetchZettelis() {
        // TODO: Because this will only work if the call doesn't take too long.
        client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis });
        });
    }

    createNewZetteli = () => {
        client.createNewZetteli()
        .then(() => this.refetchZettelis());
    }

    updateZetteli = (modifiedZetteli: ZetteliType) => {
        client.updateZetteli(modifiedZetteli.id, modifiedZetteli)
        .then(() => this.refetchZettelis());
    }

    deleteZetteli = (id: string) => {
        client.deleteZetteli(id)
        .then(() => this.refetchZettelis());
    }

    componentWillMount() {
        client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis, loading: false });
        });
    }

    componentDidMount() {
        Mousetrap.bind(['command+u'], this.createNewZetteli);

    }
    componentWillUnmount() {
        Mousetrap.unbind(['command+u']);
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
          <div style={{ marginBottom: '20em' }} className="zetteliList">
              {this.state.zettelis.map( zli => 
                 <Zetteli
                   tags={zli.tags}
                   datetime={zli.datetime}
                   body={zli.body}
                   key={zli.id}
                   id={zli.id}
                   onUpdate={this.updateZetteli}
                   onDelete={this.deleteZetteli}
                 />
              )}
              <div style={{textAlign: 'center'}}>
                <button className="ui center aligned circular icon button" onClick={this.createNewZetteli}>
                    <i className="plus icon" />
                </button>
            </div>
          </div>
        );
    }
}