# PLAN — Nav-Dock Redesign (drill-down dock + TopStrip)

> Sau khi xong pipeline này: `UnifiedDock` tái cấu trúc thành dock drill-down 2 level (NAV → TOOLS), `TopChrome` được thay bằng `TopStrip` mỏng (tên doc + undo/redo + theme quick-toggle), `SidebarRail` bị bỏ khỏi layout, `Settings` overlay mới, `AccountChip` trong NAV — toàn bộ đúng spec `docs/nav-dock-design.md`, pass `npm run build` + `tsc --noEmit` + vitest, 0 hex rời ngoài tokens.

---

## Context

- **Tại sao chia session:** codebase hiện có 16 file trong `UnifiedDock/`, 50 vitest liên quan dock, `ModeToggle` cần xóa + thay bằng nav entry points, `Workspace.tsx` layout cần đổi. Khối lượng > 1 chat. Rủi ro cao ở session đầu (xóa component đang được test).
- **Nguồn chân lý WHAT:** `docs/nav-dock-design.md` — đã chốt bởi user 2026-06-18. Mọi HOW quyết định tại thời điểm implement.
- **Constraint external:** câu hỏi HOW §10 của `nav-dock-design.md` (state machine, undo source, dropdown data) — implementer tự chốt hoặc hỏi lead; **không chặn kế hoạch này**.
- **Mục mở duy nhất còn lại:** theme quick-toggle ở strip (§7 `nav-dock-design.md`). **Default trong plan này: thêm vào strip (S2)** vì rẻ và researcher hội tụ. Nếu user muốn bỏ, chỉnh CHECKPOINT khi bắt đầu S2.
- **Workstream liên quan:** Phase 0 Mock-UI (`nib-mock-ui`), `dock-v2`, `nib-editor-rebuild` — các long-plan đó không đụng nav-dock redesign, không xung đột.
- **Out of scope:** auth/user system thật cho AccountChip, unified undo manager (feature.md §11.5), CommandPalette logic thay đổi, LibraryOverlay UI, backend CAS.

---

## Pipeline 1 phase / 3 session

```
[S1] Dock drill-down: dockLevel state + NAV level + xóa ModeToggle
        │ Gate: vitest pass (updated); dock render NAV level với 5 nút + Back ở TOOLS; 0 hex
        ▼
[S2] TopStrip + bỏ SidebarRail khỏi Workspace layout
        │ Gate: npm run build 0 error; strip full-width, doc-title + undo/redo + theme-toggle; rail không render
        ▼
[S3] Settings overlay + AccountChip + i18n đầy đủ §9
        Gate: vitest pass; Settings mở từ NAV; lang/theme đổi được; AccountChip cuối NAV;
              all 15 keys §9 có trong en.json + vi.json; 0 hex rời
```

---

## Phase 1 — Nav-Dock Redesign

**Mục tiêu:** tái cấu trúc toàn bộ navigation surface theo `docs/nav-dock-design.md` — 1 dock drill-down duy nhất + strip mỏng + bỏ sidebar — trong 3 session liên tiếp.

---

### Session 1.1 — Dock drill-down: state machine + NAV level + xóa ModeToggle ⚠️ PLAN-APPROVAL

> **Rủi ro cao nhất của workstream.** Xóa `ModeToggle` (đang có vitest), thêm `dockLevel` state, tái cấu trúc `UnifiedDock` render. Implementer phải có approval trước khi bắt đầu session này.

- **Scope:**
  - Thêm field `dockLevel: 'nav' | 'tools'` vào `dockState.ts`; cập nhật persist logic (đề xuất: khởi động về `'nav'`, không nhớ level cuối — dễ định hướng; implementer quyết nếu muốn đổi).
  - Tạo component `NavLevel.tsx` (hoặc inline trong UnifiedDock) render row NAV: [Thư viện] [Cài đặt] [Gõ] [Viết] [Trợ giúp] … [AccountChip placeholder].
  - Khi `dockLevel === 'tools'`: render row TOOLS (Back + tool hiện có theo `mode`); nút Back → set `dockLevel = 'nav'`.
  - Khi bấm [Gõ]: set `mode = 'type'`, set `dockLevel = 'tools'`; [Viết]: set `mode = 'pen'`, set `dockLevel = 'tools'`.
  - Xóa `ModeToggle.tsx` (file + export khỏi `index.ts`).
  - Cập nhật `dockState.test.ts`: bổ sung test cho `dockLevel`; xóa/cập nhật test liên quan ModeToggle.
  - Collapse behavior: ở mọi `dockLevel`, collapse về ô vuông; bung lại về level đang đứng (không reset về NAV khi bung).
  - AccountChip ở vị trí cuối NAV: **placeholder** (chỉ cần avatar circle + "Account" text, chưa cần logic) — đủ để layout NAV level hoàn chỉnh.

- **Files chạm (≤10):**
  1. `src/components/UnifiedDock/dockState.ts`
  2. `src/components/UnifiedDock/dockState.test.ts`
  3. `src/components/UnifiedDock/UnifiedDock.tsx`
  4. `src/components/UnifiedDock/ModeToggle.tsx` — **XÓA**
  5. `src/components/UnifiedDock/NavLevel.tsx` — **MỚI** (hoặc inline vào UnifiedDock.tsx)
  6. `src/components/UnifiedDock/dock.css`
  7. `src/components/UnifiedDock/index.ts`
  8. `src/locales/en.json` — chỉ thêm keys NAV: `dock.nav.*`, `dock.back` (§9 của design doc)
  9. `src/locales/vi.json` — tương tự

- **STOP gate (đo được):**
  - `npm run build` exit 0
  - `tsc --noEmit` 0 error
  - `vitest` pass (số test có thể giảm do xóa ModeToggle test cũ, nhưng không có test fail)
  - NAV level render đủ 5 nút + AccountChip placeholder; click [Gõ]/[Viết] → chuyển sang TOOLS level; nút Back → trở về NAV
  - 0 hex rời ngoài `src/styles/tokens.css`
  - Hit target ≥44px cho tất cả nút NAV và TOOLS (verify bằng DevTools)

- **Output artifact:** UnifiedDock hoạt động 2 level; ModeToggle đã xóa; NAV level dùng i18n keys.

---

### Session 1.2 — TopStrip mới + bỏ SidebarRail khỏi Workspace layout

- **Scope:**
  - Tạo `TopStrip.tsx`: full-width, sticky top. Chứa:
    - Trái: `[≡ tên tài liệu ▾]` — inline-rename + dropdown quick-switch doc (data source: `mockDocs.ts` hiện có hoặc prop từ Workspace; "Xem tất cả" → dispatch mở LibraryOverlay).
    - Phải: [theme-toggle icon] [⟲ undo] [⟳ redo] — cả 3 hit target ≥44px.
  - `TopStrip` dùng i18n keys `strip.*` (§9).
  - Xóa `TopChrome.tsx` (hoặc giữ file nhưng unused — xóa sạch để không gây import dư).
  - `Workspace.tsx`: thay `<TopChrome>` bằng `<TopStrip>`; bỏ `<SidebarRail>` khỏi layout row; `UnifiedDock` + `CommandPalette` vẫn nằm trong EditorContext.Provider (constraint cứng — không đụng).
  - `SidebarRail/` files: đánh dấu unused hoặc xóa (không gây import error). Nếu xóa → xóa import trong Workspace cùng lúc.
  - Không cần implement undo/redo logic thật — nối vào hook/context hiện có; nếu chưa có, để `onClick={() => {}}` placeholder và comment TODO.
  - Theme quick-toggle: nối vào `useTheme` / store hiện có (nếu có); nếu chưa, toggle giữa `light`/`dark`/`system` theo thứ tự vòng tròn — placeholder OK, implement logic thật trong S3.

- **Files chạm (≤10):**
  1. `src/components/TopStrip.tsx` — **MỚI**
  2. `src/components/Workspace.tsx`
  3. `src/components/TopChrome.tsx` — **XÓA** (hoặc để unused — quyết khi thấy dependency graph)
  4. `src/components/SidebarRail/` — **XÓA** hoặc unused (tối đa 3 file bên trong)
  5. `src/locales/en.json` — thêm keys `strip.*`
  6. `src/locales/vi.json` — tương tự

- **STOP gate (đo được):**
  - `npm run build` exit 0
  - `tsc --noEmit` 0 error
  - `vitest` pass
  - TopStrip render full-width trên canvas; hiển thị doc-title + undo/redo + theme-toggle icon
  - SidebarRail KHÔNG render trong DOM
  - Doc-title dropdown mở được (dù data là mock)
  - Theme-toggle click không gây error (dù logic có thể là placeholder)
  - 0 hex rời ngoài tokens.css

- **Output artifact:** `TopStrip.tsx` hoạt động; Workspace layout: strip trên + canvas dưới (không rail).

---

### Session 1.3 — Settings overlay + AccountChip đầy đủ + i18n hoàn thiện §9

- **Scope:**
  - Tạo `SettingsOverlay/` (cùng kiểu `LibraryOverlay/`: scrim + panel, nút Đóng/← trong header panel). Chứa MVP: Ngôn ngữ (en/vi toggle) + Theme (light/dark/system selector).
  - Wiring: nút [Cài đặt] ở NAV level → mở SettingsOverlay. Thay đổi lang/theme áp dụng ngay (runtime, không reload); lưu persistent theo cơ chế hiện có.
  - Hoàn thiện AccountChip (placeholder từ S1): avatar tròn ~32px (CSS circle, nền `--accent-subtle`, chữ initials `--accent`) + tên user truncate (lấy từ localStorage hoặc default "User"). Click → mở SettingsOverlay (MVP per §6 design doc).
  - Hoàn thiện theme quick-toggle ở strip (nếu S2 để placeholder).
  - i18n: verify **toàn bộ 15 key §9** có trong cả `en.json` + `vi.json`. Thêm bất kỳ key còn thiếu từ S1/S2.
  - Token sweep: kiểm tra toàn bộ file chạm trong S1–S3 không có hex rời. Sửa bất kỳ hex nào tìm thấy.

- **Files chạm (≤10):**
  1. `src/components/SettingsOverlay/SettingsOverlay.tsx` — **MỚI**
  2. `src/components/SettingsOverlay/index.ts` — **MỚI**
  3. `src/components/UnifiedDock/AccountChip.tsx` — **MỚI** (hoặc inline NavLevel)
  4. `src/components/UnifiedDock/UnifiedDock.tsx` — wire Cài đặt → open SettingsOverlay
  5. `src/components/TopStrip.tsx` — wire theme-toggle đầy đủ nếu cần
  6. `src/locales/en.json` — keys `settings.*` + verify tất cả §9
  7. `src/locales/vi.json` — tương tự
  8. `src/styles/tokens.css` — thêm token nếu cần (vd AccountChip cần token riêng)

- **STOP gate (đo được):**
  - `npm run build` exit 0
  - `tsc --noEmit` 0 error
  - `vitest` pass
  - SettingsOverlay mở từ nút [Cài đặt] NAV; scrim đúng; có nút Đóng; đóng được
  - Lang toggle en↔vi hoạt động runtime (không reload)
  - Theme toggle light/dark/system hoạt động runtime; lưu persistent
  - AccountChip: avatar tròn xuất hiện cuối NAV; click → Settings mở
  - **Tất cả 15 key §9 hiện diện trong en.json và vi.json** (có thể đếm bằng grep)
  - 0 hex rời ngoài tokens.css trong toàn bộ file đã chạm (grep `#[0-9a-fA-F]{3,6}` trong src/components/ ngoài tokens.css = 0 kết quả)
  - Hit target ≥44px cho AccountChip, Settings close button

---

## Outcome cuối

- 1 dock duy nhất drill-down 2 level (NAV / TOOLS) hoạt động, nổi + kéo thả + collapse ở mọi level.
- TopStrip mỏng full-width: inline-rename doc + dropdown quick-switch + undo/redo + theme quick-toggle.
- SidebarRail + TopChrome + ModeToggle đã bỏ.
- SettingsOverlay: lang + theme.
- AccountChip trong NAV.
- Song ngữ en/vi đầy đủ 15 key §9; 0 hex rời; hit target ≥44px.
- **Gate cuối đo được:** `npm run build` + `tsc --noEmit` + vitest = 0 error; grep hex rời ngoài tokens.css = 0 kết quả; manual smoke: click Gõ → TOOLS → Back → NAV; click Cài đặt → Settings mở → đổi lang → label dock đổi ngay.

---

## Open questions (chưa chốt, implementer giải tại S tương ứng)

| # | Câu hỏi | Session liên quan | Ghi chú |
|---|---|---|---|
| Q1 | Khởi động về `nav` hay nhớ level cuối? | S1 | Default plan: về `nav`; implementer có thể đổi |
| Q2 | Transition animation NAV↔TOOLS? (slide / fade / none) | S1 | `prefers-reduced-motion` bắt buộc nếu có animation |
| Q3 | Data source doc-list cho dropdown (mock vs store)? | S2 | Dùng `mockDocs.ts` hiện có, không tạo mới |
| Q4 | Undo/redo ở strip gọi vào đâu? | S2 | Nối hook hiện có; placeholder OK nếu chưa có |
| Q5 | AccountChip tên user lấy từ đâu? | S3 | localStorage key `nib-user-name`, fallback "User" |

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-18 | Initial | Sinh từ brief nav-dock-redesign, @planner |
