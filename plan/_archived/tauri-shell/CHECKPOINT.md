# CHECKPOINT — tauri-shell

> Trạng thái từng session. Lead + glue-packaging cập nhật sau mỗi session PASS.
> Format: `[x] PASS <date>` hoặc `[ ] pending` hoặc `[~] in_progress`.

---

## Tổng quan

| Session | Mô tả | Status |
|---|---|---|
| S1 | Scaffold src-tauri/ + deps + cargo build | [x] PASS 2026-06-15 |
| S2 | Verify `npm run tauri dev` mở cửa sổ native | [x] PASS 2026-06-15 (process evidence; user smoke cần xác nhận visual) |

---

## Session 1 — Scaffold src-tauri/ + deps + cargo build

**Status:** `[x] PASS 2026-06-15 17:13`

Done-criteria:
- [x] `src-tauri/Cargo.toml` tồn tại
- [x] `src-tauri/tauri.conf.json` tồn tại
- [x] `src-tauri/src/lib.rs` + `src/main.rs` tồn tại
- [x] `package.json`: có `@tauri-apps/api: ^2` (dep) + `@tauri-apps/cli: ^2` (devDep) + script `"tauri": "tauri"`
- [x] `cargo build` (cwd `src-tauri/`) → exit 0
- [x] `npm install` → node_modules/.bin/tauri tồn tại

Evidence:
```
cargo build (cwd src-tauri/):
  Finished `dev` profile [unoptimized + debuginfo] target(s) in 13.83s
  EXIT: 0

ls src-tauri/: Cargo.lock Cargo.toml build.rs gen/ icons/ src/ target/ tauri.conf.json
ls src-tauri/src/: lib.rs main.rs
ls src-tauri/icons/: 128x128.png 128x128@2x.png 32x32.png icon.icns icon.ico
node_modules/.bin/tauri: EXISTS

Note: Icon PHẢI là RGBA PNG (color type 6). RGB (type 2) gây "proc macro panicked: not RGBA" tại generate_context!().
```

---

## Session 2 — Verify `npm run tauri dev` mở cửa sổ native

**Status:** `[x] PASS 2026-06-15 17:16 (process evidence PASS; visual UI cần user smoke)`

Done-criteria:
- [x] `npm run tauri dev` khởi động không panic (grep panicked = NO PANIC, grep error = 0)
- [x] Cửa sổ native mở: WebKitWebProcess (PID 758508) + WebKitNetworkProcess (PID 758476) đều active; TCP ESTAB từ WebKitNetworkProcess→localhost:1420 xác nhận webview đã load content
- [~] UI hiển thị đúng: CHƯA có screenshot (không có tool gnome-screenshot/grim/scrot trong agent context) → **CẦN USER SMOKE** (`npm run tauri dev` tự chạy, confirm canvas+dock hiện)
- [x] Stdout log 0 panic, 0 error — `Finished dev profile in 2.04s` + `Running target/debug/nib`
- [x] App đóng sạch — orphan check: `CLEAN`, port 1420 free

Evidence:
```
stdout (no panic):
  VITE v5.4.21  ready in 155 ms
  ➜  Local: http://localhost:1420/
  Finished `dev` profile in 2.04s
  Running `target/debug/nib`

Process evidence (webview active):
  757991  target/debug/nib             (uptime 1m53s)
  758476  WebKitNetworkProcess         (TCP ESTAB →:1420)
  758508  WebKitWebProcess             (RSS 415MB — rendering React+MathLive+KaTeX)

Error check: grep panicked → NO PANIC | grep error count = 0

Orphan after kill: CLEAN — no orphan processes | port 1420 free

Screenshot: không có tool nào available (gnome-screenshot/grim/scrot/import/ffmpeg đều absent)
→ Cần user chạy `npm run tauri dev` và xác nhận visual canvas+dock
```

---

## Ghi chú

- **Sidecar Python SymPy**: CHƯA implement trong plan này. Slot đã chừa tại `tauri.conf.json` `externalBin: []` và comment trong `lib.rs`. Sẽ thêm ở plan riêng (glue-packaging IPC session 3+).
- **Icons**: Session 1 dùng placeholder. Cần icon set đầy đủ trước khi `cargo build --release` (production bundle).
- **CSP**: `"csp": null` trong dev. Siết lại khi có thêm yêu cầu bảo mật.
