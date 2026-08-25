import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('AuthStore Zustand Store', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initial state should be unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('login should set authenticated user', () => {
    const userMock = {
      id: 'usr_123',
      name: 'Fiscal Teste',
      email: 'fiscal@sigs.gov.br',
      role: 'Fiscal Sanitário',
      podeLerTodos: true,
    };

    const success = useAuthStore.getState().login(userMock);
    expect(success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(userMock);
  });

  it('loginAsGuest should set visitor user with restricted read access', () => {
    const success = useAuthStore.getState().loginAsGuest();
    expect(success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.role).toBe('Visitante');
    expect(state.user.podeLerTodos).toBe(false);
  });

  it('updateProfile should update current user fields', () => {
    useAuthStore.getState().login({
      id: 'usr_123',
      name: 'Fiscal Antigo',
      email: 'fiscal@sigs.gov.br',
    });

    useAuthStore.getState().updateProfile({
      name: 'Fiscal Novo',
    });

    const state = useAuthStore.getState();
    expect(state.user.name).toBe('Fiscal Novo');
    expect(state.user.email).toBe('fiscal@sigs.gov.br');
  });

  it('logout should reset auth state', () => {
    useAuthStore.getState().login({ id: '1', name: 'User' });
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
