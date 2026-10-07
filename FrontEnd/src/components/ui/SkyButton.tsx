import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SkyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'gradient' | 'secondary' | 'text' | 'danger';
  fullWidth?: boolean;
}

export function SkyButton({ children, variant = 'primary', fullWidth = true, className = '', type = 'button', ...props }: SkyButtonProps): JSX.Element {
  return <button {...props} type={type} className={`sky-button sky-button--${variant}${fullWidth ? ' sky-button--full' : ''} ${className}`.trim()}>{children}</button>;
}