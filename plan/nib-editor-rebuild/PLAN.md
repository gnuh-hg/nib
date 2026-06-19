# PLAN — Nib Editor Rebuild (khớp design HTML)

> **Goal**: Sau 5 session, toàn bộ UI editor (header bar, sidebar rail, library overlay, canvas/paper) khớp pixel-level với `Nib Editor.dc.html` là file nguồn chân lý — `npm run build` exit 0, `tsc --noEmit` 0 error, vitest pass, vòng lõi "gõ 1 block → kết quả symbolic mock inline" không vỡ.

---

## Context

### Vì sao chia nhiều session

Có 4 vùng conflict/missing với độ phức tạp và rủi ro khác nhau, phụ thuộc nhau theo thứ tự rõ ràng:
1. **Tokens** — nền tảng, mọi vùng sau đều phụ thuộc CSS token đúng trước.
2. **Header** — độc lập tương đối, chỉ cần tokens xong.
3. **Canvas/Paper re-layout** — rủi ro kiến trúc cao nhất (desk wrapper + paper container + geometry.ts ref fix); phải xong trước sidebar vì rail đẩy layout.
4. **Sidebar Rail** — phụ thuộc canvas layout ổn định + onToggleRail prop từ header.
5. **Library Overlay** — phụ thuộc sidebar rail state (`libOpen`); nhiều sub-component nhất.

Mỗi session ước tính 1 chat đủ chất lượng nếu scope được kiểm soát.

### File nguồn chân lý

`/home/gnuh/Downloads/Nib Editor.dc.html` — **design HTML thắng tuyệt đối** với mọi conflict. Không diễn giải lại.

### Ràng buộc [LOCKED] — áp dụng toàn bộ plan

| # | Ràng buộc | Nguồn |
|---|---|---|
| R1 | Design HTML thắng tuyệt đối khi conflict | User chốt |
| R2 | Landscape-only (≥1024px); DROP hỗ trợ portrait + sub-compact 820px | User chốt 2026-06-17 |
| R3 | KHÔNG đụng UnifiedDock (Vùng 5 — đã khớp) | User chốt |
| R4 | Token-driven: cấm raw hex literal, cấm hardcode CSS color trực tiếp | CLAUDE.md §3 + design.md |
| R5 | i18n en+vi cho **mọi** text string mới (cả label, tooltip, placeholder) | CLAUDE.md §3 + requirements.md |
| R6 | `xOffset` tính từ PAPER-left, không phải canvas-left (geometry.ts) | Researcher risk #2; architect chốt HOW |
| R7 | Vòng lõi "gõ 1 block → kết quả symbolic inline live" KHÔNG được vỡ ở bất kỳ session nào | Gate vàng CLAUDE.md §8.1 |

### Ngoài scope plan này

- Handwriting / MyScript (Phase 3 ROADMAP — chặn CC-1/CC-2/CC-3)
- FastAPI/SymPy real CAS (Phase 1 ROADMAP — plan riêng)
- Tauri shell + IPC (Phase 2 ROADMAP)
- UnifiedDock (đã khớp, không đụng)
- Multi-block cross-selection nâng cao (Phase 5 ROADMAP)

### Spec doc cần cập nhật (trong các session tương ứng)

- `docs/requirements.md` §2: đổi từ "min 1024px + sub-compact 820px" sang "landscape-only ≥1024px; portrait không hỗ trợ" — thực hiện trong S1 cùng lúc tokens.
- `src/styles/tokens.css`: thêm 3 token mới + sửa giá trị sai — thực hiện S1.

---

## Pipeline — 1 phase / 5 session

```
[S1] Tokens fix ──────────────────────────────────► tokens.css đúng + đủ 3 token mới
                                                         │
[S2] Header bar fix ──────────────────────────────► TopChrome khớp design
                                                         │
[S3] Canvas/Paper re-layout ──────────────────────► desk+paper 664 + geometry fix
                                                         │
[S4] Sidebar Rail ────────────────────────────────► <nav> animate 256↔0 hoạt động
                                                         │
[S5] Library Overlay ────────────────────────────► overlay đầy đủ (search/grid/list/sort/modal)
                                                         │
                                                    ► UI khớp design HTML end-to-end
```

---

## Phase 1 — Rebuild UI khớp design HTML

**Mục tiêu**: Tất cả 5 vùng conflict/missing (tokens, header, canvas/paper, rail, library) khớp pixel-level với `Nib Editor.dc.html`; vòng lõi không vỡ; codebase build sạch.

---

### Session 1.1 — Tokens: fix + bổ sung

**Scope**:
- Thêm 3 token còn thiếu vào `src/styles/tokens.css`:
  - `--desk`: `#DAD6CD` (light) / `#0F1113` (dark)
  - `--sheet-shadow`: `0 2px 4px rgba(20,24,40,.08),0 12px 32px rgba(20,24,40,.12)` (light) / `0 2px 6px rgba(0,0,0,.4),0 16px 40px rgba(0,0,0,.5)` (dark)
  - `--scrim`: `rgba(26,28,32,.42)` (light) / `rgba(0,0,0,.55)` (dark) — thay/alias `--overlay` cũ nếu có naming conflict (architect chốt cách rename, plan ghi nhận cần giải quyết)
- Sửa giá trị sai (design thắng): `--shadow-2`, `--bg-subtle`, `--swatch-blue`, `--swatch-purple`, `--swatch-rose`, `--swatch-orange`, `--swatch-slate` (cả light + dark)
- Cập nhật `docs/requirements.md` §2: landscape-only ≥1024px, bỏ portrait/820px

**STOP gate**:
- `tsc --noEmit` 0 error
- `npm run build` exit 0
- `vitest` pass (không regression)
- `src/styles/tokens.css` chứa đủ 3 token mới (`--desk`, `--sheet-shadow`, `--scrim`) — grep verify
- Không có hex literal mới nào được thêm vào tokens.css (chỉ dùng CSS custom property)
- `docs/requirements.md` §2 đã cập nhật landscape-only

**Output artifact**: `src/styles/tokens.css` (updated), `docs/requirements.md` (§2 updated)

---

### Session 1.2 — Header Bar: rail-toggle + bỏ virtual-keyboard

**Scope**:
- Thêm nút rail-toggle vào `TopChrome.tsx`: icon `layout-sidebar` 34×34, đặt sau separator đầu tiên, theo đúng vị trí design HTML
- Bỏ (hoặc ẩn/dời) nút virtual-keyboard khỏi header (design HTML không có)
- Thêm prop `onToggleRail: () => void` vào `TopChrome` interface
- Wire prop `onToggleRail` từ `AppShell.tsx` (hoặc component cha quản rail state) — state `railOpen` phải được khởi tạo ở đây vì Session 1.4 cần
- i18n: thêm key tooltip cho rail-toggle vào `en.json` + `vi.json`

**STOP gate**:
- `tsc --noEmit` 0 error
- `npm run build` exit 0
- `vitest` pass
- Nút rail-toggle render đúng vị trí trong header (console 0 error)
- Nút virtual-keyboard không còn hiển thị trong header
- `railOpen` state tồn tại ở AppShell level (grep `railOpen` trong component cha)
- i18n keys cho rail-toggle có trong `en.json` và `vi.json`

**Output artifact**: `src/components/TopChrome.tsx` (updated), `AppShell.tsx` (updated — state + prop), `src/i18n/en.json`, `src/i18n/vi.json`

---

### Session 1.3 — Canvas/Paper re-layout + geometry fix

**Scope**: (rủi ro cao nhất — 1 session riêng)
- Thêm desk wrapper: `data-canvas` element với `display:flex; justify-content:center; padding:30px 0; background:var(--desk)` — thay cấu trúc hiện tại `nib-canvas`
- Thêm paper container: `data-paper` 664px flex-none, `background:var(--bg-app)`, `border-radius:5px 5px 0 0`, `box-shadow:var(--sheet-shadow)`, `background:repeating-linear-gradient(...)` ruled 63px/64px
- Thêm left-margin-line: `position:absolute; left:44px; width:1px; color-mix(in srgb, var(--accent) 22%, transparent)`
- Thêm page-title: `position:absolute; left:56px; right:24px; top:0; height:64px; font-size:20px; font-weight:600`
- Thêm selection overlay (dark mode): dashed 1.5px accent + corner handles 9×9 + badge "N block"
- Thêm bottom hint pill
- **Fix geometry.ts**: `lineIndexFromY` + `xOffsetFromX` dùng ref của paper element (không phải canvas) — xOffset tính từ PAPER-left (R6)
- Đảm bảo `TipTap EditorContent` không vỡ sau khi có desk+paper wrapper

**STOP gate**:
- `tsc --noEmit` 0 error
- `npm run build` exit 0
- `vitest` pass (geometry unit test: block đặt tại PAPER-left, không canvas-left)
- Paper 664px render centered trên desk background `var(--desk)` — visible trong browser dev
- Left-margin-line visible
- `box-shadow: var(--sheet-shadow)` áp dụng lên paper — không hardcode
- **Vòng lõi**: gõ 1 block → mock CAS → kết quả symbolic mock inline hiển thị đúng vị trí trong paper (không bị lệch trái so với paper edge)
- Console 0 error

**Output artifact**: Canvas/paper component (file architect chốt tên), `src/utils/geometry.ts` (updated)

---

### Session 1.4 — Left Sidebar Rail

**Scope** (MISSING — zero code hiện tại):
- Tạo `SidebarRail.tsx`: `<nav>` animate `width: 256px ↔ 0` bằng `transition: width .22s cubic-bezier(.4,0,.2,1)`, `border-right` khi mở
- Header của rail: label "Tài liệu" (10.5px uppercase fw700 `--text-muted`) — i18n key
- Doc list items: height 44px (icon 15px + title 13px fw500 + subtitle 10.5px `--text-muted`); active = `--accent-subtle` bg + title fw700 + left-edge `span` absolute 3px `--accent`
- Footer: `border-top` + "Mở thư viện" button 40px grid-icon → emit `onOpenLibrary` — i18n key
- Wire `railOpen` (từ S1.2 AppShell state) vào SidebarRail prop; rail đẩy canvas layout (không overlay — landscape-only R2, rail 256 + paper 664 = 920 ≤ viewport ≥1024)
- i18n: tất cả label rail vào `en.json` + `vi.json`

**STOP gate**:
- `tsc --noEmit` 0 error
- `npm run build` exit 0
- `vitest` pass
- Rail mở: `width:256px`; rail đóng: `width:0` — transition 0.22s cubic-bezier(.4,0,.2,1) (kiểm tra CSS computed style)
- Active doc item render `--accent-subtle` + left-edge 3px — console 0 error
- "Mở thư viện" button render ở footer
- i18n keys rail có trong `en.json` + `vi.json`
- **Vòng lõi**: gõ 1 block → kết quả mock inline không vỡ khi rail mở/đóng

**Output artifact**: `src/components/SidebarRail.tsx` (new), `AppShell.tsx` (updated — wire rail), `en.json`, `vi.json`

---

### Session 1.5 — Library Overlay

**Scope** (MISSING — zero code hiện tại; phức tạp nhất):
- Scrim: `position:absolute; inset:0; background:var(--scrim); z-index:50` + opacity transition (open/close)
- Panel: `position:absolute; inset:8px; background:var(--bg-elevated); border-radius:14px; box-shadow:var(--shadow-2); z-index:60`
- Header: back-button 36px + "Thư viện" (15px fw700) + "Tài liệu mới" accent-button — i18n
- Toolbar: search input 36px + grid/list toggle buttons 34×32 (active = `--accent-subtle`) + sort dropdown
- Body: grid mode `grid(auto-fill minmax(195px), gap:12px)` — cards với ruled-preview 100px + title + time + `⋯` menu; list mode rows 48px
- Sort dropdown: overlay z70 + các option
- Context menu (⋯): Đổi tên / Nhân đôi / Xoá — i18n
- Delete confirm modal: width 360px, `--error` color scheme, Cancel + Xoá button — i18n
- Rename inline (renamingIdx state): input replace title text
- State: `libOpen`, `viewMode`, `sortOpen`, `ctxOpen`, `delOpen`, `renamingIdx` — sống ở AppShell level (researcher risk #4)
- Wire `onOpenLibrary` từ SidebarRail footer

**STOP gate**:
- `tsc --noEmit` 0 error
- `npm run build` exit 0
- `vitest` pass
- Library overlay mở/đóng với scrim opacity transition (console 0 error)
- Grid view + List view toggle hoạt động (viewMode state thay đổi)
- Sort dropdown mở/đóng
- Delete confirm modal hiển thị với `--error` background, Cancel đóng modal
- Context menu hiển thị với 3 option (Đổi tên / Nhân đôi / Xoá) — i18n en+vi verify
- i18n keys library có đủ trong `en.json` + `vi.json`
- **Vòng lõi**: gõ 1 block → kết quả mock inline không vỡ (library overlay không can thiệp editor)

**Output artifact**: `src/components/LibraryOverlay.tsx` (new), `AppShell.tsx` (updated — libOpen + wire), `en.json`, `vi.json`

---

## Outcome cuối

- Toàn bộ 5 vùng UI (tokens, header, canvas/paper, sidebar rail, library overlay) khớp `Nib Editor.dc.html`
- `npm run build` exit 0 + `tsc --noEmit` 0 error + vitest pass sau Session 1.5
- Vòng lõi "gõ 1 block → kết quả symbolic mock inline live" hoạt động end-to-end trong browser Vite dev sau mỗi session
- UnifiedDock không bị đụng chạm
- Không có hex literal mới trong codebase
- i18n en+vi đầy đủ cho mọi text mới

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-17 | Initial | Task #2 từ team-lead; researcher Task #1 map xong 6 vùng |
