# INDEX — Thư viện tham chiếu thiết kế Nib

> **Dành riêng cho agent `design`** (và lead khi review mockup).  
> Đây là MỤC LỤC CÓ HƯỚNG DẪN — đọc file này trước tiên, sau đó tra đúng file theo loại việc.  
> **Nguồn chân lý cuối cùng** = code thật trong `src/` (tokens.css, component CSS).  
> Nếu thấy mâu thuẫn giữa thư viện này và `src/` → `src/` thắng; báo lead cập nhật thư viện.

---

## Cây thư mục thư viện

```
.claude/design-library/
├── INDEX.md                     ← BẠN ĐANG ĐỌC — đọc đầu tiên mọi task
├── tokens.md                    ← Catalog CSS token (light+dark) + "khi nào dùng"
├── components.md                ← Danh mục component Nib + class CSS + cách tái dùng
├── patterns/
│   ├── overlay.md               ← Blueprint overlay (Library/Settings): scrim+panel centered+header Back
│   ├── dock-drill-down.md       ← Blueprint dock dọc NAV↔TOOLS drill-down
│   └── ruled-paper-canvas.md   ← Blueprint canvas giấy kẻ ngang + block toán
└── snippets/
    ├── overlay-panel.html       ← Snippet copy-được cho màn overlay mới
    ├── dock-nav-level.html      ← Snippet copy-được cho dock NAV level
    └── ruled-paper-canvas.html  ← Snippet copy-được cho canvas layout
```

---

## Thứ tự đọc khi bắt đầu 1 task design

### Bước 1 — Nắm token (BẮT BUỘC mọi task)

Đọc `tokens.md`:
- §1–§2 (màu chủ đạo + trạng thái) — biết accent/result/approx/error dùng khi nào.
- §5 (spacing `--space-*`) — dùng đúng khoảng cách, không hardcode px.
- §6 (typography `--font-size-*`) — dùng đúng cỡ chữ theo vị trí (UI/doc/math).

**Quy tắc bất biến:** CẤM hex rời (`#xxxxxx`, `rgba(...)`) — mọi màu qua `var(--token)`.

### Bước 2 — Xác định pattern phù hợp

Tra bảng "Phân loại pattern" bên dưới → đọc file pattern tương ứng.

### Bước 3 — Lấy snippet nền

Đọc `snippets/<tên-gần-nhất>.html` → copy toàn bộ, chỉnh `data-i18n` key + token cho đúng màn.  
Snippet đã đảm bảo: link đúng `tokens.css`, dùng `var(--...)`, `data-i18n` (không hardcode text), ≥1024px landscape.

### Bước 4 — Kiểm component đã có

Đọc `components.md` → nếu component Nib đã tồn tại (`UnifiedDock`, `LibraryOverlay`, `SettingsOverlay`…) → dùng class CSS y hệt, không tự đặt tên class mới cho cùng component.

### Bước 5 — Verify fidelity + 0 hex trước khi nộp (STOP gate)

```bash
# 1. 0 hex rời (bắt buộc):
grep -rnE "#[0-9a-fA-F]{3,8}" docs/design-artifacts/<file-mockup>
# kỳ vọng: RỖNG

# 2. Không có class bịa nib-demo (bắt buộc):
grep -n "nib-demo" docs/design-artifacts/<file-mockup>
# kỳ vọng: RỖNG

# 3. Đã link CSS component thật (bắt buộc):
grep -n "src/components" docs/design-artifacts/<file-mockup>
# kỳ vọng: ≥1 match

# 4. Class trong snippet tồn tại trong src/ (bắt buộc):
# Ví dụ kiểm class nib-library__panel:
grep -rn "nib-library__panel" src/components/
# kỳ vọng: ≥1 match (class thật có trong CSS được link)
```

Nếu có hex → thay bằng `var(--token)`. Nếu có class bịa → đối chiếu src/ và dùng class thật.
**Visual match = USER smoke** (browser automation không hoạt động với background agent — ISSUE-8/13):
nộp structural-fidelity evidence (grep pass) + checklist cho user mở `file://` hoặc `npm run dev` đối chiếu.

---

## Phân loại pattern → file cần đọc

| Loại màn / UI | File pattern | Snippet nền |
|---|---|---|
| Overlay lớn (Library / Settings / dialog fullscreen) | `patterns/overlay.md` | `snippets/overlay-panel.html` |
| Dock dọc (NAV level hoặc TOOLS level) | `patterns/dock-drill-down.md` | `snippets/dock-nav-level.html` |
| Canvas giấy kẻ ngang + block toán | `patterns/ruled-paper-canvas.md` | `snippets/ruled-paper-canvas.html` |
| Popover / dropdown nhỏ (sort, context menu) | `components.md` §5 | Tái dùng `.nib-lib-sort` / `.nib-lib-ctx` |
| Form field / input (Settings sections) | `components.md` §6 | Tái dùng `.nib-settings-field` |
| Delete / confirm modal | `components.md` §7 | Tái dùng `.nib-lib-delete` |

---

## Quy ước copy snippet & thay token

### Khi copy snippet HTML vào docs/design-artifacts/:

1. **Link tokens.css VÀ CSS component thật (BẮT BUỘC):**
   ```html
   <!-- tokens.css luôn đứng đầu -->
   <link rel="stylesheet" href="../../src/styles/tokens.css">
   <!-- THÊM: CSS của từng component Nib dùng trong mockup -->
   <link rel="stylesheet" href="../../src/components/LibraryOverlay/library-overlay.css">
   <link rel="stylesheet" href="../../src/components/UnifiedDock/dock.css">
   <link rel="stylesheet" href="../../src/components/app-shell.css">
   <link rel="stylesheet" href="../../src/components/canvas.css">
   <link rel="stylesheet" href="../../src/components/blocks.css">
   ```
   **Quy tắc:** mỗi component Nib có trong mockup → PHẢI link CSS của component đó.
   **KHÔNG** tự viết lại CSS component trong `<style>` inline — viết lại ≈ là nguồn gốc divergence
   (ISSUE-13: snippet gần-đúng-bằng-tay không khớp app thật). Chỉ cần CSS demo-setup (body, wrapper).
   Đường dẫn relative từ `docs/design-artifacts/<tên>.html`: `../../src/...`

2. **Màu = token (luôn luôn):**
   ```css
   /* SAI: */          background: #xxxxxx;
   /* ĐÚNG: */         background: var(--accent);
   ```
   Tra tên token đúng ở `tokens.md`. Không tự đặt token mới — chỉ dùng token đã tồn tại trong `src/styles/tokens.css`.

3. **Khoảng cách = spacing token:**
   ```css
   /* SAI: */          gap: 16px;
   /* ĐÚNG: */         gap: var(--space-4);
   ```

4. **Text = data-i18n (không hardcode):**
   ```html
   <!-- SAI: -->       <span>Thư viện</span>
   <!-- ĐÚNG: -->      <span data-i18n="library.title">Library</span>
   ```
   Trong mockup HTML tĩnh, giữ fallback text tiếng Anh trong nội dung thẻ, gắn `data-i18n` để
   editor-frontend wire i18n sau. Key format: `<namespace>.<key>` (vd `settings.title`, `dock.nav.library`).

5. **Frame ≥1024px landscape:**
   ```html
   <html lang="en" data-theme="light" style="min-width:1024px">
   ```
   Requirements §2 LOCKED: desktop-class landscape only. Không thiết kế breakpoint portrait/mobile.

6. **Theme demo:** thay `data-theme="light"` bằng `data-theme="dark"` để test dark mode.

### Khi mở rộng component đã có:

- Tái dùng class CSS gốc (vd `.nib-library__panel`, `.nib-dock__expanded`, `.nib-settings__panel`).
- Thêm class modifier dạng `nib-<component>__<element>--<modifier>` nếu cần variant mới.
- Không dùng `!important` (trừ override animation pattern đã có trong `dock.css`).
- Không ghi đè class gốc — thêm class phụ bên cạnh nếu cần tuỳ chỉnh cục bộ.

---

## Nguyên tắc 3 req nền [LOCKED] (kiểm trước khi nộp mockup)

| Req | Kiểm bằng cách |
|---|---|
| **Song ngữ en/vi** — mọi string qua `data-i18n` | `grep -c "data-i18n" <file>` ≥ số chuỗi hiển thị; không có text "hardcoded" (không phải placeholder) |
| **Thiết bị desktop-class** — min 1024px landscape, hit target ≥44px | Xem `<html style="min-width:1024px">`; nút tương tác có `min-height:44px` hoặc `height:44px` |
| **Theme light/dark** — 0 hex rời | `grep -rnE "#[0-9a-fA-F]{3,8}" <file>` = rỗng |

---

## MAPPING src ↔ design-library (dùng để đồng bộ khi editor-frontend sửa UI/UX)

> **Mục đích**: khi `editor-frontend` thay đổi DOM/structure/icon của component có trong bảng dưới → phải cập nhật file design-library tương ứng trong CÙNG task. Style token tự sync (snippet đã link CSS thật); chỉ DOM/icon/class là copy tĩnh cần sửa tay.

| Component | File src chính | File design-library phải sync |
|---|---|---|
| **UnifiedDock** | `src/components/UnifiedDock/UnifiedDock.tsx` `NavLevel.tsx` `DragHandle.tsx` `DockBtn.tsx` `dock.css` | `snippets/dock-nav-level.html` + `components.md §1` |
| **LibraryOverlay** | `src/components/LibraryOverlay/LibraryOverlay.tsx` `LibraryToolbar.tsx` `DocCard.tsx` `library-overlay.css` | `snippets/overlay-panel.html` + `components.md §2` |
| **Canvas / TopStrip** | `src/components/Canvas.tsx` `TopStrip.tsx` `canvas.css` `app-shell.css` `blocks.css` | `snippets/ruled-paper-canvas.html` + `components.md §5` |
| **SettingsOverlay** | `src/components/SettingsOverlay/SettingsOverlay.tsx` `settings-overlay.css` | `components.md §3` *(no snippet)* |
| **CommandPalette** | `src/components/CommandPalette.tsx` `palette.css` | `components.md §6` *(no snippet)* |
| **NibBlock (NodeView)** | `src/components/canvas.css` `blocks.css` | `components.md §7` *(tái dùng §5 Canvas)* |
| **icons.tsx** | `src/components/icons.tsx` | Mọi snippet dùng inline SVG → cập nhật `viewBox/d` khi icon thay đổi |

**Trigger sửa design-library**: thay đổi là UI/UX (DOM structure / class name / icon / thêm-bớt element), KHÔNG phải logic thuần (state machine / event handler / performance). Khi không chắc → sửa luôn cho an toàn.

**Cách re-verify nhanh** (sau khi cập nhật snippet):
```bash
# Serve từ REPO ROOT — KHÔNG --directory snippets:
# link ../../../src/... trong snippet cần resolve từ root, http.server sẽ 404 nếu serve từ subfolder.
# cwd: /home/gnuh/Documents/project/Nib
python3 -m http.server 8081
# Mở: http://localhost:8081/.claude/design-library/snippets/<tên-snippet>.html
# So sánh side-by-side với app thật (npm run dev :1420)
```

---

## Không làm

> **Lưu ý audit:** 8 skill gsap-* (`.claude/skills/gsap-*`): **GIỮ chủ đích** — sẽ dùng khi nâng cấp animation sau (user chốt 2026-06-20); KHÔNG flag là dead trong audit.

| Không làm | Vì sao |
|---|---|
| Hardcode hex màu (`#xxxxxx`) | Vi phạm token contract — thay bằng `var(--accent)` |
| Tự đặt tên class mới cho component đã có | Phân kỳ với `src/` thật → editor-frontend sửa lại |
| Thiết kế dưới 1024px / portrait | requirements.md §2 LOCKED |
| Hardcode text EN/VI | Dùng `data-i18n` — string quản lý ở `src/locales/{en,vi}.json` |
| Sửa bất kỳ file nào trong `src/` | Chỉ đọc — ghi `src/` là việc editor-frontend |
| Dùng `!important` tùy tiện | Chỉ khi override transition/animation (pattern đã có) |
| Tự đặt token mới (vd `--my-color`) | Chỉ dùng token đã có trong `src/styles/tokens.css` |
| **Sửa UI/UX component có mapping mà KHÔNG cập nhật snippet** | design-library stale → artifact sau dùng DOM sai → redo lại (bài học ISSUE-13) |
