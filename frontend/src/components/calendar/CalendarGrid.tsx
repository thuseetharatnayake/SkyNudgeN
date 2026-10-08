import { getDayThumbs } from '../../lib/getDayThumbs';
import { demoSkyImage } from '../../lib/demoSky';
import { getMonthOffset, localDateKey, monthLegend } from '../../lib/moments';
import type { SkyMoment } from '../../types/sky';

interface CalendarGridProps {
  year: number;
  month: number;
  moments: SkyMoment[];
  photosByDay: Record<string, string[]>;
  onSelectDay: (isoDate: string) => void;
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarGrid({ year, month, moments, photosByDay, onSelectDay }: CalendarGridProps): JSX.Element {
  const offset = getMonthOffset(year, month);
  const dayCount = new Date(year, month + 1, 0).getDate();
  const today = localDateKey(new Date());
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthMoments = moments.filter((moment) => localDateKey(moment.occurred_at).startsWith(monthPrefix)).sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
  const momentsByDay = monthMoments.reduce<Record<string, SkyMoment[]>>((days, moment) => {
    const date = localDateKey(moment.occurred_at);
    (days[date] ??= []).push(moment);
    return days;
  }, {});
  const photoCount = monthMoments.reduce((total, moment) => total + Math.max(moment.photo_urls.length, 1), 0);

  return <section className="moments-calendar" aria-label="Sky moments calendar">
    <div className="moments-calendar__grid">{weekdays.map((day) => <span key={day} className="moments-calendar__weekday">{day}</span>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}{Array.from({ length: dayCount }, (_, index) => {
      const day = index + 1;
      const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const dayMoments = momentsByDay[date] ?? [];
      const orderedPhotos = dayMoments.flatMap((moment) => moment.photo_urls.length > 0 ? moment.photo_urls : [demoSkyImage(moment.category)]);
      const photos = getDayThumbs(orderedPhotos.length > 0 ? orderedPhotos : photosByDay[date] ?? []);
      const className = `moments-calendar__day ${dayMoments.length > 0 ? 'moments-calendar__day--has' : 'moments-calendar__day--empty'}${date === today ? ' moments-calendar__day--today' : ''}`;
      if (dayMoments.length === 0) return <span key={date} className={className}>{day}</span>;
      const photoLabel = orderedPhotos.length;
      return <button key={date} className={className} type="button" onClick={() => onSelectDay(date)} aria-label={`${day} ${new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1))}, ${dayMoments.length} moment${dayMoments.length === 1 ? '' : 's'}, ${photoLabel} photo${photoLabel === 1 ? '' : 's'}`}><span className={`moments-calendar__thumbs ${photos.layout}`}>{photos.urls.map((url, photoIndex) => <i key={`${url}-${photoIndex}`} style={{ backgroundImage: `url("${url}")` }} />)}</span><span className="moments-calendar__number">{day}</span></button>;
    })}</div>
    <p className="moments-calendar__legend"><i aria-hidden="true" />{monthLegend(monthMoments.length, photoCount)}</p>
  </section>;
}
