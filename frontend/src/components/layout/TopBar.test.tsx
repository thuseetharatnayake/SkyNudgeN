import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';

function Location(): JSX.Element { return <p data-testid="location">{useLocation().pathname}</p>; }
function renderTopBar(backTo = '/home', onBack?: () => void): void {
  render(<MemoryRouter initialEntries={['/current']}><Routes><Route path="*" element={<><TopBar backTo={backTo} onBack={onBack} /><Location /></>} /></Routes></MemoryRouter>);
}

afterEach(cleanup);

describe('TopBar', () => {
  it('uses its fallback route for a direct entry', () => {
    renderTopBar('/account');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/account');
  });

  it('is keyboard focusable and activates a supplied back callback', () => {
    const onBack = vi.fn();
    renderTopBar('/home', onBack);
    const back = screen.getByRole('button', { name: 'Back' });
    back.focus();
    expect(document.activeElement).toBe(back);
    fireEvent.click(back);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('does not render a back button when hidden', () => {
    render(<MemoryRouter><TopBar hideBack /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });
});