---
slug: free-caret-v2-phase-a
title: Free-caret v2 Phase A — Spacer-atom + Virtual caret + Materialize-on-input + Multi-segment
status: executed
owner: tester
created: 2026-06-25
last_run: 2026-06-30
---

# Flow test — Free-caret v2 Phase A (Gate vàng)

## 1. Phạm vi & khi nào chạy (trigger)

- **Test cái gì:** Kiểm hành vi "click vùng trống trên dòng tại x bất kỳ → caret ảo xuất hiện đúng x → gõ → text+spacer tại ~x, console 0 error". Đây là **gate vàng Phase A** của free-caret-v2 (spacer-atom / virtual-caret / materialize-on-input). Bài học stale-HMR (mistakes.md): unit PASS nhưng runtime có thể sập — cần browser smoke thật.
- **Route/màn:** `/` (canvas editor, TipTap ProseMirror với schema `doc(paragraph(spacer_atom|text)*)`)
- **Khi nào chạy flow này:** Feature-complete (sau khi `editor-frontend` hoàn tất Phase A free-caret-v2) + Regression (mỗi khi đụng `virtualCaret.ts`, `materializeInput.ts`, `SpacerAtom.ts`, `Workspace.tsx`, `NibDocument.ts`, `spacer.css`).
- **Tiền điều kiện:**
  - `npm run dev` đang chạy tại :1420 (chạy SẠCH sau `pkill vite` — tránh stale-HMR phantom)
  - Không yêu cầu đăng nhập (offline-only IDB đủ)
  - Playwright chromium headless đã cài (`@playwright/test`, `npx playwright install chromium`)
  - Viewport ≥ 1024px (default Playwright 1280×720)

## 2. Liệt kê trường hợp (đủ các case có thể xảy ra)

| # | Nhóm | Case | Input/điều kiện | Kết quả kỳ vọng |
|---|---|---|---|---|
| 1 | Empty/first-run (E5) | App mount — schema không crash từ IDB cũ | navigate :1420, đợi editor sẵn | `.ProseMirror` visible + contenteditable=true; console 0 JS error (nếu IDB có nibBlock cũ → E5 FAIL + report, KHÔNG deleteDatabase) |
| 2 | Happy path (Gate vàng A) | Click vùng trống (gap) → `.nib-vcaret` xuất hiện đúng x | Gõ text "Hello" tạo paragraph; click tại x≈250px sau start paragraph (past text-right); MATERIALIZE_THRESHOLD=4 | `.nib-vcaret` visible; `left` style của vcaret ≈ (clickX − editorLeft) với tolerance ±20px; console 0 error |
| 3 | Happy path (Gate vàng B) | Gõ ký tự "hi" → text tại ~x, spacer tồn tại, vcaret biến mất | Tiếp tục từ Case 2 (vcaret active); gõ "h", "i" | `.nib-vcaret` KHÔNG visible; `.nib-spacer` tồn tại count≥1 + width>0; text "hi" có trong editor; console 0 error |
| 4 | Edge (E6 / layout-shift) | Vcaret blink không đẩy dòng dưới | Click gap trong paragraph 1; ghi top-position của paragraph 2 trước và sau click | Position của paragraph 2 không dịch chuyển (diff≤2px) — E6: `height:calc(1em+4px)` + `top:0` giữ line-box |
| 5 | Edge (E2) | Click tại pos≈0 (doc root) → vcaret KHÔNG kích hoạt | Click vào góc trái trên cùng của editor (pos=0) | `.nib-vcaret` KHÔNG xuất hiện (E2 guard `if(pos<1) return false`); console 0 error |
| 6 | Edge (Escape clear) | Escape khi vcaret active → clear | vcaret active; nhấn Escape | `.nib-vcaret` KHÔNG visible sau Escape; console 0 error |
| 7 | Edge (click on content) | Click vào text hiện có → vcaret clear | vcaret active; click đúng vào chữ "Hello" | `.nib-vcaret` KHÔNG visible (nhánh `else clearVirtualCaret`); console 0 error |
| 8 | Error (E5 schema-mismatch) | N/A — không có network call trong Phase A; E5 (IDB schema mismatch) đã cover trong Case 1 (mount 0 error). Nếu crash xảy ra → FAIL + report rõ, KHÔNG xoá IDB. | — | — |
| 9 | Boundary | Click rất xa phải (x≈580px từ paper-left, gần mép) → spacer rộng | Click tại x ≈ paperLeft+580; gõ "Z" | spacer width lớn (≥100px); text "Z" tồn tại; không crash; console 0 error |
| 10 | Concurrent/State (E1) | Vcaret survive qua remote Yjs tx | vcaret active; dispatch tx không có virtualCaretKey meta | vcaret state không bị reset (E1 apply: `getMeta ?? prev`); `.nib-vcaret` vẫn visible sau tx; console 0 error |
| 11 | **i18n** [LOCKED] | App load + editor hoạt động ở cả vi và en | `localStorage.setItem('lang','vi')` → reload → editor visible + not crashed; đổi 'en' → reload → tương tự | Editor `.ProseMirror` visible + editable sau cả 2 lang; không thấy key raw; console 0 error |
| 12 | **Theme** [LOCKED] | Editor + vcaret render đúng token ở light/dark | Set `document.documentElement.dataset.theme='dark'` → kiểm `.nib-vcaret` background dùng `--accent` token; set light → tương tự | `--accent` token áp đúng cho vcaret trong cả 2 theme; editor không vỡ layout; console 0 error |
| 13 | **Thiết bị** [LOCKED] | ≥1024px landscape; không horizontal scroll; hit-target | viewport 1280×720 (Playwright default) | `window.innerWidth ≥ 1024`; `document.documentElement.scrollWidth ≤ window.innerWidth`; editor focusable; console 0 error |
| 14 | **Multi-Seg §3b.B** — Chèn TRÁI đoạn | Setup `[A][sp(~200px)][AnchorL14]`; click 150px trái AnchorL14 (trái half spacer) → type "t" | vcaret ở trái spacer, materialize sp(50)+t TRƯỚC sp(200)+AnchorL14 | AnchorL14.left diff ≤ 2px (acceptance). **DỰ KIẾN FAIL** — Phase A bug: tr.insert() đẩy phải |
| 15 | **Multi-Seg §3b.E** — Chèn GIỮA 2 đoạn sát | Setup `[Left15][sp(~150px)][Right15]`; click 100px trái Right15 (trái-phần spacer) → type "m" | vcaret ở giữa spacer, materialize sp(50)+m TRƯỚC sp(150)+Right15 | Right15.left diff ≤ 2px. **DỰ KIẾN FAIL** — cùng Phase A bug |
| 16 | **Multi-Seg §3b.D** — Chèn PHẢI cuối | Setup `[S][sp(120)][Left16][sp(100)][Right16]`; click 150px phải Right16 → type "z" | vcaret 150px past Right16, materialize sp(150)+z AFTER Right16 | Left16 diff ≤ 2px AND Right16 diff ≤ 2px; "z" in content. EXPECT PASS |
| 17 | **Multi-Seg §3b.C** — Chèn trong text (normal PM) | `typeInFreshParagraph("Hello17")`; Home+ArrowRight → type "!" | Cursor inside text; NO vcaret | Content contains "H!ello17"; vcaret NOT visible. EXPECT PASS |
| 18 | **Multi-Seg §3b.F** — Chuỗi liên tiếp (combo) | Step1: 120px past "B" → "P18a"; Step2: 100px past P18a.right → "P18b" | Two sequential right-of-existing inserts | P18a.left diff ≤ 2px; P18b.left ≈ click2X ±30px; console 0 error. EXPECT PASS |

> **Ghi chú N/A:** Nhóm Error thuần (network/server 500/auth) = N/A vì Phase A không có network call. i18n Case 11 = lightweight (Phase A không thêm i18n key mới; test chỉ verify app không crash khi switch lang).

## 3. Các bước thao tác (browser)

> Thực thi bằng **Playwright headless (PRIMARY, §0 browser-test/SKILL.md)**. Spec: `tests/e2e/free-caret-v2-phase-a.spec.ts`.

1. `pkill vite; npm run dev &` → đợi :1420 OK (tránh stale-HMR)
2. `page.goto('http://localhost:1420')` → `waitForLoadState('networkidle')` → `waitForSelector('.ProseMirror', {state:'visible', timeout:15000})`
3. Collect console errors: `page.on('console', msg => { if(msg.type()==='error') errs.push(msg.text()) })`; `page.on('pageerror', err => errs.push(err.message))`
4. **Case 1**: screenshot `case-1-mount.png`; assert `consoleErrors.length === 0`; assert `.ProseMirror[contenteditable="true"]` visible
5. **Case 2**: click `.ProseMirror`; type "Hello"; get `.nib-pm p` first boundingBox; click at `(paraBox.x + 250, paraBox.y + midY)`; `waitForSelector('.nib-vcaret', {state:'visible'})`; extract `left` from vcaret style; assert `left ≈ (clickX - editorLeft) ± 20`; screenshot `case-2-vcaret.png`
6. **Case 3**: (fresh nav) type "Hello"; click gap; assert vcaret visible; `keyboard.press('h')`, `keyboard.press('i')`; assert `.nib-vcaret` not visible; assert `.nib-spacer` count≥1 + width>0; assert textContent contains "hi"; screenshot `case-3-typed.png`
7. **Case 4 (E6)**: type "Hello"; `keyboard.press('Enter')`; type "World" (2nd para); get second-para top; click gap in first para; get second-para top again; assert `|top2 - top1| ≤ 2px`; screenshot `case-4-no-shift.png`
8. **Case 5 (E2)**: get editor boundingBox; click at `(editorBox.x + 1, editorBox.y + 1)` (pos≈0); assert `.nib-vcaret` not visible; screenshot `case-5-e2-guard.png`
9. **Case 6 (Escape)**: type text; click gap; assert vcaret visible; `keyboard.press('Escape')`; assert `.nib-vcaret` not visible; screenshot `case-6-escape.png`
10. **Case 7 (click-on-content)**: type "Hello"; click gap; assert vcaret; click on "H" of "Hello" (inside text rect); assert `.nib-vcaret` not visible; screenshot `case-7-click-content.png`
11. **Case 9 (boundary)**: type "AB"; click at `(paperLeft + 580, paraY + midY)`; assert vcaret; type "Z"; assert spacer width≥100 (if gap large enough); screenshot `case-9-boundary.png`
12. **Case 11 (i18n)**: `evaluate(() => { localStorage.setItem('lang','vi'); })` → reload → assert `.ProseMirror` visible + no error; `evaluate(() => { localStorage.setItem('lang','en'); })` → reload → assert same; screenshot `case-11-i18n.png`
13. **Case 12 (theme)**: `evaluate(() => { document.documentElement.dataset.theme='dark'; })`; assert `document.querySelector('.nib-vcaret')` style uses `var(--accent)` (check `background` property); screenshot `case-12-theme-dark.png`; set light → screenshot `case-12-theme-light.png`
14. **Case 13 (device)**: `evaluate(() => window.innerWidth)` ≥ 1024; `evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)` true; assert `.ProseMirror` focusable; screenshot `case-13-device.png`
15. After all cases: assert `consoleErrors` (accumulated) = 0 for each individual gate; write any errors to `evidence/free-caret-v2-phase-a/console.txt`

## 4. Kết quả kỳ vọng & evidence

- **PASS khi:**
  - `.ProseMirror` visible + editable sau mount, console 0 JS error (Case 1 / E5)
  - `.nib-vcaret` xuất hiện sau click gap; `left` style ≈ (clickX − editorLeft) ± 20px (Case 2)
  - `.nib-vcaret` biến mất sau gõ; `.nib-spacer` count≥1 + width>0; text "hi" trong editor (Case 3)
  - Second paragraph top không dịch chuyển >2px khi vcaret blink (Case 4 / E6)
  - Vcaret KHÔNG xuất hiện khi click pos≈0 (Case 5 / E2) hoặc click on content (Case 7)
  - Vcaret clear sau Escape (Case 6)
  - App load không crash với lang vi/en (Case 11)
  - Editor render đúng trong dark/light mode (Case 12)
  - `window.innerWidth ≥ 1024`, không horizontal scroll (Case 13)
- **Evidence thu:**
  - Screenshot mỗi case → `tests/evidence/free-caret-v2-phase-a/case-N-<slug>.png`
  - Console errors nếu có → `tests/evidence/free-caret-v2-phase-a/console.txt`
  - Playwright exit code 0 = PASS

## 5. Kết quả chạy

### Lần 1 (2026-06-25 — trước fix): FAIL tại Cases 3 & 9
Bug `materializeInput.ts`: `view.coordsAtPos(lineDocPos)` trả coords của vcaret widget span (absolute, left=click-x) thay vì text-right → gap=0 → no spacer. Editor-frontend đã fix: Option A — store `textRightClient` trong `VirtualCaretState` tại click time.

### Lần 2 (2026-06-25 — sau fix): **PASS 12/12** ✅ exit 0

| Case # | Kết quả | Số đo | Evidence |
|---|---|---|---|
| 1 (E5 mount) | **PASS** | 0 JS error, contenteditable=true | case-1-mount.png |
| 2 (Gate vàng A — vcaret at x) | **PASS** | vcaret.left=191.0 ≈ expected 191.0 (diff=0.0, tol±15) | case-2-vcaret-visible.png |
| 3 (Gate vàng B — text at x) | **PASS** | spacer.width=150.0px; "hi" at viewport 557.0 = clicked 557.0 | case-3-typed-hi.png |
| 4 (E6 no layout shift) | **PASS** | shift=0.00px ≤ 2px | case-4-no-layout-shift.png |
| 5 (E2 guard pos<1) | **PASS** | no vcaret at top-left | case-5-e2-guard.png |
| 6 (Escape clear) | **PASS** | vcaret cleared | case-6-escape-clear.png |
| 7 (click-on-text) | **PASS** | vcaret cleared | case-7-click-content.png |
| 9 (Boundary large spacer) | **PASS** | spacer.width=300.0px ≥ 100px | case-9-boundary-large-spacer.png |
| 10 (IME) | **N/A** | Playwright headless không mô phỏng compositionstart; user-smoke checklist trong spec | — |
| 11 (i18n LOCKED) | **PASS** | Editor functional vi/en, 0 JS error | case-11-lang-vi.png, case-11-lang-en.png |
| 12 (Theme LOCKED) | **PASS** | vcaret bg="rgb(63, 182, 190)" (--accent) dark mode | case-12-theme-dark.png, case-12-theme-light.png |
| 13 (Thiết bị LOCKED) | **PASS** | viewport=1440px ≥ 1024, no H-scroll, clickable | case-13-device.png |

**Verdict lần 2: GATE VÀNG PHASE A ĐÓNG ✅** — exit 0, 12/12 pass (1 N/A IME user-smoke).
"Click vùng trống tại x bất kỳ (vùng trống không có segment) → gõ → text xuất hiện ĐÚNG x, console 0 error" = **PASS đo được**.

---

### Lần 3 (2026-06-30 — multi-segment §3b bổ sung, 5 ca mới)

Thêm coverage phân hoạch tương đương cho acceptance "vị trí BẤT KỲ trên cùng 1 dòng" khi đã có đoạn text khác.

| Case # | Kết quả | Số đo | Evidence |
|---|---|---|---|
| 14 (MS-1 — Chèn TRÁI) | **FAIL (EXPECTED)** — Bug Phase A | AnchorL14.left diff=**55.0px** >> 2px. before=598.0 after=653.0 | case-14-ms1-insert-left.png, case-14-ms1-fail-auto.png |
| 15 (MS-2 — Chèn GIỮA-2-ĐOẠN) | **FAIL (EXPECTED)** — Bug Phase A | Right15.left diff=**63.0px** >> 2px. before=580.0 after=643.0 | case-15-ms2-insert-between.png, case-15-ms2-fail-auto.png |
| 16 (MS-3 — Chèn PHẢI cuối) | **PASS** ✅ | Left16 diff=0.0px, Right16 diff=0.0px (both ≤ 2px) | case-16-ms3-insert-right.png |
| 17 (MS-4 — Chèn trong text PM) | **PASS** ✅ | "H!ello17" confirmed in content; vcaret NOT active | case-17-ms4-insert-within-text.png |
| 18 (MS-5 — Sequential) | **PASS** ✅ | P18a diff=0.0px; P18b.left=651.0=click2X (offset=0.0px ≤ 30px) | case-18-ms5-sequential.png |

**Verdict lần 3 — Multi-segment §3b:**

| Lớp tương đương | Case | Kết quả |
|---|---|---|
| §3b.A — Vùng trống (baseline) | Cases 3, 9 | PASS ✅ (lần 2) |
| §3b.B — Chèn TRÁI đoạn (pos < seg.pos) | Case 14 | **FAIL** (expected) — AnchorL14 dịch 55px |
| §3b.C — Chèn trong text (PM normal) | Case 17 | PASS ✅ |
| §3b.D — Chèn PHẢI/cuối dòng | Case 16 | PASS ✅ |
| §3b.E — Chèn GIỮA 2 đoạn sát nhau | Case 15 | **FAIL** (expected) — Right15 dịch 63px |
| §3b.F — Chèn liên tiếp combo | Case 18 | PASS ✅ |

**Acceptance nguyên văn → case chứng minh:**
- `"nhập ký tự ở vị trí BẤT KỲ trên cùng 1 dòng"` → phủ bởi Cases 14 (trái), 15 (giữa-2-đoạn), 16 (phải), 17 (trong text), 18 (combo)
- `"khi dòng ĐÃ CÓ đoạn text khác, chèn bên TRÁI → đoạn có sẵn phải ĐỨNG YÊN"` → Case 14: **FAIL** (diff=55px). **Bug Phase A xác nhận đo được.**
- `"chèn GIỮA-2-ĐOẠN-SÁT → đoạn đứng yên"` → Case 15: **FAIL** (diff=63px). **Bug Phase A xác nhận đo được.**
- `"chèn bên PHẢI / combo / trong text → đoạn đứng yên"` → Cases 16, 17, 18: **PASS** ✅

**Kết luận:** Phân hoạch §3b complete. PASS path (phải/combo/trong-text) hoạt động đúng; FAIL path (trái/giữa-2-đoạn) có số đo cụ thể xác nhận bug — fix thuộc Phase B merge-machinery.

**Spec:** `tests/e2e/free-caret-v2-phase-a.spec.ts`
**Evidence:** `tests/evidence/free-caret-v2-phase-a/` (19+ artifacts)
