import React from 'react';
import moment from 'moment';

export default class EditableDateTime extends React.Component {
    //TODO specify prop types
    render() {
        return (
            <span className="left floated">
               {moment(this.props.datetime).format()} 
            </span>
        );
    }
}