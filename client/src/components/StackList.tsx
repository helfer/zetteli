import * as React from 'react';
import { Link } from 'react-router-dom';

export interface StackType {
    id: string;
    name: string;
    // public: boolean;
    // settings: { defaultTags: string[] };
}

interface Props {
    stacks: StackType[];
}

export default class StackList extends React.PureComponent<Props> {
    render() {
        return (
            <ul>
                {this.props.stacks.map(s => 
                    <li key={s.id}><StackListEntry stack={s} /></li>
                )}
            </ul>
        );
    }
}

export function StackListEntry(props: { stack: StackType }) {
    return (
        <Link to={`/s/${props.stack.id}`}>{props.stack.name}</Link>
    );
}