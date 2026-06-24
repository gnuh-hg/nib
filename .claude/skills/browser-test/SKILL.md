---
name: browser-test
description: "Thực thi flow test Nib bằng Chrome MCP: lái Chrome foreground, thao tác theo flow file đã ready, thu evidence (screenshot/GIF/console). CẢNH BÁO: foreground-only (ISSUE-8) — background teammate không reach extension."
---

# browser-test — thực thi flow test bằng Chrome / Playwright

> Skill phục vụ riêng vai **`tester`**. Mục đích: thực thi 1 flow đã `status: ready` + thu evidence đo được. **2 đường execute:** Playwright headless (PRIMARY, background-safe) và Chrome MCP (secondary, foreground-only).

---

## §0. Playwright headless (PRIMARY — background-safe, ISSUE-8 giải block)

> **Dùng đường này trước** khi Chrome MCP. Playwright headless chạy qua `Bash` — KHÔNG cần Chrome extension, KHÔNG cần foreground session. Background teammate dùng được hoàn toàn.

### Điều kiện tiên quyết

```bash
# Kiểm Playwright đã cài chưa (devDependency @playwright/test + chromium binary)
ls node_modules/.bin/playwright && echo "OK" || echo "CHƯA CÀI — báo lead"
ls ~/.cache/ms-playwright/ && echo "Chromium cache OK" || echo "Chạy: npx playwright install chromium"

# Kiểm dev server đang chạy (:1420)
curl -s -o /dev/null -w "%{http_code}" http://localhost:1420 | grep -q "200\|304" && echo "OK" || echo "CHƯA CHẠY — báo lead: cần npm run dev"
```

### Mode 1 — Inline script (nhanh, cho 1 flow)

```bash
# Viết spec tạm + chạy ngay (thay <slug> + <case-name>)
cat > /tmp/nib-test-<slug>.spec.ts << 'EOF'
import { test, expect, Page } from '@playwright/test';

// Util: thu console errors
async function collectErrors(page: Page): Promise<string[]> {
  const errs: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text()); });
  return errs;
}

test('<case-name>', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('http://localhost:1420');
  // --- thao tác ---
  await page.locator('<selector>').click();
  await expect(page.locator('<selector>')).toBeVisible();
  // --- evidence ---
  await page.screenshot({ path: 'tests/flows/evidence/<slug>/case-1.png', fullPage: true });
  // --- gate ---
  expect(errors, `console errors: ${errors.join('; ')}`).toHaveLength(0);
});
EOF

npx playwright test /tmp/nib-test-<slug>.spec.ts \
  --project=chromium \
  --reporter=list \
  2>&1
```

### Mode 2 — File trong `tests/flows/playwright/` (tái dùng)

```bash
# Ghi spec vào tests/flows/playwright/<slug>.spec.ts
# Chạy:
npx playwright test tests/flows/playwright/<slug>.spec.ts \
  --project=chromium \
  --reporter=list \
  2>&1
```

### Thu evidence

| Loại | Cách thu | Lưu ở |
|---|---|---|
| Screenshot | `page.screenshot({ path: '...', fullPage: true })` | `tests/flows/evidence/<slug>/case-N.png` |
| Toàn flow GIF/video | thêm `--video=on` vào lệnh + copy từ `test-results/` | `tests/flows/evidence/<slug>/` |
| Console errors | `page.on('console', ...)` collect trong test | ghi vào `console.txt` nếu có lỗi |

### Gate Playwright

```bash
# PASS = exit 0 + 0 failed
npx playwright test <spec-file> --project=chromium --reporter=list 2>&1
echo "Exit: $?"
# Screenshot evidence phải tồn tại:
ls tests/flows/evidence/<slug>/
```

### Cẩn thận với Playwright

- **Dev server PHẢI đang chạy** (`npm run dev` :1420) — Playwright không tự khởi server.
- **KHÔNG cần `playwright.config.ts`** cho inline test (--project=chromium đủ).
- **MathLive web component**: đợi hydrate trước khi click → `page.waitForSelector('math-field')` hoặc `page.waitForLoadState('networkidle')`.
- **`page.goto` timeout default = 30s** — đủ cho Vite dev server.

---

## ⚠️ CẢNH BÁO CHROME MCP — FOREGROUND-ONLY (ISSUE-8, secondary fallback)

**Chrome extension bind vào DUY NHẤT 1 foreground session.** Background teammate **KHÔNG** reach được extension — đã xác nhận ≥4 session xuyên nhiều phiên Nib.

```
Nếu đang là BACKGROUND TEAMMATE:
  → KHÔNG gọi bất kỳ mcp__claude-in-chrome__* tool nào.
  → Nộp flow file đã "ready" cho lead.
  → Kèm click-through checklist (xem §5 dưới) để lead/user tự thực thi.
  → TaskUpdate(completed) + SendMessage kèm checklist.

Nếu đang là FOREGROUND SESSION (lead tự chạy hoặc user mời foreground):
  → Bắt đầu với tabs_context_mcp để lấy tab context hiện tại.
  → Tiến hành §1–§4 bình thường.
```

Xem thêm: `.claude/teams/playbook.md §9` (giới hạn Agent Teams) + `.claude/skills/team-fix/SKILL.md §7.A nhóm chrome`.

---

## 1. Trình tự chuẩn thực thi flow

### Bước 0 — Chuẩn bị (trước khi mở Chrome)

1. Kiểm tiền điều kiện của flow:
   ```bash
   # Dev server Nib chạy chưa?
   # Nib dùng Vite dev server cổng :1420
   curl -s -o /dev/null -w "%{http_code}" http://localhost:1420 | grep -q "200\|304" && echo "OK" || echo "CHƯA CHẠY — chạy: npm run dev"
   ```
2. Nếu chưa có server → thông báo cho lead/user: "Cần `npm run dev` từ root repo trước khi thực thi".
3. Đọc lại flow file (`tests/flows/<slug>.flow.md`) — nắm đủ case + sequence thao tác.

### Bước 1 — Khởi tạo tab

```
mcp__claude-in-chrome__tabs_context_mcp    # Luôn gọi đầu tiên — lấy tab context hiện tại
```

- Nếu đã có tab Nib (:1420) phù hợp: dùng tab ID đó.
- Nếu chưa có:
  ```
  mcp__claude-in-chrome__tabs_create_mcp   # Tạo tab mới
  mcp__claude-in-chrome__navigate(tabId, "http://localhost:1420")
  ```
- **Không reuse tab ID từ phiên trước** — luôn lấy từ `tabs_context_mcp`.

### Bước 2 — Thao tác theo flow (per-case)

Với mỗi case trong flow file:

| Hành động | Tool |
|---|---|
| Click vào element | `mcp__claude-in-chrome__computer` (chuột) hoặc `mcp__claude-in-chrome__find` → lấy selector → `computer` |
| Nhập text / form | `mcp__claude-in-chrome__form_input` |
| Đọc nội dung trang | `mcp__claude-in-chrome__read_page` hoặc `mcp__claude-in-chrome__get_page_text` |
| Chạy JS (check state, scroll) | `mcp__claude-in-chrome__javascript_tool` |
| Navigate | `mcp__claude-in-chrome__navigate` |
| Chụp screenshot / GIF | `mcp__claude-in-chrome__computer` (screenshot) hoặc `mcp__claude-in-chrome__gif_creator` |

**Capture frame trước + sau mỗi thao tác quan trọng** để GIF playback mượt.

### Bước 3 — Kiểm console

Sau mỗi thao tác quan trọng (và bắt buộc sau toàn bộ flow):

```
mcp__claude-in-chrome__read_console_messages(tabId, pattern="error|Error|FAILED")
```

- Kỳ vọng: 0 error. Warning không-chặn ghi chú nhưng không FAIL.
- Network lỗi (auth, sync) → dùng `read_network_requests` để phân tích thêm.

### Bước 4 — Thu evidence

- **Screenshot**: chụp sau mỗi case chính → đặt tên gợi nhớ (`case-1-happy.png`, `case-3-error.png`).
- **GIF**: dùng `gif_creator` cho flow nhiều bước (login, drag, animation) → tên `<slug>-<case>.gif`.
- **Console log**: copy text lỗi (nếu có) → `tests/flows/evidence/<slug>/console.txt`.
- Lưu tất cả vào `tests/flows/evidence/<slug>/`.

### Bước 5 — Ghi kết quả vào flow file

Điền bảng "5. Kết quả chạy" trong `tests/flows/<slug>.flow.md`:

```markdown
| Case # | Kết quả | Evidence | Ghi chú |
|---|---|---|---|
| 1 | PASS | evidence/slug/case-1-happy.png | |
| 3 | FAIL | evidence/slug/case-3-error.png | banner lỗi không xuất hiện |
```

Cập nhật frontmatter:
- `status: executed`
- `last_run: YYYY-MM-DD`

---

## 2. Format report evidence (SendMessage cho lead)

```markdown
## Evidence — <slug>.flow.md

| Gate | Cách kiểm | Kết quả |
|---|---|---|
| Console | read_console_messages pattern=error | 0 error ✓ |
| Case 1 (Happy) | navigate + gõ + verify output | PASS — screenshot case-1-happy.png |
| Case 3 (Error) | server 500 → observe banner | FAIL — banner không hiển thị |
| i18n | đổi lang vi → en | PASS — cả 2 ngôn ngữ đúng |
| Theme | light → dark | PASS — màu token đúng |
| Thiết bị | 1024px landscape | PASS — layout không vỡ |

**Verdict:** FAIL tại Case 3 — <triệu chứng cụ thể>
Evidence: tests/flows/evidence/<slug>/
```

> Map ngược vào flow file: PASS/FAIL từng case ghi vào "5. Kết quả chạy".

---

## 3. Quy tắc tránh dialog (alert/confirm/prompt)

**KHÔNG click** nút/link có thể trigger `alert()`, `confirm()`, `prompt()` — browser dialog block extension, mọi lệnh tiếp theo sẽ timeout.

```
❌ KHÔNG: click nút "Xóa" nếu có confirm dialog JS
✓ Thay bằng: dùng javascript_tool để kiểm state mà không trigger dialog
✓ Hoặc: dùng javascript_tool để dismiss dialog trước nếu biết sẽ xuất hiện
```

```javascript
// Kiểm và dismiss dialog trước khi click nút nguy hiểm:
// javascript_tool: window.__confirmResult = true; window.confirm = () => window.__confirmResult;
```

Nếu dialog đã trigger và mất phản hồi → thông báo user: "Cần dismiss dialog thủ công trong browser".

---

## 4. Case đặc biệt — i18n, theme, thiết bị

### i18n (Case 7 [LOCKED])

```
1. navigate :1420 → mở Settings
2. Đổi lang → "English" → quan sát toàn bộ UI
3. Đổi lang → "Tiếng Việt" → quan sát toàn bộ UI
PASS: mọi text hiển thị đúng ngôn ngữ; không thấy key raw (vd "settings.lang")
```

### Theme (Case 8 [LOCKED])

```
1. Đổi theme → Light → screenshot
2. Đổi theme → Dark → screenshot
3. Đổi theme → System (theo OS)
PASS: màu thay đổi đúng; không có element vẫn giữ màu cũ; console 0 error
Kiểm nhanh: javascript_tool → getComputedStyle(document.body).getPropertyValue('--bg-base')
```

### Thiết bị ≥1024px (Case 9 [LOCKED])

```
javascript_tool: window.innerWidth → kỳ vọng ≥1024
Kiểm layout không vỡ (không horizontal scrollbar):
  javascript_tool: document.documentElement.scrollWidth <= window.innerWidth
Hit target: find(".nib-dock__navbtn") → getComputedStyle → height ≥44px
```

---

## 5. Click-through checklist (dùng khi background — ISSUE-8)

Khi không thể chạy Chrome (background teammate), nộp template này cho lead/user:

```markdown
## Click-through checklist — <feature-slug>

> Thực thi thủ công: `npm run dev` (:1420) → mở Chrome → làm từng bước.

### Tiền điều kiện
- [ ] `npm run dev` đang chạy (:1420)
- [ ] <điều kiện cụ thể từ flow: vd đã đăng nhập, có ≥1 doc>

### Case 1 — Happy path
- [ ] <bước 1>
- [ ] <bước 2>
- [ ] **PASS khi:** <kết quả kỳ vọng đo được>

### Case 2 — ...
...

### Case 7 — i18n
- [ ] Mở Settings → đổi lang → English → kiểm UI
- [ ] Đổi sang Tiếng Việt → kiểm UI
- [ ] **PASS khi:** text đúng ngôn ngữ, không thấy key raw

### Case 8 — Theme
- [ ] Settings → Light → screenshot
- [ ] Dark → screenshot; **PASS khi:** màu token đổi đúng

### Case 9 — Thiết bị
- [ ] Resize cửa sổ về ≥1024px landscape
- [ ] **PASS khi:** layout không vỡ, không horizontal scrollbar

### Ghi nhận kết quả
- PASS / FAIL: ___
- Case FAIL (nếu có): Case # — <triệu chứng>
- Screenshot (nếu có): đặt vào `tests/flows/evidence/<slug>/`
```

---

## 6. Quick reference

```
TRÌNH TỰ CHUẨN:
  0. Kiểm tiền điều kiện (curl :1420)
  1. tabs_context_mcp → tabs_create_mcp/navigate :1420
  2. Thao tác per-case (computer/find/form_input/javascript_tool)
  3. read_console_messages pattern=error (kỳ vọng 0)
  4. Thu evidence → tests/flows/evidence/<slug>/
  5. Ghi "5. Kết quả chạy" + cập nhật status:executed

TRÁNH:
  - Dialog JS (alert/confirm) → block extension
  - Reuse tab ID từ phiên khác
  - Gate cảm tính ("có vẻ đúng")

BACKGROUND → nộp click-through checklist (§5)
FOREGROUND → bắt đầu tabs_context_mcp

PASS = console 0 error + screenshot evidence + kết quả khớp expected
FAIL = ghi rõ case # + triệu chứng cụ thể (KHÔNG "có lỗi gì đó")
```
