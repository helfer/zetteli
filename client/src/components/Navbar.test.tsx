import * as React from 'react';
import * as enzyme from 'enzyme';
import Navbar from './Navbar';

import { MemoryRouter } from 'react-router';

describe('Navbar', () => {
    it('renders the menu', () => {
        const navbar = enzyme.render(<MemoryRouter><Navbar /></MemoryRouter>);
        expect(navbar.text()).toContain('Home');
        expect(navbar.text()).toContain('Archive');
        expect(navbar.text()).toContain('Settings');
    });
});