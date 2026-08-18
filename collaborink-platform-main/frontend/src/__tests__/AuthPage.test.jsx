import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AuthPage from '../pages/AuthPage';

// vi.hoisted() ensures these are available inside vi.mock() factories (which are hoisted)
const { mockLogin, mockSignup, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockSignup: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({ login: mockLogin, signup: mockSignup, user: null }),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()],
  };
});

function renderAuth() {
  return render(<MemoryRouter><AuthPage /></MemoryRouter>);
}

// The submit button shares the text "Login" with the toggle button.
// Use container.querySelector to target the submit button specifically.
function getSubmitButton(container) {
  return container.querySelector('button[type="submit"]');
}

describe('AuthPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockSignup.mockReset();
    mockNavigate.mockReset();
  });

  describe('Login mode (default)', () => {
    it('renders email input in login mode', () => {
      renderAuth();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });

    it('renders password input (bullet placeholder)', () => {
      renderAuth();
      expect(document.querySelector('[name="password"]')).toBeInTheDocument();
    });

    it('does NOT show firstName/lastName in login mode', () => {
      renderAuth();
      expect(screen.queryByPlaceholderText('John')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Doe')).not.toBeInTheDocument();
    });

    it('shows Login submit button', () => {
      const { container } = renderAuth();
      expect(getSubmitButton(container)).toBeInTheDocument();
      expect(getSubmitButton(container).textContent).toMatch(/login/i);
    });

    it('shows "Email is required" when form submitted empty', async () => {
      const { container } = renderAuth();
      // Submit with no fields filled — email is empty by default
      fireEvent.click(getSubmitButton(container));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('calls login with email and password on valid submit', async () => {
      mockLogin.mockResolvedValueOnce({});
      const { container } = renderAuth();

      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'user@example.com', name: 'email' },
      });
      fireEvent.change(document.querySelector('[name="password"]'), {
        target: { value: 'Password123', name: 'password' },
      });
      fireEvent.click(getSubmitButton(container));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'Password123');
      });
    });

    it('navigates to /dashboard on successful login', async () => {
      mockLogin.mockResolvedValueOnce({});
      const { container } = renderAuth();

      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'user@example.com', name: 'email' },
      });
      fireEvent.change(document.querySelector('[name="password"]'), {
        target: { value: 'Password123', name: 'password' },
      });
      fireEvent.click(getSubmitButton(container));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Signup mode', () => {
    function switchToSignup() {
      const { container } = renderAuth();
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      return { container };
    }

    it('shows firstName and lastName inputs in signup mode', () => {
      switchToSignup();
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
    });

    it('shows two password fields in signup mode', () => {
      switchToSignup();
      const passwordFields = document.querySelectorAll('[name="password"], [name="confirmPassword"]');
      expect(passwordFields.length).toBe(2);
    });

    it('shows password length error for short password', async () => {
      const { container } = switchToSignup();
      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'test@test.com', name: 'email' },
      });
      fireEvent.change(document.querySelector('[name="password"]'), {
        target: { value: '123', name: 'password' },
      });
      fireEvent.click(getSubmitButton(container));

      await waitFor(() => {
        expect(screen.getByText(/at least 6/i)).toBeInTheDocument();
      });
    });

    it('calls signup with correct data on valid form', async () => {
      mockSignup.mockResolvedValueOnce({});
      const { container } = switchToSignup();

      fireEvent.change(screen.getByPlaceholderText('John'), {
        target: { value: 'Test', name: 'firstName' },
      });
      fireEvent.change(screen.getByPlaceholderText('Doe'), {
        target: { value: 'User', name: 'lastName' },
      });
      fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
        target: { value: 'new@example.com', name: 'email' },
      });
      fireEvent.change(document.querySelector('[name="password"]'), {
        target: { value: 'Password123', name: 'password' },
      });
      fireEvent.change(document.querySelector('[name="confirmPassword"]'), {
        target: { value: 'Password123', name: 'confirmPassword' },
      });

      fireEvent.click(getSubmitButton(container));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'new@example.com', firstName: 'Test', lastName: 'User' })
        );
      });
    });
  });
});
