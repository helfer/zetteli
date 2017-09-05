import * as React from 'react';
import moment from 'moment';

export interface Props {
    datetime: Date;
}

export default class EditableDateTime extends React.Component<Props, object> {
    // TODO specify prop types
    render() {
        return (
            <span className="left floated">
               {moment(this.props.datetime).format()} 
            </span>
        );
    }
}