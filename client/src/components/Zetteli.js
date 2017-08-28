import React from 'react';

import EditableDateTime from './EditableDateTime';
import EditableTagList from './EditableTagList';
import EditableText from './EditableText';

export default class Zetteli extends React.Component {
    render() {
        return (
          <div className="ui card centered fluid">
            <div className="extra content">
              <EditableDateTime /> 
              <EditableTagList /> 
            </div>
            <EditableText /> 
          </div>
        );
    }
}