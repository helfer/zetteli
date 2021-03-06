import * as React from 'react';

import EditableDateTime from './EditableDateTime';
import EditableTagList from './EditableTagList';
import EditableText from './EditableText';

export interface Props {
    id: string;
    body: string;
    tags: string[];
    datetime: Date;
    isOptimistic: boolean;

    onUpdate: (arg: {id: string, tags?: string[], body?: string}) => void;
    onDelete: (id: string) => void;

    isFullscreen?: boolean;
    toggleFullscreen?: () => void;
}

export interface ZetteliType {
    id: string;
    body: string;
    tags: string[];
    datetime: Date;
    optimisticCount?: number;
}

export interface SerializedZetteli {
    id: string;
    body: string;
    tags: string[];
    datetime: string;
}

const zetteliStyle = { 
    backgroundColor: 'white', 
    marginBottom: '12px',
    padding: '8px',
    fontFamily: 'Helvetica, sans',
    fontSize: '13px',
};

export default class Zetteli extends React.PureComponent<Props, never> {
    editableText: EditableText;

    updateText = (evt: Event) => {
       this.props.onUpdate({
           id: this.props.id,
           // TODO(helfer): Fix typings here
           body: (evt.target as HTMLInputElement).value,
       });
    }
    
    updateTags = (newTags: string[]) => {
       this.props.onUpdate({
           id: this.props.id,
           tags: newTags,
       });
       this.editableText.focus();
    }

    onDelete = () => {
        if (this.props.body === '' || confirm('Really delete?')) {
            this.props.onDelete(this.props.id);
        }
    }

    editableTextRef = (ref: EditableText) => {
        this.editableText = ref;
    }

    render() {
        if (this.props.isFullscreen) {
            return this.renderFullscreen();
        }

        return (
          <div className="ui centered fluid" style={zetteliStyle}>
            <div>
              {false ? (<i className="warning sign icon" />) : null}
              <EditableDateTime datetime={this.props.datetime} /> 
              <span style={{ float: 'right' }}>
                <i className="window maximize icon" onClick={this.props.toggleFullscreen}/>
              </span>
              <span style={{ float: 'right' }}>
                <i className="trash icon" onClick={this.onDelete} />
              </span>
              <EditableTagList tags={this.props.tags} updateTags={this.updateTags}/> 
            </div>
            <div className="ui divider"/>
            <EditableText
              text={this.props.body}
              onChange={this.updateText}
              ref={this.editableTextRef}
            />
            <span
                style={{
                    float: 'right',
                    position: 'relative',
                    bottom: '10px',
                    right: '-8px',
                    opacity: this.props.isOptimistic ? 0.4 : 0,
                    WebkitTransition : 'opacity 800ms ease',
                    MozTransition : 'opacity 800ms ease',
                    OTransition : 'opacity 800ms ease',
                    transition : 'opacity 800ms ease',
                }}
                data-tooltip="Some changes are not saved yet"
            >
                <i className="warning sign icon" />
            </span>
          </div>
        );
    }

    renderFullscreen = () => {
        const fullscreenStyle = {
            width: '50%',
            margin: 'auto',
            paddingTop: '10em',
            fontSize: '18px',
            fontFamily: 'serif',
        };

        return (
          <div className="ui centered fluid" style={zetteliStyle}>
            <div>
              <span style={{ float: 'right' }}>
                <i className="window close outline icon" onClick={this.props.toggleFullscreen}/>
              </span>
            </div>
            <div style={fullscreenStyle}>
                <EditableText
                    text={this.props.body}
                    onChange={this.updateText}
                    ref={this.editableTextRef}
                />
                <span
                    style={{
                        float: 'right',
                        position: 'relative',
                        bottom: '10px',
                        right: '10px',
                        opacity: this.props.isOptimistic ? 0.4 : 0,
                        WebkitTransition : 'opacity 800ms ease',
                        MozTransition : 'opacity 800ms ease',
                        OTransition : 'opacity 800ms ease',
                        transition : 'opacity 800ms ease',
                    }}
                    data-tooltip="Some changes are not saved yet"
                >
                    <i className="warning sign icon" />
                </span>
            </div>
          </div>
        );
    }
}