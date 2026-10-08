import { describe, expect, it } from 'vitest';

const routeFallbacks = {
  feed: '/home',
  calendar: '/home',
  selectedDay: '/moments/calendar',
  activeMoment: '/moments',
  createNudge: '/home',
  nudgeDetails: '/nudge/new',
  nudgeSuccess: '/home',
  account: '/home',
  settings: '/account',
  verification: '/account',
  verificationForm: '/verification',
  signUp: '/login',
  welcome: '/home',
  notFound: '/home',
} as const;

describe('TopBar route fallback table', () => {
  it('keeps every non-home/login screen mapped to its approved fallback', () => {
    expect(routeFallbacks).toEqual({ feed: '/home', calendar: '/home', selectedDay: '/moments/calendar', activeMoment: '/moments', createNudge: '/home', nudgeDetails: '/nudge/new', nudgeSuccess: '/home', account: '/home', settings: '/account', verification: '/account', verificationForm: '/verification', signUp: '/login', welcome: '/home', notFound: '/home' });
  });
});