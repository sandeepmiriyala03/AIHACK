import { render, screen, fireEvent } from '@testing-library/react';
import About from './page'; // adjust path if needed

describe('About Page', () => {
  beforeEach(() => {
    render(<About />);
  });

  test('renders section headers', () => {
    expect(screen.getByRole('button', { name: /Framework and Platform/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OCR and Document Processing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OCR Language Data and Models/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Application Installation and Testing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Summary/i })).toBeInTheDocument();
  });

  test('all sections start collapsed', () => {
    expect(screen.queryByText(/Next.js:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Tesseract.js:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/OCR trained language models/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Supports PWA installation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/This project combines modern web technologies/i)).not.toBeInTheDocument();
  });

  test('toggles Framework and Platform section', () => {
    const header = screen.getByRole('button', { name: /Framework and Platform/i });
    fireEvent.click(header);
    expect(screen.getByText(/Next.js:/i)).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/Next.js:/i)).not.toBeInTheDocument();
  });

  test('toggles OCR and Document Processing section', () => {
    const header = screen.getByRole('button', { name: /OCR and Document Processing/i });
    fireEvent.click(header);
    expect(screen.getByText(/Tesseract.js:/i)).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/Tesseract.js:/i)).not.toBeInTheDocument();
  });

  test('toggles OCR Language Data and Models section', () => {
    const header = screen.getByRole('button', { name: /OCR Language Data and Models/i });
    fireEvent.click(header);
    expect(screen.getByText(/OCR trained language models/i)).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/OCR trained language models/i)).not.toBeInTheDocument();
  });

  test('toggles Application Installation and Testing section', () => {
    const header = screen.getByRole('button', { name: /Application Installation and Testing/i });
    fireEvent.click(header);
    expect(screen.getByText(/Supports PWA installation/i)).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/Supports PWA installation/i)).not.toBeInTheDocument();
  });

  test('toggles Summary section', () => {
    const header = screen.getByRole('button', { name: /Summary/i });
    fireEvent.click(header);
    expect(screen.getByText(/This project combines modern web technologies/i)).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/This project combines modern web technologies/i)).not.toBeInTheDocument();
  });
});
