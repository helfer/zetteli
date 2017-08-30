import React from 'react';

import EditableDateTime from './EditableDateTime';
import EditableTagList from './EditableTagList';
import EditableText from './EditableText';

export default class Zetteli extends React.Component {


    updateText = (evt) => {
       this.props.onUpdate({
           id: this.props.id,
           body: evt.target.value,
       });
    }

    render() {
        return (
          <div className="ui card centered fluid">
            <div className="extra content">
              <EditableDateTime datetime={this.props.datetime} /> 
              <EditableTagList tags={this.props.tags}/> 
            </div>
            <EditableText text={this.props.body} onChange={this.updateText} /> 
          </div>
        );
    }
}