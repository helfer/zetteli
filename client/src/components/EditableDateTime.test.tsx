import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableDateTime from './EditableDateTime';
import timezoneMock from 'timezone-mock';

describe('EditableDateTime', () => {
    beforeAll(() => {
        timezoneMock.register('US/Pacific');
    });

    afterAll(() => {
        timezoneMock.unregister();
    });

    it('renders the date correctly', () => {
        const d = new Date(1505004501000);
        const dateTime = enzyme.shallow(<EditableDateTime datetime={d}/>);
        expect(dateTime.text()).toContain('Saturday, September 9th 2017, 17:48:21');
    });
});