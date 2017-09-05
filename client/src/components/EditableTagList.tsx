import * as React from 'react';

export interface Props {
    tags: string[],
    updateTags: (newTags: string[]) => void,
}

export default class EditableTagList extends React.Component<Props, object> {

    state = {
        editing: false,
    }

    startEditing = () => {
        this.setState({ editing: true });
    }

    onKeyUp = evt => {
        if (evt.keyCode === 13) {
            const newTags = evt.target.value.split(' ');
            this.props.updateTags(newTags);
            this.setState({ editing: false });
        }
    }

    render() {
        if (this.state.editing){
            return (
                <span className="right floated" onClick={this.startEditing}>
                    <input
                        type="text"
                        onKeyUp={this.onKeyUp}
                        defaultValue={this.props.tags.join(' ')}
                        autoFocus
                     />
                </span>
            );
        }

        return (
            <span className="right floated" onClick={this.startEditing}>
                {this.props.tags.map(tag => <a className="ui label small" key={tag}> {tag} </a>)}
            </span>
        );
    }
}