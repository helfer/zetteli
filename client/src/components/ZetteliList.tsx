import * as React from 'react';
import Mousetrap from 'mousetrap';
import FileSaver from 'file-saver';
import moment from 'moment';

// import Zetteli from './Zetteli';
import FullscreenableZetteli from './FullscreenableZetteli';
import ZetteliClient from '../services/ZetteliClient';
import { ZetteliType } from './Zetteli';
import preventDefault from '../utils/preventDefault';

export interface Props {
    client: ZetteliClient;
}

export default class ZetteliList extends React.Component<Props, object> {
    state = {
        loading: true,
        zettelis: [] as ZetteliType[],
    };

    mousetrap: MousetrapInstance;

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

    // Allows the user to save displayed zettelis to a local file
    downloadZettelis = () => {
        function serializeZetteli(z: ZetteliType): string {
            const DATE_RFC2822 = 'ddd, MM MMM YYYY HH:mm:ss [GMT]';
            const time = moment.utc(z.datetime).format(DATE_RFC2822);
            // TODO(helfer): Make this string less ugly
            // TODO(helfer): Make sure the date is formatted correctly.
            // NOTE(helfer): Should we strip HTML?
            return `
---
>${moment(time).format()}
[${z.tags.join(' ')}]

${z.body}

            `;
        }

        const serializedZettelis = this.state.zettelis.map(serializeZetteli);
        var blob = new Blob(serializedZettelis, {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, `heftli-${moment().utc().format()}.txt`);
    }

    componentWillMount() {
        this.props.client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis, loading: false });
        });
    }

    componentDidMount() {
        // NOTE(helfer): new Mousetrap() works and will bind to document.
        // tslint:disable-next-line no-any
        this.mousetrap = new Mousetrap(undefined as any);
        this.mousetrap.stopCallback = () => false;
        this.mousetrap.bind('command+u', this.createNewZetteli);
        this.mousetrap.bind(['ctrl+s', 'meta+s'], (e) => {
            preventDefault(e); 
            this.downloadZettelis();
        });

    }
    componentWillUnmount() {
        this.mousetrap.unbind('command+u');
        this.mousetrap.unbind(['ctrl+s', 'meta+s']);
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
                 <FullscreenableZetteli
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