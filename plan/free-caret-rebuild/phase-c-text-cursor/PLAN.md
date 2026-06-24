# PLAN — Phase C: Text Engine + Cursor

> Sau khi Phase C done, **editor có RowView thật** (row render đúng vị trí trên giấy kẻ), **text insert tại caret**, **click-to-position + ghost caret virtual-space**, **arrow nav 2D (up/down goalX)**. MathInline vẫn là placeholder opaque unit — Phase D mới nhúng MathLive.

---

## Context

- **Vì sao chia nhiều session**: Phase C là phase UX đầu tiên chạm editor interaction (render + input + navigation) — mỗi nhóm behavior cần đọc source + viết component/plugin riêng, đủ nặng để tách session.
- **HOW đã chốt**: `plan/free-caret-rebuild/phase-a-architect/ARCHITECTURE.md` §5 (Insert + Click-to-Position) + §6 (Arrow-Nav 2D Plugin Interface). Implementer đọc đó trước khi code; PLAN này chỉ định WHAT + gate.
- **Hiện trạng đầu vào** (sau Phase B):
  - PM schema: `row{id}` + `mathInline{id}` atom (placeholder `[Math]` span); `text` + marks.
  - Bridges: `yBlockMeta.ts` + `yRowMeta.ts` + `useBlockMeta` + `useRowMeta` + appendTransaction plugin + migration module.
  - RowView ở B.1 = placeholder `<div class="nib-row">` không có geometry.
  - Editor UI tạm trống/broken — đây là bình thường, Phase C bắt đầu fix.
- **Out of scope Phase C**:
  - §4 dual-caret MathLive handoff (Phase D).
  - §7 vòng lõi CAS / Tính (Phase E).
  - Yjs 2-tab sync live test (Phase F).
  - MathLive inline thật (Phase D): `mathInline` VẪN giữ placeholder `[Math]`; left/right qua atom là opaque unit (PM `atom:true` handle tự nhiên — không cần custom keymap).

---

## Pipeline 1 phase / 3 session

```
[Phase C — Text Engine + Cursor]
  │
  ├── C.1 RowView thật + Text Insert ──────────────────────► rows render đúng vị trí; gõ = chèn
  │
  ├── C.2 Click-to-Position + Ghost Caret virtual-space ───► click content→caret; click dòng trống→ghost; gõ→materialize
  │
  └── C.3 Arrow Nav 2D (up/down goalX + Tab) ──────────────► up/down giữ goalX; ghost-park dòng trống; Tab→next atom
                                                                         │
                                                                         ▼
                                                               Phase C gate → unlock Phase D
```

---

## Phase C — Text Engine + Cursor

**Mục tiêu**: editor cơ bản hoạt động được: thấy nội dung đúng chỗ, gõ chèn, click đặt caret, di chuyển 2D. MathInline opaque unit, vòng lõi còn gián đoạn.

---

### Session C.1 — RowView thật + Text Insert

- **Scope**:
  - Đọc trước: `src/editor/geometry.ts` (RULE_HEIGHT=64, MARGIN_L=56 — constants bắt buộc dùng đúng) + `src/editor/extensions/Row.ts` (RowView placeholder B.1) + ARCHITECTURE.md §2 (blankBefore/indent semantics).
  - **`src/editor/RowView.tsx`** (thay placeholder trong `Row.ts`): component NodeView dùng `useRowMeta(ydoc, rowId)` → lấy `{blankBefore, indent}` → render `<div class="nib-row">` với:
    - Khoảng cách dọc: `margin-top: blankBefore * RULE_HEIGHT` (px) — số dòng kẻ trống phía trên row này.
    - Leading offset ngang: `padding-left: indent` (px) — cột bắt đầu nội dung.
    - `contentDOM` = phần tử con để PM render text + mathInline atoms vào.
  - CSS `.nib-row`: display block, min-height RULE_HEIGHT (1 dòng kẻ), inherit font/line-height từ paper. Token-driven (0 hex rời).
  - Wire `RowView` vào `Row.ts` NodeView factory; bỏ hoàn toàn placeholder div cũ.
  - **Text insert verification**: PM mặc định đã xử lý gõ = insert tại selection (không overwrite) → vitest test xác nhận: tạo doc `row > text("abc")`, dispatch insertText("X") tại pos 2 → doc chứa `"aXbc"` đúng.
  - Vitest unit: RowView render với blankBefore=2 → margin-top = 128px (2×64); RowView indent=56 → padding-left 56px; text insert test pass.
- **STOP gate**:
  - `npm run build` exit 0.
  - `tsc --noEmit` 0 error.
  - `npx vitest run` pass.
  - RowView sử dụng đúng RULE_HEIGHT + MARGIN_L constants (grep confirm — không hardcode số).
  - Test: blankBefore=2 → margin-top = 2×RULE_HEIGHT; indent=56 → padding-left=56.
  - Test: text insert = chèn đúng vị trí, không đè.
  - 0 hex rời trong RowView.tsx + CSS.
- **Output artifact**: `src/editor/RowView.tsx` (new), sửa `src/editor/extensions/Row.ts` (wire RowView), `src/editor/row-view.css` (hoặc CSS module).

---

### Session C.2 — Click-to-Position + Ghost Caret virtual-space

- **Scope**:
  - Đọc trước: ARCHITECTURE.md §5 (click-to-position + ghost-park spec) + §2 (whitespace materialize) + `src/components/Workspace.tsx` (nơi wire editor click handler) + `src/editor/geometry.ts`.
  - **Click handler** (PM `handleClickOn` hoặc mousedown trên paper wrapper):
    - `view.posAtCoords({left: event.clientX, top: event.clientY})` → nếu trả `pos` hợp lệ và pos nằm trong content → `dispatch(tr.setSelection(TextSelection.create(doc, pos)))`.
    - Click vào **dòng kẻ trống** (posAtCoords null hoặc không có row tại tọa độ): tính `targetLine` (= `Math.floor((clientY - paperTop) / RULE_HEIGHT)`) + `targetCol` (= `clientX - paperLeft`); set transient **ghost-park state** `{ targetLine, targetCol }`; PM selection ghim vị trí gần nhất (cuối row trên / pos 0 nếu doc rỗng).
    - Click **quá cuối text** của row có sẵn (posAtCoords trả pos cuối row): PM selection = cuối row; ghost-park `{ targetLine: rowLine, targetCol: clickX }`.
  - **Ghost caret Decoration.widget** (`src/editor/plugins/ghostCaret.ts`): PM plugin theo dõi ghost-park state + PM selection. Khi `ghostPark != null` và selection collapsed và `mathFocusActive === null` → render `<span class="nib-ghost-caret">` tại tọa độ ghost-park (absolute position trên paper). Khi user gõ ký tự đầu → materialize (xem dưới) → ghost-park clear.
  - **Materialize whitespace** (trong keydown / `handleKeyDown` hoặc `appendTransaction`):
    - Ghost-park set + user gõ char: nếu dòng trống chưa có row → **tạo row mới** với `initRowMeta(ydoc, newRowId, { blankBefore: targetLine - prevRowLine, indent: targetCol })` + insert row node vào PM doc tại vị trí đúng + insert char.
    - Ghost-park set + row đã có + targetCol quá cuối text: **synth space** (insertText(" ", cuối row) để lấp đến targetCol) HOẶC set `indent` nếu row vốn rỗng; sau đó insert char.
    - Clear ghost-park sau materialize.
  - Ghost-park là **React state hoặc plugin state** (KHÔNG lưu vào Y.Doc / rowMeta — §2: "KHÔNG persist caret position").
  - Vitest: click pos hợp lệ → selection set đúng; click dòng trống → ghost-park non-null + PM selection ở vị trí gần nhất; gõ char khi ghost-park → row mới trong doc + char đầu đúng.
- **STOP gate**:
  - `npm run build` + `tsc --noEmit` 0 + vitest pass.
  - Test: click vào text → PM selection.anchor = đúng pos.
  - Test: click dòng trống (không có row) → ghost-park = `{targetLine, targetCol}` non-null; PM selection = pos gần nhất (không crash).
  - Test: ghost-park set → type "x" → doc chứa 1 row mới; rowMeta `blankBefore` + `indent` đúng (tính từ target); doc KHÔNG có literal space thừa trong XmlFragment cho dòng trống.
  - 0 hex rời; ghost caret dùng `--caret` token (CSS var).
- **Output artifact**: `src/editor/plugins/ghostCaret.ts` (new), click/materialize logic (trong Workspace.tsx hoặc plugin riêng), sửa `Workspace.tsx` (wire handler).

---

### Session C.3 — Arrow Nav 2D (up/down goalX + Tab)

- **Scope**:
  - Đọc trước: ARCHITECTURE.md §6 (Arrow-Nav 2D Plugin Interface spec đầy đủ) + `src/editor/geometry.ts` (RULE_HEIGHT dùng cho targetY).
  - **Left/Right**: `mathInline` có `atom: true` → PM default đã coi như 1 unit (caret nhảy qua nguyên atom). **Verify bằng test** thay vì implement thêm: tạo doc `row[text("a") + mathInline + text("b")]`; dispatch ArrowRight từ pos cuối "a" → selection = pos sau atom (không vào trong); ArrowLeft từ pos đầu "b" → pos trước atom.
  - **NEW `src/editor/plugins/caretNav.ts`** — keymap plugin:
    - **ArrowUp**: lấy `coordsAtPos(selection.head)` → `{left: curX, top}`. `targetY = curRowTop − RULE_HEIGHT`. `posAtCoords({left: goalX ?? curX, top: targetY})` → `setTextSelection(pos)`. Lưu `goalX = curX` vào plugin state (giữ qua chuỗi up/down). Nếu `posAtCoords` null (dòng trống) → set ghost-park `{targetLine: curLine-1, targetCol: goalX}` + ghim PM pos gần nhất.
    - **ArrowDown**: đối xứng. `targetY = curRowBottom + RULE_HEIGHT`.
    - **Reset goalX**: khi user press ArrowLeft / ArrowRight / click → clear goalX.
    - **ArrowUp đầu doc**: giữ nguyên (no-op hoặc pos 0). **ArrowDown cuối doc**: ghost-park dòng kẻ kế nếu muốn extend, hoặc giữ nguyên — document decision trong CHECKPOINT.
    - **Tab** (trong row text, không trong mathInline): tìm mathInline kế trên cùng row (hoặc row sau) → `setNodeSelection(pos)` (select atom). Shift+Tab = atom trước. Trong mathInline: MathLive xử Tab nội bộ (Phase D) — Phase C để Tab hoạt động nếu có atom trong row.
  - Wire `caretNav` plugin vào editor (Workspace.tsx hoặc extensions list).
  - Vitest:
    - Left/Right qua atom = 1 unit (test verify test confirm PM behavior).
    - ArrowDown từ row 1 → selection đến row 2 đúng goalX.
    - Chuỗi ArrowDown×3 → goalX preserved (selection x-coord xấp xỉ nhau qua 3 row).
    - ArrowUp vào dòng trống → ghost-park non-null.
    - Tab từ text → NodeSelection = mathInline kế tiếp.
- **STOP gate**:
  - `npm run build` + `tsc --noEmit` 0 + `npx vitest run` pass.
  - Test left/right: ArrowRight từ sau text "a" trước atom → pos nhảy qua atom (1 bước, không 2).
  - Test up/down goalX: 3 row khác độ dài; ArrowDown từ col 40 row 1 → col gần 40 row 2/3 (goalX preserved).
  - Test ghost-park: ArrowUp vào dòng kẻ trống → ghost-park non-null + PM selection không crash.
  - Test Tab: có mathInline trong row → Tab → NodeSelection đến atom.
- **Output artifact**: `src/editor/plugins/caretNav.ts` (new), sửa Workspace.tsx / extensions (wire plugin).

**Phase C gate** (sau Session C.3 cuối):
- `npm run build` + `tsc --noEmit` 0 + `npx vitest run` pass toàn bộ.
- Hành vi quan sát (implementer tự verify `npm run dev`): gõ text → chèn đúng vị trí; rows render tại đúng blankBefore/indent trên giấy kẻ; click bất kỳ → cursor đặt hoặc ghost-park; up/down giữ goalX; atom = opaque unit cho left/right.
- Vòng lõi **VẪN gián đoạn** (mathInline placeholder, không MathLive, không Tính) — ghi rõ CHECKPOINT + lộ trình Phase D (MathLive inline + dual-caret) → Phase E (CAS).
- 0 hex rời; i18n parity nếu thêm chuỗi UI.
- Ghost caret dùng `--caret` token (không hardcode color).

---

## Outcome cuối Phase C

- Editor có hình hài hoạt động: rows đúng vị trí, text gõ được, caret di chuyển 2D, click đặt caret / tạo row.
- MathInline atom = opaque placeholder `[Math]` — caret đi qua, không vào trong.
- Gate đo được: vitest pass + hành vi 4 test coverage (insert / left-right-atom / up-down-goalX / click-create-row).

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-23 | Initial | Planner — team caret-input, Phase B ĐÓNG PASS |
