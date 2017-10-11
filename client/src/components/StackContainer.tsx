import * as React from 'react';
import Mousetrap from 'mousetrap';
import FileSaver from 'file-saver';
import moment from 'moment';

import { ZetteliClient } from '../services/ZetteliClient';
import { ZetteliType } from './Zetteli';
import preventDefault from '../utils/preventDefault';
import Stack from './Stack';

export interface Props {
    client: ZetteliClient;
    // TODO(helfer): Is this the best way of controlling which Zettelis to show?
    filterBy: (z: ZetteliType) => boolean;
}

export interface State {
    loading: boolean;
    zettelis: ZetteliType[];
}

export default class StackContainer extends React.Component<Props, State> {
    static defaultProps = {
        filterBy: () => true,
    };

    state = {
        loading: true,
        zettelis: [],
    };

    mousetrap: MousetrapInstance;

    refetchZettelis = () => {
        // TODO: Because this will only work if the call doesn't take too long.
        return this.props.client.getAllZettelis().then( zettelis => {
            this.setState({ zettelis });
        });
    }

    createNewZetteli = () => {
        this.props.client.createNewZetteli()
        .then(() => this.refetchZettelis());
    }

    updateZetteli = (modifiedZetteli: ZetteliType) => {
        this.props.client.updateZetteli(modifiedZetteli.id, modifiedZetteli);
        // NOTE(helfer): Not refreshing here because the client will notify subscribers
    }

    deleteZetteli = (id: string) => {
        this.props.client.deleteZetteli(id)
        .then(() => this.refetchZettelis());
    }

    // Allows the user to save displayed zettelis to a local file
    downloadZettelis = () => {
        function serializeZetteli(z: ZetteliType): string {
            const DATE_RFC2822 = 'ddd, MM MMM YYYY HH:mm:ss ZZ';
            const time = moment.utc(z.datetime).format(DATE_RFC2822);
            // TODO(helfer): Make this string less ugly
            // NOTE(helfer): Should we strip HTML?
            return `
---
>${time}
[${z.tags.join(' ')}]

${z.body}
`;
        }

        const serializedZettelis = this.state.zettelis.map(serializeZetteli);
        var blob = new Blob(serializedZettelis, {type: 'text/plain;charset=utf-8'});
        FileSaver.saveAs(blob, `heftli-${moment().utc().format()}.txt`);
    }

    componentWillMount() {
        this.refetchZettelis().then( () => {
            this.setState({ loading: false });
        });
        this.props.client.subscribe(this.refetchZettelis);
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
        this.props.client.unsubscribe(this.refetchZettelis);
    }

    render() {
        if (this.state.loading) {
            return (
                <div className="ui active inverted dimmer">
                    <div className="ui text loader">Loading</div>
                </div>
            );
        }
        let filteredZettelis = this.state.zettelis.filter(this.props.filterBy);
        return (
          <Stack
            zettelis={filteredZettelis}
            onUpdate={this.updateZetteli}
            onDelete={this.deleteZetteli}
            onCreate={this.createNewZetteli}
          />
        );
    }
}