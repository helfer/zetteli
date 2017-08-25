import React from 'react';

export default class TextField extends React.Component {
    render = () => {
        return (<textarea>{this.props.text}</textarea>);
    }
}