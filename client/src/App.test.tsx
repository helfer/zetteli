import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import * as enzyme from 'enzyme';

import LocalStorageClient from './services/LocalStorageClient';
import { ZetteliType } from './components/Zetteli';

describe('App', () => {
  // TODO(helfer): client is currently not used in tests
  let client: LocalStorageClient;
  let zli: ZetteliType;
  let zli2: ZetteliType;
  let store: Storage;
  let storage: Map<string, string>;

  beforeEach(() => {
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
        datetime: new Date(),
        tags: ['t1', 't2'],
      };
      client.addZetteli(zli);
      zli2 = {
        id: '2',
        body: 'byebye',
        datetime: new Date(),
        tags: ['t1'],
      };
      client.addZetteli(zli2);
  });

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App />, div);
  });

  it('updates state if onSearchChange is called', () => {
    const app = enzyme.shallow(<App />);
    (app.instance() as App).onSearchChange('abc');
    app.update();
    expect(app.state().search).toBe('abc');
  });

  it('applies searchFilter if search length is >= 3', () => {
    const app = enzyme.shallow(<App />);
    app.setState({ search: 'bye'});
    app.update();
    expect((app.instance() as App).searchFilter(zli)).toBe(false);
    expect((app.instance() as App).searchFilter(zli2)).toBe(true);
  });

  it('does not apply searchFilter if search length is < 3', () => {
    const app = enzyme.shallow(<App />);
    app.setState({ search: 'by'});
    app.update();
    expect((app.instance() as App).searchFilter(zli)).toBe(true);
    expect((app.instance() as App).searchFilter(zli2)).toBe(true);
  });

  // TODO(helfer): How do I get coverage for these lines?
  /*
  it('renders archive path', () => {

  });

  it('renders settings path', () => {

  });
  */
});
