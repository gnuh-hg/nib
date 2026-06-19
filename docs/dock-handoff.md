# Handoff — Unified Tool Dock (Nib)

> **Mục đích file này:** brief tự-chứa để gửi cho một phiên thiết kế/dựng UI khác ("claude design").
> Người nhận **chưa biết gì** về Nib — đọc hết trước khi dựng. Mọi quyết định trong "§2 Quyết định đã chốt" là **bất biến**, không tự đổi.
> Nguồn: tổng hợp từ team `toolbar-redesign` (researcher → planner → architect), đã được owner duyệt.

---

## 0. Nib là gì (1 đoạn)

Nib = "notepad toán học sống" desktop-class: viết tay (bút) **hoặc** gõ công thức vào một canvas giấy-kẻ-ngang, app tính symbolic ngay tại chỗ (đạo hàm/tích phân ra hàm, số học exact không làm tròn, giải phương trình). Tài liệu gồm các **block** đặt tự do trên canvas; mỗi block là math / text / ink (nét bút). Stack: React + TypeScript + Vite, editor TipTap/ProseMirror, math editor MathLive.

## 1. Việc cần làm (1 câu)

Thay thế **2 thanh công cụ rời** hiện tại (FloatingToolbar ngữ-cảnh ẩn-hiện + PenPalette riêng) bằng **MỘT vertical tool dock duy nhất, luôn hiện**, gộp hết tùy chọn, không phân biệt loại block, click bung popover.

### Vì sao (vấn đề của bản cũ)
- FloatingToolbar **ẩn** khi không chọn block → user không biết tùy chọn tồn tại.
- PenPalette **ẩn** trên máy chỉ-chuột → bộ công cụ phân tán 2 nơi.
- Owner đã thấy một bản mockup "khá ổn về hình dáng" nhưng **các option chưa được làm rõ nên sai** → file này chốt lại đúng từng option.

---

## 2. Quyết định đã chốt (BẤT BIẾN — không tự đổi)

1. **Thay thế hẳn** — dock là nơi DUY NHẤT chứa tùy chọn. Nhóm ngữ-cảnh "Khi chọn block" **mọc thêm vào chính dock** (không phải một toolbar nổi riêng). Bỏ hẳn FloatingToolbar + PenPalette cũ.
2. **Format-cần-selection vào popover** — B/I/U/S + cỡ chữ gom vào popover "Định dạng" (chỉ hiện khi chọn block). Toggle `exact ↔ decimal` **giữ inline cạnh kết quả**, KHÔNG vào dock.
3. **Nút chuyển chế độ "Gõ ⇄ Bút"** ngay trên dock — đổi giữa bộ tùy chọn cho gõ và cho bút. **KHÔNG ẩn theo thiết bị** (luôn hiện cả trên máy không có bút).
4. **Bộ công cụ vẽ = Chọn · Bút · Dạ quang · Tẩy** (Lasso nằm trong flyout của "Chọn"; KHÔNG có bút chì).
5. **Màu mực = 8 màu** (giữ nguyên bộ swatch hiện có, không rút về 5).

---

## 3. Hình dáng & hành vi tổng thể

- Hộp **dọc**, bo góc `--radius-md` (10px), **nổi** (`--bg-elevated` + `--shadow-2`), luôn hiện.
- **Kéo thả tự do** trên canvas qua drag-handle ⋮⋮ ở đầu; lưu vị trí (persistent).
- 2 trạng thái: **Mở rộng** (mặc định) / **Thu gọn in-place** (gập còn icon tối thiểu).
- Mọi nút **hit target ≥ 44×44px**. Mọi chuỗi qua i18n (en/vi). Mọi màu/spacing qua design token — **cấm hex rời**.

### Cấu trúc 6 nhóm (trên → xuống)

```
┌──────────────────┐
│  ⋮⋮  Kéo thả     │  A — cố định
│  [Gõ] | [Bút]   │  A — nút chuyển chế độ (segmented)
├──────────────────┤
│  ↕  Chọn  ▸     │  B — CHỈ hiện ở chế độ BÚT
│  ✒  Bút         │     ("Chọn" có chevron ▸ mở flyout: Lasso)
│  🖊 Dạ quang     │
│  ⌫  Tẩy         │
│  ─────           │
│  ≡  Cỡ nét  ▸   │     popover (Mảnh/Vừa/Đậm)
│  ●  Màu mực ▸   │     popover (8 màu) — màu NÉT BÚT
├ ─ ─ ─ ─ ─ ─ ─ ─┤
│  ⇄  Convert      │  C — NGỮ CẢNH, mọc khi có block được chọn
│  T  Định dạng ▸ │     popover; ẩn với ink
│  ●  Màu khối ▸  │     popover (8 màu) — màu CHỮ/NHẤN; ẩn với ink & kết quả
│  ⧉  Copy         │     ẩn với text & ink
│  ⎘  Nhân đôi    │
│  🗑 Xoá  (đỏ)    │
├──────────────────┤
│  [ = Tính ]  ③  │  D — luôn hiện; badge ③ = số block khi chọn nhiều
├──────────────────┤
│  ‹  Thu gọn      │  E — luôn hiện
└──────────────────┘
```
- **Chế độ Gõ:** ẩn hẳn nhóm B → dock ngắn lại (A + C-nếu-có-block + D + E).
- **Chế độ Bút:** hiện đầy đủ nhóm B.

---

## 4. Bảng TẤT CẢ option (phần quan trọng nhất — "làm rõ" để không còn sai)

| Option | Nhóm | Chế độ | Hiện khi | Áp cho block | Hành vi |
|---|---|---|---|---|---|
| **Kéo thả ⋮⋮** | A | cả hai | luôn | — | Drag di chuyển dock, thả → lưu vị trí |
| **Toggle Gõ/Bút** | A | cả hai | luôn | — | Đổi chế độ; segment active nền `--accent-subtle` |
| **Chọn** | B | Bút | luôn (mode Bút) | — | Công cụ chọn/di chuyển block; chevron ▸ → flyout (Lasso). 1 tool active mỗi lúc |
| **Lasso** | B (flyout) | Bút | trong flyout "Chọn" | — | Chọn vùng tự do nhiều block/nét |
| **Bút** | B | Bút | luôn (mode Bút) | tạo ink | Vẽ nét mực; tool mặc định khi vào mode Bút |
| **Dạ quang** | B | Bút | luôn (mode Bút) | tạo ink | Nét highlight trong suốt |
| **Tẩy** | B | Bút | luôn (mode Bút) | xóa ink | Stroke-eraser (tẩy từng nét) |
| **Cỡ nét** | B | Bút | luôn (mode Bút) | ink | Popover: Mảnh 2px / Vừa 4px / Đậm 6px |
| **Màu mực** | B | Bút | luôn (mode Bút) | ink stroke | Popover 8 màu. ⚠️ = màu NÉT BÚT, khác "Màu khối" |
| **Convert** | C | cả hai | có block | text/math/ink | text→Toán; math→Chữ; ink→"Dùng làm Toán"/"Dùng làm Phác thảo" |
| **Định dạng** | C | cả hai | có block (ẩn với ink) | text/math | Popover (xem §5.3) |
| **Màu khối** | C | cả hai | có block (ẩn với ink & kết-quả) | text/math | Popover 8 màu, áp màu chữ/nhấn block. ⚠️ khác "Màu mực" |
| **Copy** | C | cả hai | block math | math | editing→copy LaTeX; result→copy kết quả. Ẩn với text/ink |
| **Nhân đôi** | C | cả hai | có block | text/math/ink | Clone block xuống dưới, bản sao thành active |
| **Xoá** | C | cả hai | có block | text/math/ink | Xóa block (màu `--error`), không hỏi xác nhận, undo được |
| **Tính** | D | cả hai | LUÔN | math/ink | Xem §5.1 (disabled / label / badge) |
| **Thu gọn ⇌** | E | cả hai | luôn | — | Gập/mở dock in-place (xem §5.2) |

**Lưu ý quan trọng (các điểm "trước đây sai"):**
- **Recalc gộp vào nút Tính** — không phải nút riêng; label đổi theo trạng thái block.
- **H1/H2/H3 đổi tên → Lớn / Thường / Nhỏ** (rõ nghĩa hơn).
- **"Màu mực" ≠ "Màu khối"** — phải khác icon/tooltip rõ ràng.
- **toggle exact↔decimal KHÔNG ở dock** — giữ inline cạnh kết quả.

---

## 5. Trạng thái & popover

### 5.1 Nút Tính (D)
| Trạng thái | Hành vi |
|---|---|
| Không chọn block | Hiện nhưng **disabled** (mờ, `cursor:not-allowed`), tooltip "Chọn một block để tính" |
| Block math đang soạn / ink | Enabled, label **"Tính"** |
| Block đã có kết quả | Enabled, label **"Tính lại"** |
| Block text | Disabled (text không tính được) |
| Chọn nhiều block (N≥2) | Label "Tính (N)" + **badge số N**, tính lần lượt |

Nút Tính nổi bật nhất: nền `--accent`, to hơn các nút khác.

### 5.2 Thu gọn / mở rộng
- **Mở rộng** (mặc định): hiện đầy đủ các nhóm.
- **Thu gọn**: gập in-place còn drag-handle + nút Tính (icon, có badge nếu cần) + nút mở rộng `›`. Nhóm B & C ẩn. Lưu trạng thái.

### 5.3 Popover (bung sang trái dock; tự lật phải nếu dock ở sát mép trái; đóng khi click ngoài)
- **Cỡ nét:** Mảnh (2px) / Vừa (4px, mặc định) / Đậm (6px) — 1 active.
- **Màu mực:** 8 màu swatch (teal, blue, green, red, purple, rose, orange, slate) — áp nét bút.
- **Màu khối:** 8 màu swatch — áp `node.attrs.color` của block text/math.
- **Định dạng** (đổi theo loại block):
  - *text:* B / I / U / S (áp vùng chọn) + cỡ Lớn / Thường / Nhỏ (áp cả block).
  - *math:* Hiển thị to (Display) / Bình thường (Normal).
  - *ink:* trống → nút trigger disabled.

---

## 6. Chế độ Gõ ⇄ Bút
- **Mặc định theo thiết bị (runtime `pointerType`):** có bút/cảm-ứng → **Bút**; chỉ chuột → **Gõ**. Lưu lựa chọn.
- Nút toggle là segmented control 2 ô `[Gõ] | [Bút]` ở đầu dock, **luôn hiện mọi thiết bị**.
- Chế độ **Gõ**: ẩn nhóm B. Chế độ **Bút**: hiện nhóm B. Chuyển = chuyển tức thì (nhóm B fade 150ms).
- Trên máy không có bút mà chọn [Bút]: nhóm công cụ vẽ vẫn ẩn theo media-query, thêm tooltip gợi ý cắm bút.

---

## 7. Ba yêu cầu nền (BẮT BUỘC)
1. **Song ngữ en/vi** — mọi chuỗi qua i18n. Các key mới (`dock.*`) liệt kê ở §9; thêm vào cả `src/locales/en.json` + `vi.json`.
2. **Thiết bị desktop-class min 820px + 3 input** (chuột+phím / cảm ứng / bút) — hit target ≥44px, dùng `pointerType` runtime (không media-query đơn lẻ).
3. **Theme light/dark/system + design token** — mọi màu/spacing/radius/shadow đọc từ CSS custom property; **cấm hex rời, cấm hardcode text**.

---

## 8. Design token dùng (đã có sẵn trong `src/styles/tokens.css`)
| Token | Dùng cho |
|---|---|
| `--bg-elevated` / `--shadow-2` | nền + bóng dock & popover |
| `--border` | phân cách nhóm, viền popover |
| `--radius-md` (10) / `--radius-sm` (6) | bo góc dock+popover / nút+badge |
| `--accent` / `--accent-subtle` / `--accent-hover` | nút active, segment active, nút Tính, badge, hover |
| `--text-primary` / `--text-secondary` / `--text-muted` | label active / inactive / drag-handle |
| `--text-on-accent` | text trên nút Tính + badge |
| `--error` | nút Xoá |
| `--swatch-{teal,blue,green,red,purple,rose,orange,slate}` | 8 màu (Màu mực & Màu khối) |
| `--space-2` (8) / `--space-3` (12) | padding/khoảng cách |
> Màu kết quả (`--result` exact / `--approx` số gần đúng) **khóa**, user không đổi — không nằm trong swatch.

## 9. i18n keys mới (thêm en + vi)
```
dock.label, dock.mode_type ("Gõ"), dock.mode_pen ("Bút"),
dock.collapse, dock.expand, dock.calc ("Tính"), dock.recalc ("Tính lại"),
dock.calc_disabled_tip ("Chọn một block để tính"),
dock.convert, dock.format ("Định dạng"), dock.block_color ("Màu khối"),
dock.copy, dock.duplicate ("Nhân đôi"), dock.delete,
dock.stroke_size ("Cỡ nét"), dock.ink_color ("Màu mực"),
dock.select_tool ("Chọn"), dock.lasso_tool ("Lasso"),
dock.stroke_thin ("Mảnh"), dock.stroke_medium ("Vừa"), dock.stroke_thick ("Đậm"),
dock.multi_select_badge ("{{n}} block"),
dock.format_math_display ("Hiển thị to"), dock.format_math_normal ("Bình thường"),
dock.format_text_heading ("Lớn"), dock.format_text_body ("Thường"), dock.format_text_small ("Nhỏ"),
dock.pen_mode_no_device ("Đang ở chế độ Bút — cắm bút để vẽ")
```
Các key đã có tái dùng được: `toolbar.bold/italic/underline/strike`, `pen.pen/highlighter/eraser`.

---

## 10. Phụ lục kỹ thuật (nếu người nhận cũng dựng React — có thể bỏ qua nếu chỉ làm mockup)

**Component mới:** `UnifiedDock.tsx` + thư mục `UnifiedDock/` (`DockPopover`, `FormatPanel`, `BlockColorPanel`, `StrokeSizePanel`, `InkColorPanel`, `SelectToolFlyout`, `ModeToggle`) + `dock.css` + hook `useDockPrefs.ts`. Tái dùng `SwatchPicker.tsx`, `icons.tsx`.
**Sửa:** `blockActions.ts` (thêm `duplicateBlock`), `editor-context.ts` (thêm `activePenTool`/`setActivePenTool`), `Canvas.tsx` (mount UnifiedDock thay 2 component cũ + guard tạo-block khi tool=Chọn), locales, `icons.tsx` (thêm IconSelect/IconDragHandle/IconDuplicate/IconChevron).
**Xóa:** `FloatingToolbar.tsx`, `PenPalette.tsx`, `toolbar.css`, `pen.css`.
**State:** mode/collapsed/position → localStorage (`nib-dock-mode/-collapsed/-position`); activePenTool → EditorContext; openPopover/dragState/penSize/penColor → local. Re-render qua `editor.on('transaction'/'selectionUpdate')`.

**Rủi ro cần lưu khi dựng:**
1. Dock overlay 52px che canvas trên iPad portrait 834px → overlay thuần, re-clamp vị trí khi resize, không đẩy margin canvas.
2. Popover lật hướng khi dock ở mép trái; touch không có hover → đóng bằng `pointerdown` ngoài. Flyout "Chọn" mở bằng chevron (KHÔNG long-press — đụng radial menu của bút).
3. `activePenTool` thêm vào EditorContext = breaking type → cập nhật default context value.
4. Drag dùng `setPointerCapture` + `touch-action:none`; release ở cả `pointerup` & `pointercancel`.
5. Undo sau Nhân đôi: MathLive stack vs ProseMirror history — focus PM trước khi dispatch; test case "tạo→gõ→nhân đôi→Ctrl+Z".

---

## 11. Tài liệu nền (đọc nếu cần ngữ cảnh sâu hơn)
- `docs/design.md` — hệ thống thiết kế Nib (responsive, canvas, màu, a11y, iconography). ⚠️ §4.1/§4.3/§4.4/§2.3 mô tả mô hình toolbar CŨ (ẩn-khi-không-active) — file handoff này **lật** điểm đó; design.md sẽ được cập nhật sau.
- `docs/requirements.md` — 3 yêu cầu nền [LOCKED].
- `docs/feature.md` — 2 đường nhập + state machine + output contract.
