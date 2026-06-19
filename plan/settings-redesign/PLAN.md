# PLAN — Settings Redesign

> Sau khi xong toàn bộ pipeline: SettingsOverlay được thay bằng layout sidebar-nav (nav trái + content phải, card nổi giống LibraryOverlay) với section registry extensible — 3 section MVP (Account editable local · Appearance = Language+Theme) đều chạy runtime no-reload, ProfileProvider persist localStorage, i18n en/vi parity, tsc 0, build 0, 0 hex rời.

---

## Context

- **Vì sao nhiều session:** Phase 1 gồm 2 task song song (architect HOW + design-figma visual Figma); lead cần gate cả hai xong trước khi editor-frontend build. Phase 2 chia 3 session nhỏ để mỗi session có gate đo được độc lập.
- **Ràng buộc external:** design-figma cần planKey Figma (`team::1618919057199763712`) và file Figma có sẵn để viết vào; nếu Figma chưa tồn tại thì design-figma tạo mới. Không có human gate license.
- **Workstream:** Phase 0 add-on (theo ROADMAP Phase 0 đang đóng). Không phải phase ROADMAP riêng — đây là 1 workstream UI cải thiện.
- **Out of scope:**
  - Auth thật (sign-in/sign-out logic) — Account section dùng local profile, không gọi backend.
  - Upload ảnh avatar — slot `avatarImage?` chừa sẵn trong ProfileProvider, implement post-MVP.
  - Editor/Math prefs section — slot để sau.
  - About section — slot để sau.
  - Backend call từ Settings (không có API call nào trong MVP này).

---

## Quyết định đã chốt (KHÔNG bàn ngược)

| # | Quyết định | Nguồn |
|---|---|---|
| 1 | Container = card nổi GIỐNG LibraryOverlay (overlay lớn centered + scrim + header Back←+tiêu đề, giữ canvas mounted) | USER+LEAD CHỐT |
| 2 | Section registry/pattern — thêm section sau không cần refactor shell | USER+LEAD CHỐT |
| 3 | Nhóm MVP (nav sidebar): "Tài khoản" · "Giao diện" (xem §Nhóm MVP bên dưới) | USER+LEAD CHỐT |
| 4 | Account = UI-ONLY local profile: displayName editable + avatar initials auto-gen + email optional → sống trong **ProfileProvider MỚI**, persist `localStorage['nib-profile']` | USER+LEAD CHỐT (Rev 1 — đã lật Decision cũ "mock static + không tạo provider mới") |
| 5 | Avatar = initials tự sinh từ displayName (1–2 ký tự); data/UI chừa slot `avatarImage?` cho upload ảnh sau (upload = post-MVP, cần Tauri fs/dialog) | USER CHỐT |
| 6 | ProfileProvider theo đúng pattern ThemeProvider/I18nProvider (context + hook + localStorage persist) | LEAD CHỐT |
| 7 | Phase 1 design = architect HOW ∥ design-figma visual (song song, lead relay) — **lead KHÔNG tự chốt bố cục visual** | LEAD CHỐT |
| 8 | i18n en/vi parity bắt buộc — key mới thêm đồng thời cả 2 file | LOCKED (requirements.md §1) |
| 9 | Landscape ≥1024px, token 0 hex rời, theme/lang runtime no-reload | LOCKED (requirements.md §2–3) |
| 10 | Group props SettingsOverlay sớm (tránh pattern 18-props như LibraryOverlay) | Researcher rủi ro R3 |

---

## Nhóm Settings MVP + Future slots

### 2 nhóm MVP (sẽ build)

| ID | Nav label (en / vi) | Nội dung | i18n namespace |
|---|---|---|---|
| `account` | Account / Tài khoản | displayName (text input, editable) · avatar (initials auto-gen, màu auto-hash từ tên, slot cho ảnh sau) · email (optional input) | `settings.account.*` |
| `appearance` | Appearance / Giao diện | Theme (light/dark/system) + Language (en/vi) — gộp 1 section vì đều là "look & feel" | `settings.appearance.*` |

> Lý do gộp Theme+Language → "Giao diện": user trải nghiệm 2 cái này như "đổi bộ mặt app" → 1 nav item hợp lý; giảm chiều dài sidebar; scale tốt khi thêm font/density sau.

### Future slots (KHÔNG build — chứng minh registry scale)

| ID | Nav label (en / vi) | Nội dung dự kiến |
|---|---|---|
| `editor` | Editor / Trình soạn thảo | Block defaults, MathLive prefs, shortcut gõ công thức |
| `paper` | Paper / Trang giấy | Line height, paper density, margin size |
| `shortcuts` | Shortcuts / Phím tắt | Key binding xem/tuỳ chỉnh |
| `about` | About / Giới thiệu | Version, licenses, changelog |

---

## Cơ chế mở rộng (Section Registry)

> Mô tả ý niệm — KHÔNG code, architect HOW sẽ làm việc này.

Mỗi section là một object mô tả (descriptor), ví dụ ý niệm:
```
{ id: "account", i18nKey: "settings.nav.account", icon: "person", component: AccountSection }
```

Registry = 1 mảng descriptor theo thứ tự hiển thị nav. Để thêm section "Editor":
1. Tạo `EditorSection.tsx`.
2. Thêm 1 object vào cuối mảng registry.
3. Shell tự render nav item + điều hướng đúng component.
→ Không cần sửa shell (`SettingsOverlay`, `SettingsNav`, `SettingsContent`).

Đây là trách nhiệm của architect (Task A Phase 1) định nghĩa type chính xác + cách inject.

---

## Data model ProfileProvider

> Phạm vi WHAT (không HOW code). Architect chốt implementation pattern.

**localStorage key:** `nib-profile`

**JSON shape:**
```
{
  displayName: string,       // tên hiển thị, editable, fallback "" → initials = "?"
  email?: string,            // optional, không validate format phức tạp ở MVP
  avatarInitials: string,    // auto-derived: 1–2 ký tự đầu displayName (vd "Nguyễn Hải" → "NH")
  avatarColor: string,       // auto-assigned từ swatch 8 màu (stable hash của displayName)
  avatarImage?: string       // URL/dataURL slot cho ảnh — CHƯA dùng ở MVP, để post-MVP
}
```

**Hành vi initials:**
- `displayName = ""` → initials = `"?"`, màu neutral
- `displayName = "Hung"` → initials = `"H"`
- `displayName = "Nguyen Hai"` → initials = `"NH"` (lấy ký tự đầu mỗi từ, tối đa 2)
- Cập nhật real-time khi user sửa displayName

**Hành vi avatarColor:**
- Hash ổn định của displayName → index vào palette 8 màu (tái dùng swatch token `--swatch-*`)
- KHÔNG random mỗi lần render

**Provider pattern:** theo ThemeProvider/I18nProvider:
- `ProfileProvider` wrap cấp cao (song song Theme/I18n)
- `useProfile()` hook return `{ profile, setDisplayName, setEmail }` (setAvatarImage reserve cho sau)
- Tự persist khi profile thay đổi

---

## i18n key list (MỚI, namespace `settings.*`)

> Liệt kê key cần thêm — text chính xác do design-figma / editor-frontend chốt khi implement. Đây là danh sách WHAT.

**Đã có (giữ nguyên, không xoá):**
- `settings.title` — tiêu đề overlay
- `settings.language` — label chọn ngôn ngữ (đang dùng, có thể migrate vào `appearance.language` sau)
- `settings.theme` — label chọn theme (đang dùng)

**Cần thêm (MỚI):**

| Key | Dùng ở đâu |
|---|---|
| `settings.nav.account` | Nav sidebar label "Tài khoản" |
| `settings.nav.appearance` | Nav sidebar label "Giao diện" |
| `settings.account.title` | Heading trong Account section |
| `settings.account.display_name` | Label input tên hiển thị |
| `settings.account.display_name_placeholder` | Placeholder input ("Your name" / "Tên của bạn") |
| `settings.account.email` | Label input email |
| `settings.account.email_placeholder` | Placeholder email ("your@email.com") |
| `settings.account.avatar_photo` | Label nút đổi ảnh đại diện |
| `settings.account.avatar_coming_soon` | Tooltip/badge nút avatar khi disabled ("Coming soon" / "Sắp có") |
| `settings.appearance.title` | Heading trong Appearance section |
| `settings.appearance.theme` | Label nhóm Theme trong Appearance |
| `settings.appearance.language` | Label nhóm Language trong Appearance |

**Tổng cộng:** 12 key mới + 3 key cũ giữ = 15 key `settings.*`

> Các nhóm Future (editor/shortcuts/about) sẽ có key riêng khi build — KHÔNG cần thêm vào MVP.

---

## Research đã có (Researcher Task #1 — PASS)

- SettingsOverlay hiện: overlay absolute inset:0, panel cố định 460×360px, 2 section (Language + Theme), 3 i18n key, CSS token-driven, 0 hex rời.
- ThemeProvider + I18nProvider mount cấp cao, component dùng hook; no prop drilling cần thiết.
- Wiring: AppShell → settingsOpen → SettingsOverlay (data-open). Sibling LibraryOverlay.
- AccountChip đã xóa (2026-06-18) — Account chỉ qua Settings.
- Mock pattern đã có: `types/` interface + `data/` array tĩnh + pure fn. ProfileProvider theo pattern Provider, KHÔNG theo mock static.
- Token đủ cho Account UI (avatar → `--accent`/`--accent-subtle`/swatch; text → `--text-primary/secondary`).
- Rủi ro R3 (props phình): group props / SettingsContext từ S2.1.
- Rủi ro clamp floating: ghi `mistakes.md` — khi tính vị trí flyout/popover trong overlay phải clamp theo bounds panel, không theo viewport.

---

## Pipeline 2 phase / 4 session

```
[Phase 1] Design ───────────────────► HOW design (architect) + Figma spec (design-figma)
                                           │ (cả hai xong → gate Phase 1)
                                           ▼
[Phase 2] Build ─────────────────────────────────────────────────────────────────────────
    [S2.1] Shell + ProfileProvider + registry scaffold ──► layout mới tồn tại, provider mount
    [S2.2] Account section (editable profile) ────────────► AccountSection render + edit
    [S2.3] Appearance section + migrate + wire + smoke ───► outcome cuối: tsc 0 + build 0
```

---

## Phase 1 — Design (song song 2 task)

**Mục tiêu**: Trước khi build, phải có (a) HOW kỹ thuật từ architect (component tree, API contract, file structure, rủi ro) và (b) visual spec Figma từ design-figma (token map, i18n key list en/vi, screenshot frame ≥1024px). Lead chạy 2 task song song, gate cả hai rồi mới sang Phase 2.

### Session 1.1 — architect HOW ∥ design-figma visual (2 task song song)

**Task A — architect**: thiết kế HOW cho Settings sidebar-nav:
- Component tree (`SettingsOverlay` → `SettingsSidebar` + `SettingsNav` + `SettingsContent` + `AccountSection` + `AppearanceSection`).
- `ProfileProvider` — interface + hook `useProfile()`, localStorage persist, initials derivation logic.
- Section registry: type `SectionDef`, registry array, dynamic render strategy (lazy? eager?).
- Props group strategy (tránh R3) — 1 `SettingsContext` hay grouped props object.
- File structure trong `src/components/SettingsOverlay/` + `src/providers/ProfileProvider/`.
- API contract: state cần truyền (open/onClose, sections, profile).
- Rủi ro: i18n key sync (R4) · animation overlay · focus trap · clamp popover trong panel (mistakes.md).

**Task B — design-figma** (song song Task A): thiết kế visual Figma:
- Frame ≥1024px, ≥2 screen: Account section (editable inputs + avatar) + Appearance section (Theme+Lang gộp).
- Design system tokens map (Figma variable ↔ CSS token) — tái dùng tokens.css.
- i18n key list en/vi đầy đủ (có thể dùng danh sách §i18n key list ở trên làm input).
- Screenshot ≥1 frame bytes > 0.
- **KHÔNG tự chốt bố cục** — dựng 2–3 hướng layout bên trong section, để user/lead chọn.

**STOP gate Phase 1**:
- architect: 5 mục A–E đầy đủ (component tree + API contract + data flow + file structure + ≥1 rủi ro), đủ để editor-frontend không phải đoán. Đặc biệt: ProfileProvider shape + initials logic + registry type phải rõ.
- design-figma: Figma file URL trả được + `get_screenshot` bytes>0 ≥1 frame + token spec bảng (Figma variable↔CSS token) + i18n key list en/vi đủ ~12 key mới + 0 hex rời + frame ≥1024px.
- **Cả hai** gate PASS → Phase 2 mới bắt đầu.

**Output artifact Phase 1**: architect report (prose 5 mục) + Figma file URL + token spec + i18n key list.

**Phase 1 gate** (sau S1.1): architect PASS + design-figma PASS.

---

## Phase 2 — Build

**Mục tiêu**: editor-frontend implement SettingsOverlay mới (sidebar-nav layout), ProfileProvider, Account section editable, migrate Language+Theme vào Appearance section, wire toàn bộ, i18n en/vi parity, gate tsc 0 + build 0 + vitest pass.

### Session 2.1 — Shell + ProfileProvider + section registry scaffold

- **Scope (WHAT)**:
  - `src/providers/ProfileProvider/` — ProfileProvider + useProfile hook + localStorage persist + initials/color logic.
  - Tạo file structure `src/components/SettingsOverlay/` theo architect S1.1.
  - SettingsOverlay mới: overlay card (giống LibraryOverlay) + sidebar-nav layout (nav trái, content phải).
  - Section registry type + array rỗng (chưa có section thật — placeholder "chưa có section").
  - Preserve open/close behavior (AppShell wire giữ nguyên, tương thích data-open nếu dùng).
  - Remove / replace file cũ SettingsOverlay.
  - Mount ProfileProvider cấp cao (cùng tầng ThemeProvider/I18nProvider trong AppShell).
  - i18n skeleton: thêm key `settings.nav.account` + `settings.nav.appearance` cả en.json + vi.json.
- **STOP gate**:
  - `tsc --noEmit` 0 error.
  - `npm run build` exit 0.
  - `vitest run` pass — không break test cũ.
  - `useProfile()` hook trả được object có shape đúng (≥1 test unit).
  - `grep -r "SettingsNav\|SettingsContent" src/` trả ≥1 kết quả.
  - `grep -rE '#[0-9a-fA-F]{3,6}\b' src/components/SettingsOverlay/ src/providers/ProfileProvider/` rỗng.
- **Output artifact**: `src/providers/ProfileProvider/` + `src/components/SettingsOverlay/` (scaffold).

### Session 2.2 — Account section (editable local profile)

- **Scope (WHAT)**:
  - `src/components/SettingsOverlay/AccountSection.tsx` — hiển thị + chỉnh sửa displayName (text input) + email (optional input) + avatar (initials auto-gen từ displayName, màu auto-hash, nút đổi ảnh disabled + "Sắp có").
  - Bind với `useProfile()` — thay đổi persist ngay qua provider.
  - Đăng ký AccountSection vào section registry (`id: "account"`).
  - i18n keys Account en/vi (`settings.account.*`): tất cả key trong danh sách §i18n (9 key mới).
- **STOP gate**:
  - `tsc --noEmit` 0 error.
  - `npm run build` exit 0.
  - `vitest run` pass — ≥2 test mới: (a) useProfile initials derivation ("Nguyen Hai" → "NH"); (b) AccountSection render display_name input + avatar initials.
  - `grep -rE '#[0-9a-fA-F]{3,6}\b' src/components/SettingsOverlay/AccountSection.tsx src/providers/ProfileProvider/` rỗng.
  - i18n parity: `grep -c '"settings.account' src/locales/en.json` == `grep -c '"settings.account' src/locales/vi.json`.
- **Output artifact**: `src/components/SettingsOverlay/AccountSection.tsx` (+ ProfileProvider đã đủ).

### Session 2.3 — Appearance section + migrate + wire + i18n parity + smoke gate

- **Scope (WHAT)**:
  - `src/components/SettingsOverlay/AppearanceSection.tsx` — gộp Language (useI18n) + Theme (useTheme) vào 1 section.
  - Migrate logic từ SettingsOverlay cũ vào AppearanceSection; giữ `useTheme`/`useI18n` không đổi.
  - Đăng ký AppearanceSection vào registry (thứ tự nav: Account → Appearance).
  - Wire nav: click nav item → render đúng section; default active = Account.
  - i18n keys Appearance en/vi (`settings.appearance.*`): 3 key mới (title, theme, language).
  - i18n parity tổng `settings.*` — không bỏ key cũ nếu còn dùng (migrate hay alias).
  - Xóa code SettingsOverlay cũ / dead code.
  - Không thêm API call mới.
- **STOP gate** (gate cuối — outcome):
  - `tsc --noEmit` 0 error.
  - `npm run build` exit 0.
  - `vitest run` pass — không break test cũ (≥56+số test S2.1+S2.2 mới); có thể thêm test nav navigation.
  - `grep -rE '#[0-9a-fA-F]{3,6}\b' src/components/SettingsOverlay/` rỗng.
  - i18n parity tổng: `grep -c '"settings\.' src/locales/en.json` == `grep -c '"settings\.' src/locales/vi.json`.
  - Click-through checklist (user smoke — Chrome ext không dùng được từ agent):
    - [ ] Settings mở → sidebar-nav 2 mục (Tài khoản / Giao diện).
    - [ ] Click Tài khoản → input tên + email + avatar initials hiện; sửa tên → initials cập nhật ngay; nút đổi ảnh disabled + "Sắp có".
    - [ ] Reload → displayName + email vẫn persist (localStorage).
    - [ ] Click Giao diện → switch en↔vi runtime, no reload; switch light/dark/system runtime, no reload.
    - [ ] Đóng Settings → overlay ẩn, state trả về bình thường.
  - **Gate vàng (no-crash):** vòng lõi gõ block → Tính → result inline không crash sau khi Settings đóng.
- **Output artifact**: `src/components/SettingsOverlay/` hoàn chỉnh (shell + 2 section) + updated `src/locales/en.json` + `vi.json`.

**Phase 2 gate** (sau S2.3): tất cả STOP gate trên pass.

---

## Outcome cuối

- SettingsOverlay mới: card nổi giống LibraryOverlay, sidebar-nav layout, 2 section MVP (Account editable local + Appearance = Language+Theme), registry extensible.
- ProfileProvider: persist `nib-profile`, initials auto-gen, slot `avatarImage?` sẵn sàng post-MVP.
- i18n en/vi parity tổng `settings.*` key (15 key).
- tsc 0 · `npm run build` 0 · vitest ≥56 + test mới pass · 0 hex rời trong `src/components/SettingsOverlay/` + `src/providers/ProfileProvider/`.
- Runtime: lang switch no-reload · theme switch no-reload · profile persist reload.
- Slot sẵn sàng cho Editor / Shortcuts / About / Paper section (chỉ thêm vào registry, không refactor shell).
- Click-through checklist 5 mục user xác nhận pass.

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-19 | Initial (draft) | Khởi tạo từ brief Task #2 (team settings-redesign, researcher Task #1 PASS) |
| 2026-06-19 | Revision 1 — đảo Decision #4 và #9 cũ: Account = ProfileProvider editable (không phải mock static + không giữ "không tạo provider mới"). Thêm §Nhóm Settings, §Cơ chế mở rộng, §Data model ProfileProvider, §i18n key list. Cập nhật sessions Phase 2 (S2.1 thêm ProfileProvider, S2.2 editable Account, S2.3 gộp Lang+Theme → AppearanceSection). | USER+LEAD chốt qua context.md entry 2026-06-19 settings-redesign; Task #2 brief |
