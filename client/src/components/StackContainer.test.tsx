import * as React from 'react';
import * as enzyme from 'enzyme';
import moment from 'moment';
import FileSaver from 'file-saver';
// import { MemoryRouter } from 'react-router';

import StackContainer, { last2days } from './StackContainer';
import { ZetteliType } from './Zetteli';
import LocalStorageClient from '../services/LocalStorageClient';

describe('StackContainer', () => {
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
        const stack = enzyme.shallow(
            <StackContainer stackId={'1'} client={client} />
        );
        expect(stack.text()).toContain('Loading');
    });
    
    // listens to cmd+u and creates a new Zetteli if it's pressed
    // TODO(helfer): that test is actually a bit tricky. Let's keep that for later
    it('listens to command+u and adds a new zetteli if called', () => {
        client.createNewZetteli = jest.fn(() => Promise.resolve([]));
        // NOTE(helfer): Have to mount here to get lifecycle events
        const stack = enzyme.mount(<StackContainer stackId={'1'} client={client} />);
        (stack.instance() as StackContainer).mousetrap.trigger('command+u');
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
        const stack = enzyme.shallow(<StackContainer stackId={'1'} client={client} />);
        stack.setState({ zettelis: [zli, zli2], loading: false });
        stack.update();
        (stack.instance() as StackContainer).downloadZettelis();
        expect(mockSaveAs.mock.calls[0][0]).toMatchSnapshot();
    });

    it('Ctrl+s calls downloadZettelis', () => {
        const stack = enzyme.mount(<StackContainer stackId={'1'} client={client} />);
        const mockDownload = jest.fn();
        (stack.instance() as StackContainer).downloadZettelis = mockDownload;
        // TODO(helfer): We're keeping loading=true here so the Router doesn't render,
        // but we should really figure out how to test stuff with a Router...
        stack.setState({ zettelis: [zli, zli2], loading: true });
        (stack.instance() as StackContainer).mousetrap.trigger('ctrl+s');
        stack.unmount();
        expect(mockDownload).toHaveBeenCalled();
    });

    // deleteZetteli calls client.delete
    it('can delete a zetteli', () => {
        client.deleteZetteli = jest.fn(() => Promise.resolve());
        const stack = enzyme.shallow(<StackContainer stackId={'1'} client={client} />);
        // TODO(helfer): Why can't I just call the prop that was passed?
        (stack.instance() as StackContainer).deleteZetteli('2');
        expect(client.deleteZetteli).toHaveBeenCalledWith('2');
    });
    
    // createNewZetteli calls client.create
    it('can create a zetteli', () => {
        client.createNewZetteli = jest.fn(() => Promise.resolve());
        const stack = enzyme.shallow(<StackContainer stackId={'1'} client={client} />);
        (stack.instance() as StackContainer).createNewZetteli();
        expect(client.createNewZetteli).toHaveBeenCalled();
    });
    // updateZetteli calls client.update
    it('can update a zetteli', () => {
        client.updateZetteli = jest.fn(() => Promise.resolve());
        const stack = enzyme.shallow(<StackContainer stackId={'1'} client={client} />);
        (stack.instance() as StackContainer).updateZetteli({ ...zli2, id: zli.id });
        expect(client.updateZetteli).toHaveBeenCalledWith(zli.id, { ...zli2, id: zli.id });
    });

    // refetch calls getAllZettelis
    it('can refetch zettelis', () => {
        client.getAllZettelis = jest.fn(() => Promise.resolve([]));
        const stack = enzyme.shallow(<StackContainer stackId={'1'} client={client} />);
        (stack.instance() as StackContainer).refetchZettelis();
        expect(client.getAllZettelis).toHaveBeenCalled();
    });

    it('last2days filter works correctly', () => {
        // It should include all zettelis from today and yesterday,
        // so at least 24 hours and at most 48 hours.
        zli.datetime = new Date();
        expect(last2days(zli)).toBe(true);
    
        zli.datetime = moment().subtract(1, 'day').toDate();
        expect(last2days(zli)).toBe(true);
    
        zli.datetime = moment().subtract(2, 'days').toDate();
        expect(last2days(zli)).toBe(false);
      });
    
});