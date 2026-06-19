# Nib — Nav-Dock Redesign (drill-down dock + thin top strip)

> Tầng thiết kế UI/UX (WHAT) cho việc **gom điều hướng vào dock duy nhất + bỏ header/sidebar cũ**.
> Quan hệ tài liệu: `requirements.md` (nền [LOCKED]) → `feature.md` (tính năng) → `design.md` (UI/UX nền) → **file này** (redesign điều hướng).
> Nguồn: phiên thảo luận team `nav-redesign` (researcher nav-patterns + ia-reconcile + critique-risk, 2 vòng R1 độc lập + R2 hội tụ) + 7 quyết định [USER CHỐT] qua AskUserQuestion (2026-06-18).
> Trạng thái: **WHAT đã chốt — chưa build.** Còn 1 mục khuyến nghị mở (theme quick-toggle, §7).

---

## 0. Một câu

Thay **TopChrome (header) + SidebarRail (sidebar)** bằng **MỘT dock duy nhất dạng drill-down** (chính là `UnifiedDock` hiện tại được tái cấu trúc) + **một strip mỏng trên cùng** (chỉ tên doc + undo/redo + đổi doc nhanh). Library overlay GIỮ NGUYÊN.

---

## 1. Mô hình "drill-down dock" — [USER CHỐT]

Dock **KHÔNG phải 2 dock**. Là **một** dock (UnifiedDock chỉnh UI/UX), **nổi + kéo-thả như hiện tại**, có **2 cấp (level)**:

### Level 1 — NAV (cấp gốc)
Hiển thị các nút điều hướng app-level:

```
[Thư viện] [Cài đặt] [Gõ] [Viết] [Help]   …   [avatar account]
```

- **Gõ** và **Viết** = 2 nút riêng (THAY cho ModeToggle Gõ↔Bút cũ — xoá ModeToggle).
- **account chip** = avatar tròn + tên user (cuối nhóm nav). Click → menu account (MVP = vào Cài đặt). KHÔNG bo góc lõm (xem §6).

### Level 2 — TOOLS (drill vào theo mode)
- Bấm **Gõ** → dock chuyển sang **bộ công cụ mode type** (Convert · Format · Tính · …) **và canvas vào mode gõ**.
- Bấm **Viết** → dock chuyển sang **bộ công cụ mode pen** (Pointer/Select/Pen · Size · Color · Tính · …) **và canvas vào mode bút**.
- Ở level TOOLS luôn có nút **Back (← Quay lại)** ở đầu → trở về level NAV.

```
TOOLS (type):  [← Back] [Convert] [Format] … [Tính]
TOOLS (pen):   [← Back] [Pointer] [Select] [Pen] [Size] [Color] … [Tính]
```

### Vì sao mô hình này sạch
- **"Gõ/Viết" = mode entry point** → không còn ModeToggle → **1 nguồn truth duy nhất** cho mode (giải lo ngại R2 "2 nguồn truth `nib-dock-mode`").
- **"Back" luôn có nghĩa** vì là *drill-up trong dock*, KHÔNG phải browser history (Tauri 1 cửa sổ không có history). Back chỉ tồn tại ở level TOOLS → không có "nút chết" trên canvas (giải lo ngại R2 "Back mồ côi").

### State & persist
- Thêm state `dockLevel: 'nav' | 'tools'`; mode `type | pen` tái dùng key cũ `nib-dock-mode`.
- Khi vào TOOLS, `nib-dock-mode` = type/pen theo nút đã bấm.
- Persist key cũ giữ: `nib-dock-collapsed`, `nib-dock-pos`. Đề xuất thêm `nib-dock-level` (khởi động về `nav` cho dễ định hướng, HOẶC nhớ level cuối — chốt khi build).
- Collapse: ở **mọi level** vẫn collapse được về ô vuông (như hiện tại). Khi collapse → bung lại về level đang đứng.

---

## 2. Thanh strip mỏng trên cùng — [USER CHỐT: giữ strip]

Thay TopChrome đầy đủ bằng **strip rất gọn**, full-width trên cùng. Chỉ chứa:

```
[≡ tên tài liệu ▾]            …spacer…            [⟲ undo] [⟳ redo]
```

- **Tên tài liệu** = inline-rename + **dropdown đổi doc nhanh** (recent docs + "Xem tất cả" → mở Library overlay). Đây là nơi thay quick-switch của SidebarRail đã bỏ (pattern đã có ở `sidebar-design.md §4.1`, giờ đặt trong strip thay vì top-bar đầy đủ).
- **undo / redo** = đặt ở strip (gần canvas, tần suất cao). KHÔNG vào dock (nav = điểm đến, undo = phản xạ), KHÔNG vào Settings.
- **KHÔNG** chứa: logo, tên "Nib", ⌘K-badge (giữ phím tắt Ctrl/Cmd+K), rail-toggle (bỏ rail).

> Lý do giữ strip thay vì "dock-only 100%": undo/redo + quick-switch doc cần affordance nhìn thấy cho user laptop-chuột; nhồi vào dock drill-down làm sâu thao tác. Cả 3 researcher hội tụ điểm này; user chọn "giữ strip mỏng".

---

## 3. Bỏ gì — Giữ gì

| Thành phần | Số phận |
|---|---|
| `TopChrome.tsx` (header đầy đủ) | **THAY** bằng strip mỏng §2 (component mới, vd `TopStrip.tsx`) |
| `SidebarRail/` (sidebar trái) | **BỎ** — quick-switch doc dời vào dropdown tên doc ở strip |
| `UnifiedDock/` | **TÁI CẤU TRÚC** thành drill-down dock §1 (giữ toàn bộ tool code; thêm level NAV; xoá ModeToggle) |
| `LibraryOverlay/` | **GIỮ NGUYÊN** (UI/UX library không đổi — user xác nhận) |
| `CommandPalette` (Ctrl+K) | **GIỮ** (phím tắt; bỏ nút badge ở header) |
| ModeToggle (trong dock) | **XOÁ** — thay bằng 2 nút Gõ/Viết ở level NAV |

---

## 4. Bảng homing — từng item TopChrome cũ đi đâu

| Item cũ | Đi đâu |
|---|---|
| Logo + "Nib" | Bỏ (không cần luôn hiện) |
| rail-toggle | Bỏ (bỏ sidebar) |
| **tên tài liệu** | **Strip** (inline-rename + dropdown switch) |
| **undo / redo** | **Strip** (cạnh phải) |
| ⌘K badge | Bỏ nút; giữ phím tắt Ctrl/Cmd+K |
| **lang** | **Cài đặt** (ít đổi) |
| **theme** | **Cài đặt** (user OK) — *xem khuyến nghị §7: cân nhắc thêm quick-toggle* |

---

## 5. Cài đặt (Settings) — bề mặt mới

Mở từ nút **Cài đặt** ở level NAV → overlay/panel (cùng kiểu Library: scrim + panel, có nút Đóng/← trong header overlay, KHÔNG cần slot Back thường trực trên dock).

MVP chứa tối thiểu: **Ngôn ngữ (en/vi)** · **Theme (light/dark/system)** · (chỗ cho account/profile local sau).

---

## 6. Account chip — [USER CHỐT: avatar đơn giản, trong dock]

- **Hình dạng:** avatar tròn (~32px) + tên user truncate. **KHÔNG** làm bo góc lõm bất đối xứng.
  - *Lý do kỹ thuật:* góc lõm (concave) KHÔNG làm được bằng `border-radius` (chỉ bo lồi). `corner-shape: scoop` chỉ có Chrome 139+; **webview Tauri (WebKitGTK Linux / WKWebView macOS) chưa hỗ trợ** → phải SVG `clip-path` thủ công, dễ vỡ khi đổi theme/đổi kích thước. Không tương xứng lợi ích (trang trí thuần).
- **Vị trí:** cuối nhóm NAV trong dock (không phải khối nổi riêng).
- **Chức năng MVP:** Nib chưa có auth/user system → avatar = placeholder + tên local (tự nhập trong Cài đặt). Click → menu nhỏ (MVP: vào Cài đặt). KHÔNG thêm data/auth layer cho MVP.

---

## 7. Khuyến nghị còn mở — theme quick-toggle

User chọn đưa **cả lang + theme vào Cài đặt**. Cả 3 researcher khuyến nghị **GIỮ thêm 1 theme quick-toggle** (theme đổi theo ánh sáng phòng, vài lần/ngày; chôn 2 lớp trong Settings = phá luồng; theme là yêu cầu nền [LOCKED] §3).

→ **Đề xuất:** vẫn để theme trong Cài đặt, **NHƯNG thêm 1 icon theme-toggle ở strip** (góc phải, cạnh undo/redo — kiểu status bar VSCode). Rẻ, 1 click. **Chờ user duyệt** (mục mở duy nhất).

---

## 8. Tuân thủ 3 yêu cầu nền [LOCKED]

- **Song ngữ en/vi:** mọi label/tooltip dock + strip + account qua i18n (key đề xuất §9). Account name không dịch.
- **Landscape ≥1024px:** strip + dock nổi không vỡ ở compact 1024–1279. Vì là **1 dock** (không phải 2 panel) → không tốn thêm real-estate; bỏ sidebar còn nới canvas. Account chip trong dock → không thêm vật nổi.
- **Theme + token:** mọi màu dock/strip/account từ token semantic (cấm hex rời). Account avatar nền/viền dùng token.
- **Hit target ≥44px [LOCKED]:** nav-dock MỚI **không có HTML reference** (khác dock-v2 "HTML thắng") → **phải đạt ≥44px ngay từ thiết kế** (cảnh báo critique-risk). undo/redo + nút strip cũng ≥44px hit area.

---

## 9. i18n keys đề xuất (cập nhật cả en.json + vi.json)

```
dock.nav.library      "Library"            / "Thư viện"
dock.nav.settings     "Settings"           / "Cài đặt"
dock.nav.type         "Type"               / "Gõ"
dock.nav.write        "Write"              / "Viết"
dock.nav.help         "Help"               / "Trợ giúp"
dock.nav.account      "Account"            / "Tài khoản"
dock.back             "Back"               / "Quay lại"
strip.rename_doc      "Rename document"    / "Đổi tên tài liệu"
strip.switch_doc      "Switch document"    / "Đổi tài liệu"
strip.view_all        "View all"           / "Xem tất cả"
strip.undo            "Undo"               / "Hoàn tác"
strip.redo            "Redo"               / "Làm lại"
settings.title        "Settings"           / "Cài đặt"
settings.language     "Language"           / "Ngôn ngữ"
settings.theme        "Theme"              / "Giao diện"
```
(Một số `dock.*` cũ tái dùng: `dock.convert`, `dock.format`, `dock.calc`, pen tools…)

---

## 10. Câu hỏi cho architect (chặn HOW, chưa làm)

1. **Dock state machine 2 level:** cấu trúc `dockLevel` + `mode` + collapse tương tác thế nào? Khởi động về `nav` hay nhớ level cuối? Transition animation (slide nav↔tools)?
2. **Xoá ModeToggle an toàn:** ModeToggle đang được test (trong 50 vitest). Gỡ + thay bằng Gõ/Viết entry cần cập nhật test nào?
3. **TopStrip vs Workspace layout:** strip thay TopChrome trong `Workspace.tsx` (full-width trên, dưới là canvas — bỏ row sidebar). Provider/EditorContext vẫn bao dock + palette (constraint cũ).
4. **Dropdown đổi doc trong strip:** data source doc-list (hiện mock `mockDocs.ts`); cache recent; quan hệ với `activeDocId` ở AppShell.
5. **Theme quick-toggle (§7):** chốt có thêm vào strip không.
6. **Undo/redo nguồn:** ProseMirror history vs MathLive undo (unified undo manager `feature.md §11.5` chưa chốt) — undo ở strip gọi cái nào.

---

## 11. Lật quyết định cũ — để biết mình đang đổi gì

- `context.md 2026-06-13`: "UnifiedDock là tool surface DUY NHẤT" → vẫn đúng (1 dock), nhưng dock giờ **kiêm cả nav** (drill-down), không chỉ tool.
- `sidebar-design.md`: "doc switcher → top-bar đầy đủ" → đổi thành **strip mỏng** (chỉ doc-title + undo/redo), nhẹ hơn; quick-switch giữ qua dropdown.
- `nib-editor-rebuild 2026-06-17`: header full-width TopChrome → **THAY** bằng TopStrip mỏng; SidebarRail → **BỎ**.
