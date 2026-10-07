import { useId, type InputHTMLAttributes } from 'react';

interface SkyFieldProps extends InputHTMLAttributes<HTMLInputElement> { label: string; hint?: string; }

export function SkyField({ label, hint, id, className = '', ...props }: SkyFieldProps): JSX.Element {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return <label className="sky-field" htmlFor={fieldId}><span className="sky-field__label">{label}</span><input {...props} id={fieldId} className={`sky-field__input ${className}`.trim()} />{hint ? <span className="sky-field__hint">{hint}</span> : null}</label>;
}