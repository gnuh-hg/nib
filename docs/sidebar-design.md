# Nib — Sidebar trái + Library: Design Spec

> **Tầng:** thiết kế UI/UX (WHAT), không phải HOW kỹ thuật. Input cho architect + editor-frontend.
> **Vị trí trong chain tài liệu:**
> `docs/requirements.md` (ràng buộc nền [LOCKED]: song ngữ · thiết bị · theme/token)
> → `docs/feature.md` (đặc tả tính năng cốt lõi: 2 đường nhập, free-placement, block model)
> → `docs/design.md` (design system + canvas/active-block/result visual đã có)
> → **`docs/sidebar-design.md`** _(file này)_ — bổ sung **document management** (đa tài liệu): sidebar rail + top-bar switcher + Library surface.
>
> File này **KHÔNG thay thế** `docs/design.md` — nó là phần mở rộng IA mới (Nib trước đây giả định 1 document; giờ thêm multi-doc).
> Mọi block UI mới ở đây vẫn phải thoả **3 yêu cầu nền [LOCKED]** từ `requirements.md`: (1) song ngữ en/vi qua i18n, (2) desktop-class min 820px + 3 input (chuột+phím/cảm ứng/bút) + hit target ≥44px, (3) theme light/dark/system qua design token (cấm hex rời).

---

## 1. Tổng quan & 3 quyết định LOCKED

Trước đây Nib có khái niệm sidebar gộp "tài liệu hiện tại" (outline/nav trong-trang) + "toàn bộ tài liệu" (danh sách). User đã chốt tách hẳn, KHÔNG lật lại trong spec này:

1. **Bỏ section "tài liệu hiện tại" khỏi sidebar.** Sidebar trái = CHỈ danh sách tài liệu. Tên document đang mở + bộ chuyển doc dời lên **top app bar** (kiểu Google Docs title). Không có nav/outline/minimap trong-trang ở bản này (free-placement canvas không có "trang" để outline — xem `feature.md §2`).
2. **"Toàn bộ tài liệu" mở rộng = một bề mặt Library RIÊNG** (route hoặc overlay có nút Back), KHÔNG phải trạng thái fullscreen của sidebar. Sidebar (rail hẹp) chỉ là danh sách title gọn; mở rộng = chuyển hẳn sang Library.
3. **Library quản lý ĐẦY ĐỦ ở MVP**: rename, xoá, duplicate, sort, tìm kiếm, preview. Đây là lý do biện minh việc tách thành bề mặt riêng (nếu chỉ list thì không cần route riêng).
   > **[USER CHỐT cập nhật]**: BỎ folder/nhóm khỏi MVP. Sidebar rail phải là **danh sách phẳng (flat list)** title — folder/cây lồng nhau không tối ưu cho UI trạng thái rail thu gọn (chỉ-title). Tổ chức tài liệu tương lai dùng **tag** thay cho folder (xem §9 SAU MVP) — KHÔNG thiết kế tag ở bản này, chỉ note hướng đi.

Lý do nền (từ nghiên cứu hội tụ, không lật):
- Nib document = giấy kẻ ngang free-placement, KHÔNG phân trang → "page thumbnail" vô nghĩa. Đây là lý do loại bỏ ý tưởng viewer-thumbnail kiểu Word/Notion-page-icon.
- "Tài liệu hiện tại" trùng affordance với "toàn bộ tài liệu" (cả hai chỉ là list title) → mode confusion. Bỏ là đúng.
- Precedent ngành: Craft (toggle Document↔Folder), Apple Notes (list↔gallery), GoodNotes (Library màn riêng), Notion/Google Docs (library = route/overlay riêng cho management) — Library-as-separate-surface là pattern chuẩn cho doc-management apps.
- Bài học `toolbar-redesign` (2026-06-13, memory): nhồi nhiều khái niệm vào 1 component → "option chưa rõ nên sai". Ở đây áp dụng ngược lại: **tách rõ 3 bề mặt theo trách nhiệm**, không nhồi quản lý đầy đủ vào 1 rail hẹp.

---

## 2. IA tổng — 3 bề mặt

```
┌─────────────────────────────────────────────────────────┐
│ TOP APP BAR                                               │
│ [rail-toggle] [doc-icon] "Tên tài liệu đang mở" [▾ switcher] │
└─────────────────────────────────────────────────────────┘
┌────────┬────────────────────────────────────────────────┐
│ SIDEBAR│                                                  │
│ RAIL   │              CANVAS (free-placement)             │
│ (danh  │                                                  │
│  sách  │                                                  │
│  gọn)  │                                                  │
│        │                                                  │
│ [+New] │                                                  │
│[⊞Mở TV]│                                                  │
└────────┴────────────────────────────────────────────────┘

Click [⊞ Mở thư viện] hoặc ▾ switcher → "Xem tất cả" / [rail-toggle long mode]
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ ← Back            LIBRARY                      [+ New]   │
│  [Tìm kiếm...........................]  [List|Grid] [Sort▾]│
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│ │ Doc 1    │ │ Doc 2    │ │ Doc 3    │  ...  (flat list)  │
│ │ preview  │ │ preview  │ │ preview  │                   │
│ └──────────┘ └──────────┘ └──────────┘                   │
│  rename / duplicate / delete / sort / search (context)    │
└─────────────────────────────────────────────────────────┘
```

**3 bề mặt:**
| Bề mặt | Vai trò | Luôn hiện? |
|---|---|---|
| (a) Top-bar doc switcher | Tên doc đang mở + chuyển doc nhanh | Luôn hiện (mọi breakpoint) |
| (b) Sidebar rail | List title gọn, tạo mới, entry vào Library | Toggle ẩn/hiện; mặc định hiện ở `regular`+/`wide`, mặc định ẩn ở `sub-compact` |
| (c) Library surface | Quản lý đầy đủ tài liệu | Chỉ khi user mở — route/overlay riêng, che hết canvas |

---

## 3. Sidebar rail

### 3.1 Chức năng

- **List title** — mỗi item: icon loại nội dung (mặc định icon tài liệu giấy-kẻ, KHÔNG thumbnail trang vì free-placement không có "trang"), tên doc (truncate 1 dòng + tooltip full), thời gian sửa gần nhất (relative, vd "2 giờ trước" — qua i18n).
- **Tài liệu active** — item tương ứng doc đang mở: nền `--accent-subtle` + left-edge 2px `--accent` (tái dùng pattern left-edge line từ `design.md §4.3`, nhất quán "teal = active/focus" toàn app).
- **Tạo mới (+)** — nút cố định cuối rail (hoặc đầu, xem §3.2), tạo doc trống mới, mở luôn vào canvas (không qua Library).
- **Tìm nhanh** — input tìm rút gọn TRÊN list (filter client-side theo tên, không cần mở Library cho thao tác nhanh). Optional ở MVP — xem §9.
- **Nút "Mở thư viện"** — luôn ở cuối rail, icon `⊞` + label (ẩn label khi rail collapsed-icon-only). Đây là ENTRY DUY NHẤT vào Library từ rail (ngoài top-bar switcher §4).

### 3.2 Hành vi thu/ẩn

- **Toggle hiện/ẩn rail**: nút trên top-bar (`[rail-toggle]`, icon kiểu sidebar-panel chuẩn). Trạng thái persist (localStorage `nib-sidebar-open`, tương tự pattern `nib-dock-*` đã dùng cho UnifiedDock).
- KHÔNG có trạng thái "rail mở rộng = Library" — toggle chỉ ẩn/hiện rail hẹp, KHÔNG đổi nó thành Library (đúng quyết định LOCKED #2).
- Rail ẨN mặc định khi `sub-compact` (820–1023px) để dành chỗ canvas; user toggle mở tạm (overlay đè lên canvas, không đẩy layout — tương tự off-canvas drawer mobile pattern nhưng dùng cho tablet).
- Rail HIỆN mặc định ở `regular`/`wide`, đẩy canvas (không overlay) — canvas width tính lại trong max-width 1440px đã có.

### 3.3 Kích thước & responsive theo breakpoint

| Breakpoint | Rail width | Mode | Item hiển thị |
|---|---|---|---|
| sub-compact (820–1023) | 280px khi mở (overlay, không đẩy canvas) | off-canvas overlay, đóng khi tap ngoài | full (icon+tên+thời gian) |
| compact (1024–1279) | 240px hoặc icon-only 56px (user toggle) | đẩy canvas | icon-only mặc định, full khi đủ chỗ |
| regular (1280–1679) | 260px | đẩy canvas, mặc định mở | full |
| wide (≥1680) | 280px | đẩy canvas, mặc định mở | full + thời gian sửa rõ hơn |

- Item height: **44px** (đáp ứng hit target nền §2 requirements.md) — kể cả ở `regular`/`wide` dù chuột không cần 44px, giữ đồng nhất 1 component cho cả 3 input.
- Icon-only mode (compact, rail hẹp 56px): chỉ hiện icon tài liệu, full tên hiện qua tooltip on-hover (`pointer:fine`) hoặc giữ-để-xem (`pointer:coarse/pen`).

### 3.4 Token

- Nền rail: `--bg-surface` (tách khỏi `--bg-app` canvas, giống mặt "block nổi" nhưng full-height).
- Item active: `--accent-subtle` bg + left-edge `--accent` 2px (đồng bộ `design.md §4.3`).
- Item hover (`pointer:fine` only): `--bg-subtle`.
- Border phân tách rail|canvas: `--border`.
- Nút "+New" / "Mở thư viện": text `--text-secondary`, icon `--text-muted`, hover → `--accent`.
- Radius item: `--radius-sm`; rail container không radius (full-height panel).

---

## 4. Top-bar doc switcher

### 4.1 Vị trí & nội dung

```
[rail-toggle ⊞] [📄] Tên tài liệu đang mở ▾        ...   [theme] [lang] [account]
```

- Icon loại doc (giấy-kẻ) + tên doc đang mở (editable inline — click vào tên = rename trực tiếp, giống Google Docs title; Enter/blur lưu).
- Mũi tên `▾` mở **dropdown switcher**: list rút gọn các doc gần đây (5–8 item, sort theo recently-opened) + dòng cuối **"Xem tất cả tài liệu →"** dẫn vào Library.
- Dropdown switcher **KHÔNG có chức năng quản lý** (không rename/delete trong dropdown) — quản lý đầy đủ chỉ ở Library, giữ đúng phân vai trò (LOCKED #3 lý do tách bề mặt).

### 4.2 Quan hệ với Library

- Top-bar dropdown = "quick switch", việc nhẹ, không rời canvas context lâu (dropdown đóng lại ngay khi chọn doc khác, không chuyển route).
- Library = nơi DUY NHẤT làm thao tác nặng (rename hàng loạt, sort, search sâu, xoá).
- Cả 2 entry-point vào Library đều dẫn route/overlay giống nhau: top-bar "Xem tất cả tài liệu →" và sidebar rail "Mở thư viện".

---

## 5. Library surface

### 5.1 Route vs Overlay — đề xuất: **Overlay làm mờ nền + nút Back**

**Lý do chọn overlay (không phải route riêng biệt với router thật):**
- Free-placement canvas có state phức tạp (scroll position, active block, dock position/expand state — xem memory `dock-v2`). Route chuyển trang (unmount/remount) dễ làm mất các state này trừ khi lưu kỹ; overlay giữ canvas mounted phía dưới (chỉ ẩn/che), trả về Back = khôi phục ngay, không cần serialize lại state.
- App là Tauri desktop single-window — không cần URL-addressable route cho UX này (khác web app cần share link "/library").
- Vẫn tách rõ là "bề mặt riêng" về mặt UI (full overlay, không phải panel nhỏ) — thoả quyết định LOCKED #2 dù implementation là overlay, không phải React Router route.

> Nếu sau này có nhu cầu deep-link / multi-window, đây là điểm architect có thể đổi sang route thật — note để mở ở §10 câu hỏi mở.

**Animation:** overlay trượt/fade vào từ trên hoặc phải, nền canvas dimmed (`rgba` overlay scrim dùng token shadow tối, không hex rời — đề xuất token `--scrim` xem §8). Tôn trọng `prefers-reduced-motion` → instant, không animation.

### 5.2 Layout

```
┌──────────────────────────────────────────────────────────┐
│ [← Back]      Thư viện               [+ Tài liệu mới]     │
│ [🔍 Tìm kiếm tài liệu...]   [List ▤ | Grid ⊞]  [Sắp xếp ▾] │
├──────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│ │ [preview]  │ │ [preview]  │ │ [preview]  │   (Grid view) │
│ │ Tên doc    │ │ Tên doc    │ │ Tên doc    │              │
│ │ sửa 2h trc │ │ sửa 1 ngày │ │ sửa 3 ngày │              │
│ └────────────┘ └────────────┘ └────────────┘              │
└──────────────────────────────────────────────────────────┘
```

- **List view**: 1 dòng/doc — icon nhỏ + tên + sửa-lúc + (•••) menu. Mật độ cao, hợp khi nhiều doc.
- **Grid view**: card preview lớn hơn — KHÔNG render full canvas thumbnail (chi phí + free-placement không có "trang" cố định để chụp đẹp); dùng **placeholder preview** = vài dòng đầu nội dung text/LaTeX dạng snippet rút gọn (giống Apple Notes gallery dùng vài dòng text đầu, không phải screenshot). Đây là khác biệt rõ với app phân trang (Word/GoodNotes) — đúng tinh thần free-placement.
- Toggle List/Grid persist theo user preference (localStorage).

### 5.3 Full management functions

| Chức năng | Affordance | Mô tả |
|---|---|---|
| **Rename** | Double-click tên / context-menu "Đổi tên" / phím F2 | Inline edit tên ngay trên item, Enter lưu, Escape huỷ |
| **Xoá** | Context-menu (•••) "Xoá" hoặc phím Delete khi item được chọn | **Có xác nhận** — modal nhẹ (không phải toast-undo-only, vì xoá doc là hành động nặng/khó phục hồi nếu không có trash). Modal: "Xoá '<tên>'? Không thể hoàn tác." [Hủy] [Xoá] — nút Xoá màu `--error` |
| **Duplicate** | Context-menu "Nhân đôi" | Tạo copy ngay trong danh sách (flat), tên = "<tên gốc> (copy)", mở Library tại vị trí copy mới (không tự mở canvas) |
| **Sắp xếp (sort)** | Dropdown `[Sắp xếp ▾]` ở toolbar Library | Options: Sửa gần nhất / Tên A-Z / Ngày tạo. Áp dụng cho cả List/Grid |
| **Tìm kiếm** | Input search trên toolbar Library | Filter theo tên (MVP); filter theo nội dung = SAU MVP |
| **Preview** | Hover (fine) hiện preview lớn hơn trong tooltip; click vào item = mở doc vào canvas | Xem §5.2 cho định nghĩa preview snippet |

- Tất cả action item có hit target ≥44px (kể cả menu (•••) icon-only).
- Context-menu mở qua: click (•••) (mọi modality) hoặc right-click (`pointer:fine`) hoặc long-press (`pointer:coarse/pen`).

### 5.4 Back / đóng

- Nút `← Back` top-left, LUÔN hiện, label "Quay lại" (i18n) — không phụ thuộc đã thực hiện thao tác gì.
- `Escape` key = tương đương Back (trừ khi đang inline-rename hoặc modal xoá đang mở — Escape trong các case đó huỷ thao tác con trước).
- Back trả về **đúng vị trí canvas cũ**: scroll position, active block (nếu còn tồn tại — doc không bị đổi), dock position/expand state đều giữ nguyên vì canvas chưa unmount (overlay che, không destroy — xem §5.1 lý do chọn overlay).
- Nếu user mở 1 doc KHÁC từ Library (không phải doc đang mở) → Back không áp dụng nữa, hành vi = chuyển sang canvas của doc mới, không phải "quay lại trạng thái cũ" (giống đã navigate đi nơi khác).

---

## 6. Trạng thái & chuyển cảnh

### 6.1 Rail ↔ Library

- Mở Library: overlay fade/slide-in ~200ms ease-out, scrim phía dưới dimmed. `prefers-reduced-motion: reduce` → instant show/hide, không animation (đồng bộ pattern đã dùng ở `design.md §5.3` cho EVALUATING spinner và `§4.3` left-edge fade).
- Đóng Library (Back): reverse animation, canvas hiện lại NGAY ở đúng vị trí — không có flash trắng / không re-render lại từ đầu.

### 6.2 Giữ ngữ cảnh canvas khi quay lại — cảnh báo rs-critique

> Cảnh báo đã ghi nhận: "đừng mất ngữ cảnh nút Tính" — nghĩa là active-block + dock state không được reset khi mở/đóng Library.

- **Active block** (theo `design.md §4.1` always-explicit-active-block — *lưu ý: model này đã bị `toolbar-redesign` 2026-06-13 lật một phần cho dock, nhưng khái niệm active-block selection cho nút Tính vẫn áp dụng*): giữ nguyên selection khi mở Library, vì DOM canvas không unmount.
- **Dock (UnifiedDock) state** (vị trí, mode Gõ/Bút, collapsed/expanded): Library overlay nằm TRÊN dock (z-index cao hơn) — dock ẩn tạm trong lúc Library mở (không hiện chồng lên Library UI), hiện lại đúng vị trí/mode khi Back, không reset localStorage state.
- **Scroll position** canvas: giữ nguyên (canvas không unmount).

---

## 7. i18n keys

Namespace `sidebar.*` (rail + top-bar) và `library.*` (Library surface). Tất cả key cần cả `en.json` + `vi.json`.

| Key | en | vi |
|---|---|---|
| `sidebar.new_doc` | New document | Tài liệu mới |
| `sidebar.open_library` | Open library | Mở thư viện |
| `sidebar.toggle` | Toggle sidebar | Bật/tắt thanh bên |
| `sidebar.search_placeholder` | Quick search... | Tìm nhanh... |
| `sidebar.item_modified` | Modified {{time}} | Sửa {{time}} |
| `sidebar.empty` | No documents yet | Chưa có tài liệu nào |
| `topbar.switcher_recent` | Recent | Gần đây |
| `topbar.switcher_view_all` | View all documents | Xem tất cả tài liệu |
| `topbar.rename_placeholder` | Untitled | Chưa đặt tên |
| `library.title` | Library | Thư viện |
| `library.back` | Back | Quay lại |
| `library.new_doc` | New document | Tài liệu mới |
| `library.search_placeholder` | Search documents... | Tìm tài liệu... |
| `library.view_list` | List view | Dạng danh sách |
| `library.view_grid` | Grid view | Dạng lưới |
| `library.sort` | Sort | Sắp xếp |
| `library.sort_modified` | Last modified | Sửa gần nhất |
| `library.sort_name` | Name A–Z | Tên A–Z |
| `library.sort_created` | Date created | Ngày tạo |
| `library.action_rename` | Rename | Đổi tên |
| `library.action_duplicate` | Duplicate | Nhân đôi |
| `library.action_delete` | Delete | Xoá |
| `library.delete_confirm_title` | Delete "{{name}}"? | Xoá "{{name}}"? |
| `library.delete_confirm_body` | This cannot be undone. | Không thể hoàn tác. |
| `library.delete_confirm_cancel` | Cancel | Hủy |
| `library.delete_confirm_ok` | Delete | Xoá |
| `library.duplicate_suffix` | (copy) | (copy) |
| `library.empty` | No documents. Create your first one. | Chưa có tài liệu. Tạo tài liệu đầu tiên. |
| `library.empty_search` | No results for "{{query}}" | Không có kết quả cho "{{query}}" |

---

## 8. Token usage

Tái dùng token đã chốt ở `requirements.md §3` + `design.md §6`. KHÔNG hardcode hex.

| Vùng | Token |
|---|---|
| Nền rail / Library card | `--bg-surface` |
| Nền Library overlay container | `--bg-elevated` + `--shadow-2` |
| Nền canvas phía sau (dimmed) | `--bg-app` + scrim (xem token mới đề xuất) |
| Item active (rail) | `--accent-subtle` bg + `--accent` left-edge 2px |
| Item hover (fine) | `--bg-subtle` |
| Border rail\|canvas, Library card border | `--border` |
| Text tên doc | `--text-primary` |
| Text thời gian sửa / placeholder | `--text-muted` |
| Nút nguy hiểm (Xoá, modal confirm) | `--error` |
| Nút chính (+ New tài liệu) | `--accent` |
| Radius item/card | `--radius-sm` (item) / `--radius-md` (card lớn Grid view, popover) |
| Shadow overlay Library | `--shadow-2` |

**Token mới đề xuất (chờ implement vào `tokens.css`, không tự gán giá trị hex — để implementer dựa theo `--bg-app`/`--text-primary` hiện có tính alpha):**
- `--scrim`: nền mờ phía sau Library overlay. Đề xuất derive từ `--text-primary` với alpha thấp (vd `color-mix` — pattern đã dùng cho dock pulse, xem memory `dock-v2`), KHÔNG hex rời mới.

---

## 9. MVP vs SAU

**MVP (bắt buộc v1.0):**
- Sidebar rail: **flat list** title (KHÔNG cây/folder), active highlight, +New, "Mở thư viện", toggle ẩn/hiện + persist.
- Top-bar: tên doc inline-editable, dropdown switcher (recent + "Xem tất cả").
- Library overlay: List + Grid view (cũng flat — không nhóm theo folder), search theo tên, sort (modified/name/created), rename, delete (có confirm), duplicate, preview snippet text trong Grid.
- i18n đầy đủ theo bảng §7, responsive theo 4 breakpoint, hit target ≥44px, token-driven theme.

**SAU MVP:**
- **Tag** — thay cho folder/nhóm để tổ chức tài liệu (gắn nhiều tag/doc, filter theo tag trong Library). Lý do chọn tag thay folder: tag không phá cấu trúc **flat list** của sidebar rail (1 doc có thể nhiều tag, không cần cây lồng nhau) — hợp UI rail thu gọn chỉ-title hơn folder. Chưa thiết kế chi tiết ở bản này (chỉ note hướng đi cho lead/architect cân nhắc khi cần).
- Drag-to-sort thủ công (kéo thả đổi thứ tự ngoài 3 sort mode).
- Preview phức tạp hơn (render canvas thumbnail thật, thay vì text snippet) — chỉ làm nếu sau này có "page concept" hoặc cố định viewport-snapshot.
- Tìm kiếm theo nội dung (không chỉ tên).
- Multi-select bulk action (xoá/duplicate nhiều doc cùng lúc) trong Library.
- Share/export doc từ Library.
- Trash/recently-deleted (hiện tại xoá = xoá thẳng có confirm, chưa có soft-delete).
- Route thật (deep-link) thay overlay, nếu có nhu cầu multi-window/share-link.

---

## 10. Câu hỏi mở cho Architect

| Câu hỏi | Vì sao chặn HOW |
|---|---|
| **Data model document list lưu ở đâu** — localStorage, Tauri store (`@tauri-apps/plugin-store` hoặc file-based), hay backend (FastAPI sidecar đã có cho CAS)? | Quyết định cách CRUD doc thực thi, đồng bộ giữa rail/Library/top-bar, và có cần migration khi đổi sau (vd thêm tag) không. |
| **Overlay vs route** — overlay đề xuất ở §5.1 dựa trên giả định Tauri single-window không cần URL-addressable. Architect cần xác nhận stack router hiện tại (nếu có React Router) có nên dùng route ẩn-trong-app (vd `/library` nhưng vẫn SPA, không phải browser navigation) để được back-button OS hỗ trợ, hay overlay state thuần (`useState`/context) là đủ? | Ảnh hưởng đến việc có cần thêm router dependency hay không, và cách xử lý phím Back/Esc nhất quán với OS. |
| **Multi-doc state trong EditorContext** — hiện tại app giả định 1 document; thêm multi-doc cần quản lý: doc nào đang active, switch doc có giữ undo-history riêng từng doc không, dock state (`nib-dock-*`) có nên scope theo doc hay global? | Chặn việc implement switcher + Library mở doc khác — cần thiết kế trước khi code, tránh phải refactor EditorContext nhiều lần. |
| **Preview snippet generation** — lấy "vài dòng đầu" từ document nào (LaTeX raw, plain text extract, hay rendered snippet)? Tính tại thời điểm nào (lưu cache lúc save doc, hay tính runtime khi mở Library)? | Ảnh hưởng tới schema lưu doc (có cần lưu thêm field `preview` không) và performance Library khi nhiều doc. |

---

> **Revision log:**
> - `2026-06-16` — Bản đầu tiên. Tổng hợp 3 quyết định LOCKED của user (bỏ "tài liệu hiện tại" / Library = bề mặt riêng / quản lý đầy đủ MVP) + research hội tụ (free-placement không page-thumbnail, precedent Craft/Apple Notes/GoodNotes/Notion). Synth: synth (planner).
> - `2026-06-16` — **[USER CHỐT cập nhật]** Bỏ folder/nhóm khỏi MVP: sidebar rail + Library list đều là **flat list** (không cây lồng nhau) — folder không tối ưu cho UI rail thu gọn chỉ-title. Library management MVP còn lại: rename · xoá · duplicate · sort · search. Tag ghi nhận là hướng tổ chức tài liệu **tương lai** (thay cho folder) ở mục §9 SAU MVP, chưa thiết kế chi tiết.
