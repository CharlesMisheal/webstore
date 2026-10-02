import { describe, it, expect } from 'vitest';
import { getAdminAllowList, isAdminSessionExpired, isEmailAllowedAdmin, ADMIN_IDLE_MS, ADMIN_ABSOLUTE_MS } from '../lib/admin-guard';

const env = 'henryaplus82@gmail.com, Staff@Example.com';

describe('Admin allow-list', () => {
  it('parses, trims and lower-cases ADMIN_EMAILS', () => {
    expect(getAdminAllowList(env)).toEqual(['henryaplus82@gmail.com', 'staff@example.com']);
  });

  it('has NO default owner when ADMIN_EMAILS is missing (fail closed)', () => {
    expect(getAdminAllowList('')).toEqual([]);
    expect(isEmailAllowedAdmin('henryaplus82@gmail.com', '')).toBe(false);
  });

  it('allows listed emails case-insensitively', () => {
    expect(isEmailAllowedAdmin('henryaplus82@gmail.com', env)).toBe(true);
    expect(isEmailAllowedAdmin('HenryAplus82@GMAIL.COM', env)).toBe(true);
    expect(isEmailAllowedAdmin('staff@example.com', env)).toBe(true);
  });

  it('rejects unlisted, empty and null emails', () => {
    expect(isEmailAllowedAdmin('customer@random.com', env)).toBe(false);
    expect(isEmailAllowedAdmin('imposter@hacker.io', env)).toBe(false);
    expect(isEmailAllowedAdmin('', env)).toBe(false);
    expect(isEmailAllowedAdmin(null, env)).toBe(false);
    expect(isEmailAllowedAdmin(undefined, env)).toBe(false);
  });
});

describe('Admin session timers', () => {
  const now = 1_700_000_000_000;

  it('is valid inside the idle and absolute windows', () => {
    expect(isAdminSessionExpired(now - 5 * 60_000, now - 60 * 60_000, now)).toBeNull();
  });

  it('expires after 30 minutes idle', () => {
    expect(isAdminSessionExpired(now - ADMIN_IDLE_MS - 1, now - 60 * 60_000, now)).toBe('idle');
  });

  it('expires after the absolute lifetime even when active', () => {
    expect(isAdminSessionExpired(now - 1_000, now - ADMIN_ABSOLUTE_MS - 1, now)).toBe('absolute');
  });

  it('treats missing timer cookies as a fresh session (callback/middleware set them)', () => {
    expect(isAdminSessionExpired(null, null, now)).toBeNull();
  });
});
