# Handoff cho claude design — Sidebar trái + Library (Nib)

> Gửi kèm 3 file: **file này** (đọc TRƯỚC) · `docs/sidebar-design.md` (spec — nguồn sự thật) · `docs/sidebar-mockup.html` (chỉ minh hoạ ý tưởng).

## Đọc theo thứ tự ưu tiên

1. **`docs/sidebar-design.md` = NGUỒN SỰ THẬT.** IA, chức năng, trạng thái, i18n key, token — bám theo file này.
2. **`docs/requirements.md` §3 = bảng màu/token chính thức** (Teal Ink). Dùng token semantic, **cấm hex rời**.
3. **`docs/sidebar-mockup.html` = CHỈ để hiểu CẤU TRÚC/luồng**, KHÔNG phải visual spec.

## ⚠️ Quan trọng: vai trò của file HTML

`sidebar-mockup.html` được dựng **qua loa** chỉ để chốt *ý tưởng/luồng tương tác*, KHÔNG phải bản thiết kế cuối. **ĐỪNG bê nguyên xi.** Cụ thể:

- **GIỮ (locked — đừng đổi cấu trúc):**
  - 3 bề mặt: top-bar doc switcher · sidebar rail (flat list, KHÔNG folder) · Library = overlay riêng (KHÔNG fullscreen-state-của-sidebar).
  - Đã bỏ hẳn section "tài liệu hiện tại"; tên doc + switcher ở top-bar.
  - Library preview = snippet text/LaTeX, KHÔNG phải screenshot/thumbnail "trang" (Nib là canvas free-placement, không có trang).
  - Management MVP: rename · xoá (có confirm) · duplicate · sort · search. KHÔNG folder. Tag = tương lai.
  - Token Teal Ink + light/dark + hit target ≥44px + song ngữ en/vi.

- **HÃY THIẾT KẾ LẠI (mockup làm sơ sài, mong bạn nâng cấp):**
  - Toàn bộ tinh chỉnh thị giác: spacing, typography scale, độ nét icon, empty state, hover/active/focus state, micro-interaction.
  - Animation chuyển cảnh rail↔Library (mockup chỉ fade thô) — tôn trọng `prefers-reduced-motion`.
  - Responsive 4 breakpoint (sub-compact 820 / compact / regular / wide) + rail icon-only collapsed — mockup CHƯA làm.
  - Modal xác nhận xoá, context-menu (⋯), inline-rename state — mockup chỉ để placeholder.
  - Layout List view của Library, preview card đẹp hơn.
  - Bố cục top-bar cho gọn, cân đối với phần còn lại của app (đã có UnifiedDock bên phải).

## Bối cảnh app (để thiết kế ăn nhập)

Nib = "notepad toán học sống" desktop-class: canvas giấy-kẻ-ngang, block toán/chữ/bút đặt tự do; đã có **UnifiedDock** (thanh công cụ dọc nổi bên phải) + vỏ Tauri 2. Sidebar này là phần **document management** (đa tài liệu) mới thêm. Phong cách: mực bút máy (teal), giấy ấm, tối giản, session làm việc dài.

## 4 điểm kỹ thuật còn mở (không cần bạn quyết — chỉ để biết)

Lưu trữ doc-list, overlay-vs-route, multi-doc state, cách sinh preview snippet — đã ghi ở `sidebar-design.md §10`, để architect xử khi build. Bạn cứ thiết kế UI; không bị chặn bởi mấy cái này.
