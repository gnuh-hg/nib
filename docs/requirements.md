# Nib — Yêu cầu nền (app-wide requirements)

> Các yêu cầu **bắt buộc, xuyên suốt mọi trang/feature** của Nib (notepad toán học sống).
> Khác với `feature.md` (tính năng lõi): file này là _ràng buộc nền_ — mọi block UI mới phải thoả 3 mục dưới.
> Mục đánh dấu **[LOCKED]** là đã chốt; phần bảng màu cuối file là **root màu chính thức** — không tự đổi giá trị hex, chỉ thêm token mới.

---

## 1. Song ngữ — Tiếng Anh & Tiếng Việt **[LOCKED]**

- App hỗ trợ **2 ngôn ngữ: `en` và `vi`**, chuyển được runtime (không cần reload).
- **Mọi chuỗi hiển thị đi qua lớp i18n** — cấm hardcode text trong component. Thêm chuỗi mới = cập nhật **cả hai** file locale cùng lúc.
- Cấu trúc: `src/locales/en.json` + `src/locales/vi.json` (key phẳng theo namespace, vd `editor.block.add`).
- **Ngôn ngữ mặc định:** theo `navigator.language`, fallback `en`. Lựa chọn của user lưu persistent (localStorage / Tauri store).
- Phạm vi dịch: UI chrome (menu, nút, tooltip, toast, settings, thông báo lỗi). **Không dịch** nội dung toán của user và LaTeX.
- Số/đơn vị: tôn trọng locale khi hiển thị _văn bản_; **kết quả toán giữ nguyên** (dấu thập phân theo convention toán, không bản địa hoá phá nghĩa).

## 2. Giao diện theo thiết bị đích **[LOCKED]**

Thiết bị đích (theo CLAUDE.md §3): **desktop-class, màn lớn** — laptop, iPad Pro, Surface, laptop cảm ứng. **KHÔNG tối ưu cho điện thoại.**

- **Chỉ hỗ trợ landscape (ngang), min-width 1024px.** [USER CHỐT 2026-06-17] **KHÔNG hỗ trợ portrait / sub-compact** (bỏ ngưỡng 820px + breakpoint sub-compact của iPad Pro 11" dọc trước đây). Dưới 1024px **hoặc** đang ở portrait → hiển thị thông báo "xoay ngang / dùng màn lớn hơn" thay vì cố co layout.
- **Breakpoints (landscape, ≥1024px):**
  | Tên | Range | Thiết bị tiêu biểu |
  |---|---|---|
  | `compact` | 1024–1279 | iPad Pro ngang, tablet 2-in-1 |
  | `regular` | 1280–1679 | laptop 13–15" |
  | `wide` | ≥ 1680 | màn ngoài, Surface Studio |
- **3 phương thức nhập đồng thời phải đều mượt:** chuột+phím / cảm ứng / bút (stylus).
  - Hit target tối thiểu **44×44px** cho mọi nút (chạm + bút).
  - Có **pointer media query** (`hover`, `pointer: fine/coarse`) để chỉnh affordance: máy cảm ứng/bút → target lớn hơn, ít hover-only UI.
  - Đường **bút** (handwriting) chỉ kích hoạt khi `pointer: coarse`/pen detected — không chiếm chỗ trên máy chỉ có chuột.
- Layout document-block phải **co giãn theo bề rộng** (kết quả render cạnh/dưới block tuỳ không gian), không vỡ ở `compact`.
- Tôn trọng `prefers-reduced-motion`.

## 3. Sáng / Tối + Root màu **[LOCKED]**

- **3 chế độ theme:** `light`, `dark`, `system` (mặc định = `system`, bám `prefers-color-scheme`).
- Lựa chọn lưu persistent; chuyển theme **không reload**, không nháy trắng (set theme trước first paint).
- **Mọi màu trong app đọc từ CSS custom property** (token semantic) — **cấm hex rời rạc** trong component. Theme = đổi giá trị token ở `:root` / `[data-theme="dark"]`.
- Phải đạt tương phản text/nền **WCAG AA** (≥ 4.5:1 cho text thường).

### Vì sao bảng màu này (xuất phát từ app, không phải chọn đại)

Màu được suy ra từ **bản chất Nib**, không gắn random:

1. **Tên "Nib" = ngòi bút máy → mực trên giấy.** Đây là identity gốc: viết tay, mực, sự chính xác, thủ công. → **Màu chủ đạo = Teal Ink** (xanh ngọc — một họ mực bút máy rất phổ biến: Quink, Diamine teal…). Vẫn là "mực" đúng brand, nhưng **kỹ thuật/hiện đại hơn xanh dương cổ điển**, ít generic. Teal mang nghĩa *chính xác · điềm tĩnh · kỹ thuật* — hợp app tính toán + session dài.
2. **Session làm việc dài, tập trung** → nền **giấy ấm** (không phải `#FFF` chói), dark mode **graphite ấm** (không phải đen tuyền — đen tuyền + text dày gây mỏi/nhòe). Chroma thấp ở UI chrome để mắt không mệt.
3. **Input ≠ kết quả tính** phải tách được bằng mắt khi lướt tài liệu dài → input (gõ) màu **ink-black**, nét bút màu **teal mực**; kết quả symbolic màu **indigo/violet** — hue **khác hẳn teal** để output không lẫn vào input/brand.
4. **Exact ≠ approximate** (§8.3 SymPy fallback sang số) → kết quả số gần đúng đánh dấu **amber** ("đây là làm tròn, KHÔNG phải nghiệm chính xác"). Đây là nhu cầu màu **đặc thù của app này**, không phải trang trí.

**Mỗi hue có một việc** (không hue thừa):

| Hue | Vai trò | Lý do bám app |
|---|---|---|
| **Teal Ink** (chủ đạo) | brand · nút chính · caret/cursor · link · nét bút · info | tên = ngòi bút; teal = mực kỹ thuật, chính xác |
| **Paper / Graphite** | nền + chữ | cảm giác notepad, đỡ mỏi mắt session dài |
| **Indigo/Violet** | kết quả symbolic exact | tách hẳn teal → mắt phân biệt input ↔ output |
| **Green** | success | "đã xong / đúng" (trạng thái, tách khỏi result) |
| **Amber** | kết quả số gần đúng + warning | báo "làm tròn, không exact" (§8.3) |
| **Red** | lỗi parse / không tính được | — |

> Vì brand đã là teal, **result KHÔNG dùng teal/green** (sẽ lẫn) → result = indigo/violet. Green để dành riêng cho status success. Amber chung cho "approx" và "warning" — cố ý: amber = chừng-chừng/cẩn thận.

### Root màu chính thức (design tokens)

Token **semantic** (theo vai trò, không theo màu). Đặt tại `src/styles/tokens.css`, áp bằng `data-theme` trên `<html>`.

```css
:root,
[data-theme="light"] {
  /* Nền — "giấy" ấm, KHÔNG #FFF chói (đỡ mỏi mắt session dài) */
  --bg-app:        #F3F1EC;  /* mặt bàn / canvas — đậm hơn block 1 chút để block "nổi" */
  --bg-surface:    #FBFAF7;  /* mặt block toán — giấy ấm */
  --bg-elevated:   #FFFFFF;  /* popover/menu nổi (kèm shadow) */
  --bg-subtle:     #ECEAE4;  /* vùng phụ, input nền chìm */

  /* Chữ — "ink-black" hơi ngả xanh (mực blue-black) */
  --text-primary:   #1A1C20;
  --text-secondary: #4A4E57;
  --text-muted:     #868A92;
  --text-on-accent: #FFFFFF;

  /* Viền */
  --border:        #E3DFD7;
  --border-strong: #CBC6BC;

  /* ===== Teal Ink — màu chủ đạo (brand + tương tác) ===== */
  --accent:        #0E7C86;  /* xanh ngọc mực bút máy */
  --accent-hover:  #0A5F67;
  --accent-subtle: #DEF1F2;  /* nền nhạt vùng accent / text-selection */
  --caret:         #0E7C86;  /* con trỏ nhập */

  /* Mực viết tay (stylus stroke) — teal sâu hơn cho ra "mực ướt" */
  --ink:           #0A5A62;

  /* Kết quả symbolic EXACT (indigo/violet — KHÁC teal để tách input↔output) */
  --result:        #4B3FBF;
  --result-subtle: #ECEAFB;

  /* Kết quả số GẦN ĐÚNG / numeric fallback (amber = làm tròn, không exact) */
  --approx:        #9A6A11;
  --approx-subtle: #FBF1DC;

  /* Trạng thái */
  --success: #137A52;  /* green — tách khỏi result (result đã là indigo) */
  --warning: #9A6A11;  /* = approx */
  --error:   #B42318;
  --info:    #0E7C86;  /* = accent teal */

  /* Hình khối */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-1: 0 1px 2px rgba(20,24,40,.06), 0 1px 1px rgba(20,24,40,.04);
  --shadow-2: 0 4px 16px rgba(20,24,40,.10);
}

[data-theme="dark"] {
  /* Graphite ấm — KHÔNG đen tuyền */
  --bg-app:        #15171A;
  --bg-surface:    #1D2024;  /* block sáng hơn nền 1 bậc */
  --bg-elevated:   #24282D;
  --bg-subtle:     #282C31;

  --text-primary:   #E8E6E1;  /* off-white ấm, không #FFF chói */
  --text-secondary: #ABAEB4;
  --text-muted:     #767A81;
  --text-on-accent: #0C111B;  /* accent dark mode sáng → chữ trên nút phải tối */

  --border:        #30343A;
  --border-strong: #434851;

  /* Teal Ink sáng lên cho đọc được trên nền tối */
  --accent:        #3FB6BE;
  --accent-hover:  #5FCBD2;
  --accent-subtle: #103438;
  --caret:         #5FD4DC;

  --ink:           #4FC9D1;  /* mực teal "phát sáng" trên giấy tối */

  --result:        #9A8CF0;  /* indigo/violet sáng — khác teal */
  --result-subtle: #211E3A;

  --approx:        #D6A53E;
  --approx-subtle: #2E2613;

  --success: #3FBE85;  /* green */
  --warning: #D6A53E;
  --error:   #E5675B;
  --info:    #3FB6BE;

  --shadow-1: 0 1px 2px rgba(0,0,0,.40);
  --shadow-2: 0 4px 20px rgba(0,0,0,.55);
}
```

**Quy ước dùng token:**
- Nền app → `--bg-app`; mặt block → `--bg-surface`; menu/popover nổi → `--bg-elevated` + `--shadow-2`.
- **Input** (gõ) → `--text-primary`; **nét bút** → `--ink` (tách khỏi accent để sau khi convert mực→toán vẫn thấy nguồn); caret → `--caret`.
- **Kết quả symbolic exact** → `--result` (+ chip nền `--result-subtle`) để mắt tách input ↔ output.
- **Kết quả số gần đúng / numeric fallback (§8.3)** → `--approx` (+ `--approx-subtle`) — BẮT BUỘC khác màu exact để user biết "đây là làm tròn".
- Nút chính / link / block đang active / con trỏ → `--accent` (Ink Blue, màu chủ đạo).

---

> _Để làm rõ ở chat sau:_ token typography/spacing đầy đủ, cơ chế lưu preference (localStorage vs Tauri store), thông báo "màn nhỏ", danh sách key i18n cho từng màn.
