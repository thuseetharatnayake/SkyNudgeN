import { useMemo, useState } from 'react';
import { demoSkyImage, isDemoSkyImage } from '../../lib/demoSky';
import { formatMomentDateTime } from '../../lib/moments';
import type { SkyMoment } from '../../types/sky';
import { SkyIcon } from '../ui/SkyIcon';

interface MomentEntryProps { moment: SkyMoment; onOpen?: () => void; }

function categoryLabel(category: SkyMoment['category']): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function MomentEntry({ moment, onOpen }: MomentEntryProps): JSX.Element {
  const photos = useMemo(() => moment.photo_urls.length > 0 ? moment.photo_urls : [demoSkyImage(moment.category)], [moment.category, moment.photo_urls]);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const hero = photos[selectedPhoto] ?? photos[0];
  const details = [`Look ${moment.direction}`, moment.landmark].filter(Boolean).join(' \u00b7 ');
  return <article className="moment-entry moment-card" onClick={onOpen}>
    <div className="moment-card__hero"><img src={hero} alt={`${categoryLabel(moment.category)} at ${moment.location_label}`} />{isDemoSkyImage(hero) ? <span className="moment-card__demo-pill">DEMO PHOTO</span> : null}</div>
    <div className="moment-card__strip" aria-label="Moment photos">{photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" className={index === selectedPhoto ? 'is-selected' : ''} aria-label={`Show photo ${index + 1}`} aria-pressed={index === selectedPhoto} onClick={(event) => { event.stopPropagation(); setSelectedPhoto(index); }}><img src={photo} alt="" /></button>)}</div>
    <div className="moment-card__meta"><span className="moment-card__category"><SkyIcon name={moment.category} size={20} /><strong>{categoryLabel(moment.category)}</strong></span><time dateTime={moment.occurred_at}>{formatMomentDateTime(moment.occurred_at)}</time></div>
    <p className="moment-card__place"><SkyIcon name="location" size={16} strokeWidth={1.8} />{moment.location_label}</p>
    {details ? <p className="moment-card__look">{details}</p> : null}
    {moment.notes ? <p className="moment-card__note">{moment.notes}</p> : null}
  </article>;
}
