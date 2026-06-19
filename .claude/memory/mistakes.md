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
