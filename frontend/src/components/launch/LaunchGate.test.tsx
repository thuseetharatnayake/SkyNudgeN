import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../../app/providers/authContext';
import { LaunchGate } from './LaunchGate';

function Location(): JSX.Element { return <p data-testid="location">{useLocation().pathname}</p>; }

function renderGate({ isAuthenticated = false, isLoading = false, reducedMotion = false }: { isAuthenticated?: boolean; isLoading?: boolean; reducedMotion?: boolean } = {}) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({ matches: reducedMotion })));
  return render(<MemoryRouter initialEntries={['/login']}><AuthContext.Provider value={{ isAuthenticated, isLoading, refreshAuth: vi.fn().mockResolvedValue(undefined) }}><LaunchGate><Routes><Route path="*" element={<Location />} /></Routes></LaunchGate></AuthContext.Provider></MemoryRouter>);
}

async function advance(milliseconds: number): Promise<void> {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

async function settleLazyScreen(): Promise<void> {
  await act(async () => { await vi.dynamicImportSettled(); });
}

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('LaunchGate', () => {
  it('waits for its minimum duration then sends an authenticated start to home', async () => {
    vi.useFakeTimers();
    renderGate({ isAuthenticated: true });
    await settleLazyScreen();
    expect(screen.getByLabelText('SkyNudge launch screen')).toBeInTheDocument();
    await advance(1_899);
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
    await advance(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/home');
    await advance(550);
    expect(screen.queryByLabelText('SkyNudge launch screen')).not.toBeInTheDocument();
  });

  it('keeps an unauthenticated start on login and completes after the splash', async () => {
    vi.useFakeTimers();
    renderGate();
    await settleLazyScreen();
    await advance(1_900);
    await advance(550);
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
    expect(screen.queryByLabelText('SkyNudge launch screen')).not.toBeInTheDocument();
  });

  it('allows a user to skip the waiting period once session resolution has finished', async () => {
    vi.useFakeTimers();
    renderGate();
    await settleLazyScreen();
    fireEvent.pointerDown(screen.getByLabelText('SkyNudge launch screen'));
    await advance(550);
    expect(screen.queryByLabelText('SkyNudge launch screen')).not.toBeInTheDocument();
  });

  it('does not finish until a loading session resolves, including after the timing cap', async () => {
    vi.useFakeTimers();
    renderGate({ isLoading: true });
    await settleLazyScreen();
    await advance(4_500);
    expect(screen.getByLabelText('SkyNudge launch screen')).toBeInTheDocument();
  });

  it('uses the shorter reduced-motion minimum duration', async () => {
    vi.useFakeTimers();
    renderGate({ reducedMotion: true });
    await settleLazyScreen();
    await advance(899);
    expect(screen.getByLabelText('SkyNudge launch screen')).toBeInTheDocument();
    await advance(1);
    await advance(550);
    expect(screen.queryByLabelText('SkyNudge launch screen')).not.toBeInTheDocument();
  });

  it('does not replay the launch screen after authentication changes to logged out', async () => {
    vi.useFakeTimers();
    const view = renderGate({ isAuthenticated: true });
    await settleLazyScreen();
    await advance(1_900);
    await advance(550);
    expect(screen.queryByLabelText('SkyNudge launch screen')).not.toBeInTheDocument();
    view.rerender(<MemoryRouter initialEntries={['/login']}><AuthContext.Provider value={{ isAuthenticated: false, isLoading: false, refreshAuth: vi.fn().mockResolvedValue(undefined) }}><LaunchGate><Routes><Route path="*" element={<Location />} /></Routes></LaunchGate></AuthContext.Provider></MemoryRouter>);
    expect(screen.queryByLabelText('SkyNudge launch screen')).not.toBeInTheDocument();
  });
});