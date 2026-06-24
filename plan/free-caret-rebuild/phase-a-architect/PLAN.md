# PLAN — Phase A Architect: Free-Caret Rebuild

> Sau khi Phase A done, **ARCHITECTURE.md** tồn tại với đủ thiết kế HOW cho 6 rủi ro blocking (R1–R6); lead gate PASS; implementer Phase B có thể bắt đầu mà không cần đoán thêm.

---

## Context

- **Vì sao chia nhiều session**: Phase A là read-heavy (≥6 file source lớn cần đọc kỹ) + design-output dài (7 section ARCHITECTURE.md). Session A.1 đọc toàn bộ source + thiết kế schema/Y.Doc; Session A.2 thiết kế migration/caret/semantics/nav/vòng-lõi + hoàn thiện ARCHITECTURE.md.
- **Ràng buộc**: Phase A **KHÔNG** ghi bất kỳ file nào trong `src/`, `backend/`, `src-tauri/`. Output duy nhất = `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md`.
- **Workstream liên quan**: `plan/free-caret-rebuild/ROADMAP.md` (phase map) — Phase A là phase đầu, blocking tất cả phase sau.
- **Out of scope**: không implement bất kỳ code nào; không thiết kế UI/UX (đó là design-vai); chỉ giải HOW cho 6 rủi ro kỹ thuật blocking.

---

## Pipeline 1 phase / 2 session

```
[Phase A — Architect] ──────────────────────────────► ARCHITECTURE.md
  │                                                        │
  ├── Session A.1 (Read source + Schema + Y.Doc)           │
  │        → partial ARCHITECTURE.md (§1 + §2)             │
  │                                                        │
  └── Session A.2 (Migration + Caret + Semantics + Nav)   │
           → ARCHITECTURE.md hoàn chỉnh (§3–§7)  ─────────┘
                    │
                    ▼
              lead gate PASS → unlock Phase B
```

---

## Phase A — Architect

**Mục tiêu**: Giải tất cả 6 rủi ro blocking (R1–R6) thông qua thiết kế HOW, sản xuất `ARCHITECTURE.md` đủ để implementer Phase B không phải đoán thêm.

### Session A.1 — Đọc source + thiết kế Schema + Y.Doc + Whitespace (R1)

- **Scope**:
  - Đọc toàn bộ các file source sau (KHÔNG bỏ qua):
    - `src/components/Workspace.tsx`
    - `src/editor/NibBlockView.tsx`
    - `src/editor/extensions/NibBlock.ts`
    - `src/editor/yBlockMeta.ts`
    - `src/editor/geometry.ts`
    - `src/components/MathField.tsx`
    - `plan/accounts-cloud-sync/phase-b-sync-engine/ARCHITECTURE.md` (Phase B accounts-cloud-sync — hiểu Y.Doc structure hiện tại)
    - `docs/feature.md §2, §2.5, §3, §5, §6` (row-based mental model, PM trade-off, state machine, render)
  - Thiết kế **PM schema mới row-based**: node types, marks, attributes tối thiểu. Xác định: row node là gì, inline-math node là gì, inline-text/marks, kết quả render node/mark.
  - Thiết kế **Y.Doc structure** cho schema mới: cách y-prosemirror bind với row-based schema, cách blockMeta (Y.Map) cần adapt.
  - Giải **R1 whitespace strategy**: lazy-fill (virtual space không lưu vào CRDT, chỉ synth khi render/commit) — đảm bảo doc trống không phình Y.Doc.
  - Ghi partial ARCHITECTURE.md với 2 section hoàn chỉnh:
    - **§1 PM Schema** (node types + attributes + marks + example doc structure)
    - **§2 Y.Doc Structure + Whitespace** (how y-prosemirror binds, blockMeta adaptation, whitespace strategy, R1 mitigation)
- **STOP gate**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` tồn tại; §1 PM Schema + §2 Y.Doc đủ chi tiết để implementer Phase B implement mà không đoán; lead đọc + PASS trước khi bắt đầu Session A.2.
- **Output artifact**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` (partial — §1 + §2)

### Session A.2 — Migration + Dual-Caret + Semantics + Nav + Vòng lõi (R2–R6)

- **Scope** (đọc ARCHITECTURE.md §1+§2 từ A.1 trước, KHÔNG đọc lại source đã đọc A.1):
  - Thiết kế **Migration strategy** R3:
    - Detect cơ chế: cách phân biệt old-schema doc (`nib-ydoc-*`) với new-schema doc khi mở IndexedDB.
    - Convert path: nếu old-schema → convert tự động sang new schema (HOW: iterate old Y.Doc → produce new Y.Doc).
    - Fallback: nếu không convert được → preserve original store + thông báo user "doc này cần migrate thủ công" (KHÔNG xóa).
    - **Hard constraint**: KHÔNG bao giờ `deleteDatabase` store cũ; KHÔNG ghi đè `nib-ydoc-u-${userId}__${docId}` với dữ liệu mới trước khi backup/verify.
    - Ghi migration test matrix: 3 case (empty old doc / doc có text / doc có math block) → expected output new schema.
  - Thiết kế **Dual-caret** R2:
    - Ghost caret: PM `Decoration.widget` CSS — render conditions (khi MathLive không active), position logic.
    - MathLive caret handoff: event sequence (click into atom / arrow-right into atom / arrow-left into atom) → focus/blur order → no PM selection clear (workaround cho bug discuss.prosemirror.net/9021).
    - Exit atom: Left arrow tại pos 0 của MathField → blur MathField → PM selection resume → ghost caret show.
    - Edge case: click vào atom giữa content → MathLive positionAt(click coord).
  - Định nghĩa **Insert semantics + Click-to-position** R4:
    - Click vào empty area → `posAtCoords` → PM TextSelection.create → caret set.
    - Type tại caret = `tr.insertText(char, pos)` — không đè.
    - Caret giữa 2 inline-math atoms (gap): type → insert text node giữa 2 atoms.
    - Backspace tại gap: xóa ký tự text trước (nếu có) hoặc merge atoms nếu gap empty.
    - Delete tại gap: xóa ký tự text sau (nếu có) hoặc merge atoms.
    - C2 hit-test: click vào atom có content → `posAtCoords` trả pos biên atom → focus MathField.
  - Thiết kế **Arrow-nav 2D plugin interface** R5:
    - Left/Right: PM default except tại biên atom → handoff MathLive (enter) hoặc exit atom (leave).
    - Up/Down: lấy `coordsAtPos(curPos)` → tìm row trên/dưới cùng x → `posAtCoords({top: nextRowY, left: curX})` → set selection. Special case: đầu/cuối doc.
    - Tab: next math atom trên cùng row (hoặc row tiếp theo nếu không có).
  - Xác nhận **Vòng lõi continuity** R6:
    - Tính target trong row-based: selection range → extract tất cả LaTeX từ inline-math nodes trong range → concatenate → gửi CAS. No selection → lấy math atom chứa cursor.
    - Result render: insert result node sau closing của biểu thức trong row (position logic).
    - MathLive WYSIWYG giữ nguyên trong atom (x^2→x², live render) — xác nhận không bị bypass.
  - Hoàn thiện ARCHITECTURE.md với 5 section còn lại:
    - **§3 Migration Strategy** (detect + convert path + fallback + test matrix)
    - **§4 Dual-Caret Design** (ghost + handoff + sync order + edge cases)
    - **§5 Insert Semantics + Click-to-Position** (type/backspace/delete/click contract)
    - **§6 Arrow-Nav 2D Plugin Interface** (left/right/up/down/tab contract)
    - **§7 Vòng lõi Continuity** (Tính target + result position + WYSIWYG confirm)
- **STOP gate**: `ARCHITECTURE.md` hoàn chỉnh với đủ 7 section; mỗi section đủ chi tiết để implementer Phase B không phải đoán HOW; lead gate PASS; KHÔNG có file nào trong `src/` bị sửa.
- **Output artifact**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` (hoàn chỉnh §1–§7)

**Phase A gate** (sau Session A.2): ARCHITECTURE.md lead gate PASS; mọi R1–R6 có thiết kế có thể kiểm chứng; kiến trúc không đề xuất ngược LOCKED stack (`CLAUDE.md §3–§6`); KHÔNG code nào được ghi vào `src/`.

---

## Outcome cuối Phase A

- `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` tồn tại + lead gate PASS.
- Mọi rủi ro blocking (R1 CRDT bloat / R2 dual-caret / R3 migration an toàn / R4 insert semantics / R5 arrow-nav / R6 vòng lõi) có thiết kế HOW cụ thể.
- Implementer Phase B có thể build schema + migration mà không cần đoán thêm.
- Gate đo được: `ARCHITECTURE.md` có đủ 7 section (grep-check tiêu đề section) + lead approve.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-23 | Initial | Planner Task #2 — caret-input team |
