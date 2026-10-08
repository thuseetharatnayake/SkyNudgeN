export const momentsUpdatedEvent = 'skynudge:moments-updated';

export function notifyMomentsUpdated(): void {
  window.dispatchEvent(new Event(momentsUpdatedEvent));
}