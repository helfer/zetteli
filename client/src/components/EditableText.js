import React from 'react';

export default class EditableText extends React.Component {
    render() {
        return (<div className="left aligned content">
            <p contentEditable="true">{this.props.text}</p>
        </div>);
    }
}