import * as React from 'react';
import * as enzyme from 'enzyme';
import EditableTagList from './EditableTagList';

it('renders the tags', () => {
  const tags = ['t1', 't2'];
  const updateTags = (newTags: string[]) => null;
  const tagList = enzyme.shallow(<EditableTagList tags={tags} updateTags={updateTags}/>);
  expect(tagList.find('.tagList').text()).toContain('t1');
  expect(tagList.find('.tagList').text()).toContain('t2');
});

it('renders an input box with the tags on click', () => {
  const tags = ['t1', 't2'];
  const updateTags = (newTags: string[]) => null;
  const tagList = enzyme.shallow(<EditableTagList tags={tags} updateTags={updateTags}/>);
  tagList.simulate('click');
  expect(tagList.find('.tagInput').exists()).toBe(true);
  expect(tagList.find('.tagInput').html()).toContain('t1');
  expect(tagList.find('.tagInput').html()).toContain('t2');
});

it('calls onUpdate when Return key is pressed', () => {
  const tags = ['t1'];
  const updateTags = jest.fn();
  const tagList = enzyme.shallow(<EditableTagList tags={tags} updateTags={updateTags}/>);
  tagList.simulate('click');
  tagList.find('input').simulate('keyUp', { keyCode: 13, target: { value: 't2 t1' } });
  expect(updateTags).toHaveBeenCalledWith(['t2', 't1']);
});

// Trying to make sure all branches are covered here.
it('does not call onUpdate when a key other than Return is pressed', () => {
  const tags = ['t1'];
  const updateTags = jest.fn();
  const tagList = enzyme.shallow(<EditableTagList tags={tags} updateTags={updateTags}/>);
  tagList.simulate('click');
  tagList.find('input').simulate('keyUp', { keyCode: 14, target: { value: 't2 t1' } });
  expect(updateTags).not.toHaveBeenCalled();
});