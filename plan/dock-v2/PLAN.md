# PLAN — v2 Tool Dock (UnifiedDock)

> Sau khi toàn bộ pipeline xong, app có **một** vertical dock duy nhất (`UnifiedDock`) thay thế hoàn toàn `FloatingToolbar.tsx` + `PenPalette.tsx`. Dock hiển thị cố định, có flyout, thu gọn/mở rộng crossfade, và wire tới `evalBlock` / `convertBlock` / format actions thật — chạy trong Vite dev browser với 0 console error.

---

## Context

- Lý do nhiều session: 3 surface tách nhau (static shell + CSS, state machine + flyouts, Editor wiring + cleanup). Làm gộp 1 chat dễ sót bug animation và type error TypeScript.
- **Nguồn sự thật duy nhất**: `docs/Nib-Dock-v2-ref.html` (DCLogic component + inline CSS). Khi xung đột với `docs/dock-handoff.md`, `docs/design.md`, `docs/feature.md` → HTML **THẮNG tuyệt đối** (user lệnh rõ).
- **3 yêu cầu nền [LOCKED]** vẫn giữ nguyên: (1) mọi chuỗi qua i18n en/vi, (2) hit target ≥ 44px, desktop-class min 820px, (3) mọi màu/spacing đọc từ CSS custom property — cấm hex rời.
- Thuộc Phase 0 (Mock-UI): Tính button wire tới `evalBlock` mock hiện có, KHÔNG cần real CAS backend.
- Out of scope: drag-to-reposition dock (xem Phase 0 ROADMAP note §3 handoff — giữ position cố định bên phải), real ink capture (Phase 3), MyScript HTR.

---

## Xung đột HTML v2 vs tài liệu cũ — đã chọn theo HTML

| Điểm xung đột | dock-handoff.md / design.md nói | HTML v2 thắng |
|---|---|---|
| Pointer + Select group | Nhóm B: "CHỈ hiện ở chế độ BÚT" | Pointer btn + Select btn **luôn hiện** cả 2 mode (HTML lines 77-84) |
| Mode toggle UI | Segmented control 2 ô `[Gõ]\|[Bút]` | **1 nút duy nhất** hiện modeIcon (nib hoặc kbd) + ▾, bấm cycle mode (HTML line 72) |
| Collapsed state | Gập còn drag-handle + Tính + nút mở rộng | **56×56px square bo 16px**, chỉ hiện penIcon; click bất kỳ = expand (HTML line 186-188) |
| Format button visibility | Hiện khi "có block được chọn" | Slide-in/out theo **mode=Gõ** (type), không liên quan block chọn (HTML line 99, renderVals fmtMaxH) |
| Xoá / Copy / Nhân đôi | Có trong nhóm C dock | **Bỏ hẳn** khỏi dock v2 (HTML Notes section: "Bỏ Copy · Nhân đôi · Xoá") |
| Tính button disabled/badge | §5.1: disabled khi không chọn block, badge N khi multi-select | HTML: Tính luôn visible, **không disabled state**, không badge trong dock (HTML line 106) |
| Định dạng flyout nội dung | text: B/I/U/S + cỡ Lớn/Thường/Nhỏ; math: Display/Normal | HTML flyout chỉ có **B/I/U/S row** (lines 155-158, empty second `<div style="display:flex;gap:5px;">`) |

---

## Cây component (a)

```
src/components/UnifiedDock/
├── index.ts                   ← re-export UnifiedDock
├── UnifiedDock.tsx            ← root, state machine + dock shell
├── DragHandle.tsx             ← 6-dot grip (cursor:grab)
├── ModeToggle.tsx             ← 1 nút cycle pen↔type + ▾
├── DockBtn.tsx                ← generic button slot (44×44 + flyout indicator badge)
├── FlyoutPanel.tsx            ← generic popover wrapper (opacity+transform animation)
├── PointerFlyout.tsx          ← "Con trỏ / Kéo thả giấy" 2 rows
├── SelectFlyout.tsx           ← "Chữ nhật / Lasso tự do" 2 rows
├── PenTypeFlyout.tsx          ← "Bút ngòi / Bút nhớ / [Tẩy nét]" (eraser conditional)
├── SizeFlyout.tsx             ← 3 rows (stroke: thin/med/thick | font: S/M/L)
├── ColorFlyout.tsx            ← SwatchGrid 8 màu (tái dùng SWATCH_NAMES từ SwatchPicker.tsx)
├── FormatFlyout.tsx           ← B/I/U/S buttons (Gõ mode only)
└── CalcBtn.tsx                ← 44×44 accent nút Tính (fire evalBlock)
```

File CSS duy nhất: `src/components/UnifiedDock/dock.css` (không tách per-component).

Tái dùng: `SwatchPicker.tsx` (SWATCH_NAMES const), `src/components/icons.tsx` (thêm icon mới).

---

## State machine (c)

### Nguồn state

| State | Nguồn | Khởi tạo / persist |
|---|---|---|
| `mode: 'pen'|'type'` | **Local UnifiedDock** | localStorage key `nib-dock-mode` (default `'pen'`) |
| `collapsed: boolean` | **Local UnifiedDock** | localStorage key `nib-dock-collapsed` (default `false`) |
| `openPop: null|'ptr'|'sel'|'pen'|'size'|'color'|'fmt'` | **Local UnifiedDock** | không persist, reset = `null` |
| `ptrTool: 'cursor'|'pan'` | **Local UnifiedDock** | không persist (default `'cursor'`) |
| `selTool: 'rect'|'lasso'` | **Local UnifiedDock** | không persist (default `'rect'`) |
| `penTool: 'nib'|'marker'|'eraser'` | **Local UnifiedDock** | không persist (default `'nib'`) |
| `penSize: 2|4|6` | **Local UnifiedDock** | không persist (default `4`) |
| `inkColor: SwatchName` | **Local UnifiedDock** | không persist (default `'teal'`) |

> **Quyết định**: HTML DCLogic giữ toàn bộ state local. `EditorContext` **KHÔNG thay đổi** trong plan này — tránh breaking type. Nếu Phase 3 (ink thật) cần `activePenTool` ở context, sẽ thêm khi đó.

### Hành vi renderVals (từ HTML script) → React

| Hành vi | Mô tả |
|---|---|
| `cycleMode` | `mode = mode === 'type' ? 'pen' : 'type'` + đóng `openPop = null` |
| `doCollapse` | `collapsed = true` + `openPop = null` |
| `doExpand` | `collapsed = false` |
| `tog(k)` | `openPop = openPop === k ? null : k` |
| Set tool | `ptrTool/selTool/penTool = value` + `openPop = null` |
| Flyout visible | `op: openPop===k ? '1':'0'`, `pe: auto:none`, `tr: translateX(0)|translateX(9px) scale(.97)` |
| Collapse crossfade | expanded: `opacity:1 scale(1)`, collapsed: `opacity:0 scale(.92)` và ngược lại |
| Format slide-in | `mode=type → maxHeight:'46px' opacity:1`; `mode=pen → maxHeight:'0px' opacity:0` |
| `penBtnBg` (active) | `openPop==='pen' → var(--accent-subtle)` else `transparent` |
| `eraser` in pen flyout | Chỉ render khi `mode === 'pen'` |
| `sizeTitle` | `mode==='pen' ? 'Cỡ nét' : 'Cỡ chữ'` (i18n key tương ứng) |
| `modeIcon` | `mode==='pen' ? nibIcon : kbdIcon` |
| `penIcon` (collapsed) | `penIcons[penTool]` — icon của penTool đang active |

### Close-flyout-on-outside-click
- `pointerdown` trên document, không phải bên trong dock → `setOpenPop(null)`.
- Dùng `useRef` trỏ dock element + `useEffect` lắng nghe `document.pointerdown`.

---

## File tạo mới / sửa / xóa (a)

### Tạo mới
| File | Mô tả |
|---|---|
| `src/components/UnifiedDock/index.ts` | re-export |
| `src/components/UnifiedDock/UnifiedDock.tsx` | root component |
| `src/components/UnifiedDock/DragHandle.tsx` | grip 6 dots |
| `src/components/UnifiedDock/ModeToggle.tsx` | cycle button |
| `src/components/UnifiedDock/DockBtn.tsx` | generic slot |
| `src/components/UnifiedDock/FlyoutPanel.tsx` | popover wrapper |
| `src/components/UnifiedDock/PointerFlyout.tsx` | |
| `src/components/UnifiedDock/SelectFlyout.tsx` | |
| `src/components/UnifiedDock/PenTypeFlyout.tsx` | |
| `src/components/UnifiedDock/SizeFlyout.tsx` | |
| `src/components/UnifiedDock/ColorFlyout.tsx` | |
| `src/components/UnifiedDock/FormatFlyout.tsx` | |
| `src/components/UnifiedDock/CalcBtn.tsx` | |
| `src/components/UnifiedDock/dock.css` | toàn bộ CSS dock |

### Sửa
| File | Thay đổi |
|---|---|
| `src/components/Canvas.tsx` | Bỏ `<PenPalette/>`, `<FloatingToolbar editor={editor}/>`, import tương ứng. Thêm `<UnifiedDock editor={editor}/>` bên trong `nib-stage` (sibling của `nib-canvas`). |
| `src/components/icons.tsx` | Thêm: `IconDragHandle` (6 dots), `IconChevronDown` (▾ 8×8), `IconCornerMark` (▿ 6×6 flyout indicator), `IconKeyboard` (kbd mode), `IconPan` (hand/pan), `IconRectSelect` (dashed rect), `IconLasso` (nếu chưa có), `IconNib` (nib/pen ngòi), `IconMarker`, `IconEraser`, `IconTextSize`, `IconStrokeSize` |
| `src/locales/en.json` | Thêm tất cả `dock.*` keys (xem mục d) |
| `src/locales/vi.json` | Thêm tất cả `dock.*` keys (xem mục d) |

### Xóa (sau Session 2.1 confirm chạy ổn)
| File | Lý do |
|---|---|
| `src/components/FloatingToolbar.tsx` | Dock là nơi duy nhất — dock-handoff.md §2.1 + HTML v2 thắng |
| `src/components/PenPalette.tsx` | Bị thay thế bởi UnifiedDock |
| `src/components/toolbar.css` | CSS của FloatingToolbar |
| `src/components/pen.css` | CSS của PenPalette |

> ⚠️ Xóa chỉ sau khi Session 2.1 gate pass (tsc + build 0 error). Không xóa trước để có fallback nếu cần.

---

## i18n keys mới — namespace `dock.*` (d)

Dưới đây là bảng đầy đủ, dùng cho **en.json** (cột EN) và **vi.json** (cột VI):

| Key | EN | VI |
|---|---|---|
| `dock.label` | `"Tool Dock"` | `"Thanh công cụ"` |
| `dock.mode_toggle_title` | `"Type ↔ Pen"` | `"Gõ ↔ Bút"` |
| `dock.drag_handle` | `"Drag to move"` | `"Kéo để di chuyển"` |
| `dock.ptr_title` | `"Pointer / Pan"` | `"Con trỏ / Kéo giấy"` |
| `dock.sel_title` | `"Selection"` | `"Vùng chọn"` |
| `dock.pen_title` | `"Pen type"` | `"Loại bút"` |
| `dock.size_stroke` | `"Stroke size"` | `"Cỡ nét"` |
| `dock.size_font` | `"Font size"` | `"Cỡ chữ"` |
| `dock.color_ink` | `"Ink color"` | `"Màu mực"` |
| `dock.convert` | `"Convert"` | `"Chuyển dạng"` |
| `dock.format` | `"Format"` | `"Định dạng"` |
| `dock.calc` | `"Calculate"` | `"Tính"` |
| `dock.collapse` | `"Collapse dock"` | `"Thu gọn"` |
| `dock.expand` | `"Expand dock"` | `"Mở rộng"` |
| `dock.ptr_cursor` | `"Cursor"` | `"Con trỏ"` |
| `dock.ptr_pan` | `"Pan canvas"` | `"Kéo thả giấy"` |
| `dock.ptr_flyout_header` | `"Pointer"` | `"Con trỏ"` |
| `dock.sel_rect` | `"Rectangle"` | `"Chữ nhật"` |
| `dock.sel_lasso` | `"Free lasso"` | `"Lasso tự do"` |
| `dock.sel_flyout_header` | `"Selection"` | `"Vùng chọn"` |
| `dock.pen_nib` | `"Nib pen"` | `"Bút ngòi"` |
| `dock.pen_marker` | `"Marker"` | `"Bút nhớ"` |
| `dock.pen_eraser` | `"Stroke eraser"` | `"Tẩy nét"` |
| `dock.pen_flyout_header` | `"Pen type"` | `"Loại bút"` |
| `dock.size_thin` | `"Thin · 2px"` | `"Mảnh · 2px"` |
| `dock.size_medium_stroke` | `"Medium · 4px"` | `"Vừa · 4px"` |
| `dock.size_thick` | `"Thick · 6px"` | `"Đậm · 6px"` |
| `dock.size_small_font` | `"Small · 14px"` | `"Nhỏ · 14px"` |
| `dock.size_medium_font` | `"Medium · 18px"` | `"Vừa · 18px"` |
| `dock.size_large_font` | `"Large · 24px"` | `"Lớn · 24px"` |
| `dock.format_flyout_header` | `"Format"` | `"Định dạng"` |

**Tái dùng (không cần key mới):**
- `toolbar.bold`, `toolbar.italic`, `toolbar.underline`, `toolbar.strike` → dùng trong FormatFlyout B/I/U/S.
- `toolbar.to_math`, `toolbar.to_text` → tooltip của Convert (context-aware).

---

## Mapping token HTML → tokens.css app (e)

| HTML token (ref.html) | App token (tokens.css) | Ghi chú |
|---|---|---|
| `--sw-teal` | `--swatch-teal` | rename trong dock.css |
| `--sw-blue` | `--swatch-blue` | |
| `--sw-green` | `--swatch-green` | |
| `--sw-red` | `--swatch-red` | |
| `--sw-purple` | `--swatch-purple` | |
| `--sw-rose` | `--swatch-rose` | |
| `--sw-orange` | `--swatch-orange` | |
| `--sw-slate` | `--swatch-slate` | |
| `--sh1` | `--shadow-1` | rename |
| `--sh2` | `--shadow-2` | rename |
| `--desk` | `--bg-app` | rename (ruled paper bg) |
| `--bg-elevated` | `--bg-elevated` | ✓ same |
| `--bg-subtle` | `--bg-subtle` | ✓ same |
| `--border` | `--border` | ✓ same |
| `--accent` | `--accent` | ✓ same |
| `--accent-subtle` | `--accent-subtle` | ✓ same |
| `--ink` | `--ink` | ✓ same |
| `--result` | `--result` | ✓ same |
| `--text-secondary` | `--text-secondary` | ✓ same |
| `--text-muted` | `--text-muted` | ✓ same |
| `--text-on-accent` | `--text-on-accent` | ✓ same |
| `--error` | `--error` | ✓ same |

**⚠️ Pulse animation**: HTML dùng `rgba(14,124,134,.3)` hardcode trong `@keyframes tinhPulse`. Đây là `--accent` light mode. Thay bằng `color-mix(in srgb, var(--accent) 30%, transparent)` trong `dock.css` (modern browser support trong Chromium/Safari/Firefox ổn). Định nghĩa **1 keyframe duy nhất** `@keyframes nibCalcPulse`, không cần 2 variant L/D.

---

## Hành vi tương tác chi tiết theo HTML (f)

### 1. Mode cycle (cycleMode)
- Click ModeToggle → `mode = mode==='type' ? 'pen' : 'type'`, đóng mọi flyout (`openPop = null`).
- ModeIcon: `mode==='pen'` → nibIcon (diamond+line); `mode==='type'` → kbdIcon (rect+dots+spacebar).
- Hiệu ứng Format slide: `transition: max-height .24s cubic-bezier(.4,0,.2,1), opacity .2s ease`.

### 2. Collapse / Expand crossfade
- **Expand → Collapse**: `doCollapse()` → `collapsed=true`, `openPop=null`.
  - Expanded div: `opacity→0, transform: scale(.92)`, `pointer-events: none`.
  - Collapsed div (56×56): `opacity→1, transform: scale(1)`, `pointer-events: auto`.
  - Transition: `opacity .25s ease, transform .25s cubic-bezier(.4,0,.2,1)`.
  - Container `min-height`: `isExp ? '460px' : '56px'` (transition `.3s cubic-bezier(.4,0,.2,1)`).
- **Collapse → Expand**: click collapsed div → `doExpand()` → `collapsed=false`.
- Collapsed div hiển thị `penIcons[penTool]` (icon của penTool active, 36×36 trong box 56×56).

### 3. Flyout toggle (tog)
- Mỗi DockBtn có `onClick = tog(key)` → `openPop = openPop===key ? null : key`.
- FlyoutPanel animate: `opacity: open?'1':'0'`, `transform: open?'translateX(0) scale(1)':'translateX(9px) scale(.97)'`.
- `transition: opacity .15s, transform .15s`.
- `pointer-events: open?'auto':'none'`.
- Position: absolute `right: 64px` (sang trái dock), top cố định theo HTML:
  - ptr: `top: 70px`
  - sel: `top: 110px`
  - pen: `top: 150px`
  - size: `top: 234px`
  - color: `top: 274px`
  - fmt: `top: 340px`
- **Đóng flyout khi click ngoài dock**: `document.pointerdown` event + `ref` check.

### 4. Pen eraser — mode-conditional
- Trong PenTypeFlyout: `<FlyoutRow>` "Tẩy nét" chỉ render khi `mode === 'pen'`.
- Nếu `penTool === 'eraser'` và user chuyển sang `mode='type'` → `penTool` vẫn giữ 'eraser' (không auto-reset). Implementer có thể reset, nhưng HTML không reset.

### 5. Active button highlight
- DockBtn hiện `background: var(--accent-subtle)` khi đó là `openPop === key`.
- FlyoutRow hiện `background: var(--accent-subtle); color: var(--accent)` khi đó là active tool.
- ModeToggle luôn `background: var(--accent-subtle); color: var(--accent)` (theo HTML: nút này luôn có nền accent-subtle).
- CalcBtn: `background: var(--accent); color: var(--text-on-accent)`, bo `border-radius: 13px`, 44×44.

### 6. Format flyout — Gõ only
- Chỉ có B/I/U/S buttons (4 ô). HTML `<div style="display:flex;gap:5px;">` thứ 2 **rỗng** → không implement thêm gì (giữ đúng HTML).
- Kết nối tới `editor.chain().focus().toggleMark('bold/italic/underline/strike').run()` (giống FloatingToolbar cũ).

### 7. Tính button
- Luôn visible, không disabled trong dock (theo HTML).
- Click → gọi `evalBlock(editor, activeBlockId)` nếu `activeBlockId !== null`. Nếu null → no-op (hoặc toast "Chọn một block để tính" — cân nhắc implementation detail).
- Style: `background: var(--accent)`, `border-radius: 13px`, 44×44, `box-shadow: var(--shadow-1)`.
- Pulse animation `nibCalcPulse` — apply khi block đang EVALUATING state (implementation detail).

### 8. Convert button
- Gọi `editor.commands.convertNibBlock(activeBlockId)` nếu có activeBlockId.
- Luôn visible (không context-sensitive trong dock v2).

### 9. DragHandle
- `cursor: grab`, `pointer-events: auto`.
- Phase 0: **không implement drag-to-reposition** (dock cố định `position: absolute; right: 0; top: 0` trong `nib-stage`). DragHandle render nhưng không có drag logic. Sẽ thêm ở Phase sau nếu cần.

---

## Cách wire vào Canvas.tsx (g)

```
Trước (Canvas.tsx):
  import { FloatingToolbar } from './FloatingToolbar'
  import { PenPalette } from './PenPalette'
  ...
  <div className="nib-stage">
    <div className="nib-canvas" ...>
      ...
    </div>
    <PenPalette />         ← xóa
  </div>
  <FloatingToolbar editor={editor} />   ← xóa

Sau (Canvas.tsx):
  import { UnifiedDock } from './UnifiedDock'
  ...
  <div className="nib-stage" style={{ position: 'relative' }}>
    <div className="nib-canvas" ...>
      ...
    </div>
    <UnifiedDock editor={editor} />    ← thêm vào đây
  </div>
  {/* FloatingToolbar đã xóa */}
```

`UnifiedDock` props:
```typescript
interface UnifiedDockProps {
  editor: Editor | null;  // từ useEditor() trong Canvas
}
```

Dock đặt `position: absolute; right: 14px; top: 14px` trong `nib-stage` (CSS trong dock.css, không inline).

---

## Pipeline 2 phase / 3 session

```
[Phase 1] Static shell + CSS  ────────────► dock render đúng visual (browser)
                                                     │
[Phase 1] State machine + flyouts ────────────► tương tác đầy đủ (browser)
                                                     │
[Phase 2] Editor wire + cleanup ──────────────► Tính/Convert hoạt động; old files xóa
```

---

## Phase 1 — Static Shell + State Machine

**Mục tiêu**: Dựng toàn bộ component tree + CSS + state machine. Dock render đúng trong Vite dev. Tất cả flyout animate. Format slide-in/out. Collapse/expand crossfade.

### Session 1.1 — Scaffold file + static render

- **Scope**:
  - Tạo thư mục `src/components/UnifiedDock/` + tất cả file `.tsx` + `dock.css`.
  - Thêm các icon còn thiếu vào `src/components/icons.tsx`: `IconDragHandle`, `IconChevronDown`, `IconCornerMark`, `IconKeyboard`, `IconPan`, `IconRectSelect`, `IconNib`, `IconMarker`, `IconEraser`, `IconTextSize`, `IconStrokeSize`. SVG paths lấy từ HTML ref (đã có sẵn ở lines 263–296).
  - Thêm toàn bộ `dock.*` i18n keys vào `en.json` + `vi.json` (bảng mục d).
  - Implement `dock.css`: dock shell 56px wide, bo 18px, `var(--bg-elevated)`, `var(--border)`, `var(--shadow-2)`. Map token theo bảng mục e (dùng `var(--swatch-*)`, `var(--shadow-*)`, không hardcode hex). `@keyframes nibCalcPulse` dùng `color-mix(in srgb, var(--accent) 30%, transparent)`.
  - `UnifiedDock.tsx`: khởi tạo state với default values, chưa wire logic → render static expanded dock với tất cả buttons/dividers đúng thứ tự HTML.
  - Mount tạm: thêm `<UnifiedDock editor={null} />` vào `Canvas.tsx` (giữ lại FloatingToolbar + PenPalette song song cho đến Session 2.1).

- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + Vite dev: dock hiển thị đúng visual bên phải canvas (56px, tất cả nút đúng thứ tự, màu từ CSS var, console 0 error).

- **Output artifact**: `src/components/UnifiedDock/` (tất cả file), icons mới trong `icons.tsx`, i18n keys trong `en.json`+`vi.json`.

### Session 1.2 — State machine + flyouts + animations

- **Scope**:
  - Wire tất cả `onClick` handler trong `UnifiedDock.tsx` (cycleMode, doCollapse, doExpand, tog(k), setCursor/setPan, setRect/setLasso, setNib/setMarker/setEraser, toggleSizePop, toggleColorPop, toggleFmtPop).
  - `FlyoutPanel.tsx`: nhận `open: boolean` prop → apply opacity/transform transition đúng theo HTML spec.
  - Mode toggle: modeIcon đổi theo `mode` state + ModeToggle style `accent-subtle` luôn.
  - Collapse/expand crossfade: expanded div fade out khi `collapsed=true`; collapsed div (56×56) fade in.
  - Format button slide-in: `max-height 0↔46px + opacity 0↔1` theo `mode`.
  - Active highlight: DockBtn `background: var(--accent-subtle)` khi `openPop===key`; FlyoutRow highlight khi là active tool.
  - Eraser conditional: render "Tẩy nét" row trong PenTypeFlyout chỉ khi `mode==='pen'`.
  - SizeFlyout: render pen rows khi `mode==='pen'`, type rows khi `mode==='type'`. Hardcoded 3 rows mỗi loại (Phase 0: chưa wire state, mỗi row `onClick` chỉ `setSize` / tương lai).
  - ColorFlyout: render 8 swatch circles dùng `--swatch-*` token, active swatch có double-ring `box-shadow` (theo HTML line 172).
  - Persist `mode` + `collapsed` vào localStorage.
  - Outside-click → `setOpenPop(null)` qua `useEffect` + `document.pointerdown`.

- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + Vite dev: (1) bấm ModeToggle → icon đổi + format btn slide in/out; (2) bấm flyout btn → flyout mở có animation; (3) click ngoài dock → flyout đóng; (4) bấm collapse → dock thu gọn 56×56 + expand lại; (5) console 0 error.

- **Output artifact**: `UnifiedDock.tsx` + sub-components hoàn chỉnh logic.

---

## Phase 2 — Editor Wire + Old File Cleanup

**Mục tiêu**: Kết nối Tính/Convert/Format với editor actions thật. Xóa FloatingToolbar + PenPalette. App chạy với dock duy nhất.

### Session 2.1 — Wire editor actions + cleanup

- **Scope**:
  - `CalcBtn.tsx`: nhận `editor: Editor | null` + `activeBlockId: string | null` (từ `useEditorContext()`). Click → `evalBlock(editor, activeBlockId)` nếu cả 2 không null.
  - `UnifiedDock.tsx` → `FormatFlyout`: truyền `editor` prop → B/I/U/S buttons gọi `editor.chain().focus().toggleMark('bold'|'italic'|'underline'|'strike').run()`. (Reuse logic từ FloatingToolbar cũ.)
  - Convert button: `onClick → editor.commands.convertNibBlock(activeBlockId)` nếu có `activeBlockId`.
  - `Canvas.tsx`: xóa import + mount `<FloatingToolbar>` + `<PenPalette>`. `<UnifiedDock editor={editor} />` là duy nhất.
  - Xóa `src/components/FloatingToolbar.tsx`, `PenPalette.tsx`, `toolbar.css`, `pen.css`.
  - Verify `tsc --noEmit` 0 error sau khi xóa (không còn import nào trỏ tới file đã xóa).
  - Smoke test vòng gõ→Tính: gõ block `x^2` → bấm Tính ở dock → kết quả mock hiện inline.

- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + Vite dev: (1) vòng "gõ 1 block → bấm Tính ở dock → kết quả mock symbolic inline" chạy được; (2) Format B/I/U/S hoạt động trên text block; (3) Convert hoạt động trên math block; (4) không còn FloatingToolbar/PenPalette nào trong UI; (5) console 0 error.

- **Output artifact**: `Canvas.tsx` cleaned, 4 file cũ xóa, `UnifiedDock` fully wired.

---

## Outcome cuối

Sau Session 2.1: app Vite dev có **1 dock duy nhất** bên phải canvas, đủ flyout + animation theo spec HTML v2, Tính/Convert/Format hoạt động, `tsc` + `npm run build` 0 error, console 0 error, i18n en↔vi pass.

---

---

## Phase 3 — Drag-to-reposition + Overflow-aware Expand/Flyout

**Mục tiêu**: Dock kéo thả tự do trên viewport (cả mở rộng lẫn thu gọn); expand tự chọn hướng lên/xuống theo khoảng trống; flyout lật/dịch khi sắp tràn đáy viewport.

### Thiết kế vị trí (positioning model)

Thay đổi căn bản: dock chuyển từ `position: absolute` trong `nib-stage` sang **`position: fixed` + `createPortal(…, document.body)`**. Lý do: drag tự do toàn viewport, không bị clip bởi nib-stage overflow, flyout không bị z-index conflict.

**Anchor model (cấu trúc DOM mới):**

```
createPortal → document.body
  └── .nib-dock-anchor  (position: fixed; left: pos.x; top: pos.y; width: 56px; height: 56px)
        ├── .nib-dock__expanded  (position: absolute; right: 0; top/bottom: 0 theo expandDir)
        └── .nib-dock__collapsed  (position: absolute; top: 0; right: 0)
```

- `pos.{x, y}` = tọa độ **góc trên-trái** của collapsed anchor (≈ góc trên-phải dock vì width=56px) trên viewport.
- **Default**: `{ x: window.innerWidth - 56 - 14, y: 14 }` — giữ đúng vị trí hiện tại (right: 14px, top: 14px).
- **Persist**: localStorage key `nib-dock-pos` → JSON `{ x: number, y: number }`.

**Expand direction (diễn giải yêu cầu user):**

> User: *"khi mở rộng có animation dần kéo xuống, khi đạt đến limit animation sẽ thành dần kéo lên"*  
> → Không phải 2 animation nối tiếp; mà: **chọn hướng mở rộng theo khoảng trống trước khi bắt đầu animation**.

```
DOCK_EXPANDED_H = 460   (px, constant)

doExpand():
  spaceBelow = window.innerHeight - pos.y
  expandDir  = (spaceBelow >= DOCK_EXPANDED_H) ? 'down' : 'up'
  setCollapsed(false)
```

| `expandDir` | CSS | Mô tả |
|---|---|---|
| `'down'` (default) | `.nib-dock__expanded { top: 0; bottom: auto }` | Mở xuống từ pos.y (default) |
| `'up'` | `.nib-dock__expanded { bottom: 0; top: auto }` | Mở lên từ pos.y + 56 |

Animation (không đổi): `opacity 0↔1 + scale .92↔1` + container `min-height 56↔460` như Phase 1.

**Flyout position (overflow-aware):**

Flyout hiện dùng `top` hardcode (CSS: `top: 70/110/150/234/274/340px`). Phase 3 xóa hardcode → **tính JS tại thời điểm flyout mở**:

```
FLYOUT_HEIGHTS: { ptr:90, sel:90, pen:130, size:115, color:130, fmt:90 }  (px, ước lượng)

tog(k)() được gọi:
  btnRect = btnRefs[k].current.getBoundingClientRect()
  expRect = expandedRef.current.getBoundingClientRect()
  topRel  = btnRect.top - expRect.top          // top của nút trong expanded div
  flyoutH = FLYOUT_HEIGHTS[k]
  fits    = (expRect.top + topRel + flyoutH) < window.innerHeight - 8
  flyoutStyle[k] = fits
    ? { top: topRel }                           // mở xuống
    : { top: topRel + btnH - flyoutH }          // lật lên (clamp tới 0 nếu vẫn overflow đỉnh)
```

`btnH` = chiều cao nút DockBtn (~40px). Truyền `style` prop xuống `FlyoutPanel` để override `top`.

---

### File đụng tới — Phase 3

| File | Thay đổi |
|---|---|
| `src/components/UnifiedDock/UnifiedDock.tsx` | createPortal, pos state + drag handlers, expandDir logic, flyoutStyle computation, btnRefs |
| `src/components/UnifiedDock/DragHandle.tsx` | Nhận `onPointerDown` prop + `touch-action: none` |
| `src/components/UnifiedDock/FlyoutPanel.tsx` | Thêm optional `style?: React.CSSProperties` prop |
| `src/components/UnifiedDock/dockState.ts` | Thêm `DOCK_POS_KEY`, `parsePos()`, `clampPos()` |
| `src/components/UnifiedDock/dock.css` | `.nib-dock-anchor` (fixed), xóa `top/right` khỏi `.nib-dock`, xóa `top` hardcode trong `.nib-dock__flyout--*`, thêm `[data-expand-up]` + `[data-dragging]` rules |
| `src/components/Canvas.tsx` | Xóa mount `<UnifiedDock>` khỏi JSX (dock tự portal ra body) HOẶC giữ mount + dock tự portal bên trong — xem note bên dưới |

> **Note Canvas.tsx**: Giữ `<UnifiedDock editor={editor}/>` trong Canvas JSX (để nhận editor prop và EditorContext). Bên trong UnifiedDock dùng `createPortal` để render DOM ra body. Component tree React vẫn là con của Canvas → EditorContext hoạt động bình thường.

---

### Session 3.1 — Drag-to-reposition

- **Scope**:
  - `dockState.ts`: thêm `DOCK_POS_KEY = 'nib-dock-pos'`; hàm `parsePos(raw: string | null): {x:number; y:number}` (parse JSON, fallback `{ x: window.innerWidth - 70, y: 14 }`); hàm `clampPos(x, y, vw, vh): {x,y}` (giới hạn: `x ∈ [0, vw-56]`, `y ∈ [0, vh-56]`).
  - `UnifiedDock.tsx`:
    - State mới: `pos: {x:number; y:number}` (khởi từ `parsePos(localStorage.getItem(DOCK_POS_KEY))`); `isDragging: boolean` (default `false`).
    - `dragOrigin = useRef<{px:number; py:number; x:number; y:number} | null>(null)` — ghi điểm bắt đầu drag.
    - `handleDragStart(e: React.PointerEvent)`: `e.currentTarget.setPointerCapture(e.pointerId)`, lưu `dragOrigin = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y }`, `setIsDragging(true)`.
    - `handleDragMove(e: React.PointerEvent)` (chỉ khi `dragOrigin !== null`): `newX = dragOrigin.x + (e.clientX - dragOrigin.px)`, `newY = dragOrigin.y + (e.clientY - dragOrigin.py)`, `setPos(clampPos(newX, newY, vw, vh))`.
    - `handleDragEnd`: `dragOrigin.current = null`, `setIsDragging(false)`, ghi localStorage (không debounce — chỉ ghi khi thả).
    - `window.resize`: `useEffect` → `setPos(p => clampPos(p.x, p.y, vw, vh))`.
    - Wrap render trong `createPortal(…, document.body)`. Thay `<div className="nib-dock" …>` → `<div className="nib-dock-anchor" style={{ left: pos.x, top: pos.y }} data-dragging={isDragging || undefined}>`. Giữ `.nib-dock__expanded` + `.nib-dock__collapsed` bên trong anchor.
    - Collapsed square: cũng nhận drag (ngoài click expand). Gắn `onPointerDown={handleDragStart}` + `onPointerMove={handleDragMove}` + `onPointerUp={handleDragEnd}` + `onPointerCancel={handleDragEnd}`. Phân biệt drag vs click: nếu tổng delta < 4px → `doExpand()`.
  - `DragHandle.tsx`: nhận thêm props `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` (typed `React.PointerEventHandler<HTMLDivElement>`) → gắn lên `.nib-dock__drag`.
  - `dock.css`:
    - Xóa `position: absolute; top: 14px; right: 14px; z-index: 30` khỏi `.nib-dock`.
    - Thêm `.nib-dock-anchor { position: fixed; z-index: 30; width: 56px; height: 56px; }`.
    - Thêm `.nib-dock__drag { touch-action: none; cursor: grab; }` (touch-action đã có cursor, bổ sung touch-action).
    - Thêm `.nib-dock-anchor[data-dragging] { }` → `.nib-dock-anchor[data-dragging] * { transition: none !important; user-select: none; }` (tắt mọi transition khi kéo, tránh lag).
    - `.nib-dock__expanded` + `.nib-dock__collapsed` vẫn `position: absolute; right: 0; top: 0` (không đổi).

- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + Vite dev kiểm tra tay (hoặc bởi lead): (1) kéo DragHandle → dock di chuyển theo tay mượt; (2) kéo collapsed square (delta ≥ 4px) → dock di chuyển, không expand; (3) tap nhẹ collapsed square (delta < 4px) → expand; (4) kéo tới mép viewport → bị clamp, không thoát ra ngoài; (5) reload → dock hiện đúng vị trí cũ; (6) thu nhỏ cửa sổ → dock re-clamp vào trong; (7) `vitest` pass (nếu có test `clampPos`, `parsePos`); (8) console 0 error.

- **Output artifact**: `dockState.ts` (thêm 3 fn), `UnifiedDock.tsx` (pos + drag logic + portal), `DragHandle.tsx` (drag props), `dock.css` (anchor class + dragging rule).

---

### Session 3.2 — Overflow-aware expand direction + flyout flip

- **Scope**:
  - `UnifiedDock.tsx`:
    - State mới: `expandDir: 'down' | 'up'` (default `'down'`).
    - `doExpand()` (cập nhật): trước `setCollapsed(false)`, tính `spaceBelow = window.innerHeight - pos.y`, `newDir = spaceBelow >= 460 ? 'down' : 'up'`, `setExpandDir(newDir)`.
    - Truyền `expandDir` xuống expanded div: `data-expand-up={expandDir === 'up' || undefined}`.
    - State mới: `flyoutStyle: Partial<Record<PopKey, React.CSSProperties>>` (default `{}`).
    - `btnRefs`: `const btnRefs = useRef<Partial<Record<PopKey, HTMLElement>>>({})` + truyền `ref callback` xuống mỗi DockBtn.
    - `expandedRef = useRef<HTMLDivElement>(null)` trỏ đến `.nib-dock__expanded`.
    - `tog(k)()` (cập nhật): sau `setOpenPop(...)`, nếu đang mở (không phải toggle off): tính `flyoutStyle[k]` theo công thức overflow-aware ở trên. `setFlyoutStyle(...)`.
    - Nếu `expandedRef.current` chưa render (null) → fallback `top: 0` (an toàn).
  - `DockBtn.tsx`: nhận thêm optional `btnRef?: (el: HTMLElement | null) => void` prop → `ref={btnRef}` trên root element.
  - `FlyoutPanel.tsx`: nhận thêm optional `style?: React.CSSProperties` → spread vào root div (override CSS `top`).
  - `dock.css`:
    - Thêm `.nib-dock__expanded[data-expand-up] { top: auto; bottom: 0; }` (expand upward).
    - Xóa `top: Xpx` hardcode khỏi `.nib-dock__flyout--ptr`, `.nib-dock__flyout--sel`, `.nib-dock__flyout--pen`, `.nib-dock__flyout--size`, `.nib-dock__flyout--color`, `.nib-dock__flyout--fmt` (chỉ giữ `width`).
    - Thêm `.nib-dock__flyout { top: 0; }` làm fallback (khi JS chưa tính được).

- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + Vite dev kiểm tra tay: (1) dock ở góc dưới-phải (drag xuống thấp) → bấm expand trên collapsed square → dock mở **lên**, không overflow đáy viewport; (2) dock ở góc trên-phải → bấm expand → dock mở **xuống** bình thường; (3) dock mở rộng, bấm flyout nút gần đáy dock (size/color/fmt) → flyout không tràn viewport, lật lên hoặc clamp; (4) bấm flyout nút gần đỉnh dock (ptr/sel/pen) → flyout mở xuống bình thường; (5) `npm run build` + `tsc` + `vitest` pass; (6) console 0 error.

- **Output artifact**: `UnifiedDock.tsx` (expandDir + flyoutStyle + btnRefs), `DockBtn.tsx` (btnRef prop), `FlyoutPanel.tsx` (style prop), `dock.css` (data-expand-up rule, xóa top hardcode).

---

## Outcome cuối (Phase 3)

Sau Session 3.2: dock kéo thả mượt trên toàn viewport (cả expanded lẫn collapsed), vị trí persist qua reload, clamp không thoát viewport; expand tự chọn hướng lên/xuống theo khoảng trống; flyout không tràn viewport. `tsc` + `npm run build` + `vitest` 0 error.

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-14 | Initial | Dựa trên Nib-Dock-v2-ref.html (source of truth), dock-handoff.md, Canvas.tsx, tokens.css |
| 2026-06-14 | Phase 3 thêm vào | User yêu cầu drag-to-reposition + overflow-aware expand/flyout |
