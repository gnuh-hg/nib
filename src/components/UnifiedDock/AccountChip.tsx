import './account-chip.css';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/hooks/useI18n';
import { useProfile } from '@/providers/ProfileProvider';
import { signOutIntentional } from '@/hooks/useSessionExpiredNotice';
import { IconUser, IconLogOut } from '../icons';

export interface AccountChipProps {
  /** Open the LoginModal (used when signed out). */
  onOpenLogin: () => void;
}

const EDGE_GAP = 8;

/**
 * Account entry in the dock NAV level.
 *  - Signed out (profile === null): a plain dock button that opens the LoginModal.
 *  - Signed in: an avatar (initials + hashed swatch) that toggles a small menu
 *    showing the email + a Sign out action.
 * The menu is portal'd to <body> and clamped into the viewport (mistakes.md:
 * floating elements must always clamp — the dock is draggable to any edge).
 */
export function AccountChip({ onOpenLogin }: AccountChipProps) {
  const { t } = useI18n();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Clamp the menu into the viewport once it has measured size.
  useLayoutEffect(() => {
    if (!menuOpen || !btnRef.current || !menuRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const m = menuRef.current.getBoundingClientRect();
    let left = b.right + EDGE_GAP;
    if (left + m.width > window.innerWidth - EDGE_GAP) {
      left = b.left - m.width - EDGE_GAP; // flip to the other side
    }
    left = Math.max(EDGE_GAP, Math.min(left, window.innerWidth - m.width - EDGE_GAP));
    let top = b.top;
    top = Math.max(EDGE_GAP, Math.min(top, window.innerHeight - m.height - EDGE_GAP));
    setMenuPos({ left, top });
  }, [menuOpen]);

  // Close the menu on outside pointerdown / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !btnRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleSignOut = useCallback(() => {
    setMenuOpen(false);
    // Flagged intentional → no session-expired notice. Local docs untouched.
    void signOutIntentional();
  }, []);

  // Signed out → a dock button that opens the login modal.
  if (!profile) {
    return (
      <button
        type="button"
        className="nib-dock__btn nib-dock__navbtn"
        title={t('account.open_login')}
        aria-label={t('account.open_login')}
        onClick={onOpenLogin}
      >
        <IconUser width={18} height={18} />
      </button>
    );
  }

  // Signed in → avatar that toggles the account menu.
  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="nib-account-chip"
        title={profile.email ?? profile.displayName}
        aria-label={t('account.menu')}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span
          className="nib-account-chip__disc"
          style={{ '--avatar-color': `var(${profile.avatarColor})` } as React.CSSProperties}
          aria-hidden="true"
        >
          {profile.avatarInitials}
        </span>
      </button>

      {menuOpen &&
        createPortal(
          <div
            className="nib-account-menu"
            ref={menuRef}
            role="menu"
            aria-label={t('account.menu')}
            style={{
              left: menuPos?.left ?? -9999,
              top: menuPos?.top ?? -9999,
              visibility: menuPos ? 'visible' : 'hidden',
            }}
          >
            <div className="nib-account-menu__identity">
              <span className="nib-account-menu__label">{t('account.signed_in_as')}</span>
              <span className="nib-account-menu__email">
                {profile.email ?? profile.displayName}
              </span>
            </div>
            <button
              type="button"
              role="menuitem"
              className="nib-account-menu__item"
              onClick={handleSignOut}
            >
              <IconLogOut width={16} height={16} />
              <span>{t('account.sign_out')}</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
