import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector) => {
    const store = {
      login: mockLogin,
      loginAsGuest: vi.fn(),
    };
    return selector ? selector(store) : store;
  },
}));

vi.mock('convex/react', () => ({
  useMutation: () => vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    usuarios: {
      create: vi.fn(),
      register: vi.fn(),
      authenticate: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<LoginPage />);
    expect(screen.getByText('SIGS Web')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu.email@exemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('switches to register tab when clicking Cadastrar', () => {
    render(<LoginPage />);
    const registerTab = screen.getByRole('button', { name: /cadastrar/i });
    fireEvent.click(registerTab);

    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repita sua senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
  });
});
