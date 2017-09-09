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

    // TODO: I want, KeyboardEvent<HTMLInputElement>, but that does't seem to work.
    onKeyUp = (evt: any ) => {
        if ((evt as KeyboardEvent).keyCode === 13) {
            const newTags: string[] = (evt.target as HTMLInputElement).value.split(' ');
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
                        className='tagInput'
                        defaultValue={this.props.tags.join(' ')}
                        autoFocus={true}
                    />
                </span>
            );
        }

        return (
            <span style={{ float: 'right' }} onClick={this.startEditing}>
                {this.props.tags.map(tag => <a className="ui label mini" key={tag}> {tag} </a>)}
            </span>
        );
    }
}