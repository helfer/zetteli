import React from 'react';
import ContentEditable from 'react-contenteditable';

export default class EditableText extends React.Component {
    render() {
        return (<div className="left aligned content">
            <ContentEditable 
              onChange={this.props.onChange}
              html={this.props.text}
            />
        </div>);
    }
}