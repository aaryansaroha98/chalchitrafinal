import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Helper function to render App with Router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

test('renders Chalchitra app without crashing', () => {
  renderWithRouter(<App />);
  // Check if the app renders without throwing errors
  expect(document.body).toBeInTheDocument();
});

test('renders navigation', () => {
  renderWithRouter(<App />);
  // Check if navigation is present (assuming it has a navbar)
  const navElement = screen.getByRole('navigation');
  expect(navElement).toBeInTheDocument();
});
