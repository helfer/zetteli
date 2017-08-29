import React from 'react';

export default class EditableTagList extends React.Component {
    render() {
        return (
            <span className="right floated">
                {this.props.tags.map(tag => <a className="ui label small"> {tag} </a>)}
            </span>
        );
    }
}