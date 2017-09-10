import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableText from './EditableText';

describe('EditableText', () => {
    it('renders the text', () => {
        const testText = 'Hi there!';
        const oc = jest.fn();
        const editableText = enzyme.render(<EditableText text={testText} onChange={oc}/>);
        expect(editableText.text()).toContain('Hi there!');
    });

    it('autofocuses the text if it is empty', () => {
        expect(false).toBe(true);
    });

    it('focuses the text if focus() is called', () => {
        expect(false).toBe(true);
    });

    it('calls onChange if the text is modified', () => {
        expect(false).toBe(true);
    });
});