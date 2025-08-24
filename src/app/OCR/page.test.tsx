import { render, screen, fireEvent } from '@testing-library/react';
import UploadPage from './page'; // adjust path as needed

describe('UploadPage Accordion Sections', () => {
  beforeEach(() => {
    render(<UploadPage />);
  });

  test('renders section headers', () => {
    expect(screen.getByRole('button', { name: /How to Use/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /What You Can Upload/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Privacy First/i })).toBeInTheDocument();
  });

  test('all sections are collapsed initially', () => {
    expect(screen.queryByText(/Click the "Choose File"/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Images \(JPG, PNG/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Your files are processed securely/i)).not.toBeInTheDocument();
  });

  test('toggles How to Use section on click', () => {
    const header = screen.getByRole('button', { name: /How to Use/i });
    fireEvent.click(header);
    expect(screen.getByText(/Click the "Choose File"/i)).toBeInTheDocument();
    fireEvent.click(header);
    expect(screen.queryByText(/Click the "Choose File"/i)).not.toBeInTheDocument();
  });

  test('toggles What You Can Upload section on keyboard Enter key', () => {
    const header = screen.getByRole('button', { name: /What You Can Upload/i });
    header.focus();
    fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
    expect(screen.getByText(/Images \(JPG, PNG/i)).toBeInTheDocument();
    fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
    expect(screen.queryByText(/Images \(JPG, PNG/i)).not.toBeInTheDocument();
  });

  test('toggles Privacy First section and shows content', () => {
    const header = screen.getByRole('button', { name: /Privacy First/i });
    fireEvent.click(header);
    expect(screen.getByText(/Your files are processed securely/i)).toBeInTheDocument();
    expect(screen.getByText(/We do not save or store/i)).toBeInTheDocument();
  });
});
