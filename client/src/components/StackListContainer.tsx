import * as React from 'react';
import StackList, { StackType } from './StackList';

interface State {
    loading: boolean;
    stacks: StackType[];
}

export default class StackListContainer extends React.Component<never, State> {
    state = {
        loading: false,
        stacks: [],
    };

    constructor() {
        super();

        // client.fetchStacks();
        // Here let's put the GraphQL Client on the context, okay? We just need to be able to
        // abstract it away, and all will be good.
    }

    onStackListUpdate = () => {
        // this.setState({ stacks: this.store.getState().stacks });
    }

    render() {
        if (this.state.loading) {
            return (
                <div className="ui active inverted dimmer">
                    <div className="ui text loader">Loading</div>
                </div>
            );
        }
        return <StackList stacks={this.state.stacks} />;
    }
}