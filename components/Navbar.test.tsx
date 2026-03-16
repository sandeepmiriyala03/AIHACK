import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar'; // Adjust path if needed

describe('Navbar component', () => {
  beforeEach(() => {
    render(<Navbar />);
  });

  test('renders the logo with alt text', () => {
    const logo = screen.getByAltText(/AksharaTantra logo/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/icon-512.png');
  });

  test('renders all navigation links', () => {
    expect(screen.getByRole('link', { name: /Upload/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /OCR/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /यथाक्षरं पठनम्/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tech stack/i })).toBeInTheDocument();
  });

  test('menu toggle button toggles menu open and closed', () => {
    const menuButton = screen.getByRole('button', { name: /Toggle menu/i });
    const navMenu = screen.getByRole('list');

    // Initially closed
    expect(navMenu).not.toHaveClass('open');

    // Click to open
    fireEvent.click(menuButton);
    expect(navMenu).toHaveClass('open');

    // Click to close
    fireEvent.click(menuButton);
    expect(navMenu).not.toHaveClass('open');
  });
});
