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
    it('shows the date, tags, text and delete button', () => {
        const zetteli = enzyme.shallow(<Zetteli {...props} />);
        expect(zetteli.find(EditableText).props().text).toEqual(props.body);
        expect(zetteli.find(EditableDateTime).props().datetime).toEqual(props.datetime);
        expect(zetteli.find(EditableTagList).props().tags).toEqual(props.tags);
        expect(zetteli.containsMatchingElement(<i className="trash icon" />)).toBe(true);
    });
    it('calls onDelete after confirming if you click the delete button', () => {
        const conf = jest.fn(() => true);
        window.confirm = conf; // TODO(helfer): This is not good. Get spyOn to work properly instead.
        const zetteli = enzyme.shallow(<Zetteli {...props} />);
        zetteli.find('.trash').simulate('click');
        expect(conf).toHaveBeenCalled();
        expect(props.onDelete).toHaveBeenCalledWith(props.id);
    });
    // TODO(helfer): Implement these additional tests
    // Delete doesn't ask for confirmation if Zetteli is empty
    // Test that updateTags calls onUpdate
    // Test that updating tags calls focus
    // Test that updateText
});