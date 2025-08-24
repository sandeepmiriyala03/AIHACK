import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Upload from './page'; // Adjust path if necessary

describe('Upload Component', () => {
  beforeEach(() => {
    render(<Upload />);
  });

    test('renders section headers', () => {
        expect(screen.getByRole('button', { name: /Instructions/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /File Upload Manager/i })).toBeInTheDocument();
    });

    
});
