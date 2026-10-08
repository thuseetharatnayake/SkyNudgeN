import type { ReactNode } from 'react';
interface PhoneFrameProps { children: ReactNode; }
export function PhoneFrame({ children }: PhoneFrameProps): JSX.Element { return <div className="app-stage"><div className="phone-frame">{children}</div></div>; }