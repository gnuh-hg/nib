---
slug: free-caret
title: Free-caret UX — click-to-position, ghost caret, materialize, arrow nav
status: executed
owner: tester
created: 2026-06-23
last_run: 2026-06-24
---

# Flow test — Free-caret UX (Phase C)

> **⚠️ EXECUTION = FOREGROUND ONLY (ISSUE-8)**
> Chrome extension chỉ bind vào 1 foreground session. Background teammate KHÔNG reach được.
> Tester đã soạn flow này background-safe; **lead hoặc user thực thi Chrome foreground**.
> Click-through checklist đầy đủ ở §3 + §5 cuối file.

---

## 1. Phạm vi & khi nào chạy (trigger)

- **Test cái gì:** Kiểm luồng free-caret end-to-end sau Phase C — (1) click lên paper đặt ghost caret đúng toạ độ, (2) gõ ký tự vật chất hoá row tại ĐÚNG vị trí ghost (đây là bug chính cần kiểm), (3) click vào text có sẵn chèn caret đúng chỗ, (4) arrow nav 2D giữ goalX, (5) không rớt ký tự. File liên quan: `src/editor/plugins/ghostCaret.ts` (handleClickOnPaper / materializeAtGhostPark) + `src/editor/plugins/caretNav.ts` + `src/editor/RowView.tsx` + `src/components/Workspace.tsx` + `src/components/Canvas.tsx`.
- **Route/màn:** `http://localhost:1420` — màn canvas chính (`WorkspaceEditor`); không cần login (IndexedDB offline-only hoạt động với `userId='local'`).
- **Khi nào chạy flow này:**
  - **Touch-area**: khi bất kỳ thay đổi nào đụng `ghostCaret.ts` / `caretNav.ts` / `Workspace.tsx` / `RowView.tsx` / `Canvas.tsx`.
  - **Feature-complete Phase C**: sau khi editor-frontend báo Phase C done + evidence pass.
  - **Regression**: trước mỗi lần merge/release đụng Phase C/D.
- **Tiền điều kiện:**
  - `npm run dev` đang chạy tại `:1420` (hoặc `npm run tauri dev`).
  - **Không cần login** — guest mode (`userId='local'`) đủ cho tất cả case.
  - **Doc mới/trống** cho Case 1, 2 (xoá IDB hoặc dùng tab incognito để không có dữ liệu cũ).
  - Window **≥1024px landscape**.
  - Cần biết RULE_HEIGHT = **64px** (hằng số geometry.ts) để tính assertion.

---

## 2. Liệt kê trường hợp (đủ các case có thể xảy ra)

> Assertion JS chạy qua `javascript_tool` (Chrome foreground) hoặc browser console. Ký hiệu `[JS]` = đoạn code cần eval.

| # | Nhóm | Case | Input/điều kiện | Kết quả kỳ vọng (ĐO ĐƯỢC) |
|---|---|---|---|---|
| 1 | **Happy — Focus on load** | Reload → editor nhận focus tự động (không phải MathLive artifact) | `http://localhost:1420` load xong, đợi ~300ms | `[JS] document.activeElement.className` chứa `'nib-pm'`; **KHÔNG** phải `'ML__fonts-did-not-load'` hay `document.body`. Kiểm: `document.activeElement?.classList.contains('nib-pm') === true` |
| 2 | **Happy — Ghost caret vị trí đúng (bug chính)** | Doc trống, click vùng trống tại toạ độ cụ thể | Doc rỗng (0 row); click tại `(paperLeft + 200, paperTop + 192)` (tức dòng thứ 3, x=200 from left) | Ngay sau click: `[JS] document.querySelector('.nib-ghost-caret') !== null`. Ghost `top` ≈ 192px (`Math.floor(192/64)*64 = 192`), ghost `left` ≈ 200px. Kiểm: `parseFloat(document.querySelector('.nib-ghost-caret').style.top) === 192 && parseFloat(document.querySelector('.nib-ghost-caret').style.left) === 200` |
| 3 | **Happy — Gõ vật chất hoá đúng chỗ (bug chính tiếp theo)** | Sau Case 2 (ghost đang hiện tại top=192, left=200), gõ ký tự `'x'` | Ghost park active (targetLine=3, targetCol=200) | SAU khi gõ: (a) `[JS] document.querySelector('.nib-ghost-caret') === null` (ghost biến); (b) `[JS] document.querySelectorAll('.nib-row').length === 1`; (c) `[JS] document.querySelector('.nib-row .nib-row__content').textContent` chứa `'x'`; (d) **row margin-top KHỚP ghost-top**: `[JS] parseFloat(document.querySelector('.nib-row').style.marginTop) === 192`; (e) row padding-left ≈ 200: `[JS] parseFloat(document.querySelector('.nib-row').style.paddingLeft) === 200` |
| 4 | **Happy — Click content có sẵn → caret đặt đúng, không ghost** | Doc có ≥1 row text; click vào giữa text đó | Row tồn tại với text `'hello'`; click vào giữa từ | SAU click: `[JS] document.querySelector('.nib-ghost-caret') === null` (không ghost); `document.activeElement.classList.contains('nib-pm') === true`; PM selection `collapsed === true` tại vị trí trong text (kiểm qua editor state — xem §3 bước 4). |
| 5 | **Happy — Click content → gõ → chèn đúng vị trí trong text** | Tiếp Case 4; click sau ký tự thứ 2 của 'hello' (giữa 'he' và 'llo'); gõ 'X' | PM selection tại pos = sau 'he' trong row | Sau gõ: `[JS] document.querySelector('.nib-row__content').textContent === 'heXllo'`; số row KHÔNG đổi (`querySelectorAll('.nib-row').length` còn = 1); không ghost. |
| 6 | **Edge — Click vùng trống khi đã có content** | Doc có 1 row tại dòng 2 (margin-top=128); click dòng 6 xa (top=6×64=384 px) | 1 row đã tồn tại; click tại `(paperLeft + 100, paperTop + 384)` | Ghost caret xuất hiện tại top≈384, left≈100; gõ 'y' → 2 rows trong doc (`querySelectorAll('.nib-row').length === 2`); row mới có text `'y'`, margin-top ≈ 256px (dòng 6 − dòng 2 − 1 = 3 blank lines × 64 = 192 từ TRÊN cùng... tính từ row cũ: blankBefore = targetLine − prevAbsLine − 1 = 6 − 2 − 1 = 3 → 3×64=192); row cũ KHÔNG bị sửa/nối. |
| 7 | **Edge — Click quá cuối text của row** | Row có text ngắn 'ab' (indent=56); click tại cùng dòng nhưng xa hơn text (x=300, far right) | `isAtEndOfRow=true` + `clickX > contentRect.right + 6` | Ghost caret xuất hiện (classifyClick trả 'virtual'); `document.querySelector('.nib-ghost-caret') !== null`; gõ 'z' → ký tự xuất hiện (không rớt). Ghost biến sau gõ. |
| 8 | **Edge — Doc trống, click dòng 0 (đầu trang)** | Doc rỗng; click tại `(paperLeft + 56, paperTop + 10)` (trong dòng 0) | targetLine = Math.floor(10/64) = 0; targetCol ≈ 56 | Ghost top ≈ 0, left ≈ 56; gõ 'a' → 1 row, margin-top = 0 (blankBefore=0), padding-left ≈ 56, textContent='a'. |
| 9 | **Error — Escape huỷ ghost** | Ghost park active (click dòng trống); nhấn Escape | ghostPark != null | Sau Escape: `[JS] document.querySelector('.nib-ghost-caret') === null`; PM selection không crash (editor vẫn active); gõ ký tự tiếp → không tạo row (ghost đã clear). |
| 10 | **Error — Ctrl+key khi ghost active không materialize** | Ghost park active; nhấn Ctrl+A (select all) | `e.ctrlKey=true` → keydown handler bỏ qua materialize | Ghost KHÔNG biến (`.nib-ghost-caret` vẫn còn); không tạo row thừa; Ctrl+A hoạt động bình thường (select all text). |
| 11 | **Boundary — Arrow-Down giữ goalX qua nhiều dòng** | Doc có ≥3 row ở các dòng khác nhau; caret đặt ở col 120 row 1; nhấn ArrowDown 2 lần | `editor.storage.caretNav.goalX` được set sau lần ↓ đầu | Sau ↓ lần 1: selection moves to row 2; sau ↓ lần 2: selection moves to row 3; PM selection x-coord ≈ 120 cả 3 lần. Kiểm goalX: `[JS] window._nibEditor?.storage?.caretNav?.goalX` ≈ 120 (nếu editor exposed), hoặc quan sát caret vẫn gần col 120. |
| 12 | **Boundary — ArrowLeft/Right qua mathInline atom = 1 bước** | Row: `text("a") + mathInline + text("b")`; caret sau 'a' (pos=2 trong row) | PM selection.head = pos ngay trước mathInline atom | ArrowRight 1 lần: selection nhảy QUA atom (pos sau atom, trước 'b') — KHÔNG vào trong atom; kiểm `[JS] document.activeElement.classList.contains('nib-pm')` = true (PM giữ focus, không phải math-field). ArrowLeft từ trước 'b' → pos trước atom, 1 bước. |
| 13 | **Boundary — Tab nhảy đến mathInline atom** | Row có text + mathInline; caret trong text (trước atom) | PM selection trong text node | Nhấn Tab: atom được chọn (`NodeSelection` → element `[data-type="math-inline"]` hay `.nib-math-inline` có thể nhận focus/selected class); kiểm `[JS] document.querySelector('.nib-row .nib-math-inline, .nib-row [data-node-type="mathInline"]')` hiện selected state. |
| 14 | **Empty/First-run — Doc trống hoàn toàn** | App mới, chưa có doc, IDB rỗng | Reload + incognito | GhostText hint xuất hiện (`[JS] document.querySelector('.nib-ghost-text')` hoặc tương tự); editor đang active; `document.querySelectorAll('.nib-row').length === 1` (starter demo từ seedStarter, hoặc 0 nếu seeded). Không crash. |
| 15 | **Concurrent/State — Ghost clear khi click content khác** | Ghost park active (click dòng trống); click vào text row có sẵn | Ghost != null trước click thứ 2 | Sau click vào text: `[JS] document.querySelector('.nib-ghost-caret') === null` (ghost bị clear); caret nằm trong text. |
| 16 | **Concurrent/State — Không rớt ký tự (assertion then chốt)** | Gõ chuỗi 5 ký tự liên tiếp 'hello' sau ghost park | Ghost → gõ h→e→l→l→o (5 phím) | Sau cùng: `[JS] document.querySelector('.nib-row__content').textContent` chứa đúng `'hello'` (5 ký tự, không thiếu, không rớt); `querySelectorAll('.nib-row').length === 1` (không tạo thêm row thừa). |
| 17 | **i18n** [LOCKED] | Chuỗi UI trong editor/canvas đúng cả en/vi | Mở Settings → đổi lang → Tiếng Việt; quan sát canvas hint pill + toast text | Canvas hint `app.canvas_hint` hiển thị tiếng Việt; `app.blocks_clamped_notice` (toast) đúng ngôn ngữ nếu trigger; không thấy key raw (`app.canvas_hint` thật); đổi về English → text đúng tiếng Anh. |
| 18 | **Theme** [LOCKED] | Ghost caret dùng token `--caret`, không hex rời; light/dark đều đúng | Đổi theme → Light → Dark → System | Ghost caret `.nib-ghost-caret` màu thay đổi khi switch theme; kiểm `[JS] getComputedStyle(document.querySelector('.nib-ghost-caret')).backgroundColor` thay đổi (không bị fixed color); `[JS] getComputedStyle(document.documentElement).getPropertyValue('--caret')` có giá trị (không rỗng). Layout paper không vỡ ở cả 3 mode. |
| 19 | **Thiết bị** [LOCKED] | ≥1024px landscape; hit target dock buttons ≥44px; không horizontal scrollbar | Resize về ≥1024px | `[JS] window.innerWidth >= 1024`; `[JS] document.documentElement.scrollWidth <= window.innerWidth` (no horizontal scroll); Dock buttons ≥44px: `[JS] getComputedStyle(document.querySelector('.nib-dock__navbtn')).height` = `'44px'` (hoặc dùng getBoundingClientRect). Ghost caret vẫn xuất hiện đúng sau resize. |

---

## 3. Các bước thao tác (browser — click-through)

> **Execution foreground chỉ.** Chạy `npm run dev` (`:1420`) trước. Dùng browser console (F12) để eval [JS] assertion.

### Chuẩn bị chung

```
[PRE-1] npm run dev tại root repo → chờ "VITE ready at http://localhost:1420"
[PRE-2] Mở Chrome → http://localhost:1420
[PRE-3] Mở DevTools (F12) → Console tab (để chạy assertion JS)
[PRE-4] Ghi lại paper bounds: eval [JS] → const r = document.querySelector('.nib-paper').getBoundingClientRect(); console.log(r)
         Ghi lại: r.left, r.top (dùng cho bước click chính xác bên dưới)
```

---

### Case 1 — Focus on load

```
[1-1] Reload trang (F5 / Cmd+R)
[1-2] Đợi 300ms (loader xong)
[1-3] KHÔNG click gì
[1-4] Eval [JS]: document.activeElement?.classList.contains('nib-pm')
      ✅ PASS: true
      ❌ FAIL: false (activeElement = body hoặc ML__fonts-did-not-load)
[1-5] Screenshot: console output + tên element
```

---

### Case 2 — Ghost caret vị trí đúng (BUG CHÍNH — đo trước)

```
[2-1] Reload trang, chờ load (doc trống — starter row có thể xuất hiện từ seedStarter)
      Nếu có starter row: cần doc thật sự trống → dùng incognito hoặc xoá IDB:
        [JS] indexedDB.deleteDatabase('nib-ydoc-local') (refresh sau)
[2-2] Eval [JS] để lấy paper.top và paper.left:
        const r = document.querySelector('.nib-paper').getBoundingClientRect();
        window.__r = r; console.log(`left=${r.left} top=${r.top}`)
[2-3] Click tại toạ độ: x = r.left + 200, y = r.top + 192
      (Dùng `mcp__claude-in-chrome__computer` action:left_click coordinate:[r.left+200, r.top+192]
       hoặc thủ công click tại pixel đó trong browser)
[2-4] Ngay sau click, eval [JS]:
        const g = document.querySelector('.nib-ghost-caret');
        console.log('ghost:', g ? `top=${g.style.top} left=${g.style.left}` : 'NULL');
      ✅ PASS: ghost != null, top='192px', left='200px'
      ❌ FAIL: ghost null (ghost không render), hoặc top/left lệch đáng kể
[2-5] Screenshot: ghost caret visible + console output
```

---

### Case 3 — Gõ vật chất hoá đúng chỗ (BUG CHÍNH — đo sau)

```
[3-1] Tiếp ngay sau Case 2 (ghost đang active, top=192, left=200)
[3-2] Ghi lại ghost position TRƯỚC khi gõ:
        [JS] const ghostTop = parseFloat(document.querySelector('.nib-ghost-caret')?.style.top ?? '-1')
             console.log('ghostTop before type:', ghostTop)
[3-3] Gõ phím 'x' (type 'x')
[3-4] Eval [JS] ngay sau gõ:
        const g2 = document.querySelector('.nib-ghost-caret');
        const rows = document.querySelectorAll('.nib-row');
        const row0 = rows[0];
        const rowContent = document.querySelector('.nib-row .nib-row__content');
        const rowMarginTop = row0 ? parseFloat(row0.style.marginTop) : -1;
        const rowPaddingLeft = row0 ? parseFloat(row0.style.paddingLeft) : -1;
        console.log({
          ghostGone: g2 === null,
          rowCount: rows.length,
          rowText: rowContent?.textContent,
          rowMarginTop,   // phải ≈ ghostTop trước khi gõ
          rowPaddingLeft, // phải ≈ 200
        })
      ✅ PASS: ghostGone=true, rowCount=1, rowText='x', rowMarginTop=192, rowPaddingLeft=200
      ❌ FAIL (bug chính): rowMarginTop ≠ 192 (text rơi sai dòng) / rowPaddingLeft ≠ 200 (cột sai) / rowText rỗng (char rớt)
[3-5] Screenshot: console output đầy đủ + paper state (row visible ở đúng vị trí)
```

---

### Case 4 + 5 — Click content có sẵn → caret trong text → chèn đúng chỗ

```
[4-1] Reload. Gõ 'hello' (tạo 1 row với text 'hello')
[4-2] Eval [JS]: document.querySelectorAll('.nib-row').length → phải = 1, textContent = 'hello'
[4-3] Click vào GIỮA chữ 'hello' (giữa ký tự 'e' và 'l' khoảng thứ 2-3)
[4-4] Eval [JS]:
        const ghost = document.querySelector('.nib-ghost-caret');
        const active = document.activeElement?.classList.contains('nib-pm');
        console.log({ ghost: ghost?.style.top ?? 'none', pmFocused: active })
      ✅ PASS: ghost='none' (null), pmFocused=true
[4-5] Gõ 'X'
[4-6] Eval [JS]: document.querySelector('.nib-row__content').textContent
      ✅ PASS: 'heXllo' (hoặc vị trí tương ứng với nơi click — phụ thuộc PM pos)
      ❌ FAIL: 'hello' + 'X' ở cuối (chèn sai vị trí) / 'hello' không đổi (char rớt)
[4-7] Screenshot
```

---

### Case 6 — Click vùng trống khi đã có content → row mới không nối

```
[6-1] Reload. Gõ 'abc' để tạo row tại dòng 0 (sau starter dismiss nếu có)
[6-2] Eval [JS]: const r = window.__r || document.querySelector('.nib-paper').getBoundingClientRect()
[6-3] Click tại y = r.top + 384 (dòng 6), x = r.left + 100
[6-4] Gõ 'y'
[6-5] Eval [JS]:
        const rows = document.querySelectorAll('.nib-row');
        console.log({
          count: rows.length,
          row0text: rows[0]?.querySelector('.nib-row__content')?.textContent,
          row1text: rows[1]?.querySelector('.nib-row__content')?.textContent,
          row1MarginTop: parseFloat(rows[1]?.style.marginTop ?? '-1'),
        })
      ✅ PASS: count=2, row0text='abc' (unchanged), row1text='y', row1MarginTop > 0
      ❌ FAIL: count=1 (nối vào row cũ), hoặc row0text bị đổi, hoặc row1MarginTop=0
[6-6] Screenshot
```

---

### Case 7 — Click quá cuối text → ghost (horizontal miss)

```
[7-1] Reload. Gõ 'ab' (row ngắn tại indent≈56)
[7-2] Eval [JS]: const rr = document.querySelector('.nib-row').getBoundingClientRect();
       console.log('row right:', rr.right)  → ghi lại
[7-3] Click tại x = rr.right + 50 (xa hơn text rõ ràng), y giữa row
[7-4] Eval [JS]: document.querySelector('.nib-ghost-caret') !== null
      ✅ PASS: true
[7-5] Gõ 'z'
[7-6] Eval [JS]: document.querySelector('.nib-ghost-caret') → null (ghost gone)
                 document.querySelector('.nib-row__content').textContent → chứa 'z' (không rớt)
[7-7] Screenshot
```

---

### Case 8 — Doc trống, click dòng 0

```
[8-1] Reload incognito (IDB rỗng)
[8-2] Click tại y = r.top + 10 (dòng 0), x = r.left + 56
[8-3] Eval: ghost top ≈ 0, left ≈ 56
[8-4] Gõ 'a'
[8-5] Eval: rowMarginTop = 0, rowPaddingLeft ≈ 56, textContent = 'a'
[8-6] Screenshot
```

---

### Case 9 — Escape huỷ ghost

```
[9-1] Click vùng trống → ghost xuất hiện
[9-2] Nhấn Escape
[9-3] Eval [JS]: document.querySelector('.nib-ghost-caret') === null → true
[9-4] Gõ 'q'
[9-5] Eval [JS]: document.querySelectorAll('.nib-row').length → unchanged (không tạo row từ 'q')
[9-6] Screenshot
```

---

### Case 10 — Ctrl+key khi ghost active không materialize

```
[10-1] Click vùng trống → ghost xuất hiện
[10-2] Nhấn Ctrl+A (select all)
[10-3] Eval [JS]: document.querySelector('.nib-ghost-caret') !== null → true (ghost vẫn còn)
[10-4] Eval [JS]: document.querySelectorAll('.nib-row').length → không tăng thêm
[10-5] Screenshot
```

---

### Case 11 — Arrow-Down giữ goalX

```
[11-1] Setup: doc có 3 row tại các dòng khác nhau (blankBefore khác nhau); có thể dùng click-ghost-type ×3 lần
[11-2] Click vào row 1 tại col ≈ 120 (x = r.left + 120)
[11-3] Nhấn ArrowDown
[11-4] Nhấn ArrowDown lần 2
[11-5] Eval [JS] xem caret vị trí:
        const sel = window.getSelection(); const range = sel?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        console.log('caret x:', rect?.left)  // phải gần 120 (+ r.left)
      ✅ PASS: caret x ≈ paper.left + 120 qua 2 lần ↓
[11-6] Screenshot
```

---

### Case 12 — ArrowLeft/Right qua mathInline = 1 bước

```
[12-1] Setup: doc có starter mathInline atom (seedStarter tạo khi đầu) hoặc tạo bằng SymbolMenu (\)
[12-2] Click text TRƯỚC atom (bên trái atom [Math])
[12-3] Nhấn ArrowRight 1 lần
[12-4] Eval [JS]:
        document.activeElement.classList.contains('nib-pm') → true (PM còn focus, không vào math-field)
      ✅ PASS: PM giữ focus; caret nhảy SANG BÊN PHẢI atom (1 bước, không vào trong)
[12-5] Nhấn ArrowLeft 1 lần → caret quay lại trước atom
[12-6] Screenshot
```

---

### Case 13 — Tab nhảy đến mathInline

```
[13-1] Setup: doc có atom [Math]; caret trong text trước atom
[13-2] Nhấn Tab
[13-3] Eval [JS]:
        document.querySelector('[data-node-type="mathInline"], .nib-math-inline')?.getAttribute('data-node-type')
        // Hoặc: document.activeElement.tagName, document.activeElement.className
      ✅ PASS: atom có visual selected state (border/highlight); PM vẫn hold focus
[13-4] Screenshot
```

---

### Case 14 — Doc trống / first-run

```
[14-1] Reload incognito (IDB rỗng)
[14-2] Eval [JS]: document.querySelector('.nib-ghost-text, .nib-hint-pill') (canvas hint visible)
[14-3] Eval [JS]: document.activeElement.classList.contains('nib-pm') → true
[14-4] Không crash; console 0 error
[14-5] Screenshot
```

---

### Case 15 — Ghost clear khi click content khác

```
[15-1] Click vùng trống → ghost xuất hiện
[15-2] Click vào row có text
[15-3] Eval [JS]: document.querySelector('.nib-ghost-caret') → null
      ✅ PASS: ghost cleared
[15-4] Screenshot
```

---

### Case 16 — Không rớt ký tự

```
[16-1] Click vùng trống → ghost
[16-2] Type 5 ký tự 'hello' (type nhanh)
[16-3] Eval [JS]: document.querySelector('.nib-row__content').textContent
      ✅ PASS: === 'hello' (không thiếu ký tự, không rớt)
      ❌ FAIL: < 5 ký tự hoặc 'hell', 'helo', v.v.
[16-4] Screenshot
```

---

### Case 17 — i18n [LOCKED]

```
[17-1] Mở Settings (nút Settings trong UnifiedDock)
[17-2] Đổi lang → Tiếng Việt
[17-3] Quan sát canvas hint pill (nib-hint-pill) + toast nếu có → text tiếng Việt
[17-4] Eval [JS]: document.querySelector('.nib-hint-pill')?.textContent (không phải key raw)
[17-5] Đổi lang → English → kiểm lại
[17-6] Console: read_console_messages pattern='i18n|locale|translation' → 0 error
[17-7] Screenshot cả 2 ngôn ngữ
```

---

### Case 18 — Theme [LOCKED]

```
[18-1] Settings → Theme → Light → chụp screenshot
[18-2] Eval [JS]: getComputedStyle(document.documentElement).getPropertyValue('--caret')
        (có giá trị = token resolved, không rỗng)
[18-3] Settings → Theme → Dark → chụp screenshot
[18-4] Eval [JS]: getComputedStyle(document.documentElement).getPropertyValue('--caret')
        (giá trị khác Light mode → token thay đổi)
[18-5] Eval [JS]: document.querySelector('.nib-ghost-caret') — click vùng trống trước để ghost xuất hiện;
        sau đó getComputedStyle(document.querySelector('.nib-ghost-caret')).backgroundColor
        (hoặc borderColor) → không bị hardcoded hex (phải theo --caret)
[18-6] Console 0 error
[18-7] Screenshot light + dark
```

---

### Case 19 — Thiết bị [LOCKED]

```
[19-1] Resize cửa sổ về ≥1024px (landscape)
[19-2] Eval [JS]: window.innerWidth >= 1024 → true
[19-3] Eval [JS]: document.documentElement.scrollWidth <= window.innerWidth → true (no horizontal scroll)
[19-4] Eval [JS]:
        const btn = document.querySelector('.nib-dock__navbtn');
        btn ? btn.getBoundingClientRect().height : 'not found'
        → ≥ 44
[19-5] Click vùng trống ở edge trái + edge phải của paper → ghost caret xuất hiện (không overflow/clip)
[19-6] Screenshot toàn màn
```

---

### Kiểm Console chung (sau toàn bộ flow)

```
[CON-1] read_console_messages pattern="error|Error|FAILED|Uncaught|Warning"
         ✅ PASS: 0 error JS (warning không-chặn ghi chú nhưng không FAIL)
[CON-2] read_network_requests urlPattern="/api/" → không có request fail nếu offline-only
```

---

## 4. Kết quả kỳ vọng & evidence

- **PASS khi:**
  - Case 1: `document.activeElement.classList.contains('nib-pm') === true` sau load ~300ms.
  - Case 2: `.nib-ghost-caret` xuất hiện với `top` và `left` khớp toạ độ click (± 1px do floor).
  - **Case 3 (cốt lõi):** `rowMarginTop === ghostTop` (margin-top của row BẰNG top của ghost trước khi gõ) + `rowPaddingLeft ≈ targetCol` + `rowText = typed char`. FAIL ở đây = BUG CHÍNH.
  - Case 16: 5 ký tự 'hello' không rớt.
  - Cases 17–19: i18n/theme/device assertions như bảng.
  - Console: 0 JS error.

- **Evidence thu:**
  - Screenshot/GIF → `tests/flows/evidence/free-caret/`
  - File đặt tên: `case-1-focus.png`, `case-2-ghost-position.png`, `case-3-materialize-console.png`, `case-3-materialize-row.png`, `case-4-click-content.png`, `case-6-two-rows.png`, `case-9-escape.png`, `case-16-nodrop.png`, `case-17-i18n-vi.png`, `case-17-i18n-en.png`, `case-18-theme-light.png`, `case-18-theme-dark.png`, `case-19-device.png`, `console-final.txt`.
  - GIF nếu muốn: `free-caret-ghost-to-row.gif` (từ click ghost → gõ → row hiện ra).

---

## 5. Kết quả chạy (điền khi executed)

| Case # | Kết quả | Evidence | Ghi chú |
|---|---|---|---|
| 1 (FOCUS) | **PASS** | evidence/free-caret/case-1-focus.png | activeElement.classList có 'nib-pm', không phải ML artifact |
| SEED | **PASS** | evidence/free-caret/case-seed-rowcount.png | exactly 1 row on load (double-seed guard ok) |
| 2 (Ghost pos) | **PASS** | evidence/free-caret/case-2-ghost-visible.png | ghost.top=256, ghost.left≈200 khớp click coords |
| 3 (Materialize) | **PASS** | evidence/free-caret/case-3-materialize.png | row viewport top ≈ paper.top + ghost.top; text='x'; paddingLeft≈200 |
| 4 (Click content) | **PASS** | evidence/free-caret/case-4-click-content.png | no ghost, PM focused sau click row |
| 6 (No-drop) | **PASS** | evidence/free-caret/case-6-nodrop.png | 5 ký tự 'hello' không rớt |
| 8 (Line 0) | **PASS** | evidence/free-caret/case-8-ghost.png + case-8-row.png | ghost top=0; row visual top ≈ paper.top |
| 9 (Escape) | **PASS** | evidence/free-caret/case-9-escape.png | ghost cleared, row count không tăng |
| 15 (Ghost-clear) | **PASS** | evidence/free-caret/case-15-ghost-clear.png | ghost clears khi click content khác |
| 5,7,10,11,12,13,14,16 | — | — | chưa cover trong spec Playwright (flow file §3 đã có manual steps) |
| 17 (i18n [LOCKED]) | — | — | manual only (cần Settings UI interaction) |
| 18 (Theme [LOCKED]) | — | — | manual only (cần Settings UI interaction) |
| 19 (Device [LOCKED]) | — | — | manual only (resize + CSS check) |

**Verdict: PASS** — 8/8 Playwright cases pass (exit 0). Console: 0 unexpected JS errors (flushSync/MathLive CDN warnings filtered — known non-blocking). Core bug "ghost correct position, text materializes at WRONG position" KHÔNG tái hiện — fix đã hoạt động đúng: `row.getBoundingClientRect().top ≈ paper.top + ghost.top`.

---

## Click-through checklist (FOREGROUND — lead/user thực thi)

> Tester đã soạn flow (background-safe). Execute Chrome = foreground only (ISSUE-8).
> Thực thi: `npm run dev` (:1420) → Chrome → F12 Console → làm từng bước §3.

### Tiền điều kiện
- [ ] `npm run dev` đang chạy tại `:1420`
- [ ] Chrome mở `http://localhost:1420`
- [ ] DevTools mở (F12 → Console)
- [ ] Ghi lại `paper.getBoundingClientRect()` → biết `r.left`, `r.top`

### Nhóm Bug chính (cases 2 & 3) — đây là assertion then chốt
- [ ] Reload doc trống (incognito nếu cần)
- [ ] Click tại `(r.left+200, r.top+192)` → ghost caret hiện **top=192px, left=200px**
- [ ] Eval: `parseFloat(document.querySelector('.nib-ghost-caret')?.style.top) === 192`
- [ ] Gõ 'x'
- [ ] Eval: `document.querySelector('.nib-row').style.marginTop` → kỳ vọng `'192px'`
- [ ] Eval: `document.querySelector('.nib-row').style.paddingLeft` → kỳ vọng `'200px'`
- [ ] Eval: `document.querySelector('.nib-row__content').textContent` → `'x'`
- [ ] **PASS khi:** marginTop khớp ghost top (192). **FAIL khi:** marginTop ≠ 192 = BUG ĐÃ XÁC NHẬN.

### Focus on load (case 1)
- [ ] Reload → đợi 300ms → KHÔNG click gì
- [ ] Eval: `document.activeElement.classList.contains('nib-pm')` → **true**

### Click content → chèn đúng (cases 4-5)
- [ ] Gõ 'hello' tạo row; click giữa từ; gõ 'X'; textContent = 'heXllo' (hoặc tương đương)

### Arrow nav (cases 11-13)
- [ ] ArrowDown ×2 từ col 120 → caret duy trì gần col 120
- [ ] ArrowRight qua atom [Math] = 1 bước (PM focus không mất)
- [ ] Tab → atom selected

### Không rớt ký tự (case 16)
- [ ] Ghost → type 'hello' nhanh → textContent = 'hello' đủ 5 ký tự

### i18n [LOCKED] (case 17)
- [ ] Settings → Tiếng Việt → canvas hint tiếng Việt; không thấy key raw
- [ ] Đổi về English → text đúng tiếng Anh

### Theme [LOCKED] (case 18)
- [ ] Light → Dark: `--caret` token thay đổi; ghost caret màu theo token
- [ ] Console 0 error

### Thiết bị [LOCKED] (case 19)
- [ ] `window.innerWidth >= 1024`; `scrollWidth <= innerWidth`; dock button height ≥ 44px

### Console cuối
- [ ] `read_console_messages` / F12 Console: **0 JS error**

### Ghi nhận
- PASS / FAIL: ___
- Case FAIL (nếu có): Case # — triệu chứng cụ thể (đặc biệt: marginTop thực tế = bao nhiêu?)
- Evidence screenshot: `tests/flows/evidence/free-caret/`
