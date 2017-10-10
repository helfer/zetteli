import * as React from 'react';
import * as enzyme from 'enzyme';
import FileSaver from 'file-saver';

import Stack from './Stack';
import { Props as ZetteliProps, ZetteliType } from './Zetteli';
import FullscreenableZetteli from './FullscreenableZetteli';
import LocalStorageClient from '../services/LocalStorageClient';

describe('Stack', () => {
    let client: LocalStorageClient;
    let store: Storage;
    let storage: Map<string, string>;
    let zli: ZetteliType;
    let zli2: ZetteliType;

    beforeEach(() => {
        // TODO(helfer): Make a proper mock of LocalStorageClient
        storage = new Map();
        store = {
            getItem: key => storage.get(key) || null,
            length: storage.size,
            clear: () => { storage.clear(); },
            setItem: (key, item) => storage.set(key, item),
            removeItem: key => storage.delete(key),
            key: i => '', // not implemented
        };

        client = new LocalStorageClient(store);
        zli = {
            id: '1',
            body: 'hello',
            datetime: new Date(1500000000000),
            tags: ['t1', 't2'],
        };
        client.addZetteli(zli);
        zli2 = {
            id: '2',
            body: 'hello2',
            datetime: new Date(1500000005000),
            tags: ['t3', 't4'],
        };
        client.addZetteli(zli2);
    });

    it('renders loading state while waiting', () => {
        const stack = enzyme.shallow(<Stack client={client} />);
        expect(stack.text()).toContain('Loading');
    });
    it('renders the list of zettelis with correct props', () => {
        const stack = enzyme.shallow(<Stack client={client} />);
        // NOTE(helfer): It would be better to not be aware of state, but I can't
        // figure out how to successfuly let the LocalStorageClient promise update the state.
        stack.setState({ zettelis: [zli, zli2], loading: false });
        stack.update();
        // TODO(helfer): Fix the type declaration of the Fullscreenable HOC soyou don't need to coerce type
        expect((stack.find(FullscreenableZetteli).at(0).props() as ZetteliProps).id).toBe('1');
        expect((stack.find(FullscreenableZetteli).at(0).props() as ZetteliProps).onUpdate).toBeDefined();
        expect((stack.find(FullscreenableZetteli).at(1).props() as ZetteliProps).id).toBe('2');
        expect((stack.find(FullscreenableZetteli).at(1).props() as ZetteliProps).onDelete).toBeDefined();
    });
    // listens to cmd+u and creates a new Zetteli if it's pressed
    // TODO(helfer): that test is actually a bit tricky. Let's keep that for later
    it('listens to command+u and adds a new zetteli if called', () => {
        client.createNewZetteli = jest.fn(() => Promise.resolve([]));
        // NOTE(helfer): Have to mount here to get lifecycle events
        const stack = enzyme.mount(<Stack client={client} />);
        (stack.instance() as Stack).mousetrap.trigger('command+u');
        expect(client.createNewZetteli).toHaveBeenCalled();
        stack.unmount();
        // TODO(helfer): Do the mock functions get removed after every test?
    });

    it('downloadZettelis saves zettelis to file', () => {
        const mockSaveAs = jest.fn();
        FileSaver.saveAs = mockSaveAs;
        // TODO(helfer): Find out why global.Blob is not defined
        // tslint:disable-next-line no-any
        (global as any).Blob = (content: string, options: {}) => ({content, options}); 
        const stack = enzyme.shallow(<Stack client={client} />);
        stack.setState({ zettelis: [zli, zli2], loading: false });
        stack.update();
        (stack.instance() as Stack).downloadZettelis();
        expect(mockSaveAs.mock.calls[0][0]).toMatchSnapshot();
    });

    it('Ctrl+s calls downloadZettelis', () => {
        const stack = enzyme.mount(<Stack client={client} />);
        const mockDownload = jest.fn();
        (stack.instance() as Stack).downloadZettelis = mockDownload;
        stack.setState({ zettelis: [zli, zli2], loading: false });
        stack.update();
        (stack.instance() as Stack).mousetrap.trigger('ctrl+s');
        stack.unmount();
        expect(mockDownload).toHaveBeenCalled();
    });

    // deleteZetteli calls client.delete
    it('can delete a zetteli', () => {
        client.deleteZetteli = jest.fn(() => Promise.resolve());
        const stack = enzyme.shallow(<Stack client={client} />);
        // TODO(helfer): Why can't I just call the prop that was passed?
        (stack.instance() as Stack).deleteZetteli('2');
        expect(client.deleteZetteli).toHaveBeenCalledWith('2');
    });
    // createNewZetteli calls client.create
    it('can create a zetteli', () => {
        client.createNewZetteli = jest.fn(() => Promise.resolve());
        const stack = enzyme.shallow(<Stack client={client} />);
        (stack.instance() as Stack).createNewZetteli();
        expect(client.createNewZetteli).toHaveBeenCalled();
    });
    // updateZetteli calls client.update
    it('can update a zetteli', () => {
        client.updateZetteli = jest.fn(() => Promise.resolve());
        const stack = enzyme.shallow(<Stack client={client} />);
        (stack.instance() as Stack).updateZetteli({ ...zli2, id: zli.id });
        expect(client.updateZetteli).toHaveBeenCalledWith(zli.id, { ...zli2, id: zli.id });
    });
    // refetch calls getAllZettelis
    it('can refetch zettelis', () => {
        client.getAllZettelis = jest.fn(() => Promise.resolve([]));
        const stack = enzyme.shallow(<Stack client={client} />);
        (stack.instance() as Stack).refetchZettelis();
        expect(client.getAllZettelis).toHaveBeenCalled();
    });
});