# Memory — mistakes (lỗi thực tế, không tái phạm)

> Lỗi cụ thể đã gặp + nguyên nhân + cách confirm fix. Đọc trước khi plan / trước khi build.
> LUÔN append (`## YYYY-MM-DD HH:MM — slug`), không overwrite. Dùng 10 entry mới nhất.

---

## 2026-06-11 12:30 — agent-team-setup-bootstrap

- Chưa có lỗi thực tế nào được ghi nhận (file khởi tạo trong Session 4.1).
- Khi gặp lỗi build/spawn/parse, append entry: triệu chứng cụ thể + nguyên nhân + cách confirm đã fix (lệnh + exit code).

## 2026-06-12 17:50 — vite-react-ts-scaffold-tsc-gotchas

- Build: scaffold Vite+React/TS. Hai lỗi `npx tsc --noEmit` (gate) chặn, fix được:
  1. `tsconfig.json` có `references:[{path:tsconfig.node.json}]` mà node config dùng `noEmit:true` → TS6306/TS6310 ("must have composite:true / may not disable emit"). Gate chạy `tsc --noEmit` (không `tsc -b`) nên reference vô nghĩa → **bỏ `references` + xoá tsconfig.node.json**; Vite load `vite.config.ts` qua esbuild, không cần tsc.
  2. `tsconfig` strict bật `noUncheckedSideEffectImports` (TS5.6) → side-effect import `import '@fontsource-variable/inter'` (không đuôi .css) báo TS2307 vì không khớp ambient `declare module '*.css'` của vite/client. Fix: **import path rõ đuôi** `'@fontsource-variable/inter/index.css'`.
- Confirm: `npx tsc --noEmit` exit 0 + `npm run build` exit 0 (dist + Inter woff2 gồm subset vietnamese).

## 2026-06-13 01:18 — mathlive-MathfieldElement-undefined-in-jsdom

- Build: `src/editor/mathliveSetup.ts` set `MathfieldElement.soundsDirectory=null` ở top-level → `npx vitest run` FAIL "Cannot set properties of undefined" vì `import {MathfieldElement} from 'mathlive'` trả **undefined** trong jsdom (mathlive guard browser-only export).
- Root cause: test `nibBlock.test.ts` import NibBlock → NibBlockView → MathField → mathliveSetup → side-effect chạy lúc load module, throw.
- Fix: guard `if (typeof MathfieldElement !== 'undefined' && MathfieldElement) { ... }`. NodeView KHÔNG mount trong headless editor nên MathField runtime không chạy — chỉ cần né side-effect lúc import.
- Confirm: `vitest run` 27/27 pass · `tsc --noEmit` 0 · `npm run build` 0.

## 2026-06-13 11:23 — mathlive-static-render-missing-css

- Triệu chứng: kết quả symbolic render bằng `convertLatexToMarkup` (static, trong ResultView qua dangerouslySetInnerHTML) hiện PHẲNG — `x^2`→"x2", `\frac{x^3}{3}`→số chồng phẳng. Nhưng `<math-field>` TƯƠNG TÁC render đúng x².
- Root cause: markup static dùng class `.ML__latex .ML__vlist/.ML__mfrac/.ML__msubsup` + KaTeX `@font-face` — tất cả nằm trong `mathlive/static.css` mà tôi **chưa import**. Math-field tương tác render đúng vì nó tự inject stylesheet vào shadow DOM (adopted stylesheets), KHÔNG dùng CSS document → static bị bỏ quên.
- Fix: thêm `import 'mathlive/static.css';` vào `src/editor/mathliveSetup.ts` (đã import ở main.tsx trước render). Vite tự bundle 19 KaTeX woff2 từ `node_modules/mathlive/fonts/` (url tương đối trong static.css) → offline-friendly cho Tauri, tốt hơn CDN.
- Confirm: `npm run build` 0 + dist/assets có KaTeX_*-woff2 (19 font) · `tsc` 0 · `vitest` 31/31 · color-inherit (--result/--approx) giữ nguyên (frac-line/sqrt-line dùng currentColor).
- Bài học: web component (math-field) dùng shadow DOM stylesheet riêng; phần STATIC render (convertLatexToMarkup→innerHTML) cần import `mathlive/static.css` RIÊNG vào document.

## 2026-06-13 12:03 — clamp-toast-fires-on-normal-load (bug #9)

- Triệu chứng: toast `app.blocks_clamped_notice` hiện MỖI lần load trang bình thường (không có block nào thực sự bị dời).
- Root cause (2 nguyên nhân): NibBlockView notify khi `round(left)!==round(xOffset)` — bắt nhầm (a) **left-margin snap**: starter xOffset=40 < MARGIN_L=56 → clampRenderX luôn trả 56 → |56-40|=16 → fire; (b) **first render width=0** (chưa layout) → clamp degenerate.
- Fix: thêm pure `isClampedLeftward(xOffset,blockW,usableW)` ở geometry.ts — chỉ true khi block bị kéo **sang TRÁI dưới authoring intent** (right-overflow thật: left < xOffset), guard blockW<=0||usableW<=0. NibBlockView gọi `if(isClampedLeftward(...)) notifyClamped()`. Left-margin snap (left>xOffset = sang phải) KHÔNG fire. Clamp positioning giữ nguyên.
- Confirm: `vitest` 35/35 (4 test mới: width0→false, left-snap→false, fits→false, wide-doc-overflow→true) · `tsc` 0 · `build` 0.
- Bài học: "vị trí render khác authoring" ≠ "đã clamp do viewport hẹp". Phân biệt hướng dịch (trái=overflow thật, phải=margin snap) + guard chưa-đo-được-width.

## 2026-06-15 17:13 — tauri-icon-must-be-rgba

- Triệu chứng: `cargo build` fail "proc macro panicked: icon .../32x32.png is not RGBA" tại `tauri::generate_context!()`.
- Root cause: PNG placeholder tạo bằng Python với color type 2 (RGB, 3 channel) — Tauri `generate_context!()` xử lý icon tại compile time và YÊU CẦU RGBA (color type 6, 4 channel). ICO và ICNS không bị ảnh hưởng.
- Fix: Tạo lại tất cả `.png` icon với `color type = 6` (RGBA) trong IHDR chunk. Mỗi pixel = 4 bytes (R,G,B,A).
- Confirm: `cargo build` exit 0 sau khi thay PNG → RGBA.

## 2026-06-17 — floating/popover phải CLAMP viewport (bug LẶP NHIỀU LẦN — user flag)

- Triệu chứng: nút "⋯" context menu trong Library overlay (`DocContextMenu`) render `position:fixed` tại đúng điểm click `{left:x, top:y}` mà KHÔNG clamp → khi trigger gần mép phải/đáy viewport, menu tràn ra ngoài màn hình, bị cắt. **User nhấn mạnh: frontend đã mắc lỗi overflow kiểu này NHIỀU LẦN.**
- Root cause: mọi floating element (context menu, popover, flyout, dropdown, tooltip) đặt theo toạ độ con trỏ/anchor nhưng quên: nội dung có kích thước → `anchor + size` có thể vượt `window.innerWidth/innerHeight`. Đặt thô `{left:x, top:y}` = bug mép màn hình mặc định.
- Fix (pattern CHUẨN, áp cho MỌI floating element từ nay): sau render đo `el.getBoundingClientRect()` trong `useLayoutEffect` → clamp `left = clamp(EDGE_GAP, x, innerWidth - width - EDGE_GAP)`, `top = clamp(EDGE_GAP, y, innerHeight - height - EDGE_GAP)`. Tham chiếu: UnifiedDock đã có `flyoutTop()`/`expandDirection()` cùng ý tưởng (overflow flip) — TÁI DÙNG tư duy đó, đừng đặt toạ độ thô.
- Bài học: **KHÔNG bao giờ đặt floating element bằng toạ độ thô không clamp.** Checklist khi tạo popover/menu/flyout: (1) đo size sau mount; (2) clamp cả 2 trục vào viewport với EDGE_GAP; (3) cân nhắc flip hướng khi gần mép. (SortDropdown + các flyout khác nên rà cùng pattern.)
- Confirm: `tsc` 0 · `build` 0 · `vitest` pass.

## 2026-06-21 17:30 — overlay-z-index-vs-dock-portal

Triệu chứng (lead screenshot app thật): LoginModal mở nhưng UnifiedDock (icon grid/gear/...) render ĐÈ LÊN scrim+panel modal.
Bối cảnh stacking: dock = `position:fixed` + `createPortal(document.body)` z-index:30, NẰM NGOÀI `.nib-app`. Overlay (Settings/Library/Login) = `position:absolute` trong `.nib-app` (KHÔNG phải stacking context: position:relative + overflow:hidden, không z/transform) → z của overlay được "promote" lên root, so trực tiếp với dock z:30.
Fix: nâng z LoginModal vượt hẳn — container/scrim z:90, panel z:100 (> dock 30, > account-menu 80). Settings/Library dùng 50/60 (đã trên dock 30); LoginModal nâng cao hơn cho chắc.
Bài học: overlay mới phải có z > dock anchor (30). Khi thêm overlay portal/fixed mới, kiểm z so với MỌI fixed/portal element ở body level, KHÔNG chỉ so trong nội bộ component. `.nib-app` cố ý KHÔNG là stacking context nên z overlay là z root-level.
Confirm: tsc 0 · build 0 · vitest 82/82 · (visual = lead screenshot re-verify).

## 2026-06-21 23:50 — y-indexeddb-unhandled-rejection-jsdom

Build: Phase B.1 YjsProvider — `npx vitest run` FAIL "ReferenceError: indexedDB is not defined" (Unhandled Rejection) khi mount `<YjsProvider token={null}>` trong jsdom.
Root cause: jsdom KHÔNG có `indexedDB`. `new IndexeddbPersistence()` (y-indexeddb 9) tạo `this._db = idb.openDB(...)` → reject; nội bộ lib còn `this._db.then(db=>{...})` KHÔNG có .catch → unhandled rejection KHÔNG chặn được từ ngoài. Thêm: `whenSynced` chỉ resolve khi event 'synced', KHÔNG bao giờ reject → `await waitForSync` treo vĩnh viễn khi IDB hỏng.
Fix (2 lớp): (1) `YjsProvider` guard `if (typeof indexedDB !== 'undefined')` TRƯỚC khi construct persistence — né hẳn jsdom/SSR (đúng pattern guard browser-only API như mathlive/MathfieldElement). (2) `waitForSync` race `whenSynced` vs `_db` rejection → resolve gracefully cho Firefox private-mode (IDB defined nhưng open() reject).
Confirm: temp smoke test render `local:doc` exit 0, 0 unhandled error; `vitest run` 82/82 · tsc 0 · build 0.


## 2026-06-22 05:20 — hocuspocus-v4-api-server-constructor-not-configure

Build: server/src/index.ts (Phase C.1). PLAN/ARCHITECTURE viết `Server.configure({...})` (API v2/v3) → `tsc --noEmit` FAIL "Property 'configure' does not exist on type 'typeof Server'" + TS7031 implicit-any cho hook params.
Root cause: @hocuspocus/server 4.3.0 đổi API — `Server` là class, dùng `new Server(config)` rồi `server.listen()`, KHÔNG còn static `Server.configure`. Hook payload types phải import + annotate (`onRequestPayload`, `onAuthenticatePayload` — đều export từ '@hocuspocus/server').
Fix: `const server = new Server({port, onRequest, onAuthenticate}); server.listen();` + type destructured params bằng payload interface.
Health W1: `onRequest` hook write `response.end('OK')` rồi `return Promise.reject()` để ngắt hook chain — Hocuspocus catch reject nội bộ, KHÔNG sinh unhandled-rejection log. Không cần E1 fallback httpServer.on('request').
Confirm: `npx tsc --noEmit` exit 0; ts-node start → `curl localhost:3000/health` = 200 body "OK", log sạch (chỉ banner Hocuspocus v4.3.0).

## 2026-06-24 13:22 — ghost-park-ime-invalid-selection-must-materialize-on-click

Triệu chứng: IME (tiếng Việt) → ghost caret hiện nhưng ký tự nhảy vào row khác. Console: "TextSelection endpoint not pointing into a node with inline content". 
Root cause: (1) ghost-park parked PM selection tại pos cấp-doc (endPos=doc.content.size) → không phải inline content → TextSelection.create throw → selection rớt về row gần nhất. (2) IME: e.key==='Process' trong composition → handleKeyDown bỏ qua (e.key.length===1 check fail) → text vào parked selection thay vì materialize. Cơ chế ghost-park hoàn toàn không tương thích IME.
Fix: ĐỔI SANG MATERIALIZE-ON-CLICK. Virtual click (classifyClick→'virtual') → `insertRowAtLine` tạo row ngay lập tức + đặt `Selection.near(rowStart+1)` (cursor trong row, inline content hợp lệ). Xóa: GhostPark state, materializeAtGhostPark, handleKeyDown ghost interceptor, ghost caret span. Thêm: pendingEmptyRowId ref + cleanupPendingEmptyRow (delete empty row on next click/blur).
Bài học: KHÔNG bao giờ park PM selection tại pos cấp-doc (doc.content.size) cho mục đích "chờ keystroke" — IME bypass mọi keydown interceptor. Nếu cần cursor ở vị trí ảo → tạo row thật luôn, đặt selection bên trong.
Confirm: tsc 0 · vitest 170/170 · build 0.

## 2026-06-24 08:15 — ghost-park-keystroke-race-window-vs-pm

Triệu chứng: ghost-park active, gõ printable char → rows vẫn 0, ký tự rớt (empty doc) hoặc double-insert (doc có row).
Root cause: window.addEventListener('keydown') fires AFTER PM đã xử lý key. PM không tìm được inline position để insert (doc trống → reject schema) → nothing, NHƯNG materialize cũng có thể chạy sau PM với state đã thay đổi. Race condition PM↔React window listener.
Fix: chuyển ghost-park materialize + Escape vào editorProps.handleKeyDown (TipTap). Callback này fires TRƯỚC PM default processing; return true → PM không xử lý key nữa. Dùng ref pattern: `ghostKeyHandlerRef.current = (e) => {...}` cập nhật mỗi render (closure đọc refs mới nhất); stable wrapper `(_view, e) => ghostKeyHandlerRef.current(e)` trong editorProps (stable pointer tránh unnecessary TipTap setProps). editorRef.current = editor sau useEditor call.
Gotcha: `editorRef.current = editor` PHẢI đặt AFTER `const editor = useEditor(...)` — đặt trước gây TS2448/TS2454 "block-scoped variable used before declaration".
Confirm: tsc 0 · vitest 174/174 · build 0.

## 2026-06-23 20:30 — mathlive-font-artifact-steals-focus

Triệu chứng: load app → user click vùng trống giấy → gõ không vào editor (ghost-park đúng nhưng không nhận phím). document.activeElement = `ML__fonts-did-not-load` (element MathLive tạo khi CDN font unreachable ở dev/offline).
Root cause: `import 'mathlive'` trong mathliveSetup.ts có side effect: append + focus element `#ML__fonts-did-not-load` vào DOM. `editor.view.focus()` gọi sau handleClickOnPaper (trong Workspace.tsx) không đủ — đã muộn sau React re-render, hoặc MathLive artifact vẫn giữ focus.
Fix (2 lớp): (1) `handleClickOnPaper` (ghostCaret.ts) thêm `view.focus()` trong CẢ HAI nhánh (doGhostPark helper + content-hit branch) — focus ngay trong click handler trước bất kỳ re-render nào; (2) WorkspaceEditor thêm `useEffect([editor])` → `requestAnimationFrame(() => { if activeElement là artifact/body/null → editor.view.focus() })` — auto-focus sau mount 1 frame để MathLive settle, không steal focus từ interactive element thật (input/modal/math-field).
Pattern class-check artifact: `activeEl?.id === 'ML__fonts-did-not-load' || activeEl?.classList.contains('ML__fonts-did-not-load')`.
Confirm: tsc 0 · vitest 172/172 · build 0.

## 2026-06-23 20:11 — posAtCoords-never-null-virtual-space-detection

Triệu chứng: click vùng trống giấy → gõ nối vào dòng có sẵn thay vì tạo dòng mới tại vị trí click. Ghost-park không bao giờ kích hoạt.
Root cause: `handleClickOnPaper` (ghostCaret.ts) giả định `view.posAtCoords()` trả `null` khi click vùng trống — sai. ProseMirror LUÔN trả pos gần nhất (không null). Nhánh `if (posAtClick !== null)` = luôn true → ghost-park path chết hoàn toàn.
Fix: sau khi nhận `posAtClick` (không null), gọi `view.coordsAtPos(posAtClick.pos)` để lấy rect render thật của pos đó. So sánh với click: `verticalMiss` (click cách hơn RULE_HEIGHT/2 từ content), `horizontalMiss` (click qua phải rect.right+threshold khi pos ở cuối text). Nếu miss → ghost-park; ngược lại → set selection. Tách pure helper `classifyClick(clickX,clickY,rect,isAtEndOfRow)` để unit-test với rect mock (không cần browser layout).
Cũng fix: `materializeAtGhostPark` luôn insert cuối doc — đổi thành insert đúng doc-order (trước row có absLine > targetLine) + adjust blankBefore của row kế.
Confirm: `npx tsc --noEmit` 0 · `npx vitest run` 172/172 (+15 test mới classifyClick+new paths+insert-before) · `npm run build` exit 0.

## 2026-06-22 15:12 — hocuspocus-provider-manageSocket-no-attach

Triệu chứng (gate vàng Phase C): client login OK, token ES256, URL/endpoint Render sống, NHƯNG WS không bao giờ connect/sync → bảng yjs_updates trống.
Root cause: src/lib/yProvider.ts tạo `new HocuspocusProvider({ websocketProvider: <custom HocuspocusProviderWebsocket>, ... })`. Trong @hocuspocus/provider 4.3, constructor chỉ gọi `this.attach()` khi `manageSocket===true` (dist dòng 715), và manageSocket CHỈ set true khi KHÔNG truyền websocketProvider (dòng 718-720 provider tự `new HocuspocusProviderWebsocket(configuration)`). Truyền socket thủ công → manageSocket=false → attach() không chạy → câm, không connect. (destroy() cũng chỉ destroy socket khi manageSocket — dòng 880.)
Fix: BỎ custom websocketProvider + handler on('destroy'); truyền thẳng `url` vào HocuspocusProvider (URL-variant → manageSocket=true → attach+connect; destroy tự dọn socket).
GOTCHA type: option URL-variant `HocuspocusProviderConfiguration` (dist dòng 297) chỉ type `url`+`preserveTrailingSlash`, KHÔNG có delay/factor/maxDelay → truyền vào = TS2353. Runtime có forward nhưng type chặn. Giải: BỎ 3 option vì lib default trùng khít ý ta (dist defaults delay:1000/factor:2/maxDelay:30000 = giá trị cũ) → typed sạch, cùng hành vi backoff.
Confirm: tsc 0 · build 0 · vitest 87/87 · grep HocuspocusProviderWebsocket=0. Connect thật = USER gate vàng (2-tab).

## 2026-06-24 01:30 — stale-HMR-dev-server-phantom-failures (LEAD-PROCESS)

Triệu chứng: lead browser-gate Phase C free-caret FAIL nhiều vòng (click trống không ghost-park / gõ rớt / focus chập chờn) → gửi editor ≥3 brief "vẫn lỗi"; nhưng editor build+tsc+vitest đều PASS mỗi vòng. User cũng báo "vẫn lỗi".
Root cause: dev server `npm run dev` chạy lâu + NHIỀU server chồng (1420/1421/1422) → Vite HMR tích luỹ module hỏng / KHÔNG áp được thay đổi editor-core (useEditor setup, plugin, editorProps.handleKeyDown, focus listener). Lead test nhầm code CŨ. Bằng chứng quyết định: console có `ReferenceError: Cannot access 'editor' before initialization` từ bản HMR trung gian (`?t=` timestamp cũ) — KHÔNG phải code trên đĩa.
Fix process: (1) editor-core change → KHÔNG tin HMR; `pkill -f vite` + chạy 1 server SẠCH trước khi gate; (2) runtime fail mà build/test pass → đọc console tìm exception + check `?t=` timestamp module (cũ=stale); (3) instrument console.log đường nghi → reload sạch → đọc log pinpoint thay vì đoán-fix mù.
Hệ quả: build+unit-test (jsdom) KHÔNG render full editor lifecycle → miss crash runtime → motivated cho tester tự execute browser (Playwright headless, ISSUE-19) bắt runtime trước khi tới lead/user.
Confirm: server sạch :1420 + IDB xoá → 1 starter row, click trống→gõ "hi"→row "hi" đúng vị trí, ghost cleared. Phase C free-caret PASS.
