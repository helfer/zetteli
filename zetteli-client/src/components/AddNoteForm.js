import React from 'react';
import TextField from './TextField.js';

export default class AddNoteForm extends React.Component {
    state = {
        text: '',
    };

    render = () => {
        return (<div>
          <TextField text={this.state.text}/>
        </div>)
    }
}