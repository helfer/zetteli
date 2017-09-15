import React from 'react';
import ReactDOM from 'react-dom';
import App, { last2days } from './App';
import * as enzyme from 'enzyme';
import moment from 'moment';

import ZetteliClient from './services/ZetteliClient';
import { ZetteliType } from './components/Zetteli';

describe('App', () => {
  let client: ZetteliClient;
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
        body: 'byebye',
        datetime: new Date(),
        tags: ['t1'],
      };
      client.addZetteli(zli2);
  });

  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<App client={client}/>, div);
  });

  it('updates state if onSearchChange is called', () => {
    const app = enzyme.shallow(<App client={client} />);
    (app.instance() as App).onSearchChange('abc');
    app.update();
    expect(app.state().search).toBe('abc');
  });

  it('applies searchFilter if search length is >= 3', () => {
    const app = enzyme.shallow(<App client={client} />);
    app.setState({ search: 'bye'});
    app.update();
    expect((app.instance() as App).searchFilter(zli)).toBe(false);
    expect((app.instance() as App).searchFilter(zli2)).toBe(true);
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

  it('does not apply searchFilter if search length is < 3', () => {
    const app = enzyme.shallow(<App client={client} />);
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
