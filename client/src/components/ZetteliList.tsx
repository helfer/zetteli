import * as React from 'react';
import Mousetrap from 'mousetrap';

import Zetteli from './Zetteli';
import ZetteliClient from '../services/ZetteliClient';
import { ZetteliType } from './Zetteli';

Mousetrap.prototype.stopCallback = () => false;

export interface Props {
    client: ZetteliClient;
}

export default class ZetteliList extends React.Component<Props, object> {
    state = {
        loading: true,
        zettelis: [] as ZetteliType[],
    };

    refetchZettelis() {
        // TODO: Because this will only work if the call doesn't take too long.
        this.props.client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis });
        });
    }

    createNewZetteli = () => {
        this.props.client.createNewZetteli()
        .then(() => this.refetchZettelis());
    }

    updateZetteli = (modifiedZetteli: ZetteliType) => {
        this.props.client.updateZetteli(modifiedZetteli.id, modifiedZetteli)
        .then(() => this.refetchZettelis());
    }

    deleteZetteli = (id: string) => {
        this.props.client.deleteZetteli(id)
        .then(() => this.refetchZettelis());
    }

    componentWillMount() {
        this.props.client.getAllZettelis().then( zettelis => {
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