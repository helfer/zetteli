import * as React from 'react';
import * as enzyme from 'enzyme';
import Navbar from './Navbar';

describe('Navbar', () => {
    it('renders the menu', () => {
        const navbar = enzyme.shallow(<Navbar />);
        expect(navbar.text()).toContain('Home');
        expect(navbar.text()).toContain('Archive');
        expect(navbar.text()).toContain('Settings');
    });
});