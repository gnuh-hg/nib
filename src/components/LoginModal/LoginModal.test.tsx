import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@/providers/I18nProvider';
import { LoginModal } from './LoginModal';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth';

// Stub the auth module so no network call happens and we can assert calls.
vi.mock('@/lib/auth', () => ({
  signInWithEmail: vi.fn(async () => ({ data: {}, error: null })),
  signUpWithEmail: vi.fn(async () => ({ data: {}, error: null })),
}));

function setup(open = true) {
  const onClose = vi.fn();
  render(
    <I18nProvider>
      <LoginModal open={open} onClose={onClose} />
    </I18nProvider>,
  );
  return { onClose };
}

beforeEach(() => {
  vi.mocked(signInWithEmail).mockClear();
  vi.mocked(signUpWithEmail).mockClear();
  localStorage.clear();
});

describe('LoginModal', () => {
  it('renders the login form (email + password + submit)', () => {
    setup();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy();
  });

  it('toggles to signup mode (shows confirm password + create-account CTA)', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(screen.getByLabelText('Confirm password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeTruthy();
  });

  it('submitting login calls signInWithEmail with the entered credentials', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Email'), 'ada@nib.app');
    await user.type(screen.getByLabelText('Password'), 'secretpw');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() =>
      expect(signInWithEmail).toHaveBeenCalledWith('ada@nib.app', 'secretpw'),
    );
  });

  it('signup with mismatched passwords shows an error and does NOT call signUp', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    await user.type(screen.getByLabelText('Email'), 'ada@nib.app');
    await user.type(screen.getByLabelText('Password'), 'aaaaaa');
    await user.type(screen.getByLabelText('Confirm password'), 'bbbbbb');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(signUpWithEmail).not.toHaveBeenCalled();
  });

  it('closes when the scrim/back is used (onClose fired)', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
