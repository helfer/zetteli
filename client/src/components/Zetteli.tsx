import * as React from 'react';

import EditableDateTime from './EditableDateTime';
import EditableTagList from './EditableTagList';
import EditableText from './EditableText';

export interface Props {
    id: string;
    body: string;
    tags: string[];
    datetime: Date;
    onUpdate: (arg: {id: string, tags?: string[], body?: string}) => void;
    onDelete: (id: string) => void;
}

export default class Zetteli extends React.PureComponent<Props, never> {
    updateText = (evt: Event) => {
       this.props.onUpdate({
           id: this.props.id,
           body: (evt.target as HTMLInputElement).value,
       });
    }
    
    updateTags = (newTags: string[]) => {
       this.props.onUpdate({
           id: this.props.id,
           tags: newTags,
       });
    }

    onDelete = () => {
        if (confirm('Really delete?')) {
            this.props.onDelete(this.props.id);
        }
    }

    render() {
        const zetteliStyle = { 
            backgroundColor: 'white', 
            marginBottom: '12px',
            padding: '8px',
            fontFamily: 'Helvetica, sans',
            fontSize: '12px',
        };
        return (
          <div className="ui centered fluid" style={zetteliStyle}>
            <div>
              <EditableDateTime datetime={this.props.datetime} /> 
              <span style={{ float: 'right' }}>
                <i className="trash icon" onClick={this.onDelete} />
              </span>
              <EditableTagList tags={this.props.tags} updateTags={this.updateTags}/> 
            </div>
            <div className="ui divider"></div>
            <EditableText text={this.props.body} onChange={this.updateText} /> 
          </div>
        );
    }
}