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

    it('does not autofocus the text if it is not empty', () => {
        const testText = 'x';
        const oc = jest.fn();
        const spy = spyOn(EditableText.prototype, 'focus');
        enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        expect(spy).not.toHaveBeenCalled();
        // TODO(helfer): I couldn't figure out how to restore the mocked functions
        // so right now the tests using spyOn actually have shared context and may break.
        // For example, if you switch around the order of this test and the next, it will fail.
    });

    it('autofocuses the text if it is empty', () => {
        const testText = '';
        const oc = jest.fn();
        const spy = spyOn(EditableText.prototype, 'focus');
        enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        expect(spy).toHaveBeenCalled();
    });

    // TODO(helfer): I'm not sure how to test this.
    // it('focuses the text if focus() is called', () => {
    // });

    it('calls onChange if the text is modified', () => {
        const testText = 'Something';
        const oc = jest.fn();
        const editableText = enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        editableText.find('.editableText').simulate('input');
        expect(oc).toHaveBeenCalled();
    });
});