import React from 'react';

export default class EditableTagList extends React.Component {
    render() {
        return (
            <span className="right floated">
                <a className="ui label small">
                  log
                </a>
                <a className="ui label small">
                  personal
                </a>
              </span>
        );
    }
}