import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/providers/I18nProvider';
import { ProfileProvider } from '@/providers/ProfileProvider';
import { AccountChip } from './AccountChip';

// supabase is mocked package-level in src/test/setup.ts → getSession() yields no
// session, so ProfileProvider.profile stays null (signed-out) here.

beforeEach(() => {
  localStorage.clear();
});

describe('AccountChip (signed out)', () => {
  it('renders a sign-in button that opens the login modal', async () => {
    const user = userEvent.setup();
    const onOpenLogin = vi.fn();
    render(
      <I18nProvider>
        <ProfileProvider>
          <AccountChip onOpenLogin={onOpenLogin} />
        </ProfileProvider>
      </I18nProvider>,
    );
    const btn = screen.getByRole('button', { name: 'Sign in' });
    await user.click(btn);
    expect(onOpenLogin).toHaveBeenCalledTimes(1);
  });
});
