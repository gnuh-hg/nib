# PLAN — Phase A: Schema spacer-atom + click→virtual-caret + type→materialize

> Sau khi Phase A PASS: người dùng click bất kỳ nơi nào trên dòng, gõ phím, text xuất hiện tại đúng x — spacer atoms materialize-on-input, merge tự nhiên khi width→0. Vòng lõi gõ sống, không rác, không phantom char, không crash PM selection. Đây là nền tảng cho mọi phase tiếp theo.

---

## Context

- **Bối cảnh**: editor đường gõ đã WIPE 2026-06-25 (row-based row/nibBlock/caretNav/ghostCaret bị xoá sau bug saga). Schema hiện tại tối thiểu `doc→paragraph(inline*)→text` trong `NibDocument.ts`. App shell + Yjs (y-prosemirror) + YjsSync còn nguyên.
- **Model đã chốt (LOCKED)**: Path B "spacer-atom" — `paragraph: (spacer_atom | text)*`; spacer_atom inline LEAF attr `{id}`, width float lưu Y.Map "nib-spacer-widths" side-channel; materialize-on-input; merge tự nhiên (width→0 → PM xoá atom); metrics đo runtime (`canvas.measureText`, `coordsAtPos`).
- **Lý do chia 3 session**: mỗi deliverable đọc file nguồn lớn + output ≥100 dòng → session granularity (1 heavy unit = 1 session).
- **Out of scope Phase A**: arrow navigation 2D (Phase B); IME robustness đầy đủ (Phase C — chỉ guard R3 ban đầu ở A.3); MathLive inline atom (Phase D); CAS pipeline (Phase E); copy/paste (Phase C); undo/redo track spacerWidthMap (Phase C).
- **Workstream**: `plan/free-caret-v2/ROADMAP.md` Phase A.

---

## Pipeline 1 phase / 3 session

```
[Session A.1] SpacerAtom extension + schema + spacerWidthMap + CSS
                                    │
                                    ▼
[Session A.2] Click → virtual caret (measurement + visual cursor)
                                    │
                                    ▼
[Session A.3] Type → materialize (gap calc + spacer insert + char + IME guard)
                                    │
                                    ▼
              Gate vàng Phase A: "click→gõ→text đúng x"
```

---

## Phase A — Schema + Virtual Caret + Materialize

**Mục tiêu**: Dựng nền schema mới (spacer-atom đúng Path B) + luồng click→caret→gõ→materialize đầy đủ trên schema đó, sao cho vòng lõi "gõ text ở bất kỳ x" hoạt động ngay cuối Phase A.

### Session A.1 — SpacerAtom extension + schema + spacerWidthMap + CSS

- **Scope**:
  - Tạo mới `src/editor/extensions/SpacerAtom.ts`: TipTap extension `spacer_atom`, inline LEAF, attr `{id: string}`, group `inline`, atom `true`. NodeView: render `<span class="nib-spacer" data-id="...">` với `style.width` từ Y.Map; observe Y.Map change → `setStyle` (R2 guard: chỉ update khi `newWidth !== oldWidth`, dùng `requestAnimationFrame`).
  - Cập nhật `src/editor/extensions/NibDocument.ts`: `NibParagraph.content` đổi từ `'inline*'` → `'(spacer_atom | text)*'`.
  - Cập nhật `src/editor/extensions/YjsSync.ts` hoặc nơi khởi tạo YjsProvider: thêm `spacerWidthMap = ydoc.getMap<number>('nib-spacer-widths')` (CC-2); export ref để Session A.2/A.3 dùng.
  - Thêm CSS rule `.nib-pm p { white-space: pre-wrap; }` vào stylesheet tương ứng (CC-1).
  - Tạo unit test `src/editor/spacerAtom.test.ts`: (a) SpacerAtom extension đăng ký đúng tên `spacer_atom`; (b) NodeView tạo `<span>` có `data-id` đúng; (c) Y.Map update → NodeView setWidth (mock).
- **KHÔNG làm**: click handler, virtual caret, materialize, MathLive, CAS.
- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + `npx vitest run` pass (kể cả test spacerAtom.test.ts). Schema thay đổi không vỡ build hiện có.
- **Output artifact**: `src/editor/extensions/SpacerAtom.ts` (mới), cập nhật `NibDocument.ts` + `YjsSync.ts` + CSS, `src/editor/spacerAtom.test.ts`.

### Session A.2 — Click → virtual caret (measurement + visual cursor)

- **Scope**:
  - Tạo mới `src/editor/virtualCaret.ts` (hoặc `src/editor/spacerCaret.ts`): module quản lý virtual caret state `{active: bool, lineDocPos: number, virtualX: number, spaceWidth: number}`.
    - `measureSpaceWidth(editorView)`: dùng `canvas.measureText(' ')` với font CSS của editor.
    - `computeVirtualPos(editorView, clickEvent)`: `posAtCoords({left, top})` → lấy PM pos gần nhất → `coordsAtPos(nearestPos)` → nếu `clickX > coords.right + threshold` → virtual mode; đo SAU DOM paint (CC-6, R4: wrap trong `requestAnimationFrame`, KHÔNG tính ngay trong event handler sync).
  - Cập nhật Workspace (hoặc editor `editorProps.handleClick`): khi click trên editor, gọi `computeVirtualPos`; lưu state vào React ref; trigger re-render Decoration.
  - Visual cursor: TipTap `addProseMirrorPlugins` thêm plugin Decoration.widget tại `lineDocPos` khi virtual caret active — hiển thị `<span class="nib-vcaret">` absolute tại `virtualX` (CSS: blink animation, pointer-events: none).
  - Khi user click vào PM doc thường (không gap) → clear virtual caret state.
  - Unit test: `computeVirtualPos` trả `{active: true, virtualX}` khi click ngoài text cuối dòng (mock `posAtCoords`/`coordsAtPos`).
- **KHÔNG làm**: materialize (A.3), spacer atom insert, key handler. Virtual caret là EPHEMERAL (ref/state), KHÔNG lưu vào Yjs.
- **STOP gate**: `npm run build` exit 0 + `tsc --noEmit` 0 error + vitest pass + visual (user smoke hoặc Playwright screenshot): click dòng trống ở x = 200px → cursor blink xuất hiện tại ~200px; click PM text thường → cursor biến mất.
- **Output artifact**: `src/editor/virtualCaret.ts` (mới), cập nhật Workspace + TipTap plugin Decoration.

### Session A.3 — Type → materialize (gap calc + spacer insert + char + IME guard R3)

- **Scope**:
  - Thêm `materialize(editorView, widthMap, virtualCaretState, char)` vào `virtualCaret.ts` (hoặc file riêng `materializeInput.ts`):
    1. Tính `gap = virtualX - coordsAtPos(lineDocPos).right` (float px). Nếu `gap < threshold` → materialize ngay tại `lineDocPos` (không cần spacer).
    2. Nếu `gap ≥ threshold`: tạo spacer_atom mới (uuid id), set `widthMap.set(id, gap)`, insert vào PM doc tại `lineDocPos+1` qua `tr.insert`.
    3. Insert character sau spacer (hoặc ngay tại lineDocPos nếu gap nhỏ).
    4. Clear virtual caret state.
  - Hook `handleKeyDown` trong editorProps: khi virtual caret active + key = printable → gọi `materialize(view, widthMap, state, key)` → `return true` (chặn PM default handler).
  - IME guard R3: thêm `compositionstart` event listener → nếu virtual caret active → `materialize(view, widthMap, state, '')` (materialize gap mà không insert char) → sau đó IME chạy tự nhiên trong PM selection thật.
  - Unit test: `materialize` khi gap=50px → spacer atom width=50 được set trong mock widthMap + char inserted đúng PM pos.
- **KHÔNG làm**: arrow nav (B), full IME robustness (C), copy/paste (C), undo track (C).
- **STOP gate (gate vàng Phase A)**: "click bất kỳ trên dòng → gõ `hi` → text `hi` xuất hiện tại đúng x, spacer atom với đúng width tồn tại trong PM doc" — `npm run build` exit 0 + `tsc --noEmit` 0 error + `npx vitest run` pass + **console 0 JS error** khi thực thi flow (kiểm bằng Playwright `free-caret-v2-phase-a.spec.ts` hoặc user smoke).
- **Output artifact**: cập nhật `src/editor/virtualCaret.ts` (thêm materialize), cập nhật editorProps/Workspace, `src/editor/materializeInput.test.ts`.

**Phase A gate** (sau Session A.3): gate vàng "click→gõ→text đúng x" PASS → Phase B có thể bắt đầu.

---

## Outcome cuối Phase A

- Người dùng click bất kỳ trên dòng (kể cả vùng trống) → visual cursor blink đúng x.
- Gõ phím → text insert tại đúng x, spacer atom materialize đúng width.
- PM doc hợp lệ (schema `paragraph: (spacer_atom | text)*`), Yjs sync bình thường, undo PM-level hoạt động (Yjs undo sẽ cải thiện ở Phase C).
- Build pass, 0 TS error, vitest pass.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-25 | Initial | Phase A của roadmap free-caret-v2 (restart sau WIPE) |
