# PLAN — Phase B: Unified add-char/merge law + Arrow navigation + Tab

> Sau khi Phase B PASS: (1) insert trái/giữa đoạn không còn đẩy đoạn phải — 2 test Playwright Case 14 + 15 chuyển XANH; (2) backspace tại gap thu hẹp/xoá spacer atom; (3) left/right arrow xuyên gap theo space_width step; (4) up/down bảo toàn goalX; (5) Tab tạo spacer 4×space_width — toàn bộ 15 Playwright case XANH, vòng lõi Phase A không regression.

---

## Context

- **Bối cảnh**: Phase A hoàn tất (SpacerAtom extension + virtualCaret plugin + materializeInput.ts, gate vàng Playwright 12/12, 2026-06-25). **BUG TREO từ Phase A (regression marker hiện tại):** khi `materialize()` chèn `[spacer+char]` trước spacer atom sẵn có, spacer sẵn có không được co lại → đoạn text phải bị PM text-flow đẩy sang (Case 14: AnchorL14 dịch ~55px; Case 15: Right15 dịch ~63px ≫ 2px dung sai). 2 test Playwright hiện FAIL có số đo làm regression marker chờ Phase B fix.
- **Bài học scoping [LOCKED] (context.md 2026-06-25):** luật add-char/merge của user (`end_j + x ≥ pos_{j+1} → merge, left-anchor`) bị Phase A xé thành insert(A)/delete(B). Phase B PHẢI hiện thực **displace/merge CẢ insert + backspace/delete như MỘT KHỐI** — không tách 2 cơ chế rời. Session B.1 chịu trách nhiệm toàn bộ primitive này.
- **Lý do chia 3 session**: mỗi session đụng file nguồn khác nhau + output ≥100 dòng → session granularity (1 heavy unit = 1 session).
- **Out of scope Phase B**: IME robustness đầy đủ (Phase C); MathLive inline atom (Phase D); CAS pipeline (Phase E); Y.UndoManager track spacerWidthMap (Phase C); copy/paste (Phase C).
- **Workstream**: `plan/free-caret-v2/ROADMAP.md` Phase B.
- **Rủi ro carry-over từ Phase A**: R4 (coordsAtPos chỉ chính xác sau DOM paint → đo trong rAF, KHÔNG trong appendTransaction sync); rule bất biến CẤM deleteDatabase.

---

## Pipeline 1 phase / 3 session

```
[Session B.1] Unified merge law (insert-side displace + backspace-gap-shrink)
                                    │
                                    ▼ Gate: Case 14 + 15 XANH (regression marker cleared)
[Session B.2] Arrow navigation 2D (left/right gap-step + up/down goalX)
                                    │
                                    ▼
[Session B.3] Tab spacer (4×space_width) + Delete boundary confirm + Phase B integration
                                    │
                                    ▼
              Gate vàng Phase B: 15/15 Playwright XANH + build/tsc/vitest 0
```

---

## Phase B — Unified merge law + Navigation + Tab

**Mục tiêu**: Hiện thực luật add-char/merge thống nhất cho CẢ insert và backspace/delete như 1 khối; thêm arrow navigation 2D và Tab spacer — sao cho vòng lõi Phase A sống và 2 test Playwright đang FAIL chuyển XANH.

### Session B.1 — Unified add-char/merge law (insert-side displace + backspace gap-shrink)

- **Scope (WHAT)**:
  - **Primitive "shrink-or-delete-spacer"**: sau khi xác định vị trí chèn, tìm spacer atom ngay SAU vị trí đó trong PM doc → lấy `old_width` từ Y.Map → tính `displacement = gap_inserted + charWidth_inserted` (cả hai đo runtime) → `new_width = old_width − displacement`. Nếu `new_width ≤ 0`: thêm `tr.delete(spacerAtom)` vào CÙNG transaction (atom biến mất → 2 text node dính = merge tự nhiên); nếu `new_width > 0`: `widthMap.set(id, new_width)`. Toàn bộ trong 1 PM transaction để atomic.
  - **Mở rộng `materializeInput.ts`**: sau khi build `tr.insert(pos, [spacerNode, charNode])`, gọi primitive shrink-or-delete-spacer cho spacer atom kế tiếp (nếu có) trong CÙNG transaction. Kết quả: đoạn phải ĐỨNG YÊN sau khi chèn vào trái/giữa.
  - **Thêm backspace-in-gap handler** (`virtualCaret.ts` hoặc `materializeInput.ts`): khi virtual caret active + user nhấn `Backspace` → tìm spacer atom chứa virtual caret → shrink width bằng `measureSpaceWidth()` qua primitive trên → nếu atom biến mất → clear vcaret state; return true (chặn PM default backspace).
  - **Unit tests bổ sung**: (a) primitive shrink với next-spacer có width > displacement → Y.Map set new_width đúng; (b) primitive shrink với next-spacer width ≤ displacement → tr.delete được thêm vào tx; (c) `materialize()` khi có next-spacer → neighbor bị shrink đúng; (d) backspace-in-gap → shrink → width→0 → atom deleted, vcaret cleared.
- **KHÔNG làm**: arrow nav (B.2), Tab (B.3), IME robustness (Phase C), full Delete-boundary (B.3 confirm).
- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + `npx vitest run` pass + **Playwright `tests/e2e/free-caret-v2-phase-a.spec.ts`: Case 14 XANH (AnchorL14 diff ≤ 2px) + Case 15 XANH (Right15 diff ≤ 2px)** + toàn bộ 13 case cũ (Case 1–13) vẫn XANH.
- **Output artifact**: cập nhật `src/editor/materializeInput.ts` + cập nhật `src/editor/virtualCaret.ts` + test bổ sung `src/editor/materializeInput.test.ts`.

### Session B.2 — Arrow navigation 2D (left/right gap-step + up/down goalX)

- **Scope (WHAT)**:
  - **Left/right khi virtual caret active trong gap**: `ArrowRight` → `virtualX += measureSpaceWidth()`; `ArrowLeft` → `virtualX -= measureSpaceWidth()`. Khi `virtualX` vượt biên phải của spacer → exit virtual mode, PM cursor đặt tại text node kề phải. Khi `virtualX` nhỏ hơn biên trái spacer → exit virtual mode, PM cursor về text node kề trái.
  - **Left/right khi PM caret đứng kề spacer atom**: nhấn mũi tên hướng spacer → activate virtual caret tại biên spacer đó (`virtualX = spacer.left_x` hoặc `spacer.right_x` tuỳ hướng); di chuyển tiếp vào trong gap.
  - **Up/down với goalX**: track `goalX` (float px) = `virtualX` nếu vcaret active, hoặc `coordsAtPos(pmSelection).left` nếu PM caret đang active. `ArrowUp`/`ArrowDown` → đổi dòng → tìm pos closest to goalX trên dòng mới via `posAtCoords({left: goalX, top: newLineY})`; nếu vị trí đó trong gap → activate virtual caret tại goalX; `goalX` được giữ qua nhiều lần up/down liên tiếp (chỉ reset khi left/right/click/type).
  - **Unit tests**: (a) goalX preserved qua 2 ArrowUp-ArrowDown liên tiếp; (b) ArrowRight exit virtual caret khi vượt biên phải spacer.
- **KHÔNG làm**: Tab (B.3), merge-machinery (đã B.1), IME (Phase C).
- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + vitest pass + smoke (Playwright screenshot hoặc user smoke): `ArrowRight` trong gap di chuyển vcaret widget đúng x; `ArrowUp`/`ArrowDown` với vcaret active → vcaret xuất hiện ở x ≈ goalX trên dòng kề (sai số ≤ 1×space_width).
- **Output artifact**: cập nhật `src/editor/virtualCaret.ts` (keydown extend: ArrowLeft/Right/Up/Down) + test bổ sung `src/editor/virtualCaret.test.ts` + (tuỳ quyết định architect) có thể tách `src/editor/arrowNav.ts` nếu logic > 80 dòng.

### Session B.3 — Tab spacer + Delete boundary confirm + Phase B integration gate

- **Scope (WHAT)**:
  - **Tab spacer**: khi virtual caret active → insert spacer_atom mới width = `4 × measureSpaceWidth()` tại vị trí vcaret (không cần char), vcaret dịch ra sau spacer mới. Khi PM caret active ở cuối đoạn text (không trong gap) → Tab cũng insert spacer_atom `4 × space_width` tại PM cursor pos.
  - **Delete at text boundary (confirm/patch)**: xác nhận PM default delete xử lý đúng khi cursor đứng giữa text và spacer_atom (spacer là inline leaf atom → Delete xoá atom, gap giảm; nếu spacer đã gone → text merge = đúng model). Nếu PM default không handle đúng (ví dụ: cursor không "thấy" atom ở đúng hướng) → thêm handler tường minh tương tự backspace-in-gap từ B.1 nhưng cho Delete. Scope nhỏ (confirm/minimal-patch, KHÔNG redesign).
  - **Phase B integration gate**: re-run full Playwright suite `tests/e2e/free-caret-v2-phase-a.spec.ts` (15 case) để xác nhận B.2/B.3 không regress Case 14/15 đã xanh từ B.1.
  - **Unit test Tab**: Tab với vcaret active → spacer atom width = 4 × space_width được insert đúng PM pos (mock measureSpaceWidth).
- **KHÔNG làm**: IME (Phase C), undo track spacerWidthMap (Phase C), MathLive inline (Phase D).
- **STOP gate (gate vàng Phase B)**: `npm run build` exit 0 + `tsc --noEmit` 0 error + `npx vitest run` pass + **Playwright full suite: 15/15 case XANH** (Case 14 + 15 giữ XANH từ B.1, case 1–13 không regression, Case 16+ nếu có vẫn pass) + Tab unit test pass.
- **Output artifact**: cập nhật `src/editor/materializeInput.ts` (Tab handler) + cập nhật `src/editor/virtualCaret.ts` (Tab + Delete boundary) + test Tab trong `src/editor/materializeInput.test.ts`.

**Phase B gate** (sau Session B.3): gate vàng = 15/15 Playwright XANH + build/tsc/vitest 0 → Phase C (IME robustness đầy đủ + Y.UndoManager track spacerWidthMap + copy/paste) có thể bắt đầu.

---

## Rủi ro carry-over Phase B

| Rủi ro | Nội dung | Hướng xử lý |
|---|---|---|
| R4 (CC-6 carry) | `coordsAtPos` chỉ chính xác sau DOM paint; cần đo trong rAF | B.2 (goalX measurement) phải tiếp tục dùng rAF; KHÔNG đo trong appendTransaction sync |
| Regression vòng lõi Phase A | B.1 modify `materializeInput.ts` — file đang giữ 12 case Playwright xanh | Chạy full Playwright suite ngay cuối B.1 TRƯỚC khi sang B.2 |
| Y.Map + PM tx atomicity | `widthMap.set()` + `tr.delete()` phải phối hợp không gây loop observe | Architect chốt HOW; plan flag rủi ro; implementer guard `new !== old` (R2 từ ROADMAP) |
| CẤM deleteDatabase | Rule bất biến Phase A | Constraint reminder đầu mỗi chat (CHECKPOINT) |

---

## Outcome cuối Phase B

- Insert trái/giữa đoạn: đoạn phải đứng yên (diff ≤ 2px) — 2 regression marker Playwright XANH.
- Backspace tại gap: spacer shrink bằng space_width; width→0 → merge tự nhiên.
- Left/right arrow xuyên gap theo space_width step; up/down bảo toàn goalX.
- Tab insert spacer 4×space_width đúng vị trí.
- 15/15 Playwright case XANH + vitest pass + build/tsc 0 error.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-30 | Initial | Phase B sau Phase A gate vàng đóng; bug merge-machinery được test phủ (Case 14/15 FAIL có số đo) |
