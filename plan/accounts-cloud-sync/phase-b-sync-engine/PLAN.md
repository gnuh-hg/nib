# PLAN — Phase B: Sync Engine (Yjs/CRDT)

> Sau khi xong Phase B: editor Nib có Yjs doc model offline-first (IndexedDB) + Hocuspocus WS client; block attrs (xOffset, lineIndex, kết quả CAS) sync đúng qua Y.Map side-channel (CC-1 đã giải); 2 browser tab edit cùng doc thấy thay đổi <1s không reset về default.

---

## Context

- **Tại sao chia nhiều session:** Phase B chạm editor core (NibBlockView.tsx, Workspace.tsx — cả hai nặng ≥150 dòng) + tạo ~12 file mới + xóa 14 node attr + migrate undo stack → mỗi nhóm deliverable nặng cần 1 session riêng để tránh context overload (ISSUE-14).
- **HOW đã xong:** `ARCHITECTURE.md` trong cùng thư mục — architect soạn, lead gate PASS 2026-06-21. Mọi quyết định HOW (CC-1 = Y.Map side-channel, module names, data model, rủi ro R1–R5) lấy từ đó. **Implementer đọc ARCHITECTURE.md trước session, KHÔNG thiết kế lại.**
- **Phase C boundary:** Phase B dùng `@hocuspocus/server` local (`ws://localhost:1234`) — multi-device thật qua Render cần Phase C. Comment `// Phase C: validate ${userId}:${docId} room in onAuthenticate` đặt trong `yProvider.ts` để Phase C không đoán.
- **Out of scope Phase B:** Hocuspocus onAuthenticate JWT validate (Phase C); cursor presence (Phase D); snapshot merge Postgres (Phase C); OAuth flow (Phase A done).
- **Phụ thuộc:** Phase A done (auth + tokenStore + ProfileProvider).

---

## Pipeline 1 phase / 5 session

```
[B.1] Yjs core libs + YjsProvider ──────► src/lib/yjs.ts · yProvider.ts · yPersistence.ts
                                            src/providers/YjsProvider/ (3 file)
                                            └─►(STOP gate: build pass, YjsProvider render offline)
[B.2] Block meta layer ─────────────────► src/editor/yBlockMeta.ts · src/hooks/useBlockMeta.ts
                                            src/hooks/useYjsStatus.ts · src/types/block.ts
                                            NEW yBlockMeta.test.ts
                                            └─►(STOP gate: vitest pass incl. new tests)
[B.3] NibBlock strip + NibBlockView ────► NibBlock.ts (3 attrs only) · NibBlockView.tsx (migrate)
(HEAVY — 2 large source files)              blockActions.ts (ydoc param) · tests updated
                                            └─►(STOP gate: R1 verified via grep, tsc 0, vitest pass)
[B.4] YjsSync ext + NibHistory del ─────► YjsSync.ts (NEW) · NibHistory.ts (DELETE)
       + TopStrip undo wire (R2)            editor-context.ts · TopStrip.tsx undo/redo
                                            └─►(STOP gate: NibHistory grep=0, undoManager wire pass)
[B.5] Workspace wiring + gate vàng ─────► Workspace.tsx (bọc YjsProvider + YjsSync + ydoc)
(HEAVY — Workspace.tsx lớn)                 Gate vàng: 2-tab sync <1s không reset
                                            └─►(STOP gate: build pass + click-through checklist user)
```

---

## Phase B — Sync Engine

**Mục tiêu:** Tích hợp Yjs CRDT vào editor Nib — offline-first IndexedDB + Hocuspocus WS client; block attrs (layout + CAS result) sync qua Y.Map side-channel; undo/redo qua yUndoManager; gate vàng 2-tab.

### Session B.1 — Yjs core libs + YjsProvider

- **Scope:**
  - Install deps: `yjs@^13`, `@hocuspocus/provider@^2`, `y-prosemirror@^1`, `y-indexeddb@^2`; DEV: `@hocuspocus/server@^2`
  - `src/lib/yjs.ts` — `createYDoc(docId)` singleton (Map cache); `getXmlFragment('prosemirror')` + `getMap('blockMeta')`; constants `PROSEMIRROR_FRAGMENT`, `BLOCK_META_MAP`
  - `src/lib/yProvider.ts` — `createHocuspocusProvider(ydoc,docId,userId,token)`, room `${userId}:${docId}`, URL `import.meta.env.VITE_HOCUSPOCUS_URL`, reconnect backoff 1000/×2/max30000, comment `// Phase C: onAuthenticate JWT validate`, caller `.destroy()`
  - `src/lib/yPersistence.ts` — `createIndexeddbPersistence(ydoc,docId)` store `nib-ydoc-${docId}`; `waitForSync(persistence): Promise<void>`
  - `src/providers/YjsProvider/yjs-context.ts` — context type `{ ydoc: Y.Doc; syncStatus: 'local'|'syncing'|'synced'|'error' }`
  - `src/providers/YjsProvider/YjsProvider.tsx` — props `{ docId, userId, token, children }`; lifecycle: createYDoc → indexeddb → waitForSync → **render children ngay** → (nếu token) hocuspocus; token null → syncStatus='local' offline-only; cleanup destroy
  - `src/providers/YjsProvider/index.ts` — re-export
  - `.env.example` — thêm `VITE_HOCUSPOCUS_URL=ws://localhost:1234`
  - **Ref ARCHITECTURE.md:** §A (module breakdown — yjs.ts/yProvider.ts/yPersistence.ts/YjsProvider), §B (data model), §C (data flow lifecycle)
- **STOP gate:**
  - `tsc --noEmit` 0 error
  - `npm run build` exit 0
  - `vitest run` pass (existing tests không vỡ)
  - YjsProvider render children với token=null → syncStatus='local', 0 console error (verify import không vỡ)
- **Output artifact:** 7 file mới (`src/lib/yjs.ts`, `yProvider.ts`, `yPersistence.ts`; `src/providers/YjsProvider/{index,yjs-context,YjsProvider}.ts/tsx`); `.env.example` (modify)

### Session B.2 — Block meta layer

- **Scope:**
  - `src/types/block.ts` — bỏ 14 field layout/CAS khỏi `NibBlockAttrs` (giữ structural `id`/`blockType`/`starter`); thêm `BlockMetaRecord` type (xOffset, lineIndex, blockState, latexContent, exactLatex, approxLatex, isApprox, errorKind, textScale, mathSize, color, inkStrokes)
  - `src/editor/yBlockMeta.ts` — `BlockMetaRecord`, `getBlockMeta/patchBlockMeta/deleteBlockMeta/initBlockMeta(ydoc,id,...)`; ghi trong `ydoc.transact()`; `initBlockMeta` idempotent
  - `src/hooks/useBlockMeta.ts` — `useBlockMeta(ydoc,id): BlockMetaRecord`; subscribe Y.Map observer; `DEFAULT_META` = defaults cũ; render DEFAULT_META ngay khi entry chưa có (R3: race tolerance)
  - `src/hooks/useYjsStatus.ts` — convenience re-export `syncStatus` từ `useContext(YjsContext)`
  - NEW `src/editor/yBlockMeta.test.ts` — dùng real `Y.Doc` (không mock); test: `patchBlockMeta→getBlockMeta` đúng; concurrent patch merge không mất data; `initBlockMeta` idempotent (gọi 2 lần không reset)
  - **Ref ARCHITECTURE.md:** §A (yBlockMeta.ts/useBlockMeta.ts/useYjsStatus.ts), §B (Map "blockMeta" schema), §E R3 (race race DEFAULT_META)
- **STOP gate:**
  - `tsc --noEmit` 0 error
  - `vitest run` pass (bao gồm yBlockMeta.test.ts — ≥3 test case: patch/get, concurrent, idempotent)
  - `npm run build` exit 0

### Session B.3 — NibBlock schema strip + NibBlockView migration

> **HEAVY** — cần đọc `NibBlock.ts` + `NibBlockView.tsx` (file lớn) trước khi sửa. 1 session riêng.

- **Scope:**
  - `src/editor/extensions/NibBlock.ts` — `addAttributes()` chỉ còn `{ id, blockType, starter }`; xóa 14 attr layout/CAS
  - `src/editor/NibBlockView.tsx` — thay `node.attrs.*` → `useBlockMeta(ydoc,id)`; writes layout/state/result → `patchBlockMeta`; `updateAttributes()` chỉ cho `blockType` (Convert); `ydoc` nhận qua prop hoặc context
  - `src/editor/blockActions.ts` — `patchBlock(ydoc,id,attrs)`, `deleteBlock(editor,ydoc,id)`, `evalBlock(editor,ydoc,id)`; `findBlock` giữ nguyên (PM scan)
  - Update `nibBlock.test.ts` — bỏ refs 14 attr layout/CAS trong helper/fixture
  - Update `blockActions.test.ts` — mock `ydoc` trong test context
  - **Ref ARCHITECTURE.md:** §A (MODIFY NibBlock.ts/NibBlockView.tsx/blockActions.ts), §C (data flow: local edit → patchBlockMeta → transact), §E R1 (updateAttributes chỉ blockType)
- **STOP gate:**
  - `tsc --noEmit` 0 error
  - `vitest run` pass (nibBlock.test.ts + blockActions.test.ts pass)
  - **R1 verify (grep):** `grep -n "updateAttributes" src/editor/NibBlockView.tsx` — chỉ thấy `blockType`; không thấy `xOffset/lineIndex/latexContent` etc.
  - **R1 verify:** `grep -n "xOffset\|lineIndex\|latexContent" src/editor/extensions/NibBlock.ts` — 0 hits trong `addAttributes`

### Session B.4 — YjsSync extension + NibHistory delete + TopStrip undo wire

- **Scope:**
  - `src/editor/extensions/YjsSync.ts` — TipTap ext: `addProseMirrorPlugins()` → `[ySyncPlugin(xmlFragment), yUndoPlugin()]`; expose `yUndoManager` qua `this.storage.undoManager`; nhận `xmlFragment` qua ext options
  - DELETE `src/editor/extensions/NibHistory.ts` — xóa file; bỏ mọi import trong codebase
  - `src/editor/editor-context.ts` — thêm `ydoc: Y.Doc` vào context type
  - `src/components/TopStrip.tsx` — undo: `editor.storage.YjsSync.undoManager.undo()`; redo: `.redo()` (R2 — cùng session khi delete NibHistory)
  - **Ref ARCHITECTURE.md:** §A (YjsSync.ts/NibHistory.ts DELETE/editor-context.ts/TopStrip.tsx), §E R2 (NibHistory → yUndoPlugin cùng session)
- **STOP gate:**
  - `tsc --noEmit` 0 error
  - `vitest run` pass
  - `grep -r "NibHistory" src/` — 0 hits (xóa sạch)
  - `grep -n "undoManager.undo\|undoManager.redo" src/components/TopStrip.tsx` — ≥2 hits (undo + redo wired)

### Session B.5 — Workspace wiring + gate vàng

> **HEAVY** — Workspace.tsx là file lớn phức tạp (sở hữu EditorContext.Provider + nhiều handler). 1 session riêng.

- **Scope:**
  - `src/components/Workspace.tsx` — bọc `<YjsProvider docId userId token>`; thêm `YjsSync.configure({ xmlFragment })` vào editor extensions; truyền `ydoc` xuống qua `EditorContext.Provider` (`editor-context.ts` đã có slot); `docId` = doc đang mở (từ ProfileProvider/LibraryOverlay state)
  - **Ref ARCHITECTURE.md:** §A (MODIFY Workspace.tsx), §C (data flow: provider lifecycle, provider props), §E R5 (Phase C boundary comment trong yProvider.ts đã ghi ở B.1)
- **STOP gate (agent tự verify):**
  - `tsc --noEmit` 0 error
  - `npm run build` exit 0
  - `vitest run` pass (≥82 test, không giảm)
- **Gate vàng (human smoke — Chrome ext không available ở background agent):**
  - Start Hocuspocus local: `npx @hocuspocus/server` hoặc `node -e "const {Server}=require('@hocuspocus/server'); new Server({port:1234}).listen()"`
  - `npm run dev` (:1420), mở 2 browser tab
  - Edit block tab 1: kéo xOffset, gõ latexContent, nhấn Tính → exactLatex gán
  - Tab 2 thấy đúng trong <1s, KHÔNG reset về default (xOffset≠0, latexContent/exactLatex đúng)
  - Offline tab 1 (disable network): edit thêm → back online → merge không mất (IndexedDB buffer)
  - Click-through checklist nộp cho lead thay browser evidence
- **Output artifact:** `Workspace.tsx` (modify); PLAN B hoàn thành khi gate vàng human-verified

**Phase B gate** (sau B.5): gate vàng human-verified + `npm run build` 0 + `tsc 0` + `vitest ≥82 pass`

---

## Outcome cuối

- Yjs CRDT tích hợp vào editor: mọi block attr (xOffset, lineIndex, kết quả CAS) lưu Y.Map "blockMeta", không dùng ProseMirror node attr → tránh bug y-prosemirror (CC-1 đã giải).
- Offline-first: IndexedDB persist Y.Doc; khi online → Hocuspocus WS sync.
- Undo/redo qua yUndoManager (NibHistory đã xóa).
- Gate vàng: 2 tab edit đồng bộ <1s không reset về default.
- Sẵn sàng Phase C (comment Phase C boundary đã ghi; onAuthenticate JWT = việc Phase C; multi-device thật = Phase C/D).

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-21 | Initial | Từ ARCHITECTURE.md gate PASS (Task #10) |
