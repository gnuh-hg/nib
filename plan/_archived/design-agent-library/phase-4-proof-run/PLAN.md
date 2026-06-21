# PLAN — Phase 4: Proof Run (agent `design` dựng settings-overlay.html)

> Chứng minh bộ đôi [agent `design` + `.claude/design-library/`] hoạt động end-to-end bằng cách dựng mockup HTML/CSS cho màn Settings Overlay (CC-2 chốt) — trước khi Phase 3 retire design-figma.

---

## Context

- **Lý do phase này tồn tại:** Phase 1 (thư viện 9 file `.claude/design-library/`) + Phase 2 (`.claude/agents/design.md` + `.claude/skills/design/SKILL.md`) đã XONG & gate PASS. Thứ tự an toàn theo ROADMAP: Phase 4 (proof run) TRƯỚC Phase 3 (retire figma) — nếu proof fail → không retire, fallback còn design-figma.
- **Màn proof (CC-2 chốt):** Settings Overlay — overlay lớn centered kiểu LibraryOverlay; layout bên trong: header (tiêu đề + back) + horizontal tab bar + content area bên dưới (H2 design spec đã lock trong `settings-overlay.css`). Hai section MVP: **Account** (avatar initials + displayName field + email field) + **Appearance** (language selector + theme selector).
- **Class CSS hiện có (agent `design` TÁI DÙNG, KHÔNG tự đặt tên mới):** từ `src/components/SettingsOverlay/settings-overlay.css`: `.nib-settings-overlay`, `.nib-settings__scrim`, `.nib-settings__panel`, `.nib-settings__header`, `.nib-settings__back`, `.nib-settings__heading`, `.nib-settings__inner`, `.nib-settings__nav`, `.nib-settings__nav-list`, `.nib-settings__nav-item`, `.nib-settings__nav-badge`, `.nib-settings__content`, `.nib-settings__section-title`, `.nib-settings-account`, `.nib-settings-account__identity`, `.nib-settings-account__avatar`, `.nib-settings-field`, `.nib-settings-field__label`, `.nib-settings-field__input`, `.nib-settings-appearance`, `.nib-settings__group`, `.nib-settings__label`, `.nib-settings__seg`, `.nib-settings__opt`.
- **i18n key namespace:** `settings.*` (vd `settings.title`, `settings.nav.account`, `settings.nav.appearance`, `settings.nav.coming_soon`, `settings.account.display_name`, `settings.account.email`, …).
- **Prerequisite kỹ thuật:** `docs/design-artifacts/` chưa tồn tại → agent `design` tự tạo (Write tool tự mkdir).
- **Executor:** agent `design` (subagent_type `design`, `claude-sonnet-4-6`, tools: Read/Write/Edit/Glob/Grep/Bash/Task*/SendMessage). KHÔNG dùng Figma MCP. KHÔNG ghi `src/`, `backend/`, `src-tauri/`.
- **Scope ngoài plan này:** implement React trong `src/` (việc của editor-frontend sau proof pass); Phase 3 retire figma (HUMAN-GATE riêng, phụ thuộc phase này gate PASS).

---

## Pipeline 1 phase / 1 session

```
[Phase 4] Proof Run
         │
         ▼
   agent `design` chạy workflow 5 bước (SKILL.md §1)
         │
         ▼
   docs/design-artifacts/settings-overlay.html  ← OUTPUT DUY NHẤT
         │
         ▼
   Bash self-verify DC-1..6 (4 lệnh grep)
         │
         ▼
   6/6 PASS → report lead → Phase 3 unblock
```

---

## Phase 4 — Proof Run

**Mục tiêu**: Agent `design` tự chạy workflow 5 bước (SKILL.md §1) → Write `docs/design-artifacts/settings-overlay.html` → self-verify 6 done-criteria bằng Bash → report đầy đủ cho lead.

### Session 4.1 — Agent `design` dựng settings-overlay.html

**Scope** (việc agent `design` phải làm trong 1 chat):

1. **Đọc đầu phiên** (bắt buộc, theo thứ tự): `.claude/master.md` → `.claude/teams/playbook.md` → `.claude/memory/context.md` → `.claude/skills/memory/SKILL.md` → `.claude/skills/design/SKILL.md`. Sau đó đọc entry point thư viện: `.claude/design-library/INDEX.md`.

2. **Bước 1 — Token** (SKILL.md §1.Bước-1): đọc `.claude/design-library/tokens.md` §1–§9 + §13–§14 + §16. Ghi nhớ: `--bg-elevated` (nền card), `--scrim` (overlay backdrop), `--accent` (tab active / nút), `--border`, `--text-primary`, `--text-secondary`, `--text-muted`, `--bg-subtle`, `--avatar-color`, `--shadow-2`. CẤM hex rời.

3. **Bước 2 — Pattern** (SKILL.md §1.Bước-2): đọc `.claude/design-library/patterns/overlay.md` — hiểu cấu trúc HTML + CSS skeleton + checklist của overlay lớn.

4. **Bước 3 — Snippet nền** (SKILL.md §1.Bước-3): đọc `.claude/design-library/snippets/overlay-panel.html` → copy toàn bộ → tuỳ chỉnh:
   - Đổi path `tokens.css` → `../../src/styles/tokens.css` (relative từ `docs/design-artifacts/`).
   - Thay class overlay sang `.nib-settings-*` (class từ `src/components/SettingsOverlay/settings-overlay.css`).
   - Thêm horizontal tab bar (`.nib-settings__nav`), hai tab: Account + Appearance.
   - Content area: Account section + Appearance section.
   - Thay placeholder key `data-i18n` bằng key đúng `settings.*` namespace.

5. **Bước 4 — Components** (SKILL.md §1.Bước-4): đọc `.claude/design-library/components.md` → xác nhận class SettingsOverlay đã catalog; tái dùng đúng tên, KHÔNG tự đặt class mới. Đọc thêm `src/components/SettingsOverlay/settings-overlay.css` nếu cần kiểm tra class chi tiết (chỉ đọc, KHÔNG ghi).

6. **Write artifact**: Write `docs/design-artifacts/settings-overlay.html` — nội dung đủ 2 section (Account + Appearance) với markup đúng class `.nib-settings-*`, data-i18n key đúng, token `var(--...)`, `min-width:1024px`.

7. **Bước 5 — Self-verify** (SKILL.md §1.Bước-5): chạy 4 lệnh Bash, paste output vào report. Phải 6/6 DC PASS trước khi `TaskUpdate(completed)`.

**Brief WHAT cho agent `design` (nội dung cần thiết kế):**

Màn Settings Overlay gồm:
- **Scrim** (`.nib-settings__scrim`, `--scrim` token, z-index 50) + **card** (`.nib-settings__panel`, width max 900px, height max 600px, `--bg-elevated`, `--shadow-2`, border-radius 14px, z-index 60).
- **Header** (`.nib-settings__header`, border-bottom `--border`): nút back trái (`.nib-settings__back`, icon ←, 44×44px, ghost) + tiêu đề (`.nib-settings__heading`, `data-i18n="settings.title"`).
- **Tab bar** (`.nib-settings__nav`, height 48px, border-bottom `--border`): 2 tab button (`.nib-settings__nav-item`): tab "Account" (`data-i18n="settings.nav.account"`, `data-active="true"`) + tab "Appearance" (`data-i18n="settings.nav.appearance"`). Tab active có underline `--accent` 2px.
- **Content** (`.nib-settings__content`, padding 28px 36px, overflow-y auto):
  - **Section Account** (`data-i18n="settings.nav.account"` làm tiêu đề section, `.nib-settings__section-title`): dòng identity (`.nib-settings-account__identity`) gồm avatar tròn 64×64 initials "AB" (`.nib-settings-account__avatar`, `--avatar-color`) + block bên phải (`.nib-settings-account__photo-btn` — "Upload photo" badge "soon" + `.nib-settings-account__badge`). Bên dưới: 2 field (`.nib-settings-field`): Display Name (`data-i18n="settings.account.display_name"`, `.nib-settings-field__input`) + Email (`data-i18n="settings.account.email"`, `.nib-settings-field__input`, `type="email"`).
  - **Section Appearance** (ẩn khi tab Account active — dùng CSS `display:none` / `hidden` attribute — hoặc show cả 2 đơn giản cho mockup): `.nib-settings-appearance`. Nhóm Language (`.nib-settings__group`): label `data-i18n="settings.appearance.language"` + 2 option button (`.nib-settings__opt`): EN (`data-i18n="settings.appearance.lang_en"`, `data-active="true"`) + VI (`data-i18n="settings.appearance.lang_vi"`). Nhóm Theme: label `data-i18n="settings.appearance.theme"` + 3 option: Light / Dark / System.
- **State demo**: `data-open="true"` trên `.nib-settings-overlay` để hiển thị. `data-theme="light"` trên `<html>`.

**i18n key list (agent `design` phải đủ):**

| Key | EN | VI |
|---|---|---|
| `settings.title` | Settings | Cài đặt |
| `settings.nav.account` | Account | Tài khoản |
| `settings.nav.appearance` | Appearance | Giao diện |
| `settings.nav.coming_soon` | Soon | Sắp ra |
| `settings.account.display_name` | Display name | Tên hiển thị |
| `settings.account.email` | Email | Email |
| `settings.account.photo_upload` | Upload photo | Tải ảnh lên |
| `settings.appearance.language` | Language | Ngôn ngữ |
| `settings.appearance.lang_en` | English | Tiếng Anh |
| `settings.appearance.lang_vi` | Tiếng Việt | Tiếng Việt |
| `settings.appearance.theme` | Theme | Giao diện |
| `settings.appearance.theme_light` | Light | Sáng |
| `settings.appearance.theme_dark` | Dark | Tối |
| `settings.appearance.theme_system` | System | Theo hệ thống |
| `settings.back` | Back | Quay lại |

**STOP gate** (đo được, phải PASS trước khi `TaskUpdate(completed)`):

| DC | Lệnh | Kỳ vọng |
|---|---|---|
| DC-1 File tồn tại | `ls docs/design-artifacts/settings-overlay.html` | exit 0 |
| DC-2 Link tokens.css | `grep "tokens.css" docs/design-artifacts/settings-overlay.html` | ≥ 1 hit |
| DC-3 0 hex rời | `grep -rnE "#[0-9a-fA-F]{3,8}" docs/design-artifacts/settings-overlay.html` | rỗng (0 match) |
| DC-4 data-i18n | `grep -c "data-i18n" docs/design-artifacts/settings-overlay.html` | ≥ 12 (≥ số chuỗi hiển thị) |
| DC-5 min-width 1024 | `grep "min-width.*1024" docs/design-artifacts/settings-overlay.html` | ≥ 1 hit |
| DC-6 Class Nib tái dùng | `grep -E "nib-(library\|settings\|dock\|strip\|paper\|palette\|block)" docs/design-artifacts/settings-overlay.html` | ≥ 1 hit |

**Output artifact**: `docs/design-artifacts/settings-overlay.html`

**Phase 4 gate** (sau Session 4.1): 6/6 DC PASS (lead đọc report + cross-check Bash output) → Phase 3 unblock.

---

## Outcome cuối

- `docs/design-artifacts/settings-overlay.html` tồn tại, 6/6 DC PASS.
- Bộ đôi [agent `design` + `.claude/design-library/`] được xác nhận hoạt động end-to-end.
- Phase 3 (retire design-figma) unblock — chờ HUMAN-GATE user duyệt diff riêng.

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-20 | Initial | Phase 4 proof run, just-in-time sau Phase 2 gate PASS |
