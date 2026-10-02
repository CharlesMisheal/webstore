import { describe, it, expect } from 'vitest';
import { isEmailAllowedAdmin, requireAdmin } from '../lib/admin-guard';

describe('Admin Authorization Guard', () => {
  it('allows owner email from allow-list', () => {
    expect(isEmailAllowedAdmin('henryaplus82@gmail.com')).toBe(true);
    // Case-insensitivity check
    expect(isEmailAllowedAdmin('HenryAplus82@GMAIL.COM')).toBe(true);
  });

  it('rejects unlisted emails', () => {
    expect(isEmailAllowedAdmin('customer@random.com')).toBe(false);
    expect(isEmailAllowedAdmin('imposter@hacker.io')).toBe(false);
    expect(isEmailAllowedAdmin('')).toBe(false);
    expect(isEmailAllowedAdmin(null)).toBe(false);
  });

  it('requireAdmin resolves for authorized owner', async () => {
    const admin = await requireAdmin('henryaplus82@gmail.com');
    expect(admin.role).toBe('owner');
    expect(admin.email).toBe('henryaplus82@gmail.com');
  });

  it('requireAdmin throws 403 HttpError for unauthorized user', async () => {
    await expect(requireAdmin('unauthorized@gmail.com')).rejects.toThrow('Access denied');
  });
});
