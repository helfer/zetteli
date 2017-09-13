import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableText from './EditableText';

describe('EditableText', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the text', () => {
        const testText = 'Hi there!';
        const oc = jest.fn();
        const et = enzyme.render(<EditableText text={testText} onChange={oc}/>);
        expect(et.text()).toContain('Hi there!');
    });

    it('does not autofocus the text if it is not empty', () => {
        const testText = 'x';
        const oc = jest.fn();
        const spy = spyOn(EditableText.prototype, 'focus');
        const et = enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        expect(spy).not.toHaveBeenCalled();
        et.unmount();
    });

    it('autofocuses the text if it is empty', () => {
        const testText = '';
        const oc = jest.fn();
        const spy = spyOn(EditableText.prototype, 'focus');
        const et = enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        expect(spy).toHaveBeenCalled();
        et.unmount();
    });

    it('focuses the text if focus() is called', () => {
        const testText = 'x';
        const oc = jest.fn();
        const et = enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        const spy = spyOn((et.instance() as EditableText).contentEditable.htmlEl, 'focus');
        (et.instance() as EditableText).focus();
        expect(spy).toHaveBeenCalled();
        et.unmount();
    });

    it('calls onChange if the text is modified', () => {
        const testText = 'Something';
        const oc = jest.fn();
        const et = enzyme.mount(<EditableText text={testText} onChange={oc}/>);
        et.find('.editableText').simulate('input');
        expect(oc).toHaveBeenCalled();
        et.unmount();
    });
});