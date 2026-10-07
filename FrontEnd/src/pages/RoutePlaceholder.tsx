interface RoutePlaceholderProps { eyebrow: string; title: string; description: string; }
export function RoutePlaceholder({ eyebrow, title, description }: RoutePlaceholderProps): JSX.Element {
  return <div className="screen-page screen-page--centered"><div className="page-stack"><div><p className="page-eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-copy">{description}</p><p className="placeholder-note">This route is connected and will receive its complete screen in the scheduled phase.</p></div></div></div>;
}