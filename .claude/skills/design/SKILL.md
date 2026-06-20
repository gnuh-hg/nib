---
name: design
description: "Workflow dựng mockup HTML/CSS pixel-accurate cho agent `design` (note-ch): 5 bước (tokens→pattern→snippet→component→verify), ≥6 done-criteria đo được, anti-pattern, gate idiom. Tham chiếu .claude/design-library/ — KHÔNG Figma, KHÔNG hex rời."
---

# design SKILL — Workflow dựng mockup HTML/CSS

> Skill phục vụ **riêng agent `design`**. Đọc sau khi đọc đủ 4 file đầu phiên (master/playbook/context/memory).  
> **Entry point thư viện**: `.claude/design-library/INDEX.md` — đọc trước bước 1.  
> Output = `docs/design-artifacts/<slug>.html` (link `../../src/styles/tokens.css`, class Nib, 0 hex rời).

---

## §1 — Workflow 5 bước (mỗi task design)

### Bước 1 — Nắm token (đọc `.claude/design-library/tokens.md`)

Đọc `.claude/design-library/tokens.md`:
- §1–§2 (màu nền + chữ): biết `--bg-app` / `--bg-elevated` / `--text-primary` / `--text-muted`.
- §4–§9 (accent / result / approx / scrim / state): biết màu nào cho interaction nào.
- §13–§14 (typography + spacing): dùng `var(--font-size-ui-sm)`, `var(--space-4)` — không hardcode px.
- §16 (dark overrides): biết token nào thay đổi dark → đảm bảo `data-theme="dark"` test được.

**Quy tắc bất biến**: CẤM hex rời (`var(...)` không có → tự điền `#xxxxxx`) — tra token đúng ở `tokens.md` rồi dùng `var(--token)`.

### Bước 2 — Xác định pattern (đọc `.claude/design-library/patterns/`)

Đọc `.claude/design-library/INDEX.md` bảng "Phân loại pattern" → chọn file pattern phù hợp:

| Loại màn | File pattern | Snippet nền |
|---|---|---|
| Overlay lớn (Library / Settings / dialog) | `.claude/design-library/patterns/overlay.md` | `snippets/overlay-panel.html` |
| Dock dọc NAV↔TOOLS | `.claude/design-library/patterns/dock-drill-down.md` | `snippets/dock-nav-level.html` |
| Canvas giấy kẻ + block toán | `.claude/design-library/patterns/ruled-paper-canvas.md` | `snippets/ruled-paper-canvas.html` |
| Popover / dropdown nhỏ | `.claude/design-library/components.md` §5 | — (tái dùng `.nib-lib-sort`) |
| Form field | `.claude/design-library/components.md` §6 | — (tái dùng `.nib-settings-field`) |

Đọc file pattern → hiểu cấu trúc HTML, CSS skeleton, checklist.

### Bước 3 — Lấy snippet nền + link CSS component THẬT (đọc `.claude/design-library/snippets/`)

Đọc snippet gần nhất → copy toàn bộ file → tuỳ chỉnh:
1. **Đường dẫn tokens.css**: `../../../src/styles/tokens.css` → **`../../src/styles/tokens.css`** (relative từ `docs/design-artifacts/`).
2. **Link CSS component thật (BẮT BUỘC — DC-7)**: mỗi component Nib trong mockup → phải thêm `<link>` CSS component từ `src/`. Không link = tự viết CSS xấp xỉ = render lệch (ISSUE-13). Tra `.claude/design-library/INDEX.md §MAPPING` để biết file nào link file nào. Ví dụ:
   ```html
   <link rel="stylesheet" href="../../src/styles/tokens.css">
   <link rel="stylesheet" href="../../src/components/LibraryOverlay/library-overlay.css">
   ```
3. **Class + icon THẬT (BẮT BUỘC — DC-8)**: class y hệt src `.tsx` (xem `components.md`); icon SVG copy đúng `viewBox/d/strokeWidth` từ `src/components/icons.tsx`. 0 class bịa (`.nib-demo-*`), 0 icon xấp xỉ.
4. **data-i18n key**: thay placeholder bằng key đúng. Ghi key list ra report.
5. **data-theme**: `data-theme="dark"` (app default); hoặc cả 2 bản để test.
6. **min-width 1024px**: giữ `<html style="min-width:1024px">` — không rút bỏ.

### Bước 4 — Kiểm + tái dùng component (đọc `.claude/design-library/components.md`)

Đọc `.claude/design-library/components.md` → với mỗi UI element cần thiết kế:
- Nếu component **đã có** (UnifiedDock / LibraryOverlay / SettingsOverlay / TopStrip / Canvas / CommandPalette / NibBlock) → **tái dùng class CSS y hệt** (`.nib-library__panel`, `.nib-dock__expanded`, `.nib-settings__panel`…).
- Nếu cần biến thể → thêm modifier `nib-<component>__<element>--<variant>`.
- Nếu component **chưa có** → đặt tên mới dạng `nib-<slug>__<element>` nhất quán, ghi chú trong report.
- KHÔNG dùng `!important` (trừ override animation pattern).
- KHÔNG sửa class gốc của component đã có.

### Bước 5 — Write file + tự verify bằng Bash (gate bắt buộc)

Write `docs/design-artifacts/<slug>.html`. Sau đó chạy **tất cả 6 lệnh** dưới đây và paste output vào report:

```bash
# 1. Verify 0 hex rời — DC-3 (kỳ vọng: rỗng — 0 match)
grep -rnE "#[0-9a-fA-F]{3,8}" docs/design-artifacts/<slug>.html

# 2. Verify link tokens.css — DC-2 (kỳ vọng: ≥1 hit)
grep "tokens.css" docs/design-artifacts/<slug>.html

# 3. Verify link CSS component thật — DC-7 (kỳ vọng: ≥1 hit)
grep "src/components" docs/design-artifacts/<slug>.html

# 4. Verify 0 class bịa nib-demo — DC-8 (kỳ vọng: rỗng)
grep "nib-demo" docs/design-artifacts/<slug>.html

# 5. Verify i18n key — DC-4 (kỳ vọng: ≥ số chuỗi hiển thị)
grep -c "data-i18n" docs/design-artifacts/<slug>.html

# 6. Verify landscape min-width — DC-5 (kỳ vọng: ≥1 hit)
grep "min-width.*1024" docs/design-artifacts/<slug>.html
```

**Visual-verify (bắt buộc ghi checklist trong report)**:
```bash
# Serve từ REPO ROOT — KHÔNG --directory (link ../../src/... cần resolve từ root):
# cwd: /home/gnuh/Documents/project/Nib
python3 -m http.server 8081
# Mở: http://localhost:8081/docs/design-artifacts/<slug>.html
# So với app: npm run dev → http://localhost:1420
```
Visual-verify = USER gate. Agent `design` liệt click-through checklist kèm report; lead/user so sánh app thật.

**KHÔNG báo done khi gate chưa qua** — gate cảm tính ("trông đẹp", "có vẻ ổn") không hợp lệ.

### Bước 6 — Motion-intent spec (khi màn/component có chuyển động)

Nếu thiết kế có transition hoặc animation (slide-in, fade, expand-panel, scroll-driven overlay...):

1. Ghi **motion intent comment** ngay trong HTML file (trước element có animation):
   ```html
   <!-- MOTION-INTENT: panel slide-in từ phải, ease power2.out, duration 0.25s; reduced-motion: instant (no transition) -->
   ```
2. Liệt kê trong **report** (SendMessage): loại chuyển động / ease gợi ý / duration ước lệ / reduced-motion fallback.
3. **Vocabulary ease**: dùng tên GSAP (`power2.out`, `expo.inOut`, `back.out(1.7)`...) thay vì mô tả chung (`ease-in-out`) — tra `.claude/skills/gsap-core/SKILL.md` để chọn đúng. `editor-frontend` dùng tên này trực tiếp.
4. **Reduced-motion**: luôn kèm fallback (`@media (prefers-reduced-motion: reduce)` trong CSS demo, hoặc ghi note "instant, no transition"). Bắt buộc — thiếu = motion spec chưa hoàn chỉnh.
5. **KHÔNG viết code GSAP** trong mockup HTML — đây là spec ý đồ; `editor-frontend` implement bằng GSAP theo `.claude/agents/design.md §Liên quan > Skill GSAP`.

---

## §2 — Done-criteria checklist (≥6, đo được)

Agent `design` PHẢI tự verify toàn bộ list này trước khi `TaskUpdate(completed)`:

- [ ] **DC-1 Artifact tồn tại**: `ls docs/design-artifacts/<slug>.html` exit 0 (file có trên đĩa)
- [ ] **DC-2 Link tokens.css**: `grep "tokens.css" docs/design-artifacts/<slug>.html` ≥ 1 hit — link `../../src/styles/tokens.css` (relative, không absolute)
- [ ] **DC-3 0 hex rời**: `grep -rnE "#[0-9a-fA-F]{3,8}" docs/design-artifacts/<slug>.html` = rỗng (0 match)
- [ ] **DC-4 i18n key**: `grep -c "data-i18n" docs/design-artifacts/<slug>.html` ≥ số chuỗi hiển thị — mọi text qua `data-i18n`, không hardcode string EN/VI
- [ ] **DC-5 Landscape ≥1024px**: `grep "min-width.*1024" docs/design-artifacts/<slug>.html` ≥ 1 hit (hoặc `<html style="min-width:1024px">` tồn tại)
- [ ] **DC-6 Tái dùng class catalog**: `grep -E "nib-(library|settings|dock|strip|paper|palette|block)" docs/design-artifacts/<slug>.html` ≥ 1 hit — tái dùng ≥1 class từ `.claude/design-library/components.md`
- [ ] **DC-7 Link CSS component thật**: `grep "src/components" docs/design-artifacts/<slug>.html` ≥ 1 hit — artifact link ≥1 CSS component từ `src/` (không chỉ tokens.css); thiếu = CSS inline xấp xỉ = render lệch (ISSUE-13)
- [ ] **DC-8 0 class bịa + class tồn tại src**: (a) `grep "nib-demo" docs/design-artifacts/<slug>.html` = rỗng; (b) mọi class `nib-*` dùng trong artifact tồn tại trong file CSS được link (đối chiếu thủ công hoặc grep từng class vào src/)

Paste kết quả từng lệnh vào SendMessage report. PASS khi 8/8 ✅.

---

## §3 — Anti-pattern (cấm)

| Sai | Đúng |
|---|---|
| Hardcode hex màu (vd `color: var(--token)` không có token → tự điền `#xxxxxx`) | Tra `.claude/design-library/tokens.md` → dùng `var(--tên-token)` đúng |
| Hardcode text EN/VI trong HTML (`<span>Thư viện</span>`) | `<span data-i18n="library.title">Library</span>` |
| Tự đặt tên class mới cho component đã có trong catalog | Đọc `components.md` → tái dùng class gốc |
| Dùng đường dẫn tuyệt đối cho tokens.css (`/src/styles/...`) | Relative: `../../src/styles/tokens.css` từ `docs/design-artifacts/` |
| Thiết kế ≤1024px hoặc portrait | `min-width:1024px` trên `<html>`, landscape only |
| Mention Figma / dùng mcp__figma | Agent `design` = code-native, KHÔNG Figma |
| Báo done mà không chạy Bash verify | Chạy đủ 4 lệnh §1.Bước-5, paste output |
| Dùng token không tồn tại trong `src/styles/tokens.css` | Chỉ dùng token đã catalog ở `tokens.md` |
| Sửa bất kỳ file trong `src/` | Chỉ đọc `src/` — ghi vào `docs/design-artifacts/` |
| Dùng `!important` tùy tiện | Chỉ khi override animation (pattern đã có trong dock.css) |
| **Link chỉ tokens.css, tự viết CSS component inline** ("đủ để thấy layout") | Link CSS component thật từ `src/components/` (DC-7); 0 CSS inline cho component đã có trong src — viết lại ≈ render lệch (ISSUE-13) |
| **Icon SVG xấp xỉ** — tự vẽ path gần đúng (sai viewBox/d, sai shape) | Copy đúng từ `src/components/icons.tsx`: viewBox/d/strokeWidth y hệt nguồn |
| **Class bịa** `.nib-demo-*` / `.nib-demo__*` để "tiện demo" | Dùng class thật từ src; wrapper demo → non-nib (`.demo-canvas`, `.demo-bg`) |
| Màn có chuyển động nhưng **không ghi motion-intent** (loại/ease/duration/reduced-motion) | Ghi comment HTML + liệt kê trong report (§1 Bước 6); dùng vocab GSAP (vd `power2.out`); kèm reduced-motion fallback |

---

## §4 — Gate idiom tổng hợp

Lệnh verify nhanh toàn bộ artifact (chạy từ gốc repo):

```bash
# Gate tổng — paste toàn bộ output vào report:
FILE="docs/design-artifacts/<slug>.html"

echo "=== DC-1: File exists ==="
ls "$FILE" && echo "PASS" || echo "FAIL"

echo "=== DC-2: tokens.css link ==="
grep "tokens.css" "$FILE" && echo "PASS" || echo "FAIL: no tokens.css link"

echo "=== DC-3: 0 hex rời ==="
HEXOUT=$(grep -rnE "#[0-9a-fA-F]{3,8}" "$FILE")
[ -z "$HEXOUT" ] && echo "PASS (empty)" || echo "FAIL: $HEXOUT"

echo "=== DC-4: data-i18n count ==="
grep -c "data-i18n" "$FILE" && echo "hits (kỳ vọng ≥ số chuỗi)"

echo "=== DC-5: min-width 1024 ==="
grep "min-width.*1024" "$FILE" && echo "PASS" || echo "FAIL"

echo "=== DC-6: Nib class ==="
grep -oE "nib-(library|settings|dock|strip|paper|palette|block)[a-z_-]*" "$FILE" | head -5

echo "=== DC-7: link CSS component src (kỳ vọng ≥1) ==="
grep "src/components" "$FILE" && echo "PASS" || echo "FAIL: chỉ link tokens.css → CSS inline lệch app"

echo "=== DC-8: 0 class bịa nib-demo (kỳ vọng rỗng) ==="
DEMOOUT=$(grep "nib-demo" "$FILE")
[ -z "$DEMOOUT" ] && echo "PASS (empty)" || echo "FAIL: $DEMOOUT"
```

**Visual-verify** (paste checklist kèm report — lead/user mở browser):
```bash
# Serve từ REPO ROOT:
python3 -m http.server 8081
# URL: http://localhost:8081/docs/design-artifacts/<slug>.html
# So sánh với: http://localhost:1420 (npm run dev)
```

---

## §5 — Trỏ tài liệu nhanh

| Cần biết | Đọc file |
|---|---|
| Cách tra cứu thư viện (thứ tự đọc, quy ước) | `.claude/design-library/INDEX.md` |
| Tên + semantic token (khi nào dùng) | `.claude/design-library/tokens.md` |
| Class CSS component Nib + cách tái dùng | `.claude/design-library/components.md` |
| Blueprint overlay (Library/Settings) | `.claude/design-library/patterns/overlay.md` |
| Blueprint dock NAV↔TOOLS | `.claude/design-library/patterns/dock-drill-down.md` |
| Blueprint canvas giấy kẻ + block | `.claude/design-library/patterns/ruled-paper-canvas.md` |
| Snippet overlay copy-được | `.claude/design-library/snippets/overlay-panel.html` |
| Snippet dock NAV copy-được | `.claude/design-library/snippets/dock-nav-level.html` |
| Snippet canvas copy-được | `.claude/design-library/snippets/ruled-paper-canvas.html` |
| Agent body đầy đủ | `.claude/agents/design.md` |
| 3 req nền [LOCKED] chi tiết | `docs/requirements.md` |
| 2 đường nhập cốt lõi | `docs/feature.md` |
