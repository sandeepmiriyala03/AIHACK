import { render, screen } from '@testing-library/react';
import RootLayout from './layout'; // adjust import path as needed


describe('RootLayout', () => {
  test('renders children and Footer component', () => {
    const childText = 'OCR ';
    render(
      <RootLayout>
        <div>{childText}</div>
      </RootLayout>
    );

    expect(screen.getByText(childText)).toBeInTheDocument();

  });

  
    
  
});
