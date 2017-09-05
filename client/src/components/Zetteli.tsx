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

export default class Zetteli extends React.Component<Props, object> {
    updateText = evt => {
       this.props.onUpdate({
           id: this.props.id,
           body: evt.target.value,
       });
    }
    
    updateTags = newTags => {
       this.props.onUpdate({
           id: this.props.id,
           tags: newTags,
       });
    }

    onDelete = () => {
        this.props.onDelete(this.props.id);
    }

    render() {
        return (
          <div className="ui card centered fluid">
            <div className="extra content">
              <EditableDateTime datetime={this.props.datetime} /> 
              <span className="right floated">
                <i className="trash icon" onClick={this.onDelete} />
              </span>
              <EditableTagList tags={this.props.tags} updateTags={this.updateTags}/> 
            </div>
            <EditableText text={this.props.body} onChange={this.updateText} /> 
          </div>
        );
    }
}