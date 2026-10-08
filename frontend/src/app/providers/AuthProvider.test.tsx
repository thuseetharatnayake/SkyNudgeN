import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { ApiContext } from './apiContext';
import { useAuth } from './useAuth';
import type { SkyNudgeApi } from '../../data';

function AuthState(): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  return <p>{isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'anonymous'}</p>;
}

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('AuthProvider', () => {
  it('forces an anonymous resolved state after four seconds when initial session lookup hangs', async () => {
    vi.useFakeTimers();
    const api = { getMyProfile: vi.fn(() => new Promise(() => undefined)) } as unknown as SkyNudgeApi;
    render(<ApiContext.Provider value={api}><AuthProvider><AuthState /></AuthProvider></ApiContext.Provider>);
    expect(screen.getByText('loading')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(4_000); });
    expect(screen.getByText('anonymous')).toBeInTheDocument();
  });

  it('does not let a late initial session result overwrite the four-second fallback', async () => {
    vi.useFakeTimers();
    let resolveProfile: (value: { id: string } | null) => void = () => undefined;
    const api = { getMyProfile: vi.fn(() => new Promise<{ id: string } | null>((resolve) => { resolveProfile = resolve; })) } as unknown as SkyNudgeApi;
    render(<ApiContext.Provider value={api}><AuthProvider><AuthState /></AuthProvider></ApiContext.Provider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(4_000); });
    resolveProfile({ id: 'late-user' });
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('anonymous')).toBeInTheDocument();
  });
});