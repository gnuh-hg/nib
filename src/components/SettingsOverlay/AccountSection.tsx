import { useCallback } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useProfile } from '@/providers/ProfileProvider';
import { signOutIntentional } from '@/hooks/useSessionExpiredNotice';
import { useSettingsContext } from './settings-context';
import { IconLogOut } from '../icons';

/**
 * Account section — UI-only local profile (no auth/backend, settings-redesign).
 * Avatar = initials auto-derived from displayName, colour auto-hashed (stable).
 * "Change photo" is disabled with a "coming soon" badge (upload = post-MVP).
 */
export function AccountSection() {
  const { t } = useI18n();
  const { profile, setDisplayName, setEmail } = useProfile();
  const { onClose } = useSettingsContext();

  // Sign out (flagged intentional → suppresses the session-expired notice) and
  // close the overlay once Supabase has cleared the local session. Local
  // documents are NOT touched — IndexedDB is never deleted on sign-out.
  const handleSignOut = useCallback(async () => {
    await signOutIntentional();
    onClose();
  }, [onClose]);

  // Since Phase A, profile is null when signed out (guest). The signed-out
  // state (sign-in form) is rendered by LoginModal. Render nothing rather than
  // crash on a null profile — the Sign out button only exists when signed in.
  if (!profile) return null;

  return (
    <div className="nib-settings-account">
      <h2 className="nib-settings__section-title">{t('settings.account.title')}</h2>

      <div className="nib-settings-account__identity">
        <div
          className="nib-settings-account__avatar"
          style={{ '--avatar-color': `var(${profile.avatarColor})` } as React.CSSProperties}
          aria-hidden="true"
        >
          {profile.avatarInitials}
        </div>
        <button
          type="button"
          className="nib-settings-account__photo-btn"
          disabled
          title={t('settings.account.avatar_coming_soon')}
        >
          {t('settings.account.avatar_photo')}
          <span className="nib-settings-account__badge">
            {t('settings.account.avatar_coming_soon')}
          </span>
        </button>
      </div>

      <label className="nib-settings-field">
        <span className="nib-settings-field__label">
          {t('settings.account.display_name')}
        </span>
        <input
          type="text"
          className="nib-settings-field__input"
          value={profile.displayName}
          placeholder={t('settings.account.display_name_placeholder')}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </label>

      <label className="nib-settings-field">
        <span className="nib-settings-field__label">{t('settings.account.email')}</span>
        <input
          type="email"
          className="nib-settings-field__input"
          value={profile.email ?? ''}
          placeholder={t('settings.account.email_placeholder')}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <p className="nib-settings-account__hint">{t('settings.account.local_hint')}</p>

      <div className="nib-settings-account__actions">
        <button
          type="button"
          className="nib-settings-account__signout"
          onClick={() => void handleSignOut()}
        >
          <IconLogOut width={16} height={16} />
          <span>{t('settings.account.sign_out')}</span>
        </button>
      </div>
    </div>
  );
}
