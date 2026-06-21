import { useI18n } from '@/hooks/useI18n';
import { useProfile } from '@/providers/ProfileProvider';

/**
 * Account section — UI-only local profile (no auth/backend, settings-redesign).
 * Avatar = initials auto-derived from displayName, colour auto-hashed (stable).
 * "Change photo" is disabled with a "coming soon" badge (upload = post-MVP).
 */
export function AccountSection() {
  const { t } = useI18n();
  const { profile, setDisplayName, setEmail } = useProfile();

  // Since Phase A, profile is null when signed out (guest). The signed-out
  // state (sign-in form) is rendered by LoginModal — wired in the next A.3-UI
  // task. Until then, render nothing rather than crash on a null profile.
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
    </div>
  );
}
