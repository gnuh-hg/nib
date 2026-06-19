# PLAN — Settings Redesign

> Sau khi xong toàn bộ pipeline: SettingsOverlay được thay bằng layout sidebar-nav (nav trái + content phải) với section registry extensible — 3 section MVP (Account mock, Language, Theme) đều chạy runtime no-reload, i18n en/vi parity, tsc 0, build 0, 0 hex rời.

---

## Context

- **Vì sao nhiều session:** Phase 1 gồm 2 task song song (architect HOW + design-figma visual Figma); lead cần gate cả hai xong trước khi editor-frontend build. Phase 2 chia 3 session nhỏ để mỗi session có gate đo được độc lập.
- **Ràng buộc external:** design-figma cần planKey Figma (`team::1618919057199763712`) và file Figma có sẵn để viết vào; nếu Figma chưa tồn tại thì design-figma tạo mới. Không có human gate license.
- **Workstream:** Phase 0 add-on (theo ROADMAP Phase 0 đang đóng). Không phải phase ROADMAP riêng — đây là 1 workstream UI cải thiện.
- **Out of scope:**
  - Auth thật (sign-in/sign-out logic) — Account section dùng mock data disabled.
  - Editor/Math prefs section — slot để sau.
  - About section — slot để sau.
  - Backend call từ Settings (không có API call nào trong MVP này).

---

## Quyết định đã chốt (KHÔNG bàn ngược)

| # | Quyết định | Nguồn |
|---|---|---|
| 1 | Layout = sidebar-nav trái + content area phải, panel ~640–720px | USER+LEAD CHỐT |
| 2 | Section registry/pattern — thêm section sau không cần refactor shell | USER+LEAD CHỐT |
| 3 | Section MVP: Account · Language · Theme (theo thứ tự nav) | USER+LEAD CHỐT |
| 4 | Account = mock signed-in: avatar + tên + email từ `src/data/mockAccount.ts` + `src/types/account.ts`, pattern giống `mockDocs.ts` | USER CHỐT |
| 5 | Nút Edit profile / Sign out: hiện, disabled, nhãn i18n "Sắp có" | USER CHỐT |
| 6 | Phase 1 design = architect HOW ∥ design-figma visual (song song, lead relay) | USER CHỐT |
| 7 | i18n en/vi parity bắt buộc — key mới thêm đồng thời cả 2 file | LOCKED (requirements.md §1) |
| 8 | Landscape ≥1024px, token 0 hex rời, theme/lang runtime no-reload | LOCKED (requirements.md §2–3) |
| 9 | useTheme / useI18n hooks có sẵn — dùng lại, không tạo provider mới | Researcher Task #1 |
| 10 | Group props SettingsOverlay sớm (tránh pattern 18-props như LibraryOverlay) | Researcher rủi ro R3 |

---

## Research đã có (Researcher Task #1 — PASS)

- SettingsOverlay hiện: overlay absolute inset:0, panel cố định 460×360px, 2 section (Language + Theme), 3 i18n key, CSS token-driven, 0 hex rời.
- ThemeProvider + I18nProvider mount cấp cao, component dùng hook; no prop drilling cần thiết.
- Wiring: AppShell → settingsOpen → SettingsOverlay (data-open). Sibling LibraryOverlay.
- AccountChip đã xóa (2026-06-18) — Account chỉ qua Settings.
- Mock pattern: `types/` interface + `data/` array tĩnh + pure fn, không import React.
- Token đủ cho Account — không cần token mới.
- Rủi ro R3 (props phình): cân nhắc context/group props cho SettingsOverlay ngay khi scaffold.

---

## Pipeline 2 phase / 4 session

```
[Phase 1] Design ───────────────────► HOW design (architect) + Figma spec (design-figma)
                                           │ (cả hai xong → gate Phase 1)
                                           ▼
[Phase 2] Build ─────────────────────────────────────────────────────────────────────────
    [S2.1] Shell + registry scaffold ──► SettingsOverlay mới: sidebar-nav layout tồn tại
    [S2.2] Account section + mock ─────► AccountSection + mockAccount.ts render được
    [S2.3] Migrate + wire + smoke ──────► outcome cuối: tsc 0 + build 0 + vitest + i18n
```

---

## Phase 1 — Design (song song 2 task)

**Mục tiêu**: Trước khi build, phải có (a) HOW kỹ thuật từ architect (component tree, API contract, file structure, rủi ro) và (b) visual spec Figma từ design-figma (token map, i18n key list en/vi, screenshot frame ≥1024px). Lead chạy 2 task song song, gate cả hai rồi mới sang Phase 2.

### Session 1.1 — architect HOW ∥ design-figma visual

**Task A — architect**: thiết kế HOW cho Settings sidebar-nav:
- Component tree (`SettingsOverlay` → `SettingsSidebar` + `SettingsNav` + `SettingsContent` + các `*Section`).
- Section registry interface (`type SectionDef = {id, labelKey, component}`), registry array, dynamic render.
- Props group strategy (tránh R3) — 1 `SettingsContext` hay grouped props object.
- File structure trong `src/components/SettingsOverlay/`.
- API contract: không có backend call; state cần truyền (open/onClose, sections).
- Rủi ro kỹ thuật: i18n key sync (R4), animation overlay với sidebar transition, focus trap trong panel mới.

**Task B — design-figma** (song song Task A): thiết kế visual Figma cho Settings sidebar-nav:
- Frame ≥1024px, 3 screen: Account section / Language section / Theme section.
- Design system tokens map (Figma variable ↔ CSS token) — tái dùng tokens.css hiện có.
- i18n key list en/vi đầy đủ cho mọi chuỗi Settings mới (~8–15 key).
- Screenshot ≥1 frame byte > 0.

**STOP gate Phase 1**:
- architect: 5 mục A–E đầy đủ (component tree + API contract + data flow + file structure + ≥1 rủi ro kỹ thuật cụ thể), đủ để editor-frontend không phải đoán.
- design-figma: Figma file URL trả được + `get_screenshot` bytes>0 ≥1 frame + token spec bảng (Figma variable↔CSS token, light+dark) + i18n key list en/vi + 0 hex rời + frame ≥1024px.
- **Cả hai** gate PASS → Phase 2 mới bắt đầu.

**Output artifact Phase 1**: architect report (prose 5 mục) + Figma file URL + token spec + i18n key list.

**Phase 1 gate** (sau S1.1): architect PASS + design-figma PASS.

---

## Phase 2 — Build

**Mục tiêu**: editor-frontend implement SettingsOverlay mới (sidebar-nav layout), Account section với mock data, migrate Language/Theme section, wire toàn bộ, i18n en/vi parity, gate tsc 0 + build 0 + vitest pass.

### Session 2.1 — Scaffold sidebar-nav shell + section registry

- **Scope (WHAT)**:
  - Tạo file structure `src/components/SettingsOverlay/` theo architect S1.1.
  - SettingsOverlay mới: overlay + sidebar-nav layout (nav trái, content phải, panel ~640–720px).
  - Section registry type + array rỗng (chưa có section thật — placeholder "chưa có section").
  - Preserve open/close behavior (data-open CSS toggle, AppShell wire giữ nguyên).
  - Remove / replace file cũ SettingsOverlay nếu cần.
  - i18n skeleton: thêm key `settings.nav.*` placeholder cả en.json + vi.json (ko hardcode text).
- **STOP gate**:
  - `tsc --noEmit` 0 error.
  - `npm run build` exit 0.
  - `vitest run` pass (không có test mới bắt buộc ở session này — không break test cũ 56/56).
  - SettingsOverlay render được sidebar-nav layout (dù nav rỗng) — kiểm bằng `grep -r "SettingsNav\|SettingsContent" src/` trả ≥1 kết quả.
  - 0 hex rời: `grep -rE '#[0-9a-fA-F]{3,6}\b' src/components/SettingsOverlay/` rỗng.
- **Output artifact**: `src/components/SettingsOverlay/` (scaffold files).

### Session 2.2 — Account section + mock data

- **Scope (WHAT)**:
  - `src/types/account.ts` — interface `Account` (id, name, email, avatarUrl?).
  - `src/data/mockAccount.ts` — 1 mock user (giống pattern mockDocs.ts, không import React).
  - `src/components/SettingsOverlay/AccountSection.tsx` — hiển thị avatar + tên + email từ mock.
  - Nút "Edit profile" + "Sign out": hiện, `disabled`, nhãn bao gồm suffix i18n "Sắp có" (vd `settings.account.edit_coming_soon`).
  - Đăng ký AccountSection vào section registry.
  - i18n keys Account en/vi (`settings.account.*`): title, edit_profile, sign_out, coming_soon.
- **STOP gate**:
  - `tsc --noEmit` 0 error.
  - `npm run build` exit 0.
  - `vitest run` pass (≥1 test mới: mockAccount.ts trả đúng shape + AccountSection render avatar/name/email).
  - `grep -rE '#[0-9a-fA-F]{3,6}\b' src/components/SettingsOverlay/AccountSection.tsx` rỗng.
  - i18n parity: `grep -c '"settings.account' src/locales/en.json` == `grep -c '"settings.account' src/locales/vi.json`.
  - `src/types/account.ts` + `src/data/mockAccount.ts` tồn tại (ls kiểm tra).
- **Output artifact**: `src/types/account.ts` + `src/data/mockAccount.ts` + `src/components/SettingsOverlay/AccountSection.tsx`.

### Session 2.3 — Migrate Language/Theme + wire + i18n parity + smoke gate

- **Scope (WHAT)**:
  - Migrate Language section (hiện đang trong SettingsOverlay cũ) → `LanguageSection.tsx` trong thư mục mới.
  - Migrate Theme section → `ThemeSection.tsx`, giữ logic useTheme/useI18n.
  - Đăng ký cả 2 vào registry (thứ tự nav: Account → Language → Theme).
  - Wire nav: click nav item → render đúng section.
  - i18n keys toàn bộ Settings (title, nav labels, placeholders…) en/vi parity — không bỏ key cũ nếu còn dùng.
  - Xóa code SettingsOverlay cũ / dead code.
  - Không thêm API call mới (settings MVP = local state + provider hooks).
- **STOP gate** (gate cuối — outcome):
  - `tsc --noEmit` 0 error.
  - `npm run build` exit 0.
  - `vitest run` pass — không break test cũ (≥56); có thể thêm test mới cho section navigation.
  - `grep -rE '#[0-9a-fA-F]{3,6}\b' src/components/SettingsOverlay/` rỗng.
  - i18n parity tổng: `grep -c '"settings\.' src/locales/en.json` == `grep -c '"settings\.' src/locales/vi.json`.
  - Click-through checklist (user smoke, Chrome ext không dùng được từ agent):
    - [ ] Settings mở → sidebar-nav 3 mục (Account / Language / Theme).
    - [ ] Click Account → avatar + tên + email hiện; nút Edit/Sign-out disabled.
    - [ ] Click Language → switch en↔vi runtime, no reload.
    - [ ] Click Theme → switch light/dark/system runtime, no reload.
    - [ ] Đóng Settings → overlay ẩn, state trả về bình thường.
  - **Gate vàng (no-crash):** vòng lõi gõ block → Tính → result inline không crash sau khi Settings đóng.
- **Output artifact**: `src/components/SettingsOverlay/` hoàn chỉnh (shell + 3 section) + updated `src/locales/en.json` + `vi.json`.

**Phase 2 gate** (sau S2.3): tất cả STOP gate trên pass.

---

## Outcome cuối

- SettingsOverlay mới: sidebar-nav layout, 3 section MVP (Account mock + Language + Theme), registry extensible.
- i18n en/vi parity tổng `settings.*` key.
- tsc 0 · `npm run build` 0 · vitest ≥56 pass · 0 hex rời trong `src/components/SettingsOverlay/`.
- Runtime: lang switch no-reload · theme switch no-reload (useTheme/useI18n provider giữ).
- Slot sẵn sàng cho Editor/Math + About section (chỉ thêm vào registry, không refactor shell).
- Click-through checklist 5 mục user xác nhận pass.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-19 | Initial | Khởi tạo từ brief Task #2 (team settings-redesign, researcher Task #1 PASS) |
