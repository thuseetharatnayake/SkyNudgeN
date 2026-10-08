import { useState } from 'react';
import { useSkyNudgeApi } from '../../app/providers/useSkyNudgeApi';
import { notifyMomentsUpdated } from '../../lib/momentUpdates';
import { showToast } from '../../lib/toast';
import type { Nudge } from '../../types/sky';
import { SkyIcon } from '../ui/SkyIcon';

interface SaveNudgeButtonProps {
  nudge: Nudge;
  canSave?: boolean;
  className?: string;
}

function hasEnded(nudge: Nudge): boolean {
  const expiresAt = nudge.expires_at ? Date.parse(nudge.expires_at) : Date.parse(nudge.created_at) + 30 * 60_000;
  return expiresAt <= Date.now();
}

export function SaveNudgeButton({ nudge, canSave = true, className = 'sky-button sky-button--secondary sky-button--full' }: SaveNudgeButtonProps): JSX.Element | null {
  const api = useSkyNudgeApi();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const ended = hasEnded(nudge);

  async function save(): Promise<void> {
    setError('');
    setIsSaving(true);
    try {
      await api.saveNudgeAsMoment(nudge.id);
      await api.getMyMoments();
      notifyMomentsUpdated();
      setIsSaved(true);
      showToast('Saved to My Sky Moments.');
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (ended) return <p className="save-nudge__ended" role="status">This SkyNudge has ended, so it can't be saved.</p>;
  if (!canSave) return null;
  if (isSaved) return <button className={`${className} save-nudge__saved`} type="button" disabled><SkyIcon name="check" size={20} strokeWidth={2.4} />Saved privately</button>;
  return <div className="save-nudge"><button className={className} type="button" disabled={isSaving} onClick={() => void save()}>{isSaving ? 'Saving…' : 'Save to My Sky Moments'}</button>{error ? <p role="alert">{error}</p> : null}</div>;
}