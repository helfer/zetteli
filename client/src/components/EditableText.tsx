import * as React from 'react';
import ContentEditable from 'react-contenteditable';
export interface Props {
    text: string;
    onChange: (evt: Event) => void;
}

export default class EditableText extends React.PureComponent<Props, never> {
    contentEditable: any = null; // TODO it's a React Element, but what exactly?

    componentDidMount() {
        // NOTE(helfer): Poor man's autofocus. If the element was just created,
        // it's text will be empty, and we focus on it.
        if (!this.props.text && this.contentEditable) {
            this.contentEditable.htmlEl.focus();
        }
    }

    render() {
        return (
          <div className="left aligned content">
            <ContentEditable
              onChange={this.props.onChange}
              html={this.props.text}
              ref={(el: any) => { this.contentEditable = el; }}
            />
          </div>
        );
    }
}