import * as React from 'react';
import * as enzyme from 'enzyme';

import Stack from './Stack';
import { Props as ZetteliProps, ZetteliType } from './Zetteli';
import FullscreenableZetteli from './FullscreenableZetteli';

describe('Stack', () => {
    let zli: ZetteliType;
    let zli2: ZetteliType;
    let wrapper: enzyme.ShallowWrapper;
    let instance: Stack;
    const updateSpy = jest.fn();
    const createSpy = jest.fn();
    const deleteSpy = jest.fn();

    beforeEach(() => {
        zli = {
            id: '1',
            body: 'hello',
            datetime: new Date(1500000000000),
            tags: ['t1', 't2'],
        };
        zli2 = {
            id: '2',
            body: 'hello2',
            datetime: new Date(1500000005000),
            tags: ['t3', 't4'],
        };

        wrapper = enzyme.shallow(
            <Stack
                zettelis={[zli, zli2]}
                onUpdate={updateSpy}
                onCreate={createSpy}
                onDelete={deleteSpy}
            />
        );
        instance = wrapper.instance() as Stack;
    });

    afterEach(() => {
        updateSpy.mockReset();
        createSpy.mockReset();
        deleteSpy.mockReset();
    });

    it('renders the list of zettelis wih correct props', () => {
        expect((wrapper.find(FullscreenableZetteli).at(0).props() as ZetteliProps).id).toBe('1');
        expect((wrapper.find(FullscreenableZetteli).at(0).props() as ZetteliProps).onUpdate).toBe(updateSpy);
        expect((wrapper.find(FullscreenableZetteli).at(1).props() as ZetteliProps).id).toBe('2');
        expect((wrapper.find(FullscreenableZetteli).at(1).props() as ZetteliProps).onDelete).toBe(deleteSpy);
    });
    
    it('can create a zetteli', () => {
        wrapper.find('button').simulate('click');
        expect(createSpy).toHaveBeenCalled();
    });
});