// Nib — Tauri 2 app shell
//
// TODO sidecar (glue-packaging Session 3+):
//   - Spawn Python FastAPI+SymPy sidecar lúc khởi động
//   - Đăng ký IPC command: #[tauri::command] async fn eval(latex: String) -> Result<String, String>
//   - Kill sidecar khi app thoát (giữ handle)
//   - Offline fallback: sidecar fail → lỗi mềm (degraded mode), app KHÔNG crash
//
// Xem kiến trúc: CLAUDE.md §6, plan/tauri-shell/PLAN.md "Chừa chỗ sidecar"

// ---------------------------------------------------------------------------
// OS Keychain — secure token storage (Phase A.2)
// ---------------------------------------------------------------------------
// CONTRACT IPC (cho editor-frontend / tokenStore.ts):
//
//   save_token(token: string) → Promise<void>
//     - Lưu JWT token vào OS keychain.
//     - Throws string error nếu keychain daemon không khả dụng (Linux headless/tty).
//     - JS: catch(e) → fallback localStorage.
//
//   load_token() → Promise<string | null>
//     - Trả Some(token) nếu đã lưu, null nếu chưa lưu (NoEntry), Err nếu daemon down.
//     - JS: catch(e) → fallback localStorage.getItem.
//
//   clear_token() → Promise<void>
//     - Xóa token. Idempotent — không lỗi khi token chưa tồn tại.
//     - Throws string error nếu daemon không khả dụng.
//
// Hành vi khi keychain KHÔNG khả dụng (Linux headless, daemon chưa chạy, v.v.):
//   → Commands trả Err(String) mô tả lý do.
//   → Tầng JS (tokenStore.ts) bắt error và fallback sang localStorage.
//   → App KHÔNG crash — đây là degraded mode.
//
// Backend keyring:
//   Linux (default): zbus-secret-service → GNOME Keyring / KWallet qua D-Bus
//   Windows (default): Windows Credential Manager
//   macOS: cần feature "apple-native-keyring-store" khi build macOS
// ---------------------------------------------------------------------------

use keyring::Entry;

/// Định danh service trong OS keychain
const KEYRING_SERVICE: &str = "com.nib.app";
/// Định danh account/key trong OS keychain — giữ 1 slot duy nhất cho auth token
const KEYRING_ACCOUNT: &str = "nib-auth-token";

/// Lưu JWT token vào OS keychain.
/// Lỗi (String) nếu keychain daemon không khả dụng → tầng JS fallback localStorage.
#[tauri::command]
async fn save_token(token: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
            .map_err(|e| format!("keyring init error: {e}"))?;
        entry
            .set_password(&token)
            .map_err(|e| format!("keyring save error: {e}"))
    })
    .await
    .map_err(|e| format!("spawn_blocking error: {e}"))?
}

/// Tải JWT token từ OS keychain.
/// - Ok(Some(token)) → đã có token
/// - Ok(None) → chưa lưu (entry không tồn tại)
/// - Err(String) → keychain không khả dụng (daemon down, permission, v.v.)
#[tauri::command]
async fn load_token() -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
            .map_err(|e| format!("keyring init error: {e}"))?;
        match entry.get_password() {
            Ok(token) => Ok(Some(token)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("keyring load error: {e}")),
        }
    })
    .await
    .map_err(|e| format!("spawn_blocking error: {e}"))?
}

/// Xóa JWT token khỏi OS keychain. Idempotent — NoEntry được coi là Ok.
/// Lỗi (String) nếu keychain daemon không khả dụng.
#[tauri::command]
async fn clear_token() -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let entry = Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
            .map_err(|e| format!("keyring init error: {e}"))?;
        match entry.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()), // đã xóa hoặc chưa tồn tại = OK
            Err(e) => Err(format!("keyring clear error: {e}")),
        }
    })
    .await
    .map_err(|e| format!("spawn_blocking error: {e}"))?
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_token, load_token, clear_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
