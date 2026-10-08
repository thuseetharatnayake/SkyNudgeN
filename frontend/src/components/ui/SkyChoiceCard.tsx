import type { ReactNode } from 'react';

interface SkyChoiceCardProps { title: string; description?: string; icon?: ReactNode; selected: boolean; onClick: () => void; disabled?: boolean; }

export function SkyChoiceCard({ title, description, icon, selected, onClick, disabled = false }: SkyChoiceCardProps): JSX.Element {
  return <button type="button" className={`sky-choice-card${selected ? ' sky-choice-card--selected' : ''}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>{icon ? <span className="sky-choice-card__icon">{icon}</span> : null}<span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span></button>;
}