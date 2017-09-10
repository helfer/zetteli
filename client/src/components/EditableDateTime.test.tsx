import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableDateTime from './EditableDateTime';

it('renders the date correctly', () => {
  const d = new Date('Wed, 16 Aug 2017 21:51:26 -0700');
  const dateTime = enzyme.shallow(<EditableDateTime datetime={d}/>);
  // TODO(helfer): This test is too brittle at the moment, because it depends on the locale
  expect(dateTime.text()).toContain('Wednesday, August 16th 2017, 21:51:26');
});