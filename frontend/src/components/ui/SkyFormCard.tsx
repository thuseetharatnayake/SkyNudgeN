import type { ReactNode } from 'react';

interface SkyFormCardProps { children: ReactNode; className?: string; }
export function SkyFormCard({ children, className = '' }: SkyFormCardProps): JSX.Element { return <section className={`sky-form-card ${className}`.trim()}>{children}</section>; }