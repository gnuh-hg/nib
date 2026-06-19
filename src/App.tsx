import { ProfileProvider } from '@/providers/ProfileProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import { AppShell } from '@/components/AppShell';

export default function App() {
  // ProfileProvider wraps the outermost layer so dock/TopStrip can read the
  // profile later (not scoped to SettingsOverlay — architect R2).
  return (
    <ProfileProvider>
      <ThemeProvider>
        <I18nProvider>
          <AppShell />
        </I18nProvider>
      </ThemeProvider>
    </ProfileProvider>
  );
}
