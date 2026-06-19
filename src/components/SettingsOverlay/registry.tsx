import type { ComponentType, ReactNode } from 'react';
import type { I18nKey } from '@/providers/i18n-context';
import { IconUser, IconSun, IconText, IconKbd } from '../icons';
import { AccountSection } from './AccountSection';
import { AppearanceSection } from './AppearanceSection';

/**
 * Section descriptor (plan §Cơ chế mở rộng). To add a section: create its
 * component and append one entry here — the shell (SettingsOverlay / SettingsNav
 * / SettingsContent) needs no changes.
 */
export interface SectionDef {
  id: string;
  /** i18n key for the nav label (compile-time checked against en.json). */
  i18nKey: I18nKey;
  icon: ReactNode;
  component: ComponentType;
  /** Future/placeholder section — rendered disabled with a "coming soon" badge. */
  comingSoon?: boolean;
}

/** Registry order = nav order. Account first → default active section. */
export const SECTION_REGISTRY: SectionDef[] = [
  {
    id: 'account',
    i18nKey: 'settings.nav.account',
    icon: <IconUser />,
    component: AccountSection,
  },
  {
    id: 'appearance',
    i18nKey: 'settings.nav.appearance',
    icon: <IconSun />,
    component: AppearanceSection,
  },
  // Future slots — proof the registry scales. comingSoon → disabled nav item.
  {
    id: 'editor',
    i18nKey: 'settings.nav.future.editor',
    icon: <IconText />,
    component: AccountSection, // placeholder; never rendered while comingSoon.
    comingSoon: true,
  },
  {
    id: 'shortcuts',
    i18nKey: 'settings.nav.future.shortcuts',
    icon: <IconKbd />,
    component: AccountSection, // placeholder.
    comingSoon: true,
  },
];
