import { useSettingsContext } from './settings-context';
import type { SectionDef } from './registry';

interface SettingsContentProps {
  sections: SectionDef[];
}

/** Renders the active section's component (eager registry lookup). */
export function SettingsContent({ sections }: SettingsContentProps) {
  const { activeId } = useSettingsContext();
  // R4: activeId always defaults to the first real section; if it ever falls out
  // of range (e.g. a section is removed) fall back to the first entry.
  const def = sections.find((s) => s.id === activeId) ?? sections[0];
  const ActiveComponent = def.component;

  return (
    <div className="nib-settings__content" role="tabpanel">
      <ActiveComponent />
    </div>
  );
}
