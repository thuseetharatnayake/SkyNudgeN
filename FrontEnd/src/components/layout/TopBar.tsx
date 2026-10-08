import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkyIcon } from '../ui/SkyIcon';

interface TopBarProps {
  backTo?: string | -1;
  onBack?: () => void;
  right?: ReactNode;
  hideBack?: boolean;
}

export function TopBar({ backTo = '/home', onBack, right, hideBack = false }: TopBarProps): JSX.Element {
  const navigate = useNavigate();

  function handleBack(): void {
    if (onBack) {
      onBack();
      return;
    }
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(backTo === -1 ? '/home' : backTo, { replace: true });
  }

  return <header className="topbar">
    {hideBack ? <span className="topbar__spacer" aria-hidden="true" /> : <button className="topbar__back" type="button" aria-label="Back" onClick={handleBack}><SkyIcon name="chevron-left" size={24} strokeWidth={2} /></button>}
    {right ? <div className="topbar__right">{right}</div> : <span className="topbar__spacer" aria-hidden="true" />}
  </header>;
}