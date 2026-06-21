import './login-modal.css';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useI18n } from '@/hooks/useI18n';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth';
import { IconArrowLeft, IconLogo, IconAlertCircle } from '../icons';

gsap.registerPlugin(useGSAP);

type Mode = 'login' | 'signup';

/** i18n keys for the auth error states (subset of I18nKey). */
type AuthErrorKey =
  | 'login.error.invalid_credentials'
  | 'login.error.network'
  | 'signup.error.email_taken'
  | 'signup.error.password_mismatch';

export interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

/** Map a Supabase auth error message to a localized i18n key. */
function mapAuthError(mode: Mode, message: string | undefined): AuthErrorKey {
  const m = (message ?? '').toLowerCase();
  if (m.includes('network') || m.includes('fetch')) return 'login.error.network';
  if (mode === 'signup') {
    if (m.includes('already') || m.includes('registered') || m.includes('exists')) {
      return 'signup.error.email_taken';
    }
    return 'login.error.network';
  }
  return 'login.error.invalid_credentials';
}

/**
 * LoginModal — email/password sign-in + sign-up (accounts-cloud-sync Phase A.3).
 * Visual source of truth: docs/design-artifacts/login-modal.html (approved).
 * Overlay always mounted (like SettingsOverlay); GSAP drives the open/panel/error/
 * mode-swap motion with a prefers-reduced-motion fallback. Every string via i18n,
 * every colour via tokens. Google OAuth is a disabled placeholder (not wired).
 */
export function LoginModal({ open, onClose }: LoginModalProps) {
  const { t } = useI18n();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset transient state + focus the email field whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setErrorKey(null);
    setSubmitting(false);
    emailRef.current?.focus();
  }, [open]);

  // Escape closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Open/close: overlay fade (0.20s) + panel slide-up translateY(8→0) (0.22s).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(overlayRef.current, { opacity: open ? 1 : 0 });
        gsap.set(panelRef.current, { opacity: open ? 1 : 0, y: 0 });
      });
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (open) {
          gsap.to(overlayRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out' });
          gsap.fromTo(
            panelRef.current,
            { y: 8, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' },
          );
        } else {
          gsap.to(overlayRef.current, { opacity: 0, duration: 0.15, ease: 'power2.out' });
          gsap.to(panelRef.current, { opacity: 0, y: 8, duration: 0.15, ease: 'power2.out' });
        }
      });
      return () => mm.revert();
    },
    { scope: overlayRef, dependencies: [open] },
  );

  // Mode-swap crossfade (login ↔ signup): simple opacity fade-in (0.12s).
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (bodyRef.current) {
          gsap.from(bodyRef.current, { opacity: 0, duration: 0.12, ease: 'power2.out' });
        }
      });
      return () => mm.revert();
    },
    { scope: overlayRef, dependencies: [mode] },
  );

  // Error appear: height 0→auto + opacity expand (0.18s).
  useGSAP(
    () => {
      if (!errorKey || !errorRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(errorRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.18,
          ease: 'power2.out',
        });
      });
      return () => mm.revert();
    },
    { scope: overlayRef, dependencies: [errorKey] },
  );

  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setErrorKey(null);
    setConfirm('');
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setErrorKey(null);
      if (mode === 'signup' && password !== confirm) {
        setErrorKey('signup.error.password_mismatch');
        return;
      }
      setSubmitting(true);
      try {
        const res =
          mode === 'login'
            ? await signInWithEmail(email, password)
            : await signUpWithEmail(email, password);
        if (res.error) {
          setErrorKey(mapAuthError(mode, res.error.message));
        } else {
          onClose();
        }
      } catch {
        setErrorKey('login.error.network');
      } finally {
        setSubmitting(false);
      }
    },
    [mode, email, password, confirm, submitting, onClose],
  );

  const isLogin = mode === 'login';

  return (
    <div className="nib-login-overlay" data-open={open} ref={overlayRef}>
      <div className="nib-login__scrim" aria-hidden="true" onClick={onClose} />

      <div
        className="nib-login__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(isLogin ? 'login.title' : 'signup.title')}
      >
        {/* Header — Back + heading (by mode) */}
        <div className="nib-login__header">
          <button
            type="button"
            className="nib-login__back"
            title={t('library.cancel')}
            aria-label={t('library.cancel')}
            onClick={onClose}
          >
            <IconArrowLeft width={18} height={18} />
          </button>
          <span className="nib-login__heading-wrap">
            {t(isLogin ? 'login.title' : 'signup.title')}
          </span>
        </div>

        {/* Body — re-rendered per mode for the crossfade */}
        <div className="nib-login__body" ref={bodyRef} key={mode}>
          <div className="nib-login__welcome">
            <span className="nib-login__logo" aria-hidden="true">
              <IconLogo width={36} height={36} />
            </span>
            <span className="nib-login__welcome-title">
              {t(isLogin ? 'login.welcome' : 'signup.welcome')}
            </span>
            <span className="nib-login__welcome-sub">
              {t(isLogin ? 'login.welcome_sub' : 'signup.welcome_sub')}
            </span>
          </div>

          <form className="nib-login__form" onSubmit={handleSubmit} noValidate>
            <label className="nib-settings-field">
              <span className="nib-settings-field__label">{t('login.email_label')}</span>
              <input
                ref={emailRef}
                type="email"
                className="nib-settings-field__input"
                placeholder={t('login.email_placeholder')}
                value={email}
                autoComplete="email"
                aria-required="true"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="nib-settings-field">
              <span className="nib-settings-field__label">{t('login.password_label')}</span>
              <input
                type="password"
                className="nib-settings-field__input"
                placeholder={t('login.password_placeholder')}
                value={password}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                aria-required="true"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {!isLogin && (
              <label className="nib-settings-field">
                <span className="nib-settings-field__label">
                  {t('signup.confirm_password_label')}
                </span>
                <input
                  type="password"
                  className="nib-settings-field__input"
                  placeholder={t('signup.confirm_password_placeholder')}
                  value={confirm}
                  autoComplete="new-password"
                  aria-required="true"
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}

            {isLogin && (
              <button type="button" className="nib-login__forgot">
                {t('login.forgot_password')}
              </button>
            )}

            {errorKey && (
              <div
                className="nib-login__error"
                ref={errorRef}
                role="alert"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="nib-login__error-icon" aria-hidden="true">
                  <IconAlertCircle width={15} height={15} />
                </span>
                <span>{t(errorKey)}</span>
              </div>
            )}

            <button type="submit" className="nib-login__submit" disabled={submitting}>
              {t(isLogin ? 'login.submit' : 'signup.submit')}
            </button>

            <div className="nib-login__mode-toggle">
              <span>{t(isLogin ? 'login.toggle_to_signup' : 'signup.toggle_to_login')}</span>
              <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')}>
                {t(isLogin ? 'login.toggle_to_signup_action' : 'signup.toggle_to_login_action')}
              </button>
            </div>
          </form>

          {/* Shared footer: OR divider + disabled Google OAuth placeholder */}
          <div className="nib-login__shared-footer">
            <div className="nib-login__divider" aria-hidden="true">
              <span className="nib-login__divider-line" />
              <span className="nib-login__divider-text">{t('login.divider')}</span>
              <span className="nib-login__divider-line" />
            </div>
            <button
              type="button"
              className="nib-login__oauth-btn"
              disabled
              aria-disabled="true"
              title={t('settings.nav.coming_soon')}
            >
              <span className="nib-login__oauth-icon" aria-hidden="true">
                G
              </span>
              <span>{t('login.google')}</span>
              <span className="nib-login__oauth-badge">{t('settings.nav.coming_soon')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
