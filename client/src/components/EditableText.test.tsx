import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableText from './EditableText';

describe('EditableText', () => {
    it('renders the text', () => {
        const testText = 'Hi there!';
        const oc = jest.fn();
        const editableText = enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        expect(editableText.text()).toContain('Hi there!');
    });
});