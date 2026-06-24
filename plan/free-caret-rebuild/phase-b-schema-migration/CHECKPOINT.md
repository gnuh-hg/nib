# CHECKPOINT — Phase B: Schema + Migration

> Sổ tay tiến độ Phase B. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **KHÔNG bao giờ `indexedDB.deleteDatabase` store cũ** — đây là hard constraint của cả phase; vi phạm = data loss.
- **PM attrs `row`/`mathInline` chỉ có `id` (static)** — KHÔNG đặt xOffset/lineIndex/latex/blockState lên PM node attr; verify bằng grep mỗi session.
- **Vòng lõi TẠM GIÁN ĐOẠN ở Phase B** — đây là đúng kế hoạch (nibBlock cũ removed, MathLive Phase D). KHÔNG cố fix vòng lõi ở Phase B; ghi trạng thái rõ.
- **HOW đã chốt tại**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` §1–§3. Đọc trước khi code.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
|---|---|---|---|
| Sessions hoàn thành | 3 | 3 | 100% |
| Build + tsc 0 error | 3/3 session | 3/3 | 100% |
| R1 proof test (Y.Doc < 1KB) | PASS | ✅ PASS (r1-proof 13/13) | 100% |
| Migration 4 case PASS | 4 case | ✅ 12/12 (4 C-case + spy + units) | 100% |
| deleteDatabase spy NEVER | PASS | ✅ 0 call (test + grep source) | 100% |
| WS room v2 | `${userId}:${docId}:v2` | ✅ yProvider.ts:58 | 100% |

vitest tổng: **118/118** (15 file). Lead verify độc lập mỗi session.

---

## Đang ở đâu

- **Phase**: B — Schema + Migration ✅ ĐÓNG (lead gate PASS 2026-06-23, 3/3 session)
- **Session kế tiếp**: — (Phase B xong → Phase C: planner soạn long-plan Text Engine + Cursor)
- **Blocker**: không
- **Reference**: `../ROADMAP.md` Phase C
- **CAVEAT (cho Phase E/user-smoke):** migration IDB round-trip THẬT chưa test (jsdom không có indexedDB) — chỉ verify logic convert + đảm bảo tĩnh không-deleteDatabase. Migration thật trên ổ đĩa cần browser-smoke với tài liệu cũ thật khi vòng lõi sống lại.

---

## Trạng thái vòng lõi (gõ→Tính→result)

| Trạng thái | Chi tiết |
|---|---|
| **TẠM GIÁN ĐOẠN (Phase B)** | nibBlock removed → editor cũ không render; RowView placeholder; MathLive chưa inline. **Đây là đúng kế hoạch.** |
| Lộ trình phục hồi | Phase C: caret/text engine (RowView thật, cursor) → Phase D: MathLive inline + dual-caret → Phase E: CAS integration → vòng lõi hoàn toàn phục hồi. |

---

## Context nhanh cho implementer khi bắt đầu mỗi session

### Session B.1 — Đọc trước
- `src/editor/extensions/NibDocument.ts` (content `nibBlock*` → đổi `row*`)
- `src/editor/extensions/NibBlock.ts` (hiểu attr pattern, KHÔNG register vào editor mới)
- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md §1` (PM schema spec)

### Session B.2 — Đọc trước
- `src/editor/yBlockMeta.ts` (adapt bỏ xOffset/lineIndex)
- `src/lib/yjs.ts` (thêm ROW_META_MAP)
- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md §2` (Y.Doc + Whitespace + appendTransaction pattern)

### Session B.3 — Đọc trước
- `src/lib/yPersistence.ts` (hiểu store naming: `idbStoreName(docId, userId)`)
- `src/providers/YjsProvider/YjsProvider.tsx` (nơi gọi migration trước bind editor)
- `src/lib/yProvider.ts` (đổi room name → v2)
- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md §3` (migration spec đầy đủ)
- `src/locales/en.json` + `vi.json` (thêm `migration.failed_preserved`)

### Constraints chung mọi session
- Implement WHAT theo PLAN.md, HOW theo ARCHITECTURE.md.
- Chạy `npm run build` + `tsc --noEmit` + `npx vitest run` trước khi báo STOP gate.
- Nộp evidence: output lệnh build/test (exit code + số test pass).
- KHÔNG implement caret UX / MathLive inline (Phase C/D).

---

## Per-session log

- **B.1 (2026-06-23)** — NEW Row.tsx + MathInline.tsx (atom, attr chỉ {id}); NibDocument content→'row*'; gỡ NibBlock khỏi register (giữ file legacy); findBlock scan 'mathInline'; stub insertNibBlock/convertNibBlock. Lead verify: tsc 0, vitest 92/92, attrs chỉ id.
- **B.2 (2026-06-23)** — yBlockMeta bỏ xOffset/lineIndex (BlockMetaRecord+DEFAULT_META); yjs.ts +ROW_META_MAP/getRowMetaMap; NEW yRowMeta.ts + useRowMeta.ts; NEW MetaSyncPlugin.ts (appendTransaction auto-init meta, **lazy GC** — không delete ngay để undo-safe); r1-proof.test.ts 13 test. Lead verify: tsc 0, r1-proof byte<1KB, vitest 106/106.
- **B.3 (2026-06-23)** — NEW migration.ts (detectSchemaVersion + convert qua prosemirrorJSONToYDoc → store `__v2` riêng → verify → fallback; CẤM deleteDatabase) + migration.test.ts 12 test; YjsProvider gọi migrate trước bind + notice banner; yProvider room→`:v2`; i18n +2 key. Lead verify: tsc 0, migration 12/12, deleteDatabase 0 call, room :v2, parity 197=197, vitest 118/118.
- **Quyết định lazy-GC (B.2):** appendTransaction KHÔNG delete meta ngay khi node removed (undo-safe) → orphan tồn tại tới lần GC quét (on-load/sweep). Phase sau cần implement sweep thật nếu orphan tích tụ.

---

## Lịch sử revision

| Date | Action | By |
|---|---|---|
| 2026-06-23 | Created | @planner (team caret-input) |
