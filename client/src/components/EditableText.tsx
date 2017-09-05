import * as React from 'react';
import ContentEditable from 'react-contenteditable';
export interface Props {
    text: string;
    onChange: (evt: Event) => void;
}

export default class EditableText extends React.Component<Props, object> {
    render() {
        return (
          <div className="left aligned content">
            <ContentEditable 
              onChange={this.props.onChange}
              html={this.props.text}
            />
          </div>
        );
    }
}