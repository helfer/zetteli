import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import ZetteliClient from './services/ZetteliClient';

describe('App', () => {
  let client: ZetteliClient;
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

      client = new ZetteliClient(store);

      const zli = {
        id: '1',
        body: 'hello',
        datetime: new Date(),
        tags: ['t1', 't2'],
      };
      client.addZetteli(zli);
  });

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App client={client}/>, div);
  });
});
