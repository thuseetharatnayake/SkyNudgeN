export const toastEvent = 'skynudge:toast';

export function showToast(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(toastEvent, { detail: message }));
}