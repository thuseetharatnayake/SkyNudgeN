import { useEffect, useState } from 'react';
import { toastEvent } from '../../lib/toast';

export function Toast(): JSX.Element | null {
  const [message, setMessage] = useState('');

  useEffect(() => {
    let timeout: number | undefined;
    const onToast = (event: Event): void => {
      setMessage((event as CustomEvent<string>).detail);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setMessage(''), 2600);
    };
    window.addEventListener(toastEvent, onToast);
    return () => { window.removeEventListener(toastEvent, onToast); window.clearTimeout(timeout); };
  }, []);

  return message ? <div className="app-toast" role="status">{message}</div> : null;
}