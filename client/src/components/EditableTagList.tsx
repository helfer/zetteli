import * as React from 'react';

export interface Props {
    tags: string[];
    updateTags: (newTags: string[]) => void;
}

export default class EditableTagList extends React.Component<Props, object> {
    state = {
        editing: false,
    };

    startEditing = () => {
        this.setState({ editing: true });
    }

    onKeyUp = (evt: React.KeyboardEvent<HTMLInputElement> ) => {
        if (evt.keyCode === 13) {
            const newTags: string[] = evt.currentTarget.value.split(' ').filter(Boolean);
            this.props.updateTags(newTags);
            this.setState({ editing: false });
        }
    }

    render() {
        if (this.state.editing) {
            return (
                <span style={{ float: 'right' }} className="right floated" onClick={this.startEditing}>
                    <input
                        type="text"
                        onKeyUp={this.onKeyUp}
                        className="tagInput"
                        defaultValue={this.props.tags.join(' ')}
                        autoFocus={true}
                    />
                </span>
            );
        }

        return (
            <span style={{ float: 'right' }} className="tagList" onClick={this.startEditing}>
                {this.props.tags.map(tag => <a className="ui label mini" key={tag}> {tag} </a>)}
            </span>
        );
    }
}