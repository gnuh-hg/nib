# CHECKPOINT — v2 Tool Dock (UnifiedDock)

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Nguồn sự thật UI**: `docs/Nib-Dock-v2-ref.html` — đọc lại nếu có nghi ngờ về behavior/structure. HTML THẮNG khi xung đột với doc cũ.
- **KHÔNG sửa** `EditorContext` trong plan này (không breaking type). Xem PLAN.md §State machine.
- **Cấm hex rời** trong dock.css — dùng `var(--swatch-*)`, `var(--shadow-*)`, `var(--accent)`, v.v.
- **i18n**: mọi chuỗi qua `t('dock.*')`. Danh sách đầy đủ: PLAN.md mục (d).
- **Phase 3 — drag**: dùng `createPortal` + `position: fixed` cho anchor. `EditorContext` vẫn hoạt động vì UnifiedDock vẫn là con React của Canvas (portal chỉ đổi DOM mount, không đổi React tree).
- **Phase 3 — expand direction**: constant `DOCK_EXPANDED_H = 460`. Tính `spaceBelow` tại thời điểm `doExpand()`, không tính trước.
- **Phase 3 — flyout flip**: dùng `btnRefs` + `expandedRef` đo DOM tại thời điểm `tog(k)`. Fallback `top: 0` nếu ref chưa mount.

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
| --- | --- | --- | --- |
| Sessions hoàn thành (Phase 1–2) | 3 | 3 | 100% ✅ |
| Sessions hoàn thành (Phase 3) | 2 | 2 | 100% ✅ |
| Files tạo mới (Phase 1–2) | 14 (UnifiedDock/*) | 14 (+dockState.ts/.test.ts) | 100% ✅ |
| i18n keys dock.* | 31 | 31 (en+vi) | 100% ✅ |
| Gate pass (Phase 1–2) | 3/3 | 3/3 | 100% ✅ |
| Gate pass (Phase 3) | 2/2 | 2/2 | 100% ✅ |
| Old files xóa (Phase 1–2) | 4 | 4 | 100% ✅ |

---

## Đang ở đâu

- **Phase**: 3 HOÀN THÀNH ✅ — toàn bộ plan dock-v2 (Phase 1+2+3) DONE.
- **Session kế tiếp**: (none) — plan dock-v2 xong. Follow-up ngoài plan: context-menu/chuột-phải cho 6 chức năng đã drop (Session 2.1).
- **Blocker**: không
- **Reference**: `PLAN.md` → toàn bộ Phase 1+2+3 PASS

---

## Per-session log

### Session 3.2 — Overflow-aware expand direction + flyout flip (2026-06-15) — ✅ DONE — Phase 3 100%

- **Expand direction**: state `expandDir`; `doExpand()` tính `expandDirection(posRef.y, innerHeight)` = `down` nếu spaceBelow≥460 else `up`. `data-expand-up` trên `.nib-dock__expanded` → CSS `top:auto; bottom:0` (mở lên từ đáy anchor). doExpand gọi từ tap ô collapsed + onKeyDown Enter/Space. posRef mirror pos → doExpand callback stable.
- **Flyout flip overflow-aware**: XÓA top hardcode (70/110/150/234/274/340) khỏi `.nib-dock__flyout--*` (chỉ giữ width); `.nib-dock__flyout{top:0}` fallback. `tog(k)` đo `btnRefs[k]`+`expandedRef` getBoundingClientRect → `flyoutTop(topRel, expTop, btnH, FLYOUT_HEIGHTS[k], innerHeight)`: fit dưới → top:topRel; else lật lên top:topRel+btnH-flyoutH (clamp ≥0). setFlyoutStyle → truyền `style` prop xuống 6 flyout → FlyoutPanel spread override top.
- **Pure helpers (+3 test, vitest 50/50)**: `DOCK_EXPANDED_H=460`, `FLYOUT_HEIGHTS`, `expandDirection(posY,vh)`, `flyoutTop(topRel,expTop,btnH,flyoutH,vh)`.
- **File**: UnifiedDock.tsx (expandDir+flyoutStyle+btnRefs+expandedRef+posRef), DockBtn.tsx (btnRef callback), FlyoutPanel.tsx (style prop), 6 flyout (forward style), dock.css ([data-expand-up] + xóa top hardcode + top:0 fallback).
- **prefers-reduced-motion**: giữ (expanded transition đã trong block tắt; data-expand-up chỉ đổi anchor top/bottom, không thêm transition).
- **Gate**: `tsc` 0 · `build` 0 · `vitest` 50/50 (+3) · grep hex/rgba dock rỗng · grep top hardcode flyout--* rỗng · dev HTTP 200.
- **Verify (minh bạch)**: browser click-through không chạy được (chrome MCP off). Bù: expandDirection/flyoutTop unit-test (5 case phủ down/up + fit/flip/clamp); đo DOM qua getBoundingClientRect tại tog/doExpand. Đề nghị lead smoke 5 điểm: dock đáy→expand mở lên; dock đỉnh→mở xuống; flyout nút thấp→lật lên; flyout nút cao→xuống; animation mượt + console 0.

### Session 3.1 — Drag-to-reposition (2026-06-15) — ✅ DONE

- **Portal + fixed**: UnifiedDock render qua `createPortal(…, document.body)`; `.nib-dock` → `.nib-dock-anchor` `position:fixed; z-index:30; width/height:56px`, `style={{left:pos.x, top:pos.y}}`. UnifiedDock VẪN là con React của Canvas → EditorContext không vỡ (portal chỉ đổi DOM mount).
- **dockState.ts** (+pure, +5 test, tổng vitest 47): `DOCK_POS_KEY`, `DOCK_ANCHOR_SIZE=56`, `DockPos`, `defaultPos(vw)` (góc phải-trên: x=vw-56-14, y=14), `clampPos(x,y,vw,vh)` (x∈[0,vw-56], y∈[0,vh-56], guard viewport nhỏ → 0), `parsePos(raw,vw)` (JSON guard finite number, fallback default).
- **Drag logic** UnifiedDock: state `pos`(init parsePos từ localStorage) + `isDragging`; `dragOrigin`/`dragMoved` ref. onDragStart (setPointerCapture + lưu origin), onDragMove (clampPos theo delta), onDragEnd (DragHandle: finalize), onCollapsedEnd (tap delta<4px → expand, else finalize). Gắn pointer handlers lên **DragHandle (mở rộng)** + **ô collapsed 56×56**. Bỏ onClick collapsed → thay bằng tap-detect + onKeyDown Enter/Space (giữ a11y).
- **Persist**: useEffect ghi `nib-dock-pos` khi `!isDragging` (sau thả + sau resize re-clamp). **Resize**: useEffect window.resize → setPos(clampPos(...)).
- **dock.css**: `.nib-dock-anchor` fixed; `[data-dragging] * {transition:none!important; user-select:none}` (kéo không lag); `touch-action:none` trên `.nib-dock__drag` (+cursor grabbing) và `.nib-dock__collapsed`. Bỏ `position/top/right/min-height` cũ của `.nib-dock`.
- **KHÔNG làm** Feature 2 (expand up/down direction + flyout flip overflow-aware) — đó là Session 3.2.
- **Gate**: `tsc` 0 · `build` 0 · `vitest` 47/47 (+5 clampPos/parsePos/defaultPos) · grep hex/rgba dock rỗng · dev HTTP 200.
- **Lưu ý verify**: browser drag click-through không chạy được trong context phiên (chrome MCP off). Bù: clampPos/parsePos unit-test; drag handlers chuẩn pointer-capture pattern; persist/resize qua useEffect. Đề nghị lead smoke tay 8 điểm STOP gate (kéo handle/collapsed, tap expand, clamp mép, reload giữ vị trí, resize re-clamp).

### Session 2.1 — Wire editor actions + xóa file cũ (2026-06-14) — ✅ DONE

- **Wire editor thật** trong UnifiedDock: Tính → `evalBlock(editor, activeBlockId)` (golden path, unit-test blockActions.test); Convert → `editor.commands.convertNibBlock(activeBlockId)`; Format B/I/U/S → `editor.chain().focus().toggleMark(...).run()` (onMouseDown preventDefault giữ focus). activeBlockId lấy từ `useEditorContext()`. No-op an toàn khi editor/active null.
- **Mount**: `Canvas.tsx` → `<UnifiedDock editor={editor}/>` là tool surface DUY NHẤT.
- **Pen/size/color/ink**: giữ local state trong dock (PenPalette cũ cũng UI-only Phase 0 → parity; EditorContext KHÔNG đổi theo PLAN §c).
- **XÓA 4 file cũ** (user chốt phương án (a)): `FloatingToolbar.tsx`, `PenPalette.tsx`, `toolbar.css`, `pen.css` + gỡ mọi import/comment trong `Canvas.tsx`. `grep -rn "FloatingToolbar|PenPalette" src/` = RỖNG. SwatchPicker GIỮ (tái dùng bởi ColorFlyout).
- **⚠️ 6 chức năng DROP** (user chốt chấp nhận, để Phase sau qua context-menu/chuột-phải — NGOÀI plan dock-v2):
  1. Xoá block non-empty (auto-delete block RỖNG khi blur vẫn còn ở NodeView).
  2. Copy LaTeX (math editing).
  3. Copy kết quả (math result).
  4. Toggle cỡ math display↔normal.
  5. Text scale H1/H2/H3 (heading/body/small).
  6. Màu khối (color attr text/math).
  - KHÔNG mất: exact↔decimal toggle (ResultView, độc lập), Ctrl+K palette, `\` symbol menu, Ctrl+Shift+M convert.
- **Gate cuối**: `tsc` 0 · `build` 0 · `vitest` 42/42 · grep refs cũ RỖNG · 4 file đã xóa · grep hex/rgba dock rỗng · dev HTTP 200. Vòng lõi (Tính→evalBlock→result) dùng chính evalBlock đã unit-test; browser click-through không chạy được trong context phiên (chrome MCP off) — lead smoke cuối.

### Session 1.2 — State machine + flyouts + animations (2026-06-14) — ✅ DONE

- **State machine** (PLAN §c) trong `UnifiedDock.tsx`: `mode` + persist `nib-dock-mode`, `collapsed` + persist `nib-dock-collapsed`, `openPop` (null|ptr|sel|pen|size|color|fmt), `ptrTool/selTool/penTool/penSize/inkColor` (không persist). useEffect ghi localStorage.
- **Pure logic tách ra** `dockState.ts` (mirror pattern blockState.ts): toggleMode, togglePop, isFormatVisible, isEraserVisible, sizeTitleKey, parseMode, parseCollapsed → component CONSUME chính các fn này (single source). Test `dockState.test.ts` 7 case.
- **Hành vi (PLAN §f)**: (1) ModeToggle cycle pen↔type, icon nib↔kbd, đóng mọi flyout; (2) collapse/expand crossfade — 2 lớp absolute overlap (.nib-dock__expanded ↔ .nib-dock__collapsed) opacity+scale .25s cubic, container min-height 460↔56 .3s; (3) flyout toggle translateX(9px) scale(.97)↔(0)scale(1) .15s + đóng khi pointerdown ngoài dock (useRef + document listener, gắn chỉ khi openPop≠null); (4) format btn slide max-height 0↔46px theo isFormatVisible(mode); (5) eraser row chỉ render mode pen (isEraserVisible); (6) active highlight DockBtn (openPop===key) + FlyoutRow (tool selected). Flyout rows + swatch đổi `<div>`→`<button>` (reset CSS) cho click thật.
- **Tool icon phản ánh state**: pointer cursor/pan, select rect/lasso, pen nib/marker/eraser, size stroke/text theo mode; collapsed square hiện icon penTool active.
- **prefers-reduced-motion**: thêm .nib-dock__expanded/.nib-dock__collapsed vào block tắt transition.
- **Editor actions vẫn no-op** (Tính/Convert/Format placeholder — wire ở 2.1, đúng scope).
- **Gate**: `tsc` 0 · `build` 0 · `vitest` 42/42 (35 cũ + 7 dockState mới, 0 regression) · grep hex/rgba dock = rỗng · dev HTTP 200.
- **Lưu ý verify**: behavioral click-through qua browser KHÔNG chạy được (chrome MCP tools không enable trong context phiên này); thay bằng unit-test pure state machine (7 case phủ 6 hành vi logic) + DOM behaviors là attribute(data-open/collapsed/visible)+CSS-driven. Console-0 suy từ build/tsc/vitest sạch + dock không có side-effect runtime (chỉ localStorage + pointerdown listener). Đề nghị lead/user smoke browser nếu cần.

### Session 1.1 — Scaffold file + static render (2026-06-14) — ✅ DONE

- **Tạo mới (14 file)** `src/components/UnifiedDock/`: `index.ts`, `UnifiedDock.tsx`, `DragHandle.tsx`, `ModeToggle.tsx`, `DockBtn.tsx`, `CalcBtn.tsx`, `FlyoutPanel.tsx`, `PointerFlyout.tsx`, `SelectFlyout.tsx`, `PenTypeFlyout.tsx`, `SizeFlyout.tsx`, `ColorFlyout.tsx`, `FormatFlyout.tsx`, `dock.css`.
- **Icons** (+13 mới vào `icons.tsx`, paths HTML-exact): IconDragHandle, IconChevronDown, IconCornerMark, IconKbd, IconNib, IconCursor, IconPan, IconRectSelect, IconMarker, IconEraser, IconStrokeSize, IconTextSize, IconDockCollapse. Tái dùng IconLasso/IconConvert/IconCalc đã có.
- **i18n**: 31 key `dock.*` thêm vào CẢ en.json + vi.json (parity 111=111, 0 missing/extra). Reuse `toolbar.bold/italic/underline/strike` cho FormatFlyout.
- **Token map (PLAN §e)**: `--sw-*`→`--swatch-*`, `--sh1/2`→`--shadow-1/2`, `--desk`→`--bg-app`. Pulse keyframe `nibCalcPulse` dùng `color-mix(in srgb, var(--accent) X%, transparent)` — 0 rgba/hex rời.
- **Mount**: `<UnifiedDock editor={null}/>` thêm vào `Canvas.tsx` trong `.nib-stage`, GIỮ FloatingToolbar + PenPalette song song (xóa ở 2.1). `.nib-stage{position:relative}` thêm trong dock.css.
- **Static render**: dock mode='pen' default, openPop=null (flyouts đóng). Format button ẩn (pen mode). Render đúng thứ tự HTML: drag · mode · ─ · pointer/select/pen · ─ · size/color · ─ · convert · [format ẩn] · ─ · Tính · collapse.
- **Gate**: `tsc --noEmit` 0 · `npm run build` exit 0 · `vitest run` 35/35 · grep hex/rgba trong dock = rỗng · i18n 31/31 en+vi · dev server HTTP 200.
- **Tension ghi nhận (chờ lead/user xác nhận, KHÔNG tự quyết)**: hit-target [LOCKED ≥44px] vs HTML v2 — nút dock 44px ngang nhưng cao 40/38px (mode 30, collapse 22). Theo lệnh "HTML thắng mọi xung đột" nên giữ kích thước HTML; CalcBtn (action chính) 44×44. Nếu cần ép ≥44 cao → lệch visual HTML.
- **Out of scope (đúng plan)**: chưa wire state machine/flyout toggle/animation (1.2), chưa wire editor actions, chưa xóa file cũ (2.1).

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| 2026-06-14 | Created from PLAN.md | @planner |
| 2026-06-14 | Session 1.1 done (scaffold + icons + i18n + static render, gate pass) | @editor-frontend |
| 2026-06-14 | Session 1.2 done (state machine + flyouts + animations + dockState tests, gate pass) | @editor-frontend |
| 2026-06-14 | Session 2.1 done (wire editor + xóa 4 file cũ; user chốt (a), 6 chức năng drop → Phase context-menu sau). Plan dock-v2 Phase 1+2 HOÀN THÀNH | @editor-frontend |
| 2026-06-15 | Phase 3 thêm vào PLAN.md (drag-to-reposition + overflow expand/flyout flip). CHECKPOINT cập nhật trạng thái + constraint mới. Session 3.1 pending | @planner |
| 2026-06-15 | Session 3.1 done (drag-to-reposition: portal+fixed+clamp+persist+resize; +5 test → vitest 47/47). Phase 3 còn 3.2 | @editor-frontend |
| 2026-06-15 | Session 3.2 done (expand up/down + flyout flip overflow-aware; +3 test → vitest 50/50). Plan dock-v2 HOÀN THÀNH (Phase 1+2+3) | @editor-frontend |
