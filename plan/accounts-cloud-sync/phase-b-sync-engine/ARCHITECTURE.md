# Phase B (Sync Engine) — ARCHITECTURE (architect HOW, gate PASS 2026-06-21)

> Bản thiết kế HOW do `architect` soạn (Task #9), lead gate PASS. Nguồn cho planner chia session + implementer build. KHÔNG re-litigate CC-1/stack.

## CC-1 — ĐÃ GIẢI: (a) Y.Map side-channel
Các field layout/CAS của block (xOffset, lineIndex, blockState, latexContent, exactLatex, approxLatex, isApprox, errorKind, textScale, mathSize, color, inkStrokes) **KHÔNG để là ProseMirror node attributes** (y-prosemirror bug không sync attrs đúng). Thay vào: lưu trong `Y.Map "blockMeta"` keyed theo block-id. PM node `nibBlock` chỉ giữ 3 attr structural: `id`, `blockType`, `starter`. Y.Map CRDT đảm bảo merge đúng; layout không reset x=0 khi mở máy khác.

## A. Module breakdown
NEW:
- `src/lib/yjs.ts` — `createYDoc(docId)` singleton (Map cache); shared types `getXmlFragment('prosemirror')` + `getMap('blockMeta')`; constants `PROSEMIRROR_FRAGMENT='prosemirror'`, `BLOCK_META_MAP='blockMeta'`.
- `src/lib/yProvider.ts` — `createHocuspocusProvider(ydoc, docId, userId, token)`; room `${userId}:${docId}`; URL `import.meta.env.VITE_HOCUSPOCUS_URL`; reconnect delay 1000/factor 2/maxDelay 30000; caller `.destroy()`.
- `src/lib/yPersistence.ts` — `createIndexeddbPersistence(ydoc, docId)` store `nib-ydoc-${docId}`; `waitForSync(persistence): Promise<void>`.
- `src/providers/YjsProvider/{index.ts, yjs-context.ts, YjsProvider.tsx}` — context `{ ydoc, syncStatus: 'local'|'syncing'|'synced'|'error' }`; provider props `{ docId, userId, token, children }`; lifecycle createYDoc→indexeddb→waitForSync→render children→(nếu token) hocuspocus. **Render children ngay** (không block editor trên WS). token null → syncStatus='local' offline-only. Cleanup destroy provider+persistence.
- `src/editor/yBlockMeta.ts` — bridge Y.Map↔block: `BlockMetaRecord` type; `getBlockMeta/patchBlockMeta/deleteBlockMeta/initBlockMeta(ydoc,id,...)`; ghi trong `ydoc.transact()`; initBlockMeta idempotent.
- `src/hooks/useBlockMeta.ts` — `useBlockMeta(ydoc,id): BlockMetaRecord` subscribe Y.Map observer; DEFAULT_META = defaults cũ; render defaults ngay khi entry chưa có (R3).
- `src/hooks/useYjsStatus.ts` — convenience re-export syncStatus.
- `src/editor/extensions/YjsSync.ts` — TipTap ext: `addProseMirrorPlugins()` → `[ySyncPlugin(xmlFragment), yUndoPlugin()]`; KHÔNG yCursorPlugin (Phase D); expose `yUndoManager` qua `this.storage.undoManager`.

MODIFY:
- `src/editor/extensions/NibBlock.ts` — addAttributes() chỉ còn `{ id, blockType, starter }`; XÓA 14 attr layout/CAS.
- `src/editor/NibBlockView.tsx` — dùng `useBlockMeta(ydoc,id)` thay `node.attrs.*`; write layout/state/result → `patchBlockMeta`; `updateAttributes()` CHỈ cho `blockType` (Convert).
- `src/editor/blockActions.ts` — `patchBlock(ydoc,id,attrs)`, `deleteBlock(editor,ydoc,id)`, `evalBlock(editor,ydoc,id)`; findBlock giữ (PM scan tìm pos).
- `src/editor/extensions/NibHistory.ts` — **DELETE**, thay yUndoPlugin; TopStrip undo/redo gọi `editor.storage.YjsSync.undoManager.undo()/redo()` (R2 — cùng session).
- `src/components/Workspace.tsx` — bọc `<YjsProvider docId userId token>`; thêm `YjsSync.configure({ xmlFragment })`; truyền ydoc xuống patchBlock/evalBlock.
- `src/editor/editor-context.ts` — thêm `ydoc: Y.Doc`.
- `src/components/TopStrip.tsx` — undo/redo qua yUndoManager.
- `src/types/block.ts` — bỏ field layout/CAS khỏi NibBlockAttrs (giữ structural) + BlockMetaRecord.
- `.env.example` — thêm `VITE_HOCUSPOCUS_URL=ws://localhost:1234`.

## B. Data model (Y.Doc per docId)
- `XmlFragment "prosemirror"` — managed by y-prosemirror/TipTap; document skeleton + nibBlock nodes (attrs `id`/`blockType`/`starter`) + text content/marks.
- `Map "blockMeta"` — key=blockId; value Y.Map { xOffset:number, lineIndex:number, blockState:string, latexContent:string, exactLatex:string, approxLatex:string, isApprox:boolean, errorKind:string, textScale:string, mathSize:string, color:string, inkStrokes:string(JSON) }.
- WS: room `${userId}:${docId}`, token=Supabase access_token (tokenStore Phase A). Auth verify = Phase C (onAuthenticate).

## C. Data flow (tóm tắt)
Local edit MathLive → `patchBlockMeta(ydoc,id,{latexContent})` → Y.Map set trong transact → y-indexeddb persist + Hocuspocus WS send. Eval → patchBlockMeta(evaluating) → CAS sidecar (Phase 0 không đổi) → patchBlockMeta(exactLatex, result-exact) (kết quả travels cùng block). Render reactive: useBlockMeta observe → setState → re-render (KHÔNG setNodeMarkup). Create: insertNibBlock (PM, y-prosemirror sync skeleton) + initBlockMeta. Delete: deleteNode (PM) + deleteBlockMeta. Remote: WS→provider apply→ XmlFragment change→ySyncPlugin→PM tx mount/unmount; blockMeta change→Y.Map observer→re-render. Offline→online: updates buffer IndexeddbPersistence→reconnect backoff→merge CRDT (xOffset/lineIndex/latex/result = LWW per key).

## D. Deps (package.json)
`yjs@^13`, `@hocuspocus/provider@^2`, `y-prosemirror@^1`, `y-indexeddb@^2`; DEV `@hocuspocus/server@^2` (dev local, Phase C dùng Render).
Không đụng `src-tauri/`, `backend/`, SymPy sidecar.
Test: update `nibBlock.test.ts` (helper bỏ attrs layout/CAS), `blockActions.test.ts` (mock ydoc), NEW `yBlockMeta.test.ts` (real Y.Doc, no mock).

## E. Rủi ro + mitigation
- **R1** attrs tái xuất hiện trong XmlFragment: sau sửa NibBlock.addAttributes, grep `updateAttributes` trong NibBlockView — chỉ hợp lệ `updateAttributes({blockType})`. Test: patchBlockMeta xOffset=100 → getBlockMeta=100 và node.attrs.xOffset undefined.
- **R2** xóa NibHistory làm undo/redo TopStrip vỡ: wire yUndoManager qua extension storage CÙNG session khi delete NibHistory.
- **R3** initBlockMeta race (remote block tới trước init): useBlockMeta render DEFAULT_META khi entry chưa có, observer re-render khi data tới; NibBlockView tolerate defaults.
- **R4** inkStrokes JSON LWW: concurrent stylus mất strokes — chấp nhận (Phase B single-user multi-device); TODO comment đổi Y.Array nếu future multi-user.
- **R5** (Phase C boundary) room `${userId}:${docId}` PHẢI validate trong Hocuspocus onAuthenticate (so userId với JWT claim) — document trong yProvider.ts comment để Phase C không đoán.

## Phase C dependency
Phase B chạy được với `@hocuspocus/server` local (`VITE_HOCUSPOCUS_URL=ws://localhost:1234`) + y-indexeddb offline. Multi-device sync thật cần Phase C (Render + Supabase `yjs_updates` persistence + onAuthenticate JWT).

## Gate vàng Phase B
2 browser tab cùng `npm run dev` (+ hocuspocus server local): edit block tab 1 (xOffset, latexContent, exactLatex) → tab 2 thấy đúng <1s, KHÔNG reset về default.
