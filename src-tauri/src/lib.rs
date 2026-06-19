// Nib — Tauri 2 app shell
//
// TODO sidecar (glue-packaging Session 3+):
//   - Spawn Python FastAPI+SymPy sidecar lúc khởi động
//   - Đăng ký IPC command: #[tauri::command] async fn eval(latex: String) -> Result<String, String>
//   - Kill sidecar khi app thoát (giữ handle)
//   - Offline fallback: sidecar fail → lỗi mềm (degraded mode), app KHÔNG crash
//
// Xem kiến trúc: CLAUDE.md §6, plan/tauri-shell/PLAN.md "Chừa chỗ sidecar"

pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
