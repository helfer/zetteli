import * as React from 'react';
import * as enzyme from 'enzyme';

import ZetteliList from './ZetteliList';
import Zetteli, { ZetteliType } from './Zetteli';
import ZetteliClient from '../services/ZetteliClient';

describe('ZetteliList', () => {
    let client: ZetteliClient;
    let store: Storage;
    let storage: Map<string, string>;
    let zli: ZetteliType;
    let zli2: ZetteliType;

    beforeEach(() => {
        // TODO(helfer): Make a proper mock of ZetteliClient
        storage = new Map();
        store = {
            getItem: key => storage.get(key) || null,
            length: storage.size,
            clear: () => { storage.clear(); },
            setItem: (key, item) => storage.set(key, item),
            removeItem: key => storage.delete(key),
            key: i => '', // not implemented
        };

        client = new ZetteliClient(store);
        zli = {
            id: '1',
            body: 'hello',
            datetime: new Date(),
            tags: ['t1', 't2'],
        };
        client.addZetteli(zli);
        zli2 = {
            id: '2',
            body: 'hello2',
            datetime: new Date(),
            tags: ['t3', 't4'],
        };
        client.addZetteli(zli2);
    });

    it('renders loading state while waiting', () => {
        const zetteliList = enzyme.shallow(<ZetteliList client={client} />);
        expect(zetteliList.text()).toContain('Loading');
    });
    it('renders the list of zettelis with correct props', () => {
        const zetteliList = enzyme.shallow(<ZetteliList client={client} />);
        // NOTE(helfer): It would be better to not be aware of state, but I can't
        // figure out how to successfuly let the ZetteliClient promise update the state.
        zetteliList.setState({ zettelis: [zli, zli2], loading: false });
        zetteliList.update();
        expect(zetteliList.find(Zetteli).at(0).props().id).toBe('1');
        expect(zetteliList.find(Zetteli).at(0).props().onUpdate).toBeDefined();
        expect(zetteliList.find(Zetteli).at(1).props().id).toBe('2');
        expect(zetteliList.find(Zetteli).at(1).props().onDelete).toBeDefined();
    });
    // listens to cmd+u and creates a new Zetteli if it's pressed
    // TODO(helfer): that test is actually a bit tricky. Let's keep that for later
    it('listens to command+u and adds a new zetteli if called', () => {
        let cb: Function = () => null;
        Mousetrap.bind = jest.fn( (key, func) => { cb = func; });
        Mousetrap.unbind = jest.fn();
        client.createNewZetteli = jest.fn(() => Promise.resolve([]));

        // NOTE(helfer): Have to mount here to get lifecycle events
        const zetteliList = enzyme.mount(<ZetteliList client={client} />);
        expect(Mousetrap.bind).toHaveBeenCalled();
        cb(); // Should have been assigned by now
        expect(client.createNewZetteli).toHaveBeenCalled();
        zetteliList.unmount();
        expect(Mousetrap.unbind).toHaveBeenCalledWith(['command+u']);

        // TODO(helfer): Do the mock functions get removed after every test?
    });

    // deleteZetteli calls client.delete
    it('can delete a zetteli', () => {
        client.deleteZetteli = jest.fn(() => Promise.resolve());
        const zetteliList = enzyme.shallow(<ZetteliList client={client} />);
        // TODO(helfer): Why can't I just call the prop that was passed?
        (zetteliList.instance() as ZetteliList).deleteZetteli('2');
        expect(client.deleteZetteli).toHaveBeenCalledWith('2');
    });
    // createNewZetteli calls client.create
    it('can create a zetteli', () => {
        client.createNewZetteli = jest.fn(() => Promise.resolve());
        const zetteliList = enzyme.shallow(<ZetteliList client={client} />);
        (zetteliList.instance() as ZetteliList).createNewZetteli();
        expect(client.createNewZetteli).toHaveBeenCalled();
    });
    // updateZetteli calls client.update
    it('can update a zetteli', () => {
        client.updateZetteli = jest.fn(() => Promise.resolve());
        const zetteliList = enzyme.shallow(<ZetteliList client={client} />);
        (zetteliList.instance() as ZetteliList).updateZetteli({ ...zli2, id: zli.id });
        expect(client.updateZetteli).toHaveBeenCalledWith(zli.id, { ...zli2, id: zli.id });
    });
    // refetch calls getAllZettelis
    it('can refetch zettelis', () => {
        client.getAllZettelis = jest.fn(() => Promise.resolve([]));
        const zetteliList = enzyme.shallow(<ZetteliList client={client} />);
        (zetteliList.instance() as ZetteliList).refetchZettelis();
        expect(client.getAllZettelis).toHaveBeenCalled();
    });
});