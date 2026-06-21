# PLAN — tauri-shell (vỏ Tauri 2 cho Nib)

> Plan này do `glue-packaging` sinh. Owner: **glue-packaging** (Agent D, CLAUDE.md §12).
> Stack [LOCKED §5]: **Tauri 2**. Electron chỉ dự phòng nếu toolchain Rust hỏng thật — không tự chuyển.
> Input: CLAUDE.md §5–§6, task #1 brief, môi trường đã verify (Ubuntu 26.04, rustc 1.96, webkit2gtk-4.1 ✓).

---

## Goal

**Dựng vỏ Tauri 2 cho app Nib để app chạy thành cửa sổ desktop native** — không qua browser.
Done = `cargo build` trong `src-tauri/` exit 0 VÀ `npm run tauri dev` mở cửa sổ native hiển thị đúng UI (dock + canvas), console 0 error.

---

## Chừa chỗ Python SymPy sidecar (CHƯA implement ở plan này)

Tauri 2 hỗ trợ sidecar qua **`tauri-plugin-shell`** + `bundle.externalBin` trong `tauri.conf.json`. Kiến trúc dự kiến:
```
[Webview React] → invoke("eval", {latex}) → [Rust #[tauri::command]] → HTTP localhost:PORT → [Python FastAPI+SymPy sidecar]
```
Các slot CHỪA trong plan này:
- `tauri.conf.json`: để trống `bundle.externalBin: []` (comment TODO) + section `plugins.shell` (comment TODO).
- `src-tauri/Cargo.toml`: comment `# tauri-plugin-shell = "2" # TODO: sidecar`.
- `src-tauri/src/lib.rs`: comment `// TODO: spawn sidecar + register IPC commands (glue-packaging Session 3+)`.

---

## Sessions

### Session 1 — Scaffold src-tauri/ + deps + cargo build

**Làm:**
1. Cài `@tauri-apps/cli@^2` vào `devDependencies` + `@tauri-apps/api@^2` vào `dependencies` + thêm script `"tauri": "tauri"` vào `package.json`.
2. Tạo `src-tauri/` với cấu trúc chuẩn Tauri 2:
   - `Cargo.toml` — workspace = false; `[lib]` crate-type = ["lib", "cdylib", "staticlib"]; deps: `tauri = { version = "2", features = [] }` + `tauri-build = { version = "2", features = [] }`.
   - `build.rs` — `fn main() { tauri_build::build() }`.
   - `src/lib.rs` — `pub fn run() { tauri::Builder::default().run(tauri::generate_context!()).expect("error while running tauri application"); }` + comment TODO sidecar.
   - `src/main.rs` — `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] fn main() { nib_lib::run() }`.
   - `tauri.conf.json` — xem spec bên dưới.
   - `icons/` — tối thiểu 1 file icon placeholder (32x32.png hoặc icon.ico) để Tauri không lỗi missing icon.
3. Chạy `cargo build` (cwd `src-tauri/`) → verify exit 0.

**tauri.conf.json spec:**
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Nib",
  "version": "0.0.0",
  "identifier": "com.nib.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:1420",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Nib",
        "width": 1280,
        "height": 800,
        "minWidth": 820,
        "minHeight": 600
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "externalBin": []
  }
}
```
> `"csp": null` = tắt CSP trong dev để React/MathLive/KaTeX script không bị block. Sẽ siết lại khi release.
> `externalBin: []` = slot chừa cho sidecar Python (TODO).
> `minWidth: 820` = theo spec thiết bị (docs/requirements.md §2 sub-compact breakpoint).

**DONE-criteria Session 1:**
- [ ] `src-tauri/` tồn tại với đủ 6 file/folder: `Cargo.toml`, `build.rs`, `src/lib.rs`, `src/main.rs`, `tauri.conf.json`, `icons/`.
- [ ] `package.json` có `@tauri-apps/api` trong `dependencies`, `@tauri-apps/cli` trong `devDependencies`, script `"tauri": "tauri"`.
- [ ] `cargo build` (cwd `src-tauri/`) → **exit 0** (không warning fatal, không linker error).
- [ ] `npm install` không lỗi (node_modules có `@tauri-apps/api` + `.bin/tauri`).

---

### Session 2 — Verify `npm run tauri dev` mở cửa sổ native

**Làm:**
1. Chạy `npm run tauri dev` (cwd root repo).
2. Tauri khởi động Vite dev server (`:1420`) + cửa sổ webview native.
3. Verify cửa sổ hiển thị đúng: canvas + UnifiedDock dock, không trang trắng.
4. Verify console 0 error (DevTools hoặc Tauri stdout).
5. Nếu launch trong môi trường agent không quan sát UI được → **cần user smoke** (user mở terminal, chạy `npm run tauri dev`, xác nhận cửa sổ mở + UI hiện).

**DONE-criteria Session 2:**
- [ ] `npm run tauri dev` khởi động không panic (stdout không có `thread 'main' panicked`).
- [ ] Cửa sổ native mở (quan sát trực tiếp hoặc user confirm).
- [ ] UI hiển thị đúng: ruled paper canvas + UnifiedDock (dock teal/tối) — **không trang trắng**.
- [ ] Console DevTools **0 error** (warning CSP/font không tính nếu không block chức năng).
- [ ] App đóng sạch khi tắt cửa sổ (không orphan process).

> **Fallback quan sát:** Nếu agent không thể quan sát UI (môi trường headless/không redirect DISPLAY),
> gate "cửa sổ mở + 0 error" cần **user smoke** thủ công. Agent vẫn chạy được `npm run tauri dev`
> và đọc stdout/stderr để verify "no panic" + Vite ready.
> Máy này có display Wayland :0 GNOME → `DISPLAY=:0` hoặc `WAYLAND_DISPLAY=wayland-0` nếu cần.

---

## Rủi ro & Cách xử lý

| Rủi ro | Xác suất | Cách xử lý |
|---|---|---|
| **Version mismatch** `@tauri-apps/cli` vs crate `tauri` phải cùng major 2 | Cao nếu pin sai | Pin cả hai `^2.x` cùng lúc; dùng `tauri info` để cross-check |
| **Icons thiếu** — Tauri yêu cầu icon set đầy đủ khi bundle | Trung bình | Session 1: để placeholder `32x32.png` + dặn trong plan; đủ icon trước khi `cargo build --release` |
| **CSP block** MathLive/KaTeX inline script/style | Cao khi CSP bật | `"csp": null` trong dev; siết sau. KaTeX woff2 từ dist/assets (Vite bundle) — không CDN → OK |
| **Wayland vs X11** — `DISPLAY` không set trong terminal agent | Trung bình | Set `DISPLAY=:0` hoặc dùng `WAYLAND_DISPLAY=wayland-0`; fallback = user smoke |
| **WebKit2GTK font** — KaTeX `@font-face` src url('../fonts/...')relative trong dist/ | Thấp | Vite bundled font vào `dist/assets/` với hash URL → không bị relative breakage |
| **`cargo build` chậm** (lần đầu ~5–15 phút) | Cao | Bình thường; đừng timeout lệnh < 15 phút |
| **`window.__TAURI_INTERNALS__` không inject** (IPC không ready) | Thấp (chỉ khi cần IPC) | Session 2 chưa cần IPC; chừa cho Session 3+ |
| **`beforeDevCommand` race** — Vite chưa ready khi Tauri open webview | Trung bình | `"devUrl"` polling (Tauri tự retry đến khi port 1420 response); thường tự giải quyết |

---

## File cần tạo / sửa

```
repo root/
├── package.json                    [SỬA] thêm deps + script tauri
├── src-tauri/
│   ├── Cargo.toml                  [TẠO]
│   ├── build.rs                    [TẠO]
│   ├── src/
│   │   ├── lib.rs                  [TẠO]
│   │   └── main.rs                 [TẠO]
│   ├── tauri.conf.json             [TẠO]
│   └── icons/
│       └── icon.png                [TẠO] placeholder (Tauri cli có thể gen)
└── (src/ frontend — KHÔNG ĐỤNG)
```

> **KHÔNG sửa** `src/`, `vite.config.ts` (đã Tauri-ready), `tsconfig.json`.

---

## Thứ tự implement (quan trọng)

1. Sửa `package.json` (thêm deps + script) → `npm install` → verify `.bin/tauri` có.
2. Tạo `src-tauri/` skeleton.
3. `cargo build` (cwd `src-tauri/`) — lần đầu chậm, để timeout ≥ 15 phút.
4. `npm run tauri dev` — verify cửa sổ.

**KHÔNG đảo thứ tự:** cài npm trước để Tauri CLI có mặt trong `.bin/`; cargo build trước `tauri dev` để Rust binary sẵn.
