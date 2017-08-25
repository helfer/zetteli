import React from 'react';
import AddNoteForm from './AddNoteForm';

export default class AddNoteView extends React.Component {
    state = {
        notes: [],
    };

    render = () => {
        return <AddNoteForm />
    }
}
