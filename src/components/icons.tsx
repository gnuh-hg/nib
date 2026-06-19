// Outline SVG icon set (design.md §9). stroke=currentColor, 1.5px, no emoji.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Brand logo — fountain nib (diamond). */
export const IconLogo = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 L18 13 L12 21 L6 13 Z" />
    <line x1="12" y1="9.5" x2="12" y2="18" />
    <circle cx="12" cy="8" r="1" />
  </Base>
);

/** Tính — "= →" semantics (matches mock). */
export const IconCalc = (p: IconProps) => (
  <Base {...p}>
    <line x1="3" y1="9" x2="11" y2="9" />
    <line x1="3" y1="14" x2="11" y2="14" />
    <path d="M14.5 11.5 H21 M18 8.5 l3 3 -3 3" />
  </Base>
);

export const IconUndo = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 7 L4 11 L8 15" />
    <path d="M4 11 h10 a5 5 0 1 1 0 10 h-2" />
  </Base>
);

export const IconRedo = (p: IconProps) => (
  <Base {...p}>
    <path d="M16 7 L20 11 L16 15" />
    <path d="M20 11 h-10 a5 5 0 1 0 0 10 h2" />
  </Base>
);

export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <line x1="12" y1="2.5" x2="12" y2="5" />
    <line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5" y2="12" />
    <line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="5.2" y1="5.2" x2="7" y2="7" />
    <line x1="17" y1="17" x2="18.8" y2="18.8" />
    <line x1="5.2" y1="18.8" x2="7" y2="17" />
    <line x1="17" y1="7" x2="18.8" y2="5.2" />
  </Base>
);

export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 14.5 A8 8 0 0 1 9.5 4 A6.4 6.4 0 1 0 20 14.5 Z" />
  </Base>
);

/** Convert — "↔T" toggle math/text. */
export const IconConvert = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8h7M7 5 4 8l3 3" />
    <path d="M20 16h-7m4-3 3 3-3 3" />
  </Base>
);

export const IconBold = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
  </Base>
);

export const IconItalic = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 5h-6M11 19H5M15 5 9 19" />
  </Base>
);

export const IconUnderline = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 5v6a5 5 0 0 0 10 0V5M5 21h14" />
  </Base>
);

export const IconStrike = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14M8 7a4 3 0 0 1 8 0M8 16a4 3 0 0 0 8 0" />
  </Base>
);

/** Pen nib — brand icon (fountain nib, diamond — matches mock). */
export const IconPenNib = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 L17 12 L12 19 L7 12 Z" />
    <line x1="12" y1="9" x2="12" y2="16" />
  </Base>
);

export const IconHighlighter = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 4 20 9l-8 8H7l-2-2 8-8z" />
    <path d="M5 21h6" />
  </Base>
);

export const IconStrokeEraser = (p: IconProps) => (
  <Base {...p}>
    <path d="M7 17 17 7l4 4-7 7H9zM4 21h8" />
  </Base>
);

export const IconLasso = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11a8 4 0 1 1 12 3.5" strokeDasharray="2 2" />
    <path d="M6 15a2 2 0 1 0 1 3c1 0 2-1 3-1" />
  </Base>
);

/** Hamburger ≡ — leading glyph of the doc-title switcher (TopStrip). */
export const IconMenu = (p: IconProps) => (
  <Base strokeWidth="1.8" {...p}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </Base>
);

/** Toggle left sidebar rail — panel with a vertical divider (design dòng 89). */
export const IconLayoutSidebar = (p: IconProps) => (
  <Base strokeWidth="1.7" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="9" y1="4" x2="9" y2="20" />
  </Base>
);

/** Document — dog-eared sheet (rail list item, design dòng 107). */
export const IconDoc = (p: IconProps) => (
  <Base strokeWidth="1.6" {...p}>
    <path d="M5 4h10l4 4v12H5Z" />
    <path d="M14 4v5h5" />
  </Base>
);

/** Library — 2×2 grid (rail footer "Open library", design dòng 116). */
export const IconLayoutGrid = (p: IconProps) => (
  <Base strokeWidth="1.7" {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Base>
);

/** Settings — cog/gear with notched teeth (nav-dock level NAV). Distinct from
 * IconSun: a lobed ring, not thin radial rays. */
export const IconSettings = (p: IconProps) => (
  <Base {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

/** Help — question mark in a circle (nav-dock level NAV). */
export const IconHelp = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.3 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.7 2.3-2.7 4" />
    <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
  </Base>
);

/** Back arrow (library header, design dòng 243). */
export const IconArrowLeft = (p: IconProps) => (
  <Base strokeWidth="1.8" {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Base>
);

/** Plus (new document, design dòng 245). */
export const IconPlus = (p: IconProps) => (
  <Base strokeWidth="2.2" {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Base>
);

/** Search (library toolbar, design dòng 249). */
export const IconSearch = (p: IconProps) => (
  <Base strokeWidth="1.8" {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <line x1="16" y1="16" x2="20.5" y2="20.5" />
  </Base>
);

/** List view (library toolbar, design dòng 252). */
export const IconList = (p: IconProps) => (
  <Base strokeWidth="1.7" {...p}>
    <line x1="9" y1="6" x2="20" y2="6" />
    <line x1="9" y1="12" x2="20" y2="12" />
    <line x1="9" y1="18" x2="20" y2="18" />
    <circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </Base>
);

/** Sort — descending lines (library toolbar, design dòng 254). */
export const IconSortLines = (p: IconProps) => (
  <Base strokeWidth="1.7" {...p}>
    <line x1="4" y1="6" x2="14" y2="6" />
    <line x1="4" y1="12" x2="11" y2="12" />
    <line x1="4" y1="18" x2="8" y2="18" />
  </Base>
);

/** Horizontal ⋯ (context-menu trigger, design dòng 268). */
export const IconDotsHorizontal = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...p}
  >
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

/** Check (active sort option, design dòng 323). */
export const IconCheck = (p: IconProps) => (
  <Base strokeWidth="2.2" {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Base>
);

/** Pencil (rename, design dòng 330). */
export const IconPencil = (p: IconProps) => (
  <Base strokeWidth="1.7" {...p}>
    <path d="M17 3l4 4L7 21H3v-4L17 3Z" />
  </Base>
);

/** Toggle exact/approx — "= ↔ ≈". */
export const IconToggleExact = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 9h6M4 13h6M14 8c1.5 1 2.5 1 4 0M14 12c1.5 1 2.5 1 4 0" />
  </Base>
);

export const IconCopy = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h8" />
  </Base>
);

export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </Base>
);

export const IconText = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 6h14M12 6v13M9 19h6" />
  </Base>
);

export const IconSize = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h8M8 7v11M14 11h6M17 11v7" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);

/* ===== UnifiedDock v2 icons — paths mirror docs/Nib-Dock-v2-ref.html exactly ===== */

/** Drag grip — 6 dots (filled). */
export const IconDragHandle = (p: IconProps) => (
  <svg width="18" height="8" viewBox="0 0 18 8" fill="currentColor" aria-hidden="true" {...p}>
    <circle cx="2" cy="2" r="1.3" />
    <circle cx="9" cy="2" r="1.3" />
    <circle cx="16" cy="2" r="1.3" />
    <circle cx="2" cy="6" r="1.3" />
    <circle cx="9" cy="6" r="1.3" />
    <circle cx="16" cy="6" r="1.3" />
  </svg>
);

/** Mode-toggle chevron ▾ (filled triangle). */
export const IconChevronDown = (p: IconProps) => (
  <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M1 3 L5 7 L9 3 Z" />
  </svg>
);

/** Flyout indicator ▿ — small corner triangle (filled). */
export const IconCornerMark = (p: IconProps) => (
  <svg width="6" height="6" viewBox="0 0 8 8" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M0 8 L8 8 L8 0 Z" />
  </svg>
);

/** Keyboard — mode toggle (type mode). */
export const IconKbd = (p: IconProps) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <rect x="2" y="6" width="20" height="13" rx="2.5" />
    <circle cx="6" cy="11" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="10" cy="11" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="14" cy="11" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18" cy="11" r="1.4" fill="currentColor" stroke="none" />
    <line x1="7" y1="15" x2="17" y2="15" strokeWidth="1.7" />
  </svg>
);

/** Fountain nib — mode toggle (pen mode) + pen-type "Nib pen". */
export const IconNib = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M12 3 L18 13 L12 21 L6 13 Z" />
    <line x1="12" y1="10" x2="12" y2="18" />
  </svg>
);

/** Pointer arrow — pointer flyout "Cursor". */
export const IconCursor = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M5 3 L19 11 L12.5 13 L10 20 Z" />
  </svg>
);

/** Open hand — pointer flyout "Pan canvas". */
export const IconPan = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M18 11v-2a2 2 0 0 0-4 0v2M14 10V7a2 2 0 0 0-4 0v3M10 10V7a2 2 0 0 0-4 0v8l-1.5-1.5a1.5 1.5 0 0 0-2.12 2.12L6 19a6 6 0 0 0 12 0v-8a2 2 0 0 0-4 0v2" />
  </svg>
);

/** Dashed rectangle — selection flyout "Rectangle". */
export const IconRectSelect = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeDasharray="3 2.4"
    strokeLinecap="round"
    aria-hidden="true"
    {...p}
  >
    <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
  </svg>
);

/** Marker / highlighter — pen-type "Marker". */
export const IconMarker = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M6 18 l9 -12 4 3 -9 12 -5 1 1 -4 Z" />
    <line x1="4" y1="21" x2="13" y2="21" />
  </svg>
);

/** Stroke eraser — pen-type "Stroke eraser". */
export const IconEraser = (p: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M7 17 l-3 -3 9 -9 6 6 -6 6 Z" />
    <line x1="4" y1="20" x2="16" y2="20" />
  </svg>
);

/** Stroke-size — 3 lines of growing weight (pen-mode size button). */
export const IconStrokeSize = (p: IconProps) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    aria-hidden="true"
    {...p}
  >
    <line x1="5" y1="7" x2="19" y2="7" strokeWidth="1.2" />
    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.6" />
    <line x1="5" y1="17" x2="19" y2="17" strokeWidth="4.2" />
  </svg>
);

/** Text-size — "A"-style tick (type-mode size button). */
export const IconTextSize = (p: IconProps) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M4 7 h16 M12 7 v13 M8 20 h8" />
  </svg>
);

/** Dock collapse — two horizontal bars. */
export const IconDockCollapse = (p: IconProps) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    {...p}
  >
    <line x1="6" y1="9" x2="18" y2="9" />
    <line x1="6" y1="15" x2="18" y2="15" />
  </svg>
);

/** User — Account settings section. Head + shoulders outline. */
export const IconUser = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </Base>
);
