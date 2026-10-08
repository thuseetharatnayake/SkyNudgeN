import { SkyIcon } from '../ui/SkyIcon';

interface LaunchScreenProps {
  isLeaving: boolean;
  onSkip: () => void;
}

export function LaunchScreen({ isLeaving, onSkip }: LaunchScreenProps): JSX.Element {
  return <div className={`launch-screen${isLeaving ? ' launch-screen--leaving' : ''}`} role="presentation" onPointerDown={onSkip} onKeyDown={onSkip} tabIndex={0} aria-label="SkyNudge launch screen">
    <span className="launch-screen__ring launch-screen__ring--one" aria-hidden="true" />
    <span className="launch-screen__ring launch-screen__ring--two" aria-hidden="true" />
    <span className="launch-screen__star"><SkyIcon name="other" size={96} strokeWidth={1.7} /></span>
  </div>;
}