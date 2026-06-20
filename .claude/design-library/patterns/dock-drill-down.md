# Pattern: Dock dọc NAV ↔ TOOLS drill-down

> Dùng khi: thiết kế UnifiedDock hoặc dock dọc mới dạng drill-down 2 level.  
> Snippet copy-được: `../snippets/dock-nav-level.html`

---

## Khi nào dùng pattern này

- Dock dọc nổi kéo-thả với drill-down 2 level (NAV ↔ TOOLS)
- Level NAV: điều hướng ứng dụng (Thư viện, Cài đặt, Gõ, Viết, Help, Account)
- Level TOOLS: công cụ theo mode (Pointer, Select, Pen, Size, Color, Convert, Format, Tính)
- Collapsed state: 56×56 nút vuông tap-to-expand, drag-to-reposition

**Không dùng pattern này khi:** menu ngang (horizontal toolbar) hoặc context menu.

---

## Cấu trúc HTML (2 level)

```
.nib-dock-anchor                       ← Fixed container 56×56, portaled to body
  ├── .nib-dock__expanded              ← Shell mở (opacity+scale animation)
  │     ├── [DragHandle]               ← ⋮⋮ kéo (pointer capture)
  │     ├── .nib-dock__divider--wide   ← Separator
  │     ├── .nib-dock__level[data-level="nav"]    ← NAV level
  │     │     ├── [NavLevel buttons]   ← Library / Settings / Gõ / Viết / Help
  │     │     └── [AccountChip]        ← Avatar tròn cuối dock
  │     │   (hoặc)
  │     ├── .nib-dock__level[data-level="tools"]  ← TOOLS level
  │     │     ├── .nib-dock__back      ← Nút Back drill-up (← icon)
  │     │     ├── .nib-dock__divider
  │     │     ├── [DockBtn] × N        ← Pointer / Select / Pen
  │     │     ├── .nib-dock__divider
  │     │     ├── [DockBtn size]       ← Size flyout
  │     │     ├── [DockBtn color]      ← Color flyout
  │     │     ├── .nib-dock__divider
  │     │     ├── [Convert btn]        ← Math↔Text
  │     │     ├── .nib-dock__format    ← Format btn (slide-in mode Gõ)
  │     │     ├── .nib-dock__divider
  │     │     └── [CalcBtn]            ← Nút Tính (accent fill)
  │     └── .nib-dock__collapse        ← Thu gọn (cuối dock)
  └── .nib-dock__collapsed             ← Nút vuông 56×56 (khi collapsed)
```

---

## Level NAV — cấu trúc NavLevel

```html
<!-- Level NAV: 5 nav item + account chip -->
<div class="nib-dock__level" data-level="nav">
  <!-- 5 nút nav theo thứ tự: Library, Settings, Type, Write, Help -->
  <button class="nib-dock__nav-btn" title="Thư viện" data-i18n-title="dock.nav.library">
    <!-- IconLibrary -->
  </button>
  <!-- ... Settings, Type, Write, Help ... -->
  <!-- Account chip (cuối) -->
  <button class="nib-dock__account" aria-label="Account">
    <span class="nib-dock__avatar"><!-- initials --></span>
  </button>
</div>
```

---

## Level TOOLS — DockBtn pattern

```html
<!-- Level TOOLS (mode Gõ ví dụ) -->
<div class="nib-dock__level" data-level="tools">
  <button class="nib-dock__back" title="Back" data-i18n-title="dock.back">
    <!-- IconArrowLeft 18px -->
  </button>
  <span class="nib-dock__divider" aria-hidden="true"></span>

  <!-- Pointer + Select (luôn hiện cả 2 mode) -->
  <button class="nib-dock__btn" title="Con trỏ" data-i18n-title="dock.ptr_title">
    <!-- IconCursor 17px -->
  </button>
  <button class="nib-dock__btn" title="Chọn" data-i18n-title="dock.sel_title">
    <!-- IconRectSelect 17px -->
  </button>
  <button class="nib-dock__btn" title="Bút" data-i18n-title="dock.pen_title">
    <!-- IconNib 17px -->
  </button>

  <span class="nib-dock__divider" aria-hidden="true"></span>

  <!-- Size + Color -->
  <button class="nib-dock__btn" title="Cỡ" data-i18n-title="dock.size_text">
    <!-- IconTextSize 17px -->
  </button>
  <button class="nib-dock__btn" title="Màu mực" data-i18n-title="dock.color_ink">
    <span class="nib-dock__color-dot" aria-hidden="true"></span>
  </button>

  <span class="nib-dock__divider" aria-hidden="true"></span>

  <!-- Convert -->
  <button class="nib-dock__btn nib-dock__btn--convert"
          title="Convert" data-i18n-title="dock.convert">
    <!-- IconConvert 16px -->
  </button>

  <!-- Format (chỉ mode Gõ) -->
  <div class="nib-dock__format" data-visible="true">
    <button class="nib-dock__btn" title="Định dạng" data-i18n-title="dock.format">
      <span class="nib-dock__format-glyph">T</span>
    </button>
  </div>

  <span class="nib-dock__divider" aria-hidden="true"></span>

  <!-- CalcBtn (Tính — accent fill) -->
  <button class="nib-calc-btn" title="Tính" data-i18n-title="dock.calc">
    <!-- IconCalc 20px -->
  </button>
</div>
```

---

## Token liên quan

| Token | Dùng ở đâu |
|---|---|
| `--bg-elevated` | Nền dock shell (`background`) |
| `--border` | Viền dock 1px |
| `--shadow-2` | Shadow dock nổi |
| `--text-secondary` | Icon nút thường |
| `--accent` | CalcBtn bg, active state, focus ring |
| `--text-on-accent` | Icon CalcBtn |
| `--accent-subtle` | Nền nút active (khi flyout open) |
| `--bg-subtle` | Hover nút thường |
| `--text-muted` | Icon collapsed state |

---

## State machine dock (tóm tắt)

```
collapsed: false   → expanded shell visible, collapsed button hidden
collapsed: true    → expanded shell opacity:0, collapsed button visible

level: "nav"       → hiển thị NavLevel (không có Back)
level: "tools"     → hiển thị TOOLS (có Back button)

openPop: null      → không flyout nào mở
openPop: "ptr"     → PointerFlyout hiện bên phải dock

expandDir: "down"  → expanded mở xuống (data-expand-up absent)
expandDir: "up"    → expanded mở lên (data-expand-up set, bottom:0 top:auto)
```

---

## Flyout pattern (popup bên phải dock)

Flyout nổi sang phải dock, `position:absolute`, top tính JS (overflow-aware):

```css
.nib-dock__flyout {
  position: absolute;
  left: calc(100% + var(--space-2));
  /* top: tính tại runtime bằng JS — tránh tràn viewport */
  z-index: 40;
  min-width: 140px;
  padding: var(--space-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--bg-elevated);
  box-shadow: var(--shadow-2);
}
```

---

## Checklist mockup dock

- [ ] `.nib-dock-anchor` có `style="left:Xpx;top:Ypx"` (hoặc default góc trái)
- [ ] Đúng `data-level` trên `.nib-dock__level` (nav / tools)
- [ ] CalcBtn có class `.nib-calc-btn` (accent fill, KHÔNG phải `.nib-dock__btn` thường)
- [ ] `.nib-dock__format` có `data-visible` khi mode Gõ, vắng khi mode Viết
- [ ] Nút Back có `data-i18n-title="dock.back"` + icon ArrowLeft
- [ ] 0 hex rời trong HTML+CSS
