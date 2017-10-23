import * as React from 'react';
import Mousetrap from 'mousetrap';
import FileSaver from 'file-saver';
import moment from 'moment';
import { Route } from 'react-router';

import { ZetteliClient } from '../services/ZetteliClient';
import GraphQLClient from '../services/GraphQLClient';
// import LocalStorageClient from '../services/LocalStorageClient';
import { ZetteliType } from './Zetteli';
import preventDefault from '../utils/preventDefault';
import Stack from './Stack';

// TODO(helfer): Pull this out into a config file
const URI = 'http://localhost:3010/graphql';

// const today = (z: ZetteliType) => {
//   return moment().isSame(moment(z.datetime), 'd');
// }
export const last2days = (z: ZetteliType) => {
    return moment(z.datetime).isAfter(moment().subtract(1, 'd').startOf('day'));
};

export interface Props {
    // client: ZetteliClient;
    stackId: string;
    // TODO(helfer): Is this the best way of controlling which Zettelis to show?
    filterBy?: (z: ZetteliType) => boolean;
    client?: ZetteliClient;
}

export interface State {
    loading: boolean;
    error: string;
    zettelis: ZetteliType[];
}

export default class StackContainer extends React.Component<Props, State> {
    state = {
        loading: true,
        error: '',
        zettelis: [],
    };

    // Public for tests
    public mousetrap: MousetrapInstance;

    private client: ZetteliClient;

    constructor(props: Props) {
        super(props);

        if (props.client) {
            this.client = props.client; // new LocalStorageClient(window.localStorage);            
        } else {
            this.client = new GraphQLClient({ sid: this.props.stackId, uri: URI });
        }
    }

    refetchZettelis = () => {
        // TODO: Because this will only work if the call doesn't take too long.
        return this.client.getAllZettelis()
        .then( zettelis => {
            this.setState({ zettelis });
        })
        .catch((error: string) => {
            this.setState({ error });
        });
    }

    createNewZetteli = () => {
        this.client.createNewZetteli()
        .then(() => this.refetchZettelis());
    }

    updateZetteli = (modifiedZetteli: ZetteliType) => {
        this.client.updateZetteli(modifiedZetteli.id, modifiedZetteli);
        // NOTE(helfer): Not refreshing here because the client will notify subscribers
    }

    deleteZetteli = (id: string) => {
        this.client.deleteZetteli(id)
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
        this.client.subscribe(this.refetchZettelis);
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
        this.client.unsubscribe(this.refetchZettelis);
    }

    renderArchiveStack = () => {
        return this.renderStack(this.state.zettelis);
    }

    renderTodayStack = () => {
        return this.renderStack(this.state.zettelis.filter(last2days));
    }

    renderStack = (filteredZettelis: ZetteliType[]) => (
        <Stack
            zettelis={filteredZettelis}
            onUpdate={this.updateZetteli}
            onDelete={this.deleteZetteli}
            onCreate={this.createNewZetteli}
        />
    )

    render() {
        if (this.state.loading) {
            // TODO: Replace this with a loading component
            return (
                <div className="ui active inverted dimmer">
                    <div className="ui text loader">Loading</div>
                </div>
            );
        }
        if (this.state.error) {
            return (
                <div style={{ marginBottom: '20em' }} className="contentContainer">
                    <p className="error">{this.state.error}</p>
                </div>
            );
        }
        return (
            <div>
                <Route
                    exact={true}
                    path="/s/:sid/archive"
                    render={this.renderArchiveStack}
                />
                <Route
                    exact={true}
                    path="/s/:sid/"
                    render={this.renderTodayStack}
                />
            </div>
        );
    }
}