# components.md — Danh mục component Nib

> Nguồn: `src/components/` (đọc 2026-06-19).  
> Mỗi entry: class CSS chính (đã xác nhận tồn tại trong `src/`) + cấu trúc + cách tái dùng trong mockup.  
> KHÔNG sửa class gốc — dùng đúng tên, thêm modifier `--<variant>` nếu cần biến thể mới.

---

## 1. UnifiedDock

**File:** `src/components/UnifiedDock/UnifiedDock.tsx` + `src/components/UnifiedDock/dock.css`

**Mô tả:** Dock công cụ dọc nổi, kéo-thả, drill-down 2 level (NAV ↔ TOOLS). Portal vào `document.body` → `position: fixed`. State persist localStorage (`nib-dock-mode`, `nib-dock-collapsed`, `nib-dock-pos`).

**Class CSS chính:**

| Class | Mô tả |
|---|---|
| `.nib-dock-anchor` | Container cố định (`position:fixed`), portal vào body, `width/height: 56px` |
| `.nib-dock__expanded` | Shell mở rộng (opacity+scale animation). `data-collapsed` ẩn, `data-expand-up` lật lên |
| `.nib-dock__collapsed` | Nút vuông 56×56 khi thu gọn (crossfade với expanded) |
| `.nib-dock__level` | Wrapper nội dung drill-down, `data-level="nav"` hay `data-level="tools"` |
| `.nib-dock__back` | Nút Back drill-up (chỉ TOOLS level) |
| `.nib-dock__btn` | Nút công cụ thường (44×44, transparent) |
| `.nib-dock__btn--convert` | Variant Convert (toggle math↔text) |
| `.nib-dock__collapse` | Nút thu gọn (cuối dock) |
| `.nib-dock__divider` | Separator ngang mảnh |
| `.nib-dock__format` | Wrapper nút Format, `data-visible` slide-in chỉ mode Gõ |
| `.nib-dock__color-dot` | Chấm màu mực hiện tại |
| `.nib-dock__format-glyph` | Glyph "T" trong nút Format |

**Sub-components:**
- `NavLevel.tsx` — level NAV (5 nút nav: Library/Settings/Type/Write/Help; **account chip bỏ 2026-06-18**)
- `CalcBtn.tsx` — nút Tính (accent fill, `.nib-dock__calc`, 44×44)
- `DragHandle.tsx` — ⋮⋮ handle kéo (class: `.nib-dock__drag`, KHÔNG phải `.nib-dock__drag-handle`)
- `FlyoutPanel.tsx` + 6 flyout (Pointer/Select/PenType/Size/Color/Format) — popover nổi phải dock
- `dockState.ts` — pure logic state machine (không UI)

**NavLevel buttons:** dùng `class="nib-dock__btn nib-dock__navbtn"` (2 class kết hợp, KHÔNG phải `.nib-dock__nav-btn`).

**Cách tái dùng trong mockup:**
```html
<!-- Dock anchor cố định, portal vào body (snippet: override position:absolute cho demo) -->
<div class="nib-dock-anchor" style="left: 24px; top: 120px;">
  <div class="nib-dock__expanded">
    <!-- DragHandle → class ĐÚNG: nib-dock__drag (KHÔNG nib-dock__drag-handle) -->
    <div class="nib-dock__drag" role="presentation" title="Kéo để đặt lại vị trí"></div>
    <span class="nib-dock__divider nib-dock__divider--wide"></span>
    <!-- Level body nav -->
    <div class="nib-dock__level" data-level="nav">
      <div class="nib-dock__nav" role="group">
        <!-- NavLevel buttons: class="nib-dock__btn nib-dock__navbtn" -->
        <button class="nib-dock__btn nib-dock__navbtn" title="Thư viện"><!-- icon --></button>
        <button class="nib-dock__btn nib-dock__navbtn" title="Cài đặt"><!-- icon --></button>
        <span class="nib-dock__divider"></span>
        <button class="nib-dock__btn nib-dock__navbtn" title="Gõ"><!-- icon --></button>
        <button class="nib-dock__btn nib-dock__navbtn" title="Viết"><!-- icon --></button>
        <button class="nib-dock__btn nib-dock__navbtn" title="Trợ giúp"><!-- icon --></button>
        <!-- KHÔNG có account chip (bỏ 2026-06-18) -->
      </div>
    </div>
    <button class="nib-dock__collapse" aria-label="Thu gọn"></button>
  </div>
  <!-- Collapsed square (hidden khi expanded) -->
  <button class="nib-dock__collapsed" aria-hidden="true"></button>
</div>
```

---

## 2. LibraryOverlay

**File:** `src/components/LibraryOverlay/LibraryOverlay.tsx` + `src/components/LibraryOverlay/library-overlay.css`

**Mô tả:** Overlay lớn quản lý tài liệu. Scrim + panel centered. `data-open="true/false"` điều khiển opacity transition — canvas vẫn mounted bên dưới.

**Class CSS chính:**

| Class | Mô tả |
|---|---|
| `.nib-library-overlay` | Container full `position:absolute inset:0`, `z-index:50`, transition opacity |
| `.nib-library__scrim` | Lớp mờ `background: var(--scrim)`, z-50 |
| `.nib-library__panel` | Panel centered `width: min(900px,calc(100%-80px))`, `height: min(600px,calc(100%-80px))`, z-60, `border-radius:14px`, slide-in animation |
| `.nib-library__header` | Header row: Back + tiêu đề + nút New |
| `.nib-library__back` | Nút Back (icon-only, ghost) |
| `.nib-library__heading` | Tiêu đề panel (bold, flex:1) |
| `.nib-library__new` | Nút "Tài liệu mới" (accent fill) |
| `.nib-library__body` | Vùng cuộn nội dung |
| `.nib-library__grid` | Grid layout card (`auto-fill minmax(195px,1fr)`) |
| `.nib-library__list` | List layout row |
| `.nib-lib-card` | Card doc (border, radius-md, hover lift) |
| `.nib-lib-card__preview` | Preview ruling stripe (repeating-linear-gradient `--border`) |
| `.nib-lib-row` | Row doc (48px, hover bg-subtle) |
| `.nib-lib-sort` | Dropdown sort (absolute, z-70) |
| `.nib-lib-ctx` | Context menu (fixed tại vị trí click, z-70) |
| `.nib-lib-delete` | Delete confirm modal (absolute inset-0, scrim nền, z-80) |
| `.nib-lib-btn` | Nút action (`.--ghost` / `.--danger`) |
| `.nib-lib-rename` | Input rename inline |

**Cách tái dùng trong mockup:**
```html
<div class="nib-library-overlay" data-open="true">
  <div class="nib-library__scrim" aria-hidden="true"></div>
  <div class="nib-library__panel" role="dialog" aria-modal="true">
    <div class="nib-library__header">
      <button class="nib-library__back"><IconArrowLeft/></button>
      <span class="nib-library__heading" data-i18n="library.title">Library</span>
      <button class="nib-library__new" data-i18n="library.new_doc">New</button>
    </div>
    <!-- LibraryToolbar -->
    <div class="nib-library__body">
      <div class="nib-library__grid"><!-- DocCard --></div>
    </div>
  </div>
</div>
```

---

## 3. SettingsOverlay

**File:** `src/components/SettingsOverlay/SettingsOverlay.tsx` + `src/components/SettingsOverlay/settings-overlay.css`

**Mô tả:** Overlay Cài đặt — CÙNG kích thước + animation với LibraryOverlay (card nổi centered + scrim). Layout bên trong: header + tab bar ngang + content full-width. `data-open` pattern.

**Class CSS chính:**

| Class | Mô tả |
|---|---|
| `.nib-settings-overlay` | Container full inset-0, z-50, opacity transition |
| `.nib-settings__scrim` | Scrim `var(--scrim)`, z-50 |
| `.nib-settings__panel` | Panel 900×600px max, z-60, `border-radius:14px`, slide-in |
| `.nib-settings__header` | Header row: Back (44px) + tiêu đề, `height:57px` |
| `.nib-settings__back` | Nút Back 44×44 ghost (hit-target ≥44px) |
| `.nib-settings__heading` | Tiêu đề panel (`--font-size-ui-md`, bold) |
| `.nib-settings__inner` | Flex column: tab bar + content |
| `.nib-settings__nav` | Tab bar ngang (full width, `height:48px`, `padding:0 36px`) |
| `.nib-settings__nav-list` | `<ul>` ngang gap-4 |
| `.nib-settings__nav-item` | Tab nút, `data-active="true"` → accent underline 2px |
| `.nib-settings__nav-badge` | Badge "Sắp ra" (bg-subtle) |
| `.nib-settings__content` | Vùng content (full-width, `padding:28px 36px`, scroll-y) |
| `.nib-settings__section-title` | H1 section (`--font-size-doc-heading`, bold) |
| `.nib-settings-account` | Layout Account section (flex column gap-20) |
| `.nib-settings-account__avatar` | Avatar circle 64px, `background: color-mix(--avatar-color)` |
| `.nib-settings-field` | Form field (label + input) |
| `.nib-settings-field__input` | Input 40px, border `--border`, focus outline `--accent` |
| `.nib-settings-appearance` | Layout Appearance section |
| `.nib-settings__seg` | Row tùy chọn segmented (flex wrap) |
| `.nib-settings__opt` | Option nút pill, `data-active="true"` → accent |

**Cách tái dùng trong mockup:**
```html
<div class="nib-settings-overlay" data-open="true">
  <div class="nib-settings__scrim" aria-hidden="true"></div>
  <div class="nib-settings__panel" role="dialog" aria-modal="true">
    <div class="nib-settings__header">
      <button class="nib-settings__back" aria-label="Đóng"></button>
      <span class="nib-settings__heading" data-i18n="settings.title">Settings</span>
    </div>
    <div class="nib-settings__inner">
      <nav class="nib-settings__nav">
        <ul class="nib-settings__nav-list">
          <li><button class="nib-settings__nav-item" data-active="true" data-i18n="settings.nav.account">Account</button></li>
          <li><button class="nib-settings__nav-item" data-i18n="settings.nav.appearance">Appearance</button></li>
        </ul>
      </nav>
      <div class="nib-settings__content"><!-- section content --></div>
    </div>
  </div>
</div>
```

---

## 4. TopStrip

**File:** `src/components/TopStrip.tsx` + `src/components/app-shell.css`

**Mô tả:** Dải mỏng `position:absolute` nổi trên canvas (không chiếm chiều cao layout). Hai "card" bo góc đặc biệt hugging 2 góc màn hình: trái (Logo + doc-title) + phải (Undo/Redo). Không có band nền liên tục — trong suốt ở giữa.

**Class CSS chính:**

| Class | Mô tả |
|---|---|
| `.nib-strip` | Wrapper absolute top-0, transparent bg, pointer-events:none (click-through ở giữa) |
| `.nib-strip__block` | Card hugging corner (height:48px, `bg-elevated`, pointer-events:auto) |
| `.nib-strip__block--left` | Card trái: `border-bottom-right-radius: 16px` + pseudo radial-gradient concave corners |
| `.nib-strip__block--right` | Card phải: mirror (border-bottom-left-radius) |
| `.nib-strip__logo` | Icon ngòi bút Nib (`color: var(--accent)`) |
| `.nib-strip__divider` | Separator dọc 1px `var(--border)` |
| `.nib-strip__doctitle-text` | Doc title (ellipsis, max-width:360px, `var(--text-primary)`) |
| `.nib-strip__iconbtn` | Icon button 44×44 (hit target, ghost, focus ring accent) |

**Cách tái dùng trong mockup:**
```html
<header class="nib-strip">
  <div class="nib-strip__block nib-strip__block--left">
    <!-- Logo icon, divider, doc title -->
    <span class="nib-strip__doctitle-text" data-i18n="app.doc_title">Untitled</span>
  </div>
  <div class="nib-strip__block nib-strip__block--right">
    <button class="nib-strip__iconbtn" data-i18n-title="strip.undo" title="Undo"><!-- icon --></button>
    <button class="nib-strip__iconbtn" data-i18n-title="strip.redo" title="Redo"><!-- icon --></button>
  </div>
</header>
```

---

## 5. Canvas — Ruled Paper

**File:** `src/components/Canvas.tsx` + `src/components/canvas.css`

**Mô tả:** Canvas giấy kẻ ngang 664px fixed-width, nổi trên mặt bàn (`--desk`). Desk centers + scrolls paper. Paper chứa ruling, margin-line, editor host, selection overlay, hint pill.

**Class CSS chính:**

| Class | Mô tả |
|---|---|
| `.nib-desk` | Mặt bàn `bg: var(--desk)`, `position:static`, center + scroll paper, `padding:30px 0` |
| `.nib-paper` | Tờ giấy 664px `bg: var(--bg-app)`, `box-shadow: var(--sheet-shadow)`, `min-height: calc(--ruled-line-height * 16)` |
| `.nib-ruled-paper` | Ruling `position:absolute inset:0`, `repeating-linear-gradient` mỗi 64px (`var(--border)` 1px) |
| `.nib-margin-line` | Đường dọc trái 44px, 1px `color-mix(--accent 22%)` |
| `.nib-editor-host` | ProseMirror host, `position:relative`, `min-height: calc(--ruled-line-height * 16)`, z-1 |
| `.nib-pm` | ProseMirror root, `position:relative`, `outline:none` |
| `.nib-selection-overlay` | Overlay chọn vùng, z-3, `pointer-events:none`, `display:none` (hidden by default) |
| `.nib-hint-pill` | Pill gợi ý, absolute bottom-16px centered, `bg-elevated`, shadow-2 (hidden by default) |

**Block toán (NodeView — trong canvas.css):**

| Class | Mô tả |
|---|---|
| `.nib-block` | Block `position:absolute z-2`, min-width:64px |
| `.nib-block__surface` | Surface trong-suốt (active→`--accent-subtle` bg), padding 6px 14px 11px |
| `.nib-block__content` | Nội dung toán/text, `font-size:19px`, `color: var(--text-primary)` |
| `.nib-block__edge` | Đường trái 2px `var(--accent)`, opacity:0 (active+EDITING→1) |
| `.nib-block__placeholder` | Placeholder absolute (bottom-aligned), `color: var(--text-muted)` |

**Cách tái dùng trong mockup:**
```html
<div class="nib-desk">
  <div class="nib-paper">
    <div class="nib-margin-line" aria-hidden="true"></div>
    <div class="nib-ruled-paper" aria-hidden="true"></div>
    <!-- Editor content / blocks go here inside .nib-editor-host -->
    <div class="nib-editor-host">
      <div class="nib-block" data-active="true" data-show-edge="true"
           style="top: 64px; left: 56px;">
        <div class="nib-block__surface">
          <div class="nib-block__content">x²</div>
          <div class="nib-block__edge"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 6. CommandPalette

**File:** `src/components/CommandPalette.tsx` + `src/components/palette.css`

**Mô tả:** Ctrl+K palette, portal vào body. Backdrop full-screen mờ + panel centered trên. Keyboard navigation (↑↓ Enter Esc). Chỉ render khi `open=true`.

**Class CSS chính:**

| Class | Mô tả |
|---|---|
| `.nib-palette-backdrop` | Fixed inset-0, z-60, `bg: var(--overlay)`, `backdrop-filter: blur(2px)`, flex center |
| `.nib-palette` | Panel `width: min(560px,92vw)`, `bg-elevated`, shadow-2, radius-lg |
| `.nib-palette__input` | Input search (full-width, border-bottom `--border`, `font-size: --font-size-ui-md`) |
| `.nib-palette__list` | `<ul>` max-height:320px scroll, `padding: --space-1` |
| `.nib-palette__item` | Item 44px min-height, `data-active` → `--accent-subtle` bg + `--accent` text |
| `.nib-palette__kbd` | Shortcut badge (`bg-subtle`, border `--border`, xs font) |
| `.nib-palette__empty` | Empty state text (`--text-muted`, center) |

**Cách tái dùng trong mockup:**
```html
<div class="nib-palette-backdrop">
  <div class="nib-palette" role="dialog" aria-modal="true">
    <input class="nib-palette__input" data-i18n-placeholder="cmd.placeholder" placeholder="Search commands…"/>
    <ul class="nib-palette__list" role="listbox">
      <li class="nib-palette__item" role="option" data-active="true">
        <span data-i18n="cmd.calc">Tính</span>
        <kbd class="nib-palette__kbd">Shift+Enter</kbd>
      </li>
    </ul>
  </div>
</div>
```

---

## 7. NibBlock (block toán/text standalone)

> Xem thêm §5 Canvas. Block là NodeView riêng biệt — catalog riêng để agent tham chiếu khi dựng mockup có block.

**File:** `src/components/canvas.css` (phần "Block (NodeView)")

**Class chính:** `.nib-block`, `.nib-block__surface`, `.nib-block__content`, `.nib-block__edge`, `.nib-block__placeholder`

**Data attributes:**
- `data-active="true"` → `--accent-subtle` nền surface
- `data-show-edge="true"` → left-edge 2px accent visible (chỉ EDITING, không INK-CAPTURE)

---

## Popover pattern (tái dùng từ LibraryOverlay)

Popover nhỏ (sort dropdown, context menu) tái dùng pattern từ LibraryOverlay:

| Class | Dùng cho | Mô tả |
|---|---|---|
| `.nib-lib-sort` | Sort dropdown | `position:absolute`, z-70, width:182px, `bg-elevated`, shadow-2, radius-10px |
| `.nib-lib-sort__opt` | Option item sort | 34px, hover `bg-subtle`, active `accent-subtle + accent` |
| `.nib-lib-ctx` | Context menu | `position:fixed` tại vị trí click, z-70, width:176px |
| `.nib-lib-ctx__opt` | Option item ctx | Giống sort__opt |
| `.nib-lib-ctx__opt--danger` | Option nguy hiểm | `color: var(--error)`, hover color-mix error |
| `.nib-lib-ctx__sep` | Separator ngang | 1px `var(--border)` |
| `.nib-lib-popover-backdrop` | Click-away backdrop | `position:fixed inset:0`, z-69 |

---

## Form field pattern (tái dùng từ SettingsOverlay)

| Class | Mô tả |
|---|---|
| `.nib-settings-field` | Wrapper (flex column, gap:7px) |
| `.nib-settings-field__label` | Label 12px, bold, `--text-secondary` |
| `.nib-settings-field__input` | Input 40px, `bg-subtle`, focus outline `--accent` |

---

## Delete / confirm modal pattern (tái dùng từ LibraryOverlay)

| Class | Mô tả |
|---|---|
| `.nib-lib-delete` | Container absolute inset-0, z-80, `bg: var(--scrim)`, flex center |
| `.nib-lib-delete__box` | Modal box 360px, `bg-elevated`, shadow-2, radius-14px |
| `.nib-lib-delete__title` | Tiêu đề (15px bold, `--text-primary`) |
| `.nib-lib-delete__msg` | Nội dung (13.5px `--text-secondary`) |
| `.nib-lib-delete__actions` | Row nút (flex end, gap:8px) |
| `.nib-lib-btn--ghost` | Nút huỷ (border `--border`, `--text-secondary`) |
| `.nib-lib-btn--danger` | Nút xoá (`bg: var(--error)`, `--text-on-accent`) |
