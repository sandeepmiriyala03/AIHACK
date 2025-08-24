import { render, screen, fireEvent } from '@testing-library/react';
import About from './page'; // Adjust the import path as needed

describe('About Page', () => {
  beforeEach(() => {
    render(<About />);
  });

  const sections = [
    { key: 'hero', label: /Welcome to AksharaTantra/i, contentText: /AksharaTantra makes text extraction simple/i },
    { key: 'mission', label: /Our Mission/i, contentText: /To empower people around the world/i },
    { key: 'features', label: /Key Features/i, contentText: /Multi-Language OCR/i },
    { key: 'howItWorks', label: /How It Works/i, contentText: /Step 1:/i },
    { key: 'whyChoose', label: /Why Choose AksharaTantra\?/i, contentText: /Completely free to use/i },
    { key: 'privacy', label: /Privacy & Security/i, contentText: /your privacy comes first/i },
  ];

  test('renders all section headers', () => {
    sections.forEach(({ label }) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  test('all sections are collapsed initially', () => {
    sections.forEach(({ contentText }) => {
      expect(screen.queryByText(contentText)).not.toBeInTheDocument();
    });
  });

  sections.forEach(({ label, contentText }) => {
    test(`toggles section "${label}" on click`, () => {
      const header = screen.getByRole('button', { name: label });
      // Expand
      fireEvent.click(header);
      expect(screen.getByText(contentText)).toBeInTheDocument();
      // Collapse
      fireEvent.click(header);
      expect(screen.queryByText(contentText)).not.toBeInTheDocument();
    });

    test(`toggles section "${label}" via keyboard Enter key`, () => {
      const header = screen.getByRole('button', { name: label });
      header.focus();
      // Expand
      fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
      expect(screen.getByText(contentText)).toBeInTheDocument();
      // Collapse
      fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
      expect(screen.queryByText(contentText)).not.toBeInTheDocument();
    });
  });
});
