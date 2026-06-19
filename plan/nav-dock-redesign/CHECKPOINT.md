# CHECKPOINT — Nav-Dock Redesign (drill-down dock + TopStrip)

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **Session 1.1 là PLAN-APPROVAL** — implementer phải nhận approval từ lead TRƯỚC khi bắt đầu S1.1 (xóa ModeToggle + tái cấu trúc dock là rủi ro cao).
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Nguồn chân lý WHAT:** `docs/nav-dock-design.md` (đã chốt). Câu hỏi HOW → xem Open questions trong `PLAN.md`.
- **3 yêu cầu nền [LOCKED]:** song ngữ en/vi · hit target ≥44px · 0 hex rời ngoài tokens.css.
- **Constraint cứng Workspace:** `UnifiedDock` + `CommandPalette` phải nằm trong `EditorContext.Provider`. Không di chuyển Provider.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 3 | 3 | 100% ✅ |
| Gate pass | 3/3 | 3/3 | ✓ |
| i18n keys §9 | 15 | 15 | 100% ✓ |
| Hex rời ngoài tokens | 0 | 0 | ✓ |

---

## Đang ở đâu

- **Phase**: 1 — **HOÀN THÀNH** (3/3 session)
- **Session kế tiếp**: — (plan nav-dock-redesign DONE)
- **Blocker**: không
- **Reference**: `PLAN.md` Outcome cuối

---

## Per-session log

### S1.1 — Dock drill-down: dockLevel + NAV level + xóa ModeToggle ✅ DONE (2026-06-18)

- **Plan-approval**: lead DUYỆT phương án HOW trước khi implement (Q1 nav-default-no-persist, Q2 opacity fade, NavLevel tách riêng, bump ≥44px, 2 icon mới).
- **Làm:**
  - `dockState.ts`: +`DockLevel`/`NavButton` type, `DEFAULT_LEVEL='nav'`, pure `navSelect()` + `backToNav()`. Giữ `toggleMode` (còn test).
  - `dockState.test.ts`: +3 test (DEFAULT_LEVEL, navSelect, backToNav) → 18 test (từ 12... thực tế file 15→18).
  - `NavLevel.tsx` MỚI: row NAV [Library][Settings][Type][Write][Help] + AccountChip placeholder (avatar tròn initials).
  - `UnifiedDock.tsx`: +`level` state (in-memory, default nav), bỏ ModeToggle+cycleMode, render drill-down (NAV ↔ TOOLS+Back), collapse ở mọi level (nút collapse ngoài level wrapper, bung về level đang đứng).
  - `ModeToggle.tsx`: **XÓA** (0 ref còn lại ngoài comment).
  - `icons.tsx`: +`IconSettings` (gear) + `IconHelp` (?-circle) outline currentColor.
  - `dock.css`: bump `.nib-dock__btn`/convert → height 44px; +`.nib-dock__level`(fade)/`.nib-dock__nav`/`.nib-dock__navbtn`/`.nib-dock__back`/`.nib-dock__account`/`.nib-dock__avatar`; reduced-motion guard cho fade.
  - `en.json`+`vi.json`: +7 key (`dock.nav.*` + `dock.back`), parity ✓.
- **Gate (lệnh thật):** `npx tsc --noEmit` exit 0 · `npx vitest run` 56/56 pass (dockState 18) · `npm run build` exit 0 (2.06s) · grep hex trong `src/components/UnifiedDock` = 0 · i18n parity 7/7 · JSON valid.
- **Hit target:** NAV + TOOLS + Back + Account đều 44px cao (CSS).
- **CÒN TREO (chỉ user smoke):** click-through `npm run dev` :1420 — NAV 5 nút + avatar; Type/Write → TOOLS+Back; Back → NAV; collapse mỗi level bung đúng level; fade.
- **Library/Settings/Help**: placeholder no-op + TODO (wiring S2/S3).

---

### S1.2 — TopStrip + bỏ SidebarRail khỏi Workspace layout ✅ DONE (2026-06-18)

- **Làm:**
  - `TopStrip.tsx` MỚI (full-width, sticky top, `<header className="nib-strip">`):
    - Trái: `[≡ tên doc ▾]` — nút switcher mở dropdown (rename action + list docs từ prop + "Xem tất cả"→onOpenLibrary). Inline-rename: double-click tiêu đề HOẶC action "Đổi tên" → `<input>` autofocus, Enter commit / Esc huỷ, outside-click+Esc đóng dropdown.
    - Phải: theme quick-toggle (useTheme.cycleTheme, Sun/Moon theo `resolved` — §7 giữ ở strip) + undo + redo (`editor.commands.undo()/redo()`). Cả 3 nút 44×44.
  - `Workspace.tsx`: import+render `TopStrip` thay `TopChrome`; BỎ `<SidebarRail>` + state `railOpen` + `onToggleRail`; thêm prop `onRenameDoc`; GIỮ UnifiedDock + CommandPalette trong `EditorContext.Provider` (Provider KHÔNG đụng).
  - `AppShell.tsx`: truyền `onRenameDoc={handleCommitRename}` (rename persist vào mock store).
  - **XÓA**: `TopChrome.tsx`, `SidebarRail/` (SidebarRail.tsx + index.ts + sidebar-rail.css) — 0 import dangling (chỉ còn 3 comment nhắc tên, không phải code).
  - `icons.tsx`: +`IconMenu` (hamburger ≡) cho leading glyph doc-title.
  - `app-shell.css`: thay block `.nib-topchrome*`/`.nib-chrome*` bằng `.nib-strip*` (token-only, dropdown clamp top-left không overflow, max-height 60vh scroll).
  - `en.json`+`vi.json`: +5 key `strip.*` (rename_doc/switch_doc/view_all/undo/redo), parity 5/5.
- **Gate (lệnh thật):** `npx tsc --noEmit` exit 0 · `npx vitest run` 56/56 pass · `npm run build` exit 0 (2.16s) · hex rời trong `src/components` (ngoài tokens.css) = 0 · strip.* parity en5/vi5 · dangling import TopChrome/SidebarRail = 0 (chỉ comment).
- **Hit target:** strip iconbtn 44×44, doc-title 44 cao, menu item min-height 44.
- **CÒN TREO (chỉ user smoke):** `npm run dev` :1420 — strip full-width trên cùng; click tên doc → dropdown (rename/list/Xem tất cả); double-click → rename inline; undo/redo; theme toggle; SidebarRail không còn.
- **Quyết định tự chốt (open questions PLAN):** Q3 dropdown data = `docs` prop (mockDocs qua AppShell); Q4 undo/redo = `editor.commands.undo()/redo()` (không no-op); §7 theme quick-toggle = GIỮ ở strip (default plan).

---

### S1.3 — Settings overlay + AccountChip + i18n §9 đầy đủ ✅ DONE (2026-06-18) — PLAN HOÀN THÀNH

- **Làm:**
  - `SettingsOverlay/` MỚI (SettingsOverlay.tsx + index.ts + settings-overlay.css): scrim+panel mirror LibraryOverlay (data-open, no unmount, reduced-motion guard). MVP = **Ngôn ngữ** (en/vi seg) + **Theme** (light/dark/system seg), active = `lang`/`theme` hiện tại, click `setLang`/`setTheme` → runtime + persist qua provider (localStorage `nib-lang`/`nib-theme`). Nút Đóng (IconClose) 44×44.
  - `UnifiedDock.tsx`: +props `onOpenLibrary`/`onOpenSettings`; NAV [Thư viện]→onOpenLibrary, [Cài đặt]→onOpenSettings (hết no-op); đọc `nib-user-name` (fallback "User") truyền `userName` xuống NavLevel. AccountChip click→onSettings (đã có sẵn từ S1.1). Help vẫn placeholder.
  - `Workspace.tsx`: +prop `onOpenSettings`, truyền xuống UnifiedDock cùng `onOpenLibrary`.
  - `AppShell.tsx`: +state `settingsOpen` + render `<SettingsOverlay>` + truyền `onOpenSettings`.
  - `en.json`+`vi.json`: +3 key `settings.title/language/theme` → **đủ 15 key §9**, parity 15/15.
- **Gate (lệnh thật):** `npx tsc --noEmit` 0 · `npx vitest run` 56/56 · `npm run build` 0 (2.02s) · §9 = 15/15 en+vi · i18n parity toàn cục 147/147 · 0 hex rời `src/components` ngoài tokens.
- **Hit target:** AccountChip 44×44 (S1.1), Settings close 44×44, seg option min-height 44.
- **Quyết định tự chốt:** AccountChip giữ **avatar-only** trong dock dọc hẹp (tên qua title/aria + nguồn initials) — visible name label sẽ ép dock rộng, phá compact tool dock; design §6 "avatar+name truncate" nghĩ cho NAV ngang, dock thực tế là dọc (dock-v2). NAV [Thư viện] cũng wire luôn (cheap, Workspace đã có onOpenLibrary) để bỏ nút chết.
- **CÒN TREO (chỉ user smoke):** `npm run dev` :1420 — NAV [Cài đặt]/avatar → SettingsOverlay; đổi lang→label dock/strip đổi ngay; đổi theme→màu đổi ngay + reload giữ; Đóng/scrim đóng overlay.

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-18 | Created from `PLAN.md` | @planner |
| 2026-06-18 | S1.2 done — TopStrip + bỏ SidebarRail | @editor-frontend |
| 2026-06-18 | S1.3 done — Settings overlay + AccountChip + §9 đủ 15 key → PLAN HOÀN THÀNH 3/3 | @editor-frontend |
