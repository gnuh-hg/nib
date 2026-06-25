# ARCHITECTURE — Phase A free-caret-v2 (spacer-atom + virtual-caret)

> Bản HOW do `architect` soạn (gate PASS 2026-06-25). Nguồn chân lý kỹ thuật cho implementer
> 3 session A.1/A.2/A.3. Kiến trúc Path B "spacer-atom" + model LOCKED — xem context.md
> entry 2026-06-25 + ROADMAP.md. TRỌNG TÂM DE-RISK: cơ chế virtual-caret KHÔNG park
> PM-selection ở pos vô lệ (chỗ row-based cũ sập — ghost-park IME bug).

---

## A. Component / module breakdown

**Extension layer (TipTap extensions)**

1. `SpacerAtom` — `src/editor/extensions/SpacerAtom.ts` [NEW]
   Node `spacer_atom`: `group:'inline'`, `atom:true`, `content:''` (LEAF), attr `{id:string}` (static, KHÔNG mutate).
   Options: `{spacerWidthMap: Y.Map<number>|null}` (null = safe no-op).
   NodeView: render `<span class="nib-spacer" data-id="...">` với `display:inline-block; width:{từ Y.Map}px`.
   Constructor: đọc `widthMap.get(id)` ngay → set initial width; `widthMap.observe(this._observer)`.
   `destroy()`: PHẢI `widthMap.unobserve(this._observer)`.
   Observer: `requestAnimationFrame(() => { if(newW!==currentW){ dom.style.width=newW+'px'; currentW=newW; } })` (R2 guard new≠old + rAF/CC-6).

2. `VirtualCaret` — `src/editor/extensions/VirtualCaret.ts` [NEW]
   TipTap Extension wrapper, `addProseMirrorPlugins()` → `[createVirtualCaretPlugin()]`. KHÔNG handle materialize/events — chỉ đưa plugin vào pipeline.

3. `NibDocument.ts` [MODIFY] — `NibParagraph.content`: `'inline*'` → `'(spacer_atom | text)*'`.

4. `yjs.ts` [MODIFY] — thêm `export const SPACER_WIDTHS_MAP = 'nib-spacer-widths'`.

**Plugin layer (ProseMirror, không React)**

5. `src/editor/virtualCaret.ts` [NEW]
   `PluginKey<VirtualCaretState>` + `Plugin`. State: `{active, lineDocPos, virtualXEditorRelative, virtualXClient}`.
   `apply(tr,prev)`: `return tr.getMeta(virtualCaretKey) ?? prev` (KHÔNG lose state qua ySyncPlugin tx — E1).
   `props.decorations(state)`: nếu active → `DecorationSet.create(doc,[Decoration.widget(lineDocPos, ()=>span, {side:1, key:'nib-vcaret'})])`; span `class="nib-vcaret" style="position:absolute; left:{virtualXEditorRelative}px"`.
   Exports: `virtualCaretKey`, `VirtualCaretState`, `createVirtualCaretPlugin()`, `setVirtualCaret(view,pos,xRel,xClient)`, `clearVirtualCaret(view)`, `getVirtualCaret(state)`.

**Logic layer (pure functions)**

6. `src/editor/materializeInput.ts` [NEW]
   `materialize(view, widthMap, vcState, char)` — tính gap, tạo spacer, dispatch 1 PM tr (mục C).
   `materializeGap(view, widthMap, vcState)` — gọi `materialize(...,'')` cho IME.
   `measureSpaceWidth(view)` — `canvas.measureText(' ')` font từ `getComputedStyle(view.dom).font`.
   `isPrintableKey(event)` — `event.key.length===1 && !ctrlKey && !metaKey && !altKey`.
   `export const MATERIALIZE_THRESHOLD = 4` (px).

**Integration layer**

7. `src/components/Workspace.tsx` [MODIFY] — `WorkspaceEditor`:
   `spacerWidthMap = useMemo(() => ydoc.getMap<number>(SPACER_WIDTHS_MAP), [ydoc])`;
   extensions thêm `SpacerAtom.configure({spacerWidthMap})`, `VirtualCaret`;
   `editorProps.handleClick / handleKeyDown / handleDOMEvents.compositionstart` (mục B).

**CSS layer**

8. `src/editor/spacer.css` [NEW]:
   - `.nib-pm p { white-space: pre-wrap; position: relative; }` (CC-1 + widget containment)
   - `.nib-spacer { display:inline-block; height:1em; vertical-align:text-bottom; pointer-events:none; }`
   - `.nib-vcaret { position:absolute; top:0; bottom:auto; height:calc(1em + 4px); width:2px; background:var(--accent); pointer-events:none; animation:nib-blink 1s step-end infinite; }`
   - `@keyframes nib-blink { 0%,100%{opacity:1} 50%{opacity:0} }`
   - `@media (prefers-reduced-motion){ .nib-vcaret{ animation:none; } }`

---

## B. API contract

```ts
interface VirtualCaretState {
  active: boolean;
  lineDocPos: number;               // valid PM pos (nearest inline pos on clicked line)
  virtualXEditorRelative: number;   // clientX - view.dom.getBoundingClientRect().left
  virtualXClient: number;           // raw event.clientX (dùng tính gap trong materialize)
}
```

**Plugin apply — CONTRACT QUAN TRỌNG (E1):**
```ts
apply(tr, prev) {
  const meta = tr.getMeta(virtualCaretKey);
  return meta !== undefined ? meta : prev;  // undefined = giữ nguyên (không reset)
}
```

**Decoration.widget:**
```ts
Decoration.widget(lineDocPos, () => {
  const span = document.createElement('span');
  span.className = 'nib-vcaret';
  span.style.left = `${virtualXEditorRelative}px`;
  return span;
}, { side: 1, key: 'nib-vcaret' })
```
Containment: `.nib-pm p { position:relative }` → span `absolute; left:N` định vị đúng trong dòng.

**editorProps.handleClick:**
```ts
handleClick(view, pos, event) {
  if (pos < 1) return false;                 // E2 guard: không dùng pos=0 (doc root)
  const coords = view.coordsAtPos(pos);
  if (event.clientX > coords.right + MATERIALIZE_THRESHOLD) {
    const viewLeft = view.dom.getBoundingClientRect().left;
    setVirtualCaret(view, pos, event.clientX - viewLeft, event.clientX);
    // PM đã set TextSelection(pos) (valid) — KHÔNG setSelection thủ công
  } else {
    if (getVirtualCaret(view.state).active) clearVirtualCaret(view);
  }
  return false; // allow PM default selection
}
```

**editorProps.handleKeyDown:**
```ts
handleKeyDown(view, event) {
  const vc = getVirtualCaret(view.state);
  if (!vc.active) return false;
  if (event.key === 'Escape') { clearVirtualCaret(view); return true; }
  if (isPrintableKey(event)) { materialize(view, spacerWidthMap, vc, event.key); return true; }
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Tab'].includes(event.key)) {
    clearVirtualCaret(view);  // Phase A: chỉ clear; Phase B xử lý arrow/Tab thật
  }
  return false;
}
```

**editorProps.handleDOMEvents.compositionstart (R3 IME):**
```ts
compositionstart(view, _event) {
  const vc = getVirtualCaret(view.state);
  if (vc.active) materializeGap(view, spacerWidthMap, vc);
  // sau materializeGap: vc cleared, PM selection tại pos hợp lệ → IME chạy tự nhiên
  return false;  // KHÔNG preventDefault
}
```

**materialize() contract:**
```ts
function materialize(view, widthMap, vcState, char) {  // char='' = gap-only (IME)
  const { lineDocPos, virtualXClient } = vcState;
  const coords = view.coordsAtPos(lineDocPos);
  const gap = Math.max(0, virtualXClient - coords.right);  // cả hai client-relative
  let tr = view.state.tr;
  let insertPos = lineDocPos;
  if (gap >= MATERIALIZE_THRESHOLD) {
    const id = crypto.randomUUID();        // fallback nếu absent: Date.now().toString(36)+Math.random()...
    widthMap.set(id, gap);                 // Y.Map update TRƯỚC PM dispatch (NodeView đọc initial đúng)
    const spacerNode = view.state.schema.nodes.spacer_atom.create({ id });
    tr = tr.insert(lineDocPos, spacerNode);
    insertPos = lineDocPos + 1;            // spacer_atom nodeSize=1
  }
  if (char !== '') { tr = tr.insertText(char, insertPos); insertPos += char.length; }
  tr = tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos)));
  tr = tr.setMeta(virtualCaretKey, { active:false, lineDocPos:0, virtualXEditorRelative:0, virtualXClient:0 });
  view.dispatch(tr);  // ySyncPlugin auto-convert → Y.XmlFragment update
}
```

**Y.Map "nib-spacer-widths":** side-channel hoàn toàn tách `xmlFragment` — ySyncPlugin KHÔNG serialize map này (CC-safe, né CC-1). Map sống trong `ydoc` → persist IDB + sync Hocuspocus cùng docId. NodeView constructor đọc `widthMap.get(id)` (đã có giá trị vì `set` gọi trước `dispatch`).

---

## C. Data flow (tóm tắt — chi tiết xem message architect 2026-06-25)

**Click gap:** PM tự `posAtCoords` → set `TextSelection(pos)` VALID → `handleClick` phát hiện `clientX > coords.right+4` → `setVirtualCaret` (meta tx) → plugin lưu state + `Decoration.widget` blink tại virtualX. **PM selection vẫn VALID tại pos**; virtual caret chỉ là decoration + plugin-state ephemeral (KHÔNG persist Yjs).

**Gõ printable:** `handleKeyDown` active+printable → `materialize` → ①gap=virtualXClient−coordsAtPos(lineDocPos).right ②id=uuid ③`widthMap.set(id,gap)` ④`tr.insert(spacer)` ⑤`tr.insertText(char)` ⑥`setSelection` sau char ⑦`setMeta` clear vc ⑧`dispatch`. NodeView mới đọc width đúng.

**IME:** `compositionstart` active → `materializeGap` (char='') → insert spacer, selection tại pos hợp lệ, clear vc → `return false` → browser IME insert vào PM selection thật. **KHÁC row-based cũ:** cũ park selection ở virtual/doc-level pos → IME insert sai/crash; mới selection luôn valid TextSelection → đúng chỗ.

**Observer:** `widthMap.observe` → rAF → `if newW!==currentW: dom.style.width` (R2/CC-6).

**State ownership:** virtual caret = PM PluginKey ephemeral (KHÔNG Yjs) · spacer_atom nodes = PM doc ← Y.XmlFragment (Yjs persist/sync) · spacer widths = Y.Map (Yjs persist/sync, keyed spacer id) · DOM widths = NodeView derived (không persist).

---

## D. File structure

| File | Action |
|---|---|
| `src/editor/extensions/NibDocument.ts` | MODIFY — `NibParagraph.content` → `'(spacer_atom | text)*'` (NibDocument/NibTextNode giữ) |
| `src/editor/extensions/SpacerAtom.ts` | NEW — extension + NodeView class inline (~80 dòng); `addNodeView()` closure truyền `opts.spacerWidthMap` |
| `src/editor/extensions/VirtualCaret.ts` | NEW — extension wrap `createVirtualCaretPlugin()` |
| `src/editor/extensions/YjsSync.ts` | KEEP (CC-3 UndoManager track spacerWidthMap = Phase C) |
| `src/editor/virtualCaret.ts` | NEW — PluginKey + plugin + set/clear/get helpers |
| `src/editor/materializeInput.ts` | NEW — materialize/materializeGap/measureSpaceWidth/isPrintableKey + THRESHOLD |
| `src/editor/spacer.css` | NEW — CC-1 + .nib-spacer + .nib-vcaret + blink + reduced-motion |
| `src/editor/spacerAtom.test.ts` | NEW — register name; NodeView span+data-id; Y.Map set→rAF→width; destroy→unobserve |
| `src/editor/virtualCaret.test.ts` | NEW — init inactive; setMeta active→getVirtualCaret; **tx-không-meta→state preserved (E1)**; decoration when active |
| `src/editor/materializeInput.test.ts` | NEW — gap=50+char→set(50)+insert+insertText; gap<4→chỉ insertText; char=''(IME)+gap→spacer no-text selection-after; isPrintableKey cases |
| `src/lib/yjs.ts` | MODIFY — `+ SPACER_WIDTHS_MAP` (additive) |
| `src/components/Canvas.tsx` | KEEP — `onPointerDown={()=>{}}` giữ (click qua editorProps) |
| `src/components/Workspace.tsx` | MODIFY — import 4 module + spacerWidthMap useMemo + extensions + editorProps + `import './editor/spacer.css'`; useEditor deps `[xmlFragment, spacerWidthMap]` |

**Import graph:** `yjs.ts`→Workspace; `SpacerAtom`→`yjs` (không import virtualCaret); `virtualCaret.ts`→`@tiptap/pm/state` (không import Y); `materializeInput.ts`→`virtualCaret`+`yjs`+`TextSelection`; Workspace = orchestrator import cả 4.

---

## E. Rủi ro kỹ thuật (implementer PHẢI handle + test)

- **E1 (cao nhất) — virtual caret bị clobber bởi remote Yjs tx:** ySyncPlugin dispatch tx khi remote update tới → nếu `apply` trả `{active:false}` khi tx không meta → caret tắt giữa chừng. **Fix:** `apply` chỉ reset khi tx CÓ `virtualCaretKey` meta (mục B). **Test bắt buộc:** dispatch tx không meta → state unchanged.
- **E2 — coordsAtPos empty paragraph:** `pos<1` (doc root) throw. Guard `if(pos<1) return false` trong handleClick. Click dòng trống x lớn → spacer rộng = đúng ý.
- **E3 — StrictMode double-observe:** unmount+remount → NodeView create+destroy+create; destroy() bỏ unobserve → observer cũ sống → 2 rAF/flicker. **Fix:** `this._observer` instance var; `destroy()` unobserve. **Test:** `destroy(); widthMap.set(id,200); expect width KHÔNG đổi`.
- **E4 — isPrintableKey & dead/Tab keys:** `'Dead'` len=4→false (đúng, sẽ vào compositionstart); `' '` len=1→true (đúng, gõ space); `'Tab'` len=3→false → handleKeyDown explicit clear (Phase A).
- **E5 — schema change vs stale IDB nibBlock:** IDB cũ có node `nibBlock`/`row` không còn trong schema → PM schema validation throw → crash. Wipe đã xảy ra 2026-06-25 nên test data đã clear; **document caveat** + minimal guard. (CẤM deleteDatabase — nếu cần dọn, hỏi user.)
- **E6 — .nib-vcaret absolute đẩy layout:** caret height vượt line-height → expand `p` → layout shift. **Fix:** `height:calc(1em+4px); top:0; bottom:auto` + `p{min-height:1.5em}`. Smoke: click dòng trống → blink không đẩy dòng dưới.

**GitNexus impact:** YjsSync LOW (0 caller ngoài Workspace) · Workspace LOW (d1 AppShell) · NibParagraph LOW (1 call-site Workspace; index stale post-wipe, grep xác nhận) · yjs.ts additive LOW.

**Implement-time checks:** `crypto.randomUUID()` có trong Tauri WebView (fallback `Date.now().toString(36)+Math.random().toString(36)`); font chưa load → `measureSpaceWidth`=0 → fallback ~7px (không block A).
