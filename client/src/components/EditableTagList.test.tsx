import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableTagList from './EditableTagList';

it('renders the tags', () => {
  const tags = ['t1', 't2'];
  const updateTags = (newTags) => {};
  const tagList = enzyme.shallow(<EditableTagList tags={tags} updateTags={updateTags}/>);
  expect(tagList.find(".tagList").text()).toContain('t1');
  expect(tagList.find(".tagList").text()).toContain('t2');
});