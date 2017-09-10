import * as React from 'react';
import ContentEditable from 'react-contenteditable';

export interface Props {
    text: string;
    onChange: (evt: Event) => void;
}

export default class EditableText extends React.PureComponent<Props, never> {
    contentEditable: ContentEditable;

    componentDidMount() {
        // NOTE(helfer): A simple autofocus implementation. If the element was just created,
        // its text will be empty, and the element will get focus. If there are multiple
        // elements without foucs, the last one will win, which is usually what we want.
        if (!this.props.text && this.contentEditable) {
            this.focus();
        }
    }

    focus() {
        this.contentEditable.htmlEl.focus();
    }

    render() {
        return (
          <div className="left aligned content">
            <ContentEditable
              onChange={this.props.onChange}
              html={this.props.text}
              ref={(el: ContentEditable) => { this.contentEditable = el; }}
            />
          </div>
        );
    }
}