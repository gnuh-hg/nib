# PLAN — Phase B: Schema + Migration

> Sau khi Phase B done, **PM schema row-based mới đã được implement**, Y.Doc adaptation (blockMeta/rowMeta) hoạt động đúng, migration an toàn chuyển tài liệu cũ sang store v2, WS room versioned. Implementer Phase C/D có base sạch để build caret + MathLive inline.

---

## Context

- **Vì sao chia nhiều session**: Phase B là phase CODE đầu tiên, chạm nhiều file độc lập (schema extensions / Y.Doc bridges / migration module / WS provider). Mỗi deliverable cần đọc ≥1 file source lớn + produce file mới → áp session granularity.
- **HOW đã chốt**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` §1–§3 + rủi ro cuối (WS room v2). Implementer đọc ARCHITECTURE.md là nguồn sự thật; PLAN này chỉ chia WHAT + gate.
- **Ràng buộc cứng**:
  - KHÔNG bao giờ `indexedDB.deleteDatabase` store cũ (spy test PHẢI fail nếu gọi).
  - PM attrs chỉ có `id` (static) — KHÔNG có xOffset/lineIndex/latex/blockState trên PM node attr. Verify bằng grep/test.
  - Vòng lõi gõ→Tính→result **TẠM GIÁN ĐOẠN có kiểm soát** ở Phase B: editor UI sẽ trống/broken (schema cũ removed, caret/MathLive Phase C/D chưa build). Ghi rõ trạng thái + lộ trình phục hồi trong CHECKPOINT.
  - WS room v2 (`${userId}:${docId}:v2`) phải được set trong Phase B — tránh v2 client nhận update v1 từ server (ARCHITECTURE.md rủi ro #1).
- **Scope ngoài plan**: caret UX (Phase C), MathLive inline / dual-caret (Phase D), CAS integration (Phase E), Yjs 2-tab sync live test (Phase F).

---

## Pipeline 1 phase / 3 session

```
[Phase B — Schema + Migration]
  │
  ├── B.1 PM Schema + TipTap Extensions ─────────────────► new schema loads, nibBlock removed
  │
  ├── B.2 Y.Doc Adaptation + appendTransaction Plugin ──► blockMeta adapt + rowMeta + R1 proof
  │
  └── B.3 Migration Module + WS Room v2 ─────────────────► 4 test cases PASS + room = v2
                                                                        │
                                                                        ▼
                                                          Phase B gate → unlock Phase C
```

---

## Phase B — Schema + Migration

**Mục tiêu**: PM schema row-based hoạt động + Y.Doc adaptation đúng (R1 proof) + migration an toàn (R3) + WS room v2 (tránh schema collision). Vòng lõi TẠM GIÁN ĐOẠN, ghi rõ path phục hồi Phase C/D.

---

### Session B.1 — PM Schema + TipTap Extensions

- **Scope**:
  - Đọc trước: `src/editor/extensions/NibDocument.ts` (hoặc tương đương — nơi khai báo `content: 'nibBlock*'`) + `src/editor/extensions/NibBlock.ts` (để hiểu attr pattern hiện tại). Đọc ARCHITECTURE.md §1 (schema spec).
  - **NibDocument.ts**: đổi `content: 'nibBlock*'` → `content: 'row*'`. Giữ file cho migration reference (KHÔNG xóa NibBlock.ts — cần cho detect §3 về sau? Không, detect dùng raw Y.Doc. Cách an toàn: deprecate-comment NibBlock, KHÔNG register vào editor mới, giữ file với note "legacy — dùng bởi migration detection via raw Y.Doc, KHÔNG register extension").
  - **NEW `src/editor/extensions/Row.ts`**: TipTap extension node `row` theo ARCHITECTURE.md §1 (group: 'block', content: '(text|mathInline)*', defining: true, draggable: false, selectable: false; attr: `{ id }`; addNodeView → `RowView` placeholder đơn giản Phase B — `<div class="nib-row">` + `contentDOM`). Parse/serialize DOM. NibBlock KHÔNG còn register.
  - **NEW `src/editor/extensions/MathInline.ts`**: TipTap extension node `mathInline` theo ARCHITECTURE.md §1 (group: 'inline', inline: true, atom: true, selectable: true, draggable: false; attr: `{ id }`; NodeView Phase B = `<span class="nib-math-placeholder">[Math]</span>` tạm — Phase D sẽ thay bằng MathLive thật). Parse/serialize DOM.
  - Wire vào editor (Workspace.tsx hoặc file extensions index): thêm `Row`, `MathInline`; bỏ `NibBlock` khỏi extension list.
  - Update **test helpers** (mock schema, test factory) để dùng `row` + `mathInline` thay `nibBlock`.
  - Vitest unit test: schema hợp lệ (doc chứa row + mathInline tạo được, serialize/parse round-trip); `nibBlock` KHÔNG còn trong schema.
- **STOP gate**:
  - `npm run build` exit 0.
  - `tsc --noEmit` 0 error.
  - `npx vitest run` pass (existing + new schema tests).
  - Test: tạo doc `doc(row({id:'r1'}, mathInline({id:'m1'})))` → serialize → parse → lấy được `row` + `mathInline` node đúng type.
  - Grep verify: `nibBlock` KHÔNG xuất hiện trong extension list (không còn được register vào editor); PM attrs `row` + `mathInline` chỉ có `id` (không có xOffset/lineIndex/latex).
- **Output artifact**: `src/editor/extensions/Row.ts`, `src/editor/extensions/MathInline.ts`, sửa `NibDocument.ts`, sửa file wire extensions + test helpers.

---

### Session B.2 — Y.Doc Adaptation + appendTransaction Plugin (R1 proof)

- **Scope** (đọc `src/editor/yBlockMeta.ts` + `src/lib/yjs.ts` + ARCHITECTURE.md §2 trước):
  - **`src/editor/yBlockMeta.ts` adapt**: bỏ `xOffset` + `lineIndex` khỏi `BlockMetaRecord` type + `DEFAULT_META`. Verify các field giữ lại: `latexContent, blockState, exactLatex, approxLatex, isApprox, errorKind, mathSize, color, inkStrokes`. Đổi comment: "keyed theo math-atom-id (mathInline), KHÔNG block-id cũ". Patch `initBlockMeta` nếu cần (bỏ init xOffset/lineIndex). Hook `useBlockMeta` tái dùng gần nguyên văn.
  - **`src/lib/yjs.ts`**: thêm constant `ROW_META_MAP = 'rowMeta'`; export helper `getRowMetaMap(ydoc)` = `ydoc.getMap(ROW_META_MAP)`.
  - **NEW `src/lib/yRowMeta.ts`**: bridge `getRowMeta / patchRowMeta / initRowMeta / deleteRowMeta` (ghi trong `ydoc.transact()`, init idempotent) + type `RowMetaRecord { blankBefore: number; indent: number }` + `DEFAULT_ROW_META`. Copy khuôn từ `yBlockMeta.ts` (pattern proven Phase B accounts-cloud-sync).
  - **NEW `src/hooks/useRowMeta.ts`**: hook `useRowMeta(ydoc, rowId): RowMetaRecord` — subscribe `Y.Map observer`, render `DEFAULT_ROW_META` khi entry chưa có, re-render khi data tới (tolerance R3 race — copy khuôn `useBlockMeta`).
  - **NEW appendTransaction plugin** (trong `Row.ts` hoặc file plugin riêng): mỗi PM transaction, diff mathInline id `{created, deleted}` + row id `{created, deleted}` → gọi `initBlockMeta(ydoc, id, DEFAULT_META)` cho atom mới / `deleteBlockMeta(ydoc, id)` cho atom xóa (LAZY — xem note undo); tương tự `initRowMeta` / `deleteRowMeta` cho row. **Note undo**: KHÔNG xóa blockMeta/rowMeta ngay nếu nằm trong cửa sổ undo-able — để GC lazy (quét entry có id vắng mặt trong doc). Approach đơn giản Phase B: mark orphan = defer delete, implement heuristic hoặc on-load GC. Document decision trong CHECKPOINT.
  - **Vitest R1 PROOF test** (`yBlockMeta.test.ts` hoặc `r1-proof.test.ts`):
    - Y.Doc mới khởi tạo: `XmlFragment('prosemirror').length === 0`; `getRowMetaMap(ydoc).size === 0`; `blockMeta.size === 0`; `Y.encodeStateAsUpdate(ydoc).byteLength < 1024` (assert < 1KB — xa rất xa ~180KB R1 bloat).
    - Click-and-type simulation: init 1 row + blankBefore + 1 char → `XmlFragment.length === 1`; `rowMeta.size === 1`; KHÔNG có space synth / row rỗng thừa.
  - **Orphan/undo test**: insert mathInline → eval (blockMeta có entry) → backspace xóa atom → undo → blockMeta entry còn nguyên (kết quả không mất sau undo).
- **STOP gate**:
  - `npm run build` + `tsc --noEmit` 0.
  - `npx vitest run` pass bao gồm R1 proof + orphan/undo test.
  - R1 proof: `Y.encodeStateAsUpdate(ydoc).byteLength < 1024` khi doc rỗng.
  - Grep: `xOffset\|lineIndex` KHÔNG xuất hiện trong `BlockMetaRecord` type định nghĩa + `DEFAULT_META` (chỉ còn ở migration.ts cho compat cũ là OK).
- **Output artifact**: sửa `src/editor/yBlockMeta.ts`, sửa `src/lib/yjs.ts`, NEW `src/lib/yRowMeta.ts`, NEW `src/hooks/useRowMeta.ts`, appendTransaction plugin, test R1 + orphan/undo.

---

### Session B.3 — Migration Module + WS Room v2

- **Scope** (đọc `src/lib/yPersistence.ts` + `src/providers/YjsProvider/YjsProvider.tsx` + `src/lib/yProvider.ts` + ARCHITECTURE.md §3 trước):
  - **NEW `src/lib/migration.ts`**: `detectSchemaVersion(ydoc)` + `migrateIfNeeded(ydoc, docId, userId): Promise<MigrationResult>` theo ARCHITECTURE.md §3:
    - Detect: đọc `docMeta.get('schemaVersion')`; scan XmlFragment children nodeName; phân loại `'v2'|'empty-new'|'old-data'|'unknown'`.
    - Convert (khi `'old-data'`): build newDoc in-memory → `prosemirrorJSONToYDoc(newSchema, pmJSON, 'prosemirror')` → set rowMeta/blockMeta → persist vào store suffix `__v2` → verify (số row/atom/field count) → set localStorage registry `nib-migrated-v2:${storeName}=1`.
    - Fallback (exception/verify FAIL): KHÔNG ghi store v2; return `{ status: 'fallback' }` → caller show notice.
    - **HARD CONSTRAINT: KHÔNG `indexedDB.deleteDatabase`** — test spy coverage bắt buộc.
  - **Update `src/providers/YjsProvider/YjsProvider.tsx`**: sau `waitForSync`, gọi `migrateIfNeeded` trước khi bind editor. Nếu `status === 'fallback'` → render migration notice (banner non-destructive, i18n). Nếu migrate thành công → load từ store v2.
  - **Update `src/lib/yProvider.ts`**: room name → `` `${userId}:${docId}:v2` `` (WS room versioning — tránh v2 client merge v1 server updates). Comment: "v2 suffix versioned cho free-caret schema mới; Phase F sync verify với server hỗ trợ v2".
  - **i18n keys**: thêm `migration.failed_preserved` (en: "Your document could not be migrated. The original is preserved." / vi tương đương) vào `src/locales/en.json` + `src/locales/vi.json`.
  - **TEST `src/lib/migration.test.ts`** với 4 case (theo ARCHITECTURE.md §3e):
    - C1 empty old: XmlFragment.len=0, blockMeta empty, no schemaVersion → stamp v2; 0 row; store cũ nguyên.
    - C2 old text block: 1 nibBlock text "Bài 1" @(line2,x40) → 1 row[text "Bài 1"]; rowMeta{blankBefore=2,indent=40}; store cũ nguyên; v2 tạo.
    - C3 old math+result: nibBlock math blockMeta{latex=`\int x^2 dx`,exact=`\frac{x^3}{3}+C`,state=result-exact,x56,line1} → 1 row[mathInline{id}]; newBlockMeta[id]={latex,exact,state,...} (bỏ x/line); rowMeta{blankBefore=1,indent=56}.
    - C4 convert-fail: node lạ/corrupt → KHÔNG ghi v2; store cũ nguyên; return `{ status: 'fallback' }`.
    - **Assertion chung tất cả case**: `spy(indexedDB, 'deleteDatabase').never.called`.
- **STOP gate**:
  - `npm run build` + `tsc --noEmit` 0.
  - `npx vitest run` pass bao gồm migration 4 test cases.
  - Spy `indexedDB.deleteDatabase` NEVER called (fail hard nếu gọi).
  - `src/lib/yProvider.ts` room name = `` `${userId}:${docId}:v2` `` (grep confirm).
  - i18n: `migration.failed_preserved` có trong cả `en.json` và `vi.json`; parity count không vỡ.
- **Output artifact**: NEW `src/lib/migration.ts`, NEW `src/lib/migration.test.ts`, sửa `YjsProvider.tsx`, sửa `yProvider.ts`, sửa `en.json` + `vi.json`.

**Phase B gate** (sau Session B.3 cuối):
- `npm run build` + `tsc --noEmit` 0 + `npx vitest run` pass toàn bộ.
- R1 proof: `Y.encodeStateAsUpdate(ydoc).byteLength < 1024` (doc rỗng mới).
- Migration 4 case PASS + spy deleteDatabase NEVER.
- WS room = `${userId}:${docId}:v2` (grep confirm).
- Vòng lõi TẠM GIÁN ĐOẠN: editor UI sẽ không render đúng (nibBlock cũ removed, RowView placeholder, MathLive chưa inline). Ghi rõ trạng thái trong CHECKPOINT + lộ trình phục hồi Phase C (caret/text) + Phase D (MathLive inline).
- 0 hex rời; i18n en/vi parity; attrs `row`/`mathInline` chỉ có `id` (grep xOffset/lineIndex/latex = 0 trong PM attrs).

---

## Outcome cuối Phase B

- PM schema mới (`row*` + `mathInline` atom) load được, cũ (`nibBlock`) không còn trong editor.
- Y.Doc sạch: rowMeta + blockMeta keyed theo id tương ứng; R1 byte proof pass.
- Migration: tài liệu cũ convert an toàn sang store v2 HOẶC preserved với notice; `deleteDatabase` KHÔNG BAO GIỜ gọi.
- WS room versioned v2 — client v2 KHÔNG merge với server v1.
- Gate đo được: vitest pass + R1 < 1KB + migration 4 case + deleteDatabase spy.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-23 | Initial | Planner task Phase B — team caret-input |
