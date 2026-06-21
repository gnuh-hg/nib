---
name: tauri-packaging
description: "Đóng gói Tauri 2 + IPC frontend↔sidecar cho glue-packaging (Nib): cargo build --release, Tauri command + invoke, spawn Python SymPy sidecar (tauri.conf.json), build desktop artifact, offline fallback khi sidecar không start."
---

# tauri-packaging — vỏ Tauri 2 + IPC sidecar

> Skill riêng cho **`glue-packaging`** (Agent D, CLAUDE.md §12). Mục đích: ghép frontend (webview) với backend SymPy (sidecar Python) qua IPC, đóng gói thành app desktop cài được thật, và **chạy offline** (CLAUDE.md §6: sidecar cục bộ để offline).
> Stack [LOCKED] §5: **Tauri 2** (Electron chỉ dự phòng nếu toolchain Rust phiền — KHÔNG tự chuyển).

---

## 0. Nguyên tắc bất biến

1. **Tauri 2, không tự đảo sang Electron.** Toolchain Rust phiền → báo lead, không tự chuyển (§5).
2. **Sidecar là đường offline.** Backend SymPy chạy như **sidecar cục bộ** (§6) để app hoạt động không cần mạng. Đóng gói phải bundle sidecar, không phụ thuộc server từ xa.
3. **IPC tên khớp hai phía.** JS `invoke("name")` ↔ Rust `#[tauri::command] fn name`. Lệch tên = "command not found" (lỗi hay gặp — xem build-verify §3).
4. **Offline fallback.** Sidecar không start → app KHÔNG crash; báo lỗi mềm cho UI (degraded mode), không treo.

---

## 1. Kiến trúc ghép

```
[Webview: React + MathLive + TipTap]   (editor-frontend dựng)
        │  invoke("eval", {latex})
        ▼  Tauri IPC (Rust)
[Rust command #[tauri::command]]
        │  forward → sidecar
        ▼  HTTP localhost / stdin-stdout
[Python sidecar: FastAPI + SymPy]      (backend-cas dựng)
        │  LaTeX kết quả
        ▼
   trả về webview → render inline
```

- **Ranh giới vai**: frontend (webview) = `editor-frontend`; FastAPI+SymPy = `backend-cas`; **lớp ghép Rust IPC + đóng gói + spawn sidecar + offline = `glue-packaging` (bạn)**. Đừng viết logic toán hay UI — chỉ ghép.

## 2. Spawn Python sidecar (tauri.conf.json)

- Khai báo sidecar trong `tauri.conf.json` → `bundle.externalBin` (binary Python đóng gói, vd qua PyInstaller) HOẶC `tauri-plugin-shell` để spawn process.
- Quyền: thêm sidecar vào `capabilities`/allowlist shell (Tauri 2 dùng capability-based permissions).
- Spawn lúc app khởi động: Rust `Command::new_sidecar("backend")?.spawn()?` → giữ handle để kill khi app thoát.
- Sidecar nghe `localhost:<port>` (chọn port tránh xung đột, hoặc cấp động rồi truyền cho frontend).

## 3. IPC command (Rust ↔ JS)

```rust
#[tauri::command]
async fn eval(latex: String) -> Result<String, String> {
    // forward sang sidecar (HTTP localhost / stdio), trả LaTeX kết quả
}
```
```js
import { invoke } from "@tauri-apps/api/core";   // Tauri 2 path
const result = await invoke("eval", { latex });  // tên "eval" PHẢI khớp Rust
```
- Tauri 2: import từ `@tauri-apps/api/core` (khác Tauri 1). Đăng ký command trong `tauri::Builder::default().invoke_handler(tauri::generate_handler![eval])`.

## 4. Offline fallback

| Tình huống | Xử lý |
|---|---|
| Sidecar không start (thiếu binary/port bận) | catch ở Rust → trả lỗi mềm → UI hiện "engine offline", KHÔNG crash app |
| Sidecar chết giữa session | health check / retry spawn 1 lần; vẫn fail → degraded mode |
| App đóng | kill sidecar handle (không để process mồ côi) |

App **phải mở được và soạn thảo được** kể cả khi engine tính chưa sẵn sàng — chỉ phần kết quả symbolic là degraded.

## 5. Self-verify gate (theo build-verify §Stack 2)

| Gate | Lệnh | PASS = |
|---|---|---|
| Rust build | `cargo build` (cwd `src-tauri/`) | exit 0 |
| Release build | `cargo build --release` (cwd `src-tauri/`) | exit 0 |
| App launch | `npm run tauri dev` (hoặc artifact) | cửa sổ mở, không panic, console 0 error |
| IPC call | ≥1 `invoke("eval",…)` frontend→sidecar | trả về đúng shape, console 0 error |
| Offline fallback | tắt sidecar → app vẫn mở, báo lỗi mềm | không crash |

Nộp evidence theo `build-verify/SKILL.md` §2 (bảng Gate|Lệnh|Exit|Kết quả).

## 6. Quick reference

```
GHÉP: webview --invoke("eval")--> Rust #[command] --forward--> Python sidecar(FastAPI+SymPy) --> LaTeX --> inline
TAURI 2: invoke từ '@tauri-apps/api/core'; command đăng ký generate_handler!; permissions = capabilities.
SIDECAR: tauri.conf.json externalBin / shell-plugin; spawn lúc start; kill khi thoát; localhost port.
OFFLINE: sidecar fail → lỗi mềm, app KHÔNG crash (degraded mode). Soạn thảo vẫn chạy.
IPC TÊN KHỚP 2 PHÍA (invoke "x" ↔ #[command] fn x). Lệch = command not found.
GATE: cargo build (0) [cwd src-tauri/] · release (0) · launch · IPC trả về · offline không crash.
KHÔNG tự đảo sang Electron (§5). KHÔNG viết logic toán/UI — chỉ ghép.
```

## 7. Ranh giới — KHÔNG làm

| Không làm | Lý do |
|---|---|
| Viết logic SymPy/toán trong Rust | Đó là `backend-cas` (sidecar Python) |
| Viết UI/editor trong webview | Đó là `editor-frontend` |
| Tự đảo Tauri→Electron | [LOCKED] §5 — báo lead nếu toolchain phiền |
| Để app crash khi sidecar fail | Phải offline fallback (degraded mode) |
| Để sidecar mồ côi khi app đóng | Giữ handle, kill lúc thoát |
| Hard-code engine URL từ xa | Sidecar là đường **offline** cục bộ (§6) |
