# CHECKPOINT — Phase B: Unified add-char/merge law + Arrow navigation + Tab

> Sổ tay tiến độ Phase B. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **CẤM `deleteDatabase`** bất kỳ lúc nào (data safety — Yjs IDB là bản sao duy nhất).
- **Path B spacer-atom là LOCKED** — KHÔNG dùng literal space char, KHÔNG bỏ ProseMirror.
- **Metrics đo runtime** — `coordsAtPos` chỉ đo SAU DOM paint (rAF); KHÔNG hằng CHAR_W=7.
- **Vòng lõi Phase A (13 case Playwright) phải SỐNG sau mỗi session** — nếu session phá build hoặc regress case cũ → rollback + report ngay trước khi tiếp.
- **Session B.1 BẮT BUỘC chạy full Playwright suite trước khi kết thúc** — xác nhận Case 14 + 15 XANH + case 1–13 không regression.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 3 | 3 (B.1+B.2+B.3) ✅ PHASE B DONE | 100% |
| `npm run build` exit 0 | 3/3 session | ✅ B.1+B.2 | — |
| `tsc --noEmit` 0 error | 3/3 session | ✅ B.1+B.2 | — |
| `npx vitest run` pass | 3/3 session | ✅ B.2 (97/97) | — |
| Playwright Case 14 (insert-trái) XANH | 1 (sau B.1) | ✅ XANH (diff 0.5px) | 100% |
| Playwright Case 15 (giữa-2-đoạn) XANH | 1 (sau B.1) | ✅ XANH (diff 0.3px) | 100% |
| Playwright 15/15 full suite XANH | 1 (sau B.3) | — | — |
| Gate vàng Phase B | 1 (B.3) | — | — |

---

## Đang ở đâu

- **Phase**: B — ✅ HOÀN TẤT 3/3 session (2026-07-01)
- **Session kế tiếp**: (Phase B đóng) → Phase C khi user quyết — cần planner long-plan Phase C (IME + Y.UndoManager track spacerWidthMap + copy/paste). PLAN-GATE.
- **Blocker**: không. Gate vàng Phase B (17/17 Playwright) XANH. Flake hạ tầng 1/5 (browser-context-closed, không phải product) đã note.
- **Reference**: `../ROADMAP.md` Phase C

---

## Per-session log

### B.1 — Unified add-char/merge law (2026-06-30) ✅ PASS
- Chain planner→architect→editor; lead gate ĐỘC LẬP re-run.
- Impl: `materializeInput.ts` +3 hàm (`measureCharWidth`/`findNextSpacer`/`shrinkOrDeleteSpacer`); `materialize()` shrink next-spacer bằng `tr.doc` post-insertion (E1); merge khi newWidth≤0 (tr.delete, KHÔNG widthMap.set — E2). `Workspace.tsx` +Backspace-in-gap. `virtualCaret.ts` export INACTIVE (E3). +`vite.config.ts` exclude tests/e2e (config stale fix, disclosed).
- Evidence (lead re-run): tsc 0 · vitest 90/90 · build 0 · **Playwright 17/17, Case 14 diff 0.5px + Case 15 diff 0.3px (≤2px)**, case 1-13/16-18 không regression.
- Treo: user smoke (insert-left/backspace-merge/IME); cosmetic test-label "[EXPECTED FAIL]" cần refresh.

### B.2 — Arrow navigation 2D (2026-06-30) ✅ PASS
- Chain architect→editor; lead gate ĐỘC LẬP re-run.
- Impl: TẠO `arrowNav.ts` (goalX module-ref; tryMoveHorizontal step±space_width+enterSpacer, exit epsilon±0.5px E1; tryMoveVertical newLineY=bottom+2/top−2 E2, gap-vs-text branch). `Workspace.tsx` hoist arrow handler + resetGoalX wiring. Bug-fix nội bộ `virtualCaret.ts` decoration key encode x (PM DOM cache stale khi vcaret dịch trong gap — disclosed, không đổi interface).
- Evidence (lead re-run): tsc 0 · vitest 97/97 (90+7) · build 0 · **Playwright 17/17 không regress**. Browser-smoke: ArrowR/L ±4.44px=1 space-width; ArrowUp/Down goalX drift 0px.
- Treo: user smoke nav (gap step / goalX qua dòng / reset).

### B.3 — Tab spacer + Delete-boundary + integration (2026-07-01) ✅ PASS — PHASE B DONE
- Lead brief editor TRỰC TIẾP (không architect — nhỏ, reuse primitive). Lead gate ĐỘC LẬP.
- Impl: refactor `insertSpacer` helper (materialize dùng lại, hành vi bất biến); Tab handler (vc.active → spacer 4×space_width tại lineDocPos, caret right-edge; PM-caret → tại selection.from); Delete = PM default ĐÚNG (probe merge AABB) → chỉ comment.
- Evidence (lead re-run): tsc 0 · vitest 99/99 (97+2) · build 0 · **Playwright 17/17** (Case 14/15 giữ xanh). Tab smoke: spacer 17.8px=4×4.44px.
- Flake hạ tầng 1/5 (browser-context-closed) — không phải product/B.3. Design-decision Tab-click-gap → right-edge (user confirm option).

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-30 | Created from PLAN.md Phase B | @planner |
| 2026-06-30 | B.1 PASS — Case 14/15 XANH, checkpoint updated | @team-lead |
| 2026-06-30 | B.2 PASS — arrow nav 2D, 97/97 vitest, 17/17 Playwright no-regress | @team-lead |
| 2026-07-01 | B.3 PASS — Tab+Delete, 99/99 vitest, 17/17 Playwright → PHASE B DONE | @team-lead |
