import * as React from 'react';
import * as enzyme from 'enzyme';
import Zetteli from './Zetteli';

import EditableText from './EditableText';
import EditableDateTime from './EditableDateTime';
import EditableTagList from './EditableTagList';

describe('Zetteli', () => {
    let props = {
        id: '1',
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
        datetime: new Date(0),
        tags: ['a'],
        body: 'Something',
    };
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('shows the date, tags, text and delete button', () => {
        const zetteli = enzyme.shallow(<Zetteli {...props} />);
        expect(zetteli.find(EditableText).props().text).toEqual(props.body);
        expect(zetteli.find(EditableDateTime).props().datetime).toEqual(props.datetime);
        expect(zetteli.find(EditableTagList).props().tags).toEqual(props.tags);
        expect(zetteli.containsMatchingElement(<i className="trash icon" />)).toBe(true);
    });
    it('calls onDelete after confirming if you click the delete button', () => {
        const conf = jest.fn(() => true);
        window.confirm = conf;
        const zetteli = enzyme.shallow(<Zetteli {...props} />);
        zetteli.find('.trash').simulate('click');
        expect(conf).toHaveBeenCalled();
        expect(props.onDelete).toHaveBeenCalledWith(props.id);
    });
    it('does not call onDelete if confirm returns false', () => {
        const conf = jest.fn(() => false);
        window.confirm = conf;
        const zetteli = enzyme.shallow(<Zetteli {...props} />);
        zetteli.find('.trash').simulate('click');
        expect(conf).toHaveBeenCalled();
        expect(props.onDelete).not.toHaveBeenCalled();
    });
    it('calls onDelete without confirming if body is empty', () => {
        const conf = jest.fn(() => false);
        window.confirm = conf;
        const zetteli = enzyme.shallow(<Zetteli {...props} body="" />);
        zetteli.find('.trash').simulate('click');
        expect(conf).not.toHaveBeenCalled();
        expect(props.onDelete).toHaveBeenCalledWith(props.id);
    });
    it('renders in full-screen mode', () => {
        const zetteli = enzyme.shallow(<Zetteli {...props} isFullscreen={true} />);
        expect(zetteli.find(EditableText).props().text).toEqual(props.body);
        expect(zetteli.find(EditableTagList).length).toBe(0);
        expect(zetteli.containsMatchingElement(
            <i className="window close outline icon" />
        )).toBe(true);
    });
    it('calls focus() on EditableText after updating tags', () => {
        const mockFocus = jest.fn();
        const newTags = ['a', 'b'];
        const zetteli = enzyme.mount(<Zetteli {...props} isFullscreen={true} />);
        (zetteli.instance() as Zetteli).editableText.focus = mockFocus;
        (zetteli.instance() as Zetteli).updateTags(newTags);
        expect(props.onUpdate).toHaveBeenCalledWith({ id: props.id, tags: newTags });
        expect(mockFocus).toHaveBeenCalled();
        zetteli.unmount();
    });
});