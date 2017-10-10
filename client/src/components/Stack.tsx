import * as React from 'react';

import FullscreenableZetteli from './FullscreenableZetteli';
import { ZetteliType } from './Zetteli';

export interface Props {
    zettelis: ZetteliType[];
    onUpdate: (zli: ZetteliType) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}

export default class Stack extends React.PureComponent<Props> {
    render() {
        return (
          <div style={{ marginBottom: '20em' }} className="contentContainer">
              {this.props.zettelis.map( zli => 
                 <FullscreenableZetteli
                   tags={zli.tags}
                   datetime={zli.datetime}
                   body={zli.body}
                   key={zli.id}
                   id={zli.id}
                   isOptimistic={Boolean(zli.optimisticCount)}
                   onUpdate={this.props.onUpdate}
                   onDelete={this.props.onDelete}
                 />
              )}
              <div style={{textAlign: 'center'}}>
                <button className="ui center aligned circular icon button" onClick={this.props.onCreate}>
                    <i className="plus icon" />
                </button>
            </div>
          </div>
        );
    }
}