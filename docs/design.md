# Nib — Kế hoạch Design (UI/UX)

> **File này là tầng thiết kế UI/UX** — mô tả WHAT về giao diện và trải nghiệm người dùng.
> Đây là input cho **architect** (HOW kỹ thuật) và **editor-frontend** (implement).
>
> **Quan hệ 3 tài liệu:**
> | Tài liệu | Vai trò | Độ ưu tiên |
> |---|---|---|
> | `docs/requirements.md` | Ràng buộc nền **[LOCKED]**: song ngữ en/vi · thiết bị desktop-class + 3 input · theme light/dark/system + design tokens | Nền tảng bất biến |
> | `docs/feature.md` | Đặc tả tính năng WHAT: 2 đường nhập · state machine · output contract · parity gõ↔bút | Spec hành vi |
> | **`docs/design.md`** _(file này)_ | Thiết kế UI/UX: responsive · canvas model · UX flow · design system · a11y | Input architect/implementer |
>
> Mọi block UI mới phải thoả **3 yêu cầu nền** (`requirements.md`): **(1)** song ngữ en/vi (mọi chuỗi qua i18n) · **(2)** desktop-class min 820px + 3 input · **(3)** theme + design tokens (cấm hex rời).
>
> Tài liệu này được tổng hợp từ 2 vòng thảo luận của team design-plan (rs-layout · rs-interaction · rs-visual), đã gate PASS.

---

## 1. Nguyên tắc design

Bốn nguyên tắc dẫn dắt mọi quyết định thiết kế của Nib:

### 1.1 UX-first — loại bỏ mọi ma sát

App dành cho "session tập trung dài" (CLAUDE.md §3). Mỗi hành động thừa = phá luồng. Nguyên tắc triển khai:
- Không modal xác nhận bắt buộc ở core flow (nhập → Tính → kết quả).
- Block vô hình mặc định — chỉ hiện affordance khi cần.
- Empty block tự xóa khi blur (tránh orphan tích tụ).
- Onboarding qua **làm**, không qua tutorial đọc.

### 1.2 Paper-feel — giấy nháp kỹ thuật số

Nib = "notepad toán học sống", không phải phần mềm tính toán. Mọi quyết định visual hướng tới cảm giác **viết trên giấy kẻ ngang**:
- Nền giấy ấm (`--bg-app #F3F1EC`), không `#FFF` chói.
- Ruling lines nhạt (`--border`), không cạnh tranh với nội dung.
- Block = đơn vị **vô hình** — không viền/hộp mặc định, chỉ nội dung trên giấy.
- Kết quả liền mạch với input (cùng dòng hoặc dòng kế), phân biệt chỉ bằng màu.

### 1.3 Redundant a11y — không chỉ dựa màu

Mọi thông tin quan trọng (input vs result, exact vs approx, lỗi) dùng **tín hiệu kép** (màu + hình dạng/text/vị trí) để đảm bảo người dùng color-blind vẫn hiểu. Chi tiết xem §8.

### 1.4 Token-driven — không hex rời

Mọi màu, khoảng cách, bán kính, shadow đọc từ CSS custom property. Thêm nội dung = thêm token semantic, không hardcode. Token mới trong tài liệu này là **đề xuất** (chờ implement vào `src/styles/tokens.css`).

---

## 2. Thiết bị & Responsive

### 2.1 Bảng thiết bị mục tiêu

| Thiết bị | Tỉ lệ | Độ phân giải CSS (đại diện) | Chú ý |
|---|---|---|---|
| iPad Pro 11" — landscape | 4:3 | 1210 × 834 | compact breakpoint |
| **iPad Pro 11" — portrait** | 4:3 | **834 × 1210** | sub-compact **[USER CHỐT hỗ trợ]** |
| iPad Pro 13" — landscape | 4:3 | 1376 × 1032 | compact/regular |
| iPad Pro 13" — portrait | 4:3 | 1032 × 1376 | compact |
| Surface Pro 11 | 3:2 | 1440 × 960 | regular |
| MacBook Air 13" | 16:10 | 1280 × 800 | regular |
| MacBook Pro 14–15" | 16:10 | 1512 × 982 | regular |
| MacBook Pro 16" | 16:10 | 1728 × 1117 | regular/wide |
| Laptop 16:9 phổ thông | 16:9 | 1366–1920 × 768–1080 | compact → wide |
| Monitor ngoài 1080p | 16:9 | 1920 × 1080 | wide |
| Monitor ngoài 1440p | 16:9 / 16:10 | 2560 × 1440 | wide |
| Ultrawide 34" | 21:9 | 3440 × 1440 | wide — canvas centered |
| Surface Studio | — | ~2000px+ | wide |

> Thiết bị dưới 820px CSS (điện thoại, tablet nhỏ) → hiển thị thông báo "tối ưu cho màn lớn" (i18n key: `app.small_screen_notice`), không cố co layout.

### 2.2 Breakpoints

| Tên | CSS width range | Thiết bị tiêu biểu | Ghi chú |
|---|---|---|---|
| **sub-compact** | 820 – 1023px | iPad Pro 11" portrait | **Mới** — [USER CHỐT] |
| **compact** | 1024 – 1279px | iPad Pro 11" landscape · iPad 13" portrait · laptop nhỏ | |
| **regular** | 1280 – 1679px | MacBook 13–16" · Surface Pro · laptop phổ thông | |
| **wide** | ≥ 1680px | monitor ngoài · ultrawide · Surface Studio | canvas centered |

> ⚠️ **Spec change** — min-width hỗ trợ nới từ 1024px → **820px**, thêm breakpoint sub-compact. Xem mục 10.

### 2.3 Chrome & canvas per breakpoint

**sub-compact (820–1023px — iPad Pro 11" portrait)**
- Top chrome: 44px, **icon-only** (không label).
- Pen palette: thu gọn 44px icon-only; collapse thành floating button khi < 900px.
- Canvas usable width: ~758px (834px − 16px margin×2 − pen palette).
- Canvas height (portrait): 896px khi có virtual keyboard, 1166px khi không — tương đương 14–18 ruling lines = **lợi chiều cao** bù cho chiều ngang hẹp.
- Margin trái: 16px (`--space-4`).

**compact (1024–1279px)**
- Top chrome: 44px, icon-only hoặc hamburger cho tính năng mở rộng.
- Pen palette: 60–72px, ghim phải; **ẩn hoàn toàn** nếu chỉ chuột (không pen/coarse).
- Canvas usable width: ~928px+.
- iPad Pro 11" landscape: sau chrome + virtual keyboard → ~505px canvas height (~7 ruling) — không lý tưởng nhưng đủ dùng.

**regular (1280–1679px)**
- Top chrome: đầy đủ icon + label.
- Pen palette: 72–80px, ghim phải.
- Toolbar: full set (tất cả nút).
- Side panel (~240px): **post-MVP** — không bắt buộc v1.0.

**wide / ultrawide (≥ 1680px)**
- Canvas **max-width 1440px**, căn giữa.
- Padding 2 bên fill màu `--bg-app` → cảm giác "notebook đặt trên bàn".
- Ultrawide 3440px: padding ~1000px/bên — **post-MVP** dùng padding space cho side panel.

### 2.4 Ba phương thức nhập — detect & affordance

| Modality | Cách detect | Affordance khác biệt |
|---|---|---|
| **pointer:fine** (chuột) | `@media (hover: hover) and (pointer: fine)` | Hover state OK; cursor changes; pen palette ẩn |
| **pointer:coarse** (cảm ứng) | `@media (pointer: coarse)` — KHÔNG có hover | Tap mới active; không hover-only UI; target ≥44px; toolbar hiện NGAY khi tap |
| **pointer:pen** (stylus) | `pointerType === 'pen'` trong event (runtime, không chỉ media query) | Pen palette hiện; palm rejection bật; Apple Pencil/Surface Pen có hover (nhưng toolbar KHÔNG hiện khi hover pen — chỉ hiện sau pen-up 1.5s) |

> Detect modality **runtime** qua `pointerType` trong PointerEvent — không dùng media query một mình vì iPad với Apple Pencil vừa hỗ trợ pen vừa coarse touch. Pen palette: hiện khi detect pen/coarse, ẩn khi chỉ fine.

---

## 3. Canvas Spatial Model

### 3.1 xOffset — authoring intent vs render position

Block lưu **`xOffset` = px tuyệt đối tính từ lề trái canvas** (authoring intent), **không phải render position**. Tại render-time, áp công thức clamp:

```
renderX = clamp(xOffset, marginL, canvasUsableWidth − blockWidth − marginR)
```

- Clamp **KHÔNG được persist** vào node attrs — chỉ áp tại render.
- Khi xoay màn hình hoặc mở tài liệu trên máy khác: block không "biến mất", luôn nằm trong viewport.
- Xoay lại về chiều ban đầu / mở trên máy gốc: `xOffset` gốc được phục hồi đúng (vì không bị ghi đè).
- Khi mở tài liệu từ máy rộng trên máy hẹp và clamp thực sự dời block: **toast 1 lần** (i18n key: `app.blocks_clamped_notice`: "Một số block đã dời vào viewport. Tài liệu vẫn nguyên vẹn trên máy gốc.").

> 📌 **Câu hỏi mở cho architect** (xem mục 11): xOffset origin là góc trái canvas (0) hay có thể âm? Hành vi khi block rộng hơn canvas usable width?

### 3.2 Canvas max-width 1440px

Canvas content area có **max-width = 1440px**, căn giữa theo viewport.

Lý do chọn 1440px: reference width phổ biến trong design system hiện đại (~1.5× viewport regular); MacBook 16" (1728px CSS) → padding 144px/bên vừa "nổi" giống notebook trên bàn; không quá rộng để mắt khó quét ngang.

```
viewport                    3440px (ultrawide ví dụ)
  └─ canvas-wrapper         1440px (centered, max-width)
       ├─ margin-left        8px (compact) / 16px (regular) / 24px (wide)
       ├─ usable-width       ~1408px max
       └─ margin-right       mirror margin-left
```

> 📌 **Câu hỏi mở cho architect** (xem mục 11): canvas max-width có nên là CSS variable configurable không?

### 3.3 Ruling grid — 64px

- **`--ruled-line-height: 64px`** [LEAD CHỐT] — bội số của 8px base grid, nằm trong range 60–80px (feature.md §1).
- Ruling vẽ bằng **CSS `repeating-linear-gradient`** trên canvas container, `z-index` thấp hơn block.
- Màu stroke: `1px solid var(--border)` — nhạt, không cạnh tranh nội dung; tự đổi theo theme.
- Block claim `N = ceil(contentHeight / 64)` dòng kẻ (bounding-box §2.4 feature.md).

### 3.4 Partial-ruling gap — khoảng trống tự nhiên

Block background (`--bg-surface`) phủ đến `contentHeight + 8px` — **không phủ kín N×64px**. Phần còn lại của N dòng cuối vẫn hiện ruling line bình thường.

```
┌─────────────────────────────┐  ← block top (lineIndex × 64px)
│  ∫ x² dx                   │  ← --bg-surface phủ (contentHeight + 8px)
└─────────────────────────────┘  ← bg kết thúc tại đây
· · · · · · · · · · · · · · ·   ← ruling line vẫn hiện (partial gap tự nhiên)
                                   (khoảng trống như notebook viết tay)
──────────────────────────────   ← ruling line dòng kẻ tiếp theo
```

Không cần logic render đặc biệt — partial gap là "side-effect" tự nhiên của CSS gradient. Giữ cảm giác giấy notebook.

---

## 4. Active-block & UX Flow

### 4.1 Mô hình "always-explicit active block"

**Vấn đề cần giải**: document có nhiều block vô hình trên cùng dòng kẻ → không rõ nút Tính sẽ tính block nào.

**Giải pháp**: Luôn có **đúng 1 block "active"** được highlight — PREVIEW rõ ràng "Tính sẽ tính block này".

Quy tắc active:
- Active khi: click/tap/pen-down vào block; đang gõ hoặc viết trong block.
- **Đặc biệt (pen)**: sau pen-up, block vừa viết **GIỮ active** cho tới khi block khác active hoặc tap ra ngoài (không tắt ngay để tránh mất target Tính).
- Không có active block → nút Tính + floating toolbar **ẩn hoàn toàn**; `Shift+Enter` → no-op + tooltip i18n `editor.no_active_block_tip`: "Chọn một biểu thức để tính".
- Click khoảng trống giữa 2 block cùng dòng → **tạo block mới** tại vị trí đó, không active block A hay B.

### 4.2 Phạm vi của nút Tính

| Trạng thái | Phạm vi tính | Ghi chú |
|---|---|---|
| Bôi đen trong 1 block | Vùng đã chọn | Selection trumps active |
| Bôi đen nhiều block | Từng block theo thứ tự, append kết quả | WHAT chốt — HOW để architect §11.5 |
| Không bôi đen | Biểu thức hiện tại / gần con trỏ | HOW cụ thể để architect chốt (mục 11) |

Ngữ cảnh biến luôn = **cả trang** (`x = 5` ở block khác vẫn có hiệu lực).

### 4.3 Affordance per modality

| Trạng thái | pointer:fine (chuột) | pointer:pen (bút) | pointer:coarse (cảm ứng) |
|---|---|---|---|
| **Idle** | Không gì (vô hình tuyệt đối) | Không gì | Không gì |
| **Hover** | `--accent-subtle` bg | Hover pen: KHÔNG hiện toolbar | Không có hover — bỏ qua |
| **Active/Focus (EDITING-MATH/TEXT)** | `--accent-subtle` bg + left-edge line 2px `--accent` + floating toolbar | `--accent-subtle` bg + left-edge line + floating toolbar | Tap → toolbar hiện NGAY |
| **Active (INK-CAPTURE)** | — | `--accent-subtle` bg + pen palette + toolbar (Tính + lasso) | Không hỗ trợ ink |
| **Pen-up → toolbar** | — | Toolbar nổi sau **~1.5s** (tránh flash khi dừng bút tạm) | — |
| **Virtual keyboard che toolbar** | — | **Toolbar-lift**: dịch lên TRÊN selection | Toolbar-lift |

> **Left-edge line spec (final)**:
> - Độ dày: **2px** (KHÔNG 1px — 1px quá mỏng trên màn Retina/HiDPI).
> - Màu: `var(--accent)` · dark mode `--accent #3FB6BE` (contrast 7.5:1 trên `--bg-surface` dark ✓).
> - Height: **100% bounding-box** của block.
> - Vị trí: inset `--space-2` (8px) từ lề trang (không sát mép).
> - Line-cap: **flat** (không rounded).
> - **Chỉ hiện ở EDITING-MATH / EDITING-TEXT** — KHÔNG hiện ở INK-CAPTURE (tránh cạnh tranh màu với nét mực `--ink` teal).
> - Transition: fade `opacity 0 → 1`, duration **100ms**; nếu `prefers-reduced-motion: reduce` → instant (không animation).
> - Nhất quán "teal = focus/active" với caret (`--caret`).

### 4.4 Discoverability: Tính / Convert / `\`

Ba thứ dễ bị lẫn — cần phân biệt rõ trong thiết kế:

**Nút Tính**
- Vị trí: **primary, nổi bật nhất** trên floating toolbar — tách biệt khỏi nhóm nút format.
- Icon: ngữ nghĩa **"= →"** (không dùng generic play ▶ hoặc run ↻).
- Tooltip (i18n `editor.calc_tooltip`): "Tính kết quả (Shift+Enter)".
- Màu active: `--accent` (không màu trung tính như format buttons).

**Nút Convert**
- Icon: **"∑⇄A"** (toggle loại nội dung toán↔chữ).
- Nhóm riêng "loại block" trên toolbar.
- Tooltip (i18n `editor.convert_tooltip`): "Đổi sang Chữ" / "Đổi sang Toán" (thay đổi theo loại hiện tại).

**Phím `\`**
- **Không có trên toolbar** — là phím tắt keyboard.
- Context xác định bằng 3 tín hiệu "đang trong block": ① left-edge line visible, ② floating toolbar present, ③ MathLive cursor đặc trưng.
- Khi focus trong block: MathLive intercept `\` → mở autocomplete LaTeX.
- Khi không trong block: document-level menu tạo block / chèn ký hiệu.
- KHÔNG cần thêm UI giải thích — 3 tín hiệu trên đủ.

### 4.5 Onboarding — first-run (minimal, không tutorial nặng)

**3 lớp khởi động — không đòi đọc hướng dẫn:**

1. **Starter content** — tài liệu mới mở với 1 block demo sẵn kết quả (vd: `∫ x² dx = x³/3 + C`). User tự sửa công thức → nhấn Tính → thấy kết quả thay đổi = học được cả flow trong < 30 giây. Block demo **fade out** sau khi user tạo block đầu tiên của mình.

2. **Ghost text hint** — trên các dòng kẻ trống đầu (khi tài liệu hoàn toàn rỗng): text mờ "click để thêm toán…" (i18n `editor.empty_hint`). **Fade out** sau khi block đầu tiên được tạo.

3. **Contextual tips** — đúng lúc hành động lần đầu (từ feature.md §7 Lớp 4). *Xem mục 10 về first-run exception.*

> **Lưu ý first-run session** [LEAD CHỐT]: Starter content + ghost text **không tính vào quota contextual tips** (max 1 tip/session cho dùng thường). First-run session là ngoại lệ để dạy mô hình block+Tính. Xem mục 10 — spec change cho feature.md §7 Lớp 4.

---

## 5. State Machine × Feedback thị giác

Mỗi state block có affordance thị giác đặc trưng, bám state machine trong feature.md §5.

### 5.1 Bảng feedback đầy đủ

| State | Background | Border / Edge | Loading | Text / Kết quả | Toolbar | Ghi chú |
|---|---|---|---|---|---|---|
| **Idle** | Không có | Không có | — | Nội dung thuần | Ẩn | Vô hình tuyệt đối |
| **Hover (chuột/pen)** | `--accent-subtle` (fade in) | Không có | — | — | KHÔNG hiện | Affordance nhẹ, không cam kết |
| **EDITING-MATH** | `--accent-subtle` | Left-edge 2px `--accent`, fade 100ms | — | MathLive live render; placeholder i18n `editor.math_placeholder` | Hiện (Tính, Convert, …) | WYSIWYG, chưa tính |
| **EDITING-TEXT** | `--accent-subtle` | Left-edge 2px `--accent`, fade 100ms | — | Text thuần | Hiện (B/I/U/S, Convert, …) | |
| **INK-CAPTURE** | `--accent-subtle` | **Không có left-edge line** — pen palette là affordance chính | — | Mực thô màu `--ink` | Hiện (Tính, lasso) | Tránh cạnh tranh màu teal ink↔accent |
| **HTR-RECOGNIZING** | — | — | Gộp vào EVALUATING spinner | — | Ẩn | Ngầm, user không thấy bước riêng |
| **EVALUATING** | — | — | Inline spinner vị trí `=`, 16px `--accent`; debounce 150ms | — | Ẩn hoặc disabled | Nếu `prefers-reduced-motion`: pulse dot thay rotation |
| **RESULT-EXACT** | Về idle (không bg) | Không có | — | Prefix `=` + kết quả `--result` indigo; inline toggle chip | Ẩn (hiện khi refocus) | Bg tắt — kết quả màu đủ tự nói |
| **RESULT-APPROX** | Về idle | Không có | — | Badge ≈ + kết quả `--approx` amber; inline toggle chip | Ẩn | Xem §7 |
| **ERROR** | Về idle | Không có | — | SVG icon ⚠️ màu `--error` + message i18n + nút "Sửa" | Ẩn | Phân biệt 3 loại lỗi bên dưới |
| **EMPTY — blur** | — | — | — | — | — | **Tự xóa block** — tránh orphan vô hình |

### 5.2 Phân loại lỗi (ERROR state)

| Loại lỗi | i18n key | Message ví dụ |
|---|---|---|
| Parse error (LaTeX không hợp lệ) | `error.parse` | "Không parse được công thức. Kiểm tra lại cú pháp." |
| HTR error (nhận diện bút thất bại) | `error.htr` | "Không nhận diện được nét viết. Thử viết lại rõ hơn hoặc dùng 'Xem LaTeX' để sửa." |
| Timeout (SymPy treo quá 5–10s) | `error.timeout` | "Tính quá lâu — kết quả số gần đúng bên dưới." |
| No closed form | `error.no_closed_form` | "Không tìm được nghiệm dạng đóng." |

Tất cả error message đi qua i18n en/vi. Nút "Sửa" (i18n `editor.error_fix_cta`) → focus block về EDITING-MATH.

### 5.3 Spinner EVALUATING

- Vị trí: inline, tại vị trí dấu `=` (sau input, trước nơi kết quả sẽ hiện).
- Size: 16px, màu `--accent`.
- Debounce: **~150ms** — nếu EVALUATING kết thúc < 150ms, spinner không flash ra.
- `prefers-reduced-motion: reduce` → thay rotation bằng pulse dot (opacity 0→1→0, 1 giây).

---

## 6. Design System

### 6.1 Font

| Vai trò | Font | Nguồn | Bundle? |
|---|---|---|---|
| UI chrome + Text/prose | **Inter** (variable) | SIL OFL | ✓ Bundle vào Tauri |
| Math (MathLive render) | **Computer Modern / Latin Modern Math** | Bundle sẵn của MathLive | Không cần thêm |

Không thay font math của MathLive. Sự khác biệt Inter ↔ Computer Modern là **tín hiệu loại nội dung tự nhiên** (UI/prose vs toán).

Weights dùng: **400** (regular) · **500** (medium/emphasis) · **600** (bold/heading).

### 6.2 Type scale (token đề xuất — chờ implement vào tokens.css)

**UI chrome:**

| Token | Giá trị | Weight | Line-height | Dùng khi |
|---|---|---|---|---|
| `--font-size-ui-xs` | 11px | 500/700 | 1.4 | Badge, chip, label nhỏ |
| `--font-size-ui-sm` | 13px | 400/500 | 1.4 | Tooltip, menu item, caption |
| `--font-size-ui-md` | 15px | 400/500 | 1.4 | Top chrome, toolbar label |

**Document text (3 bậc §7.5.2 feature.md):**

| Token | Giá trị | Weight | Line-height | Bậc |
|---|---|---|---|---|
| `--font-size-doc-heading` | 20px | 600 | 1.35 | Heading |
| `--font-size-doc-body` | 16px | 400 | 1.65 | Body (mặc định) |
| `--font-size-doc-small` | 13px | 400 | 1.55 | Small / caption trong doc |

**Math:**

| Token | Giá trị | Dùng khi |
|---|---|---|
| `--font-math-inline` | 16px | Math block inline (normal size) |
| `--font-math-display` | 18px | Math block display (lớn, tương đương `\displaystyle`) |

Line-height math = MathLive default — **KHÔNG override** (MathLive tự quản layout vertical).

### 6.3 Spacing scale (token đề xuất)

Base 4px, bội số 8px.

| Token | Giá trị | Dùng khi |
|---|---|---|
| `--space-1` | 4px | Gap nhỏ (badge padding) |
| `--space-2` | 8px | Padding component nhỏ, block-to-block gap |
| `--space-3` | 12px | Padding toolbar button |
| `--space-4` | 16px | Margin nội dung, padding section |
| `--space-5` | 24px | Section gap |
| `--space-6` | 32px | — |
| `--space-7` | 48px | — |
| `--space-8` | 64px | = `--ruled-line-height` |

**Số liệu cụ thể:**
- Menu item height: **36px** (desktop density).
- Toolbar button: padding `--space-2` × `--space-3` + icon 20px → hit target ≥44px. ✓
- Block-to-block gap cùng ruling: ≥ `--space-2` (8px).

### 6.4 Radius & Shadow

Token đã có trong `requirements.md §3` — đưa lại đây cho tiện tra:

| Token | Giá trị | Dùng khi |
|---|---|---|
| `--radius-sm` | 6px | Chip, badge, pill |
| `--radius-md` | 10px | Toolbar, popover, tooltip |
| `--radius-lg` | 16px | Modal, panel, card |
| `--shadow-1` | nhẹ | Toolbar nổi, popover nhẹ |
| `--shadow-2` | mạnh | Modal, drawer |

### 6.5 Ruling visual

| Thuộc tính | Giá trị |
|---|---|
| `--ruled-line-height` | 64px (đề xuất token mới) |
| Stroke | `1px solid var(--border)` |
| Nền canvas | `var(--bg-app)` |
| Dạng | Chỉ kẻ ngang — KHÔNG grid ô vuông |
| Implement | CSS `repeating-linear-gradient` trên canvas container |
| Z-index | Dưới block (block nổi lên trên ruling) |

---

## 7. Result & Approx Visual

### 7.1 Math render = MathLive static

Kết quả **không** render bằng HTML plain (không hiển thị được phân số, căn, Σ…). Dùng **MathLive static component `<math-span>`** để render LaTeX kết quả.

Đặt màu kết quả qua CSS custom property container (`--result`, `--approx`). Nếu MathLive hardcode glyph color → dùng CSS var `--math-ink-color` (spike ≤2h, xem mục 11).

### 7.2 Redundant signals — không chỉ dựa màu

Thứ tự ưu tiên tín hiệu phân biệt input ↔ result:

1. **Prefix text `=` / `≈`** — universal, color-blind safe, screen reader readable.
2. **Vị trí spatial** — input trái/trên, kết quả phải/dưới dấu `=`.
3. **Luminance contrast** — `--text-primary` (~gần đen) vs `--result` (indigo trung bình) khác luminance rõ.
4. **Hue** — chỉ là tín hiệu thứ 4, không phải duy nhất.
5. **Badge ≈ shape** — riêng cho approx, shape bổ sung.

Kết luận: tín hiệu 1+2+3 đủ cho người dùng color-blind.

### 7.3 Badge ≈ (approx)

Khi kết quả là numeric fallback (`is_approx: true`), hiển thị badge ≈ TRƯỚC `<math-span>` kết quả.

**Spec badge (final — rs-visual verified):**
- Nền: `--approx-subtle`
- Text: `≈` màu `--approx`, 13px weight 700
- Shape: pill, `--radius-sm` (6px)
- Visual size: height **20px**, padding `3px 6px`
- **Hit area: 44×44px via CSS `::before`** — visual 20px nhưng vùng tap/pen đủ 44px theo yêu cầu nền §2. Dùng `position: relative; ::before { content:''; position:absolute; inset: -12px -6px; }` (approximate). Architect spec chính xác vào NodeView.
- Margin: `margin-right: --space-2` (8px) trước `<math-span>`
- Tooltip: i18n key `result.approx_tooltip` ("Kết quả số gần đúng — không phải nghiệm chính xác")
- ARIA: `aria-label="Approximate"` trên badge element

HTML wrapper: badge ≈ nằm **NGOÀI** `<math-span>` (để CSS `::before` hit area + tooltip + ARIA hoạt động đúng — không bị MathLive shadow DOM block).

### 7.4 Inline toggle exact ↔ decimal

Khi backend trả cả `exact_latex` lẫn `approx_latex`: hiển thị 2 chip ngay dưới/cạnh kết quả — **không đợi refocus toolbar**.

**Spec chip toggle:**

| Thuộc tính | Active chip | Inactive chip |
|---|---|---|
| Background | `--accent-subtle` | Transparent |
| Text color | `--accent` | `--text-muted` |
| Border | `1px solid var(--accent)` @ 0.3 alpha | `1px solid var(--border)` |
| Font | `--font-size-ui-xs` 11px weight 500 | — |
| Size | height 22px, padding `4px 8px` | — |
| Radius | `--radius-sm` | — |
| Gap giữa 2 chip | `--space-1` (4px) | — |

Nhãn chip: `= Exact` / `≈ Decimal` (i18n keys: `result.toggle_exact` / `result.toggle_decimal`).

Nếu chỉ có approx (`is_approx: true`, không có exact): chỉ badge ≈ — không hiện toggle.

### 7.5 Ba layout ví dụ (ASCII)

**Layout 1 — kết quả ngắn, cùng dòng:**
```
···· dòng kẻ ····························
   d/dx(x²)  =  2x
···· dòng kẻ ····························
               [= Exact] [≈ Decimal]       ← chip toggle (hiện thêm)
```

**Layout 2 — kết quả dài, xuống dòng kế:**
```
···· dòng kẻ ····························
   ∫ eˣ sin x dx
···· dòng kẻ ····························
   = ½ eˣ (sin x − cos x) + C
···· dòng kẻ ····························
   [= Exact] [≈ Decimal]
```

**Layout 3 — approx-only (không có exact):**
```
···· dòng kẻ ····························
   ∫₀¹ eˣ² dx
···· dòng kẻ ····························
   [≈]  1.4627
···· dòng kẻ ····························
```
(Badge ≈ trước số, không có chip toggle)

---

## 8. Màu & A11y

### 8.1 Token màu đang dùng (tham chiếu — nguồn gốc từ requirements.md §3)

> Token semantic đầy đủ xem `requirements.md §3`. Tài liệu này chỉ trích dẫn token liên quan thiết kế.

| Token | Light | Dark | Vai trò |
|---|---|---|---|
| `--accent` | #0E7C86 | #3FB6BE | Brand, nút chính, caret, left-edge line |
| `--accent-subtle` | #DEF1F2 | #103438 | Active block highlight |
| `--ink` | #0A5A62 | #4FC9D1 | Nét bút stylus |
| `--result` | #4B3FBF | #9A8CF0 | Kết quả symbolic exact |
| `--result-subtle` | #ECEAFB | #211E3A | Badge/chip nền result |
| `--approx` | **#7A5200** ✱ | #D6A53E | Kết quả số gần đúng |
| `--approx-subtle` | #FBF1DC | #2E2613 | Badge ≈ nền |
| `--warning` | **#7A5200** ✱ | #D6A53E | Warning (= --approx, cùng semantic amber) |
| `--error` | #B42318 | #E5675B | Lỗi |
| `--text-primary` | #1A1C20 | #E8E6E1 | Input gõ |
| `--text-muted` | #868A92 | #767A81 | Placeholder, inactive chip |
| `--border` | #E3DFD7 | #30343A | Ruling line, border |
| `--bg-app` | #F3F1EC | #15171A | Nền canvas (giấy ấm) |
| `--bg-surface` | #FBFAF7 | #1D2024 | Nền block |

> ✱ `--approx` light: `#9A6A11 → #7A5200` — **[USER CHỐT]**, verify contrast **6.63:1** trên `--bg-surface` ✓ WCAG AA.
> `--warning` light cập nhật theo `--approx` (cùng semantic amber). Dark mode: `--approx #D6A53E` / `--approx-subtle #2E2613` / `--warning #D6A53E` — giữ nguyên. Xem mục 10.

### 8.2 Swatch 8 màu (đề xuất token mới — chờ implement)

Màu annotation cho text + ink, **không trùng `--result`/`--approx`**. Màu user chọn là **dữ liệu** (lưu theo nội dung), khác token theme.

| Token swatch | Light | Dark | Đạt AA? |
|---|---|---|---|
| `--swatch-teal` | #0E7C86 | #3FB6BE | ✓ |
| `--swatch-blue` | #1A59A6 | #5B9FE6 | ✓ |
| `--swatch-green` | #137A52 | #3FBE85 | ✓ |
| `--swatch-red` | #B42318 | #E5675B | ✓ |
| `--swatch-purple` | #7B2FA0 | #BF7AE8 | ✓ |
| `--swatch-rose` | #A8265A | #E07AAB | ✓ |
| `--swatch-orange` | #B85000 | #E8872C | ✓ — xem ghi chú |
| `--swatch-slate` | #56606D | #9EA8B4 | ✓ |

> **Ghi chú `--swatch-orange`**: cân nhắc đẩy hue về đỏ hơn (~hue 20°) để tách khỏi `--approx` amber. Xem bảng deuteranopia §8.3.

**Màu kết quả CAS (`--result`, `--approx`) KHÔNG có trong swatch** — khoá, user không đổi màu kết quả.

### 8.3 Deuteranopia — bảng redundant signal cặp dễ nhầm

| Cặp màu | Nguy cơ deuteranopia | Tín hiệu phụ đảm bảo | Kết luận |
|---|---|---|---|
| `--ink` teal ↔ `--result` indigo | Trung bình (cả hai tối, khác hue) | Rendering type khác (SVG stroke vs MathLive typeset) + vị trí spatial + luminance | **An toàn** |
| `--swatch-orange` ↔ `--approx` amber | **NGUY HIỂM NHẤT** (gần hue) | **Badge ≈** là tín hiệu dứt khoát (shape + text, không chỉ màu) | Badge ≈ là bắt buộc |
| `--text-primary` prose ↔ `--result` indigo | Thấp | Prefix `=` text + luminance khác + font khác (Inter vs Computer Modern) | **An toàn** |
| Input math (gõ) ↔ `--ink` (bút) | Thấp | Rendering khác (MathLive typeset vs canvas stroke) + luminance + spatial | **An toàn** |

**Hành động từ bảng**: Badge ≈ là **bắt buộc** về a11y, không phải trang trí — đảm bảo phân biệt approx vs swatch-orange với người dùng deuteranopia.

---

## 9. Iconography

### 9.1 Quy chuẩn

- **Style**: outline, stroke 1.5px, rounded caps, 24px grid / 20px live area.
- **Thư viện**: Phosphor Icons hoặc Lucide (cả hai SIL OFL — cho phép bundle).
- **Active state**: fill solid **hoặc** `--accent-subtle` background (không dùng cả hai cùng lúc).
- **KHÔNG dùng emoji** — dùng SVG cho mọi icon UI (a11y, scale, theme-aware).
- **Size**: icon trong toolbar 20px; icon trong pen palette 24px (target bút lớn hơn).

### 9.2 Icon đặc trưng Nib

| Tính năng | Icon concept | Ghi chú |
|---|---|---|
| **Tính** | `= →` | Ngữ nghĩa rõ; KHÔNG dùng ▶ (play) hoặc ↻ (refresh) |
| **Convert** | `↔T` (⇄ với chữ T) | Toggle loại: toán↔chữ |
| **Pen tool** | **Ngòi bút fountain nib** | Đúng brand Nib = ngòi bút máy |
| **Highlighter** | Marker nghiêng | Phân biệt với pen nib |
| **Stroke-eraser** | Tẩy có đường gạch | Khác pixel-eraser (sau MVP) |
| **Lasso** | Đường đứt lượn | Chọn vùng tự do |
| **Virtual keyboard** | Bàn phím mini | Toggle MathLive virtual KB |
| **Toggle exact/approx** | `= ↔ ≈` | Inline toggle chip (xem §7.4) |

### 9.3 Icon không dùng

- ▶ (play) — lẫn với media player.
- ↻ (refresh) — lẫn với reload.
- 🧮 emoji — không scale, không theme-aware.
- Bất kỳ emoji nào khác.

---

## 10. Thay đổi spec mà design phát hiện

> Các mục dưới đây là **sửa đổi cần áp vào `requirements.md` và/hoặc `feature.md`**.
> **Tài liệu này KHÔNG sửa trực tiếp** — liệt kê để lead + user duyệt, sau đó giao task sửa riêng.

### 10.1 [USER CHỐT] Min-width 820px + breakpoint sub-compact

**File cần sửa**: `requirements.md §2`

| Hiện tại | Thay đổi |
|---|---|
| Min width hỗ trợ: **1024px** | Nới xuống **820px** |
| Breakpoints: compact/regular/wide | Thêm **sub-compact (820–1023px)** |
| Dưới 1024px → thông báo "tối ưu màn lớn" | Dưới **820px** → thông báo đó |

Lý do: iPad Pro 11" portrait = 834px CSS — thiết bị đích được user chốt hỗ trợ.

### 10.2 [USER CHỐT] Token --approx light = #7A5200

**File cần sửa**: `requirements.md §3` (bảng root màu)

| Token | Hiện tại | Thay đổi | WCAG AA (trên --bg-surface) |
|---|---|---|---|
| `--approx` light | `#9A6A11` (~4.16:1 ✗) | **`#7A5200`** | **6.63:1 ✓** (verified) |
| `--approx-subtle` light | `#FBF1DC` | Giữ nguyên | — (nền) |
| `--approx` dark | `#D6A53E` | Giữ nguyên | 6.96:1 ✓ |
| `--approx-subtle` dark | `#2E2613` | Giữ nguyên | — (nền) |
| `--warning` light | `#9A6A11` (= --approx cũ) | **`#7A5200`** (cùng semantic amber) | 6.63:1 ✓ |
| `--warning` dark | `#D6A53E` | Giữ nguyên | ✓ |

### 10.3 [LEAD CHỐT] First-run session ngoại lệ cho contextual tips

**File cần sửa**: `feature.md §7 Lớp 4`

| Hiện tại | Thay đổi |
|---|---|
| "Max 1 tip/session" (tuyệt đối) | GIỮ max 1 tip/session cho dùng thường ngày; **first-run session ngoại lệ** được dùng starter content + ghost text để dạy flow mà KHÔNG tính vào quota tip |

Lý do: user cần học ≥4 điều trong lần đầu (block, Tính, Convert, `\`); max 1 tip/session không đủ cho onboarding mà không có starter content.

### 10.4 Token typography mới (đề xuất — chờ implement)

**File cần sửa**: `src/styles/tokens.css` (thêm mới, không overwrite token cũ)

Thêm các token sau (đề xuất trong §6.2 và §6.3):
- `--font-size-ui-xs` / `-ui-sm` / `-ui-md`
- `--font-size-doc-heading` / `-doc-body` / `-doc-small`
- `--font-math-inline` / `--font-math-display`
- `--space-1` đến `--space-8`
- `--ruled-line-height` (64px)

### 10.5 Token swatch 8 màu (đề xuất — chờ implement)

**File cần sửa**: `src/styles/tokens.css` (thêm mới)

Thêm `--swatch-teal` đến `--swatch-slate` (8 token, light + dark) — xem §8.2.

---

## 11. Câu hỏi còn mở cho Architect

> Các điểm dưới đây **chặn HOW** của thiết kế kỹ thuật. **Tài liệu design KHÔNG tự chốt** — đây là input cho architect xử lý trước khi editor-frontend implement.

### 11.1 Target của Tính khi không bôi đen [CHẶN — §11.5 feature.md]

Khi user nhấn Tính mà không bôi đen gì:
- "Biểu thức hiện tại / gần con trỏ" — hành vi cụ thể là gì?
- Tính cả block? Một phần block nếu block chứa nhiều biểu thức ghép?
- Bôi đen nhiều block → append kết quả từng block — HOW cụ thể (transaction ProseMirror)?

### 11.2 Multi-block selection [CHẶN — §11.5]

Khi bôi đen vượt ranh giới nhiều block:
- ProseMirror selection model linear — NodeView absolute-positioned có conflict không?
- Thứ tự "append kết quả từng block" = thứ tự nào (lineIndex? DOM order?)?

### 11.3 Focus persistence trong ProseMirror

- Sau pen-up, block giữ active cho đến khi "block khác active / tap ra ngoài" — cơ chế ProseMirror focus/blur handle thế nào?
- Transition RESULT-RENDERED → EDITING-MATH khi click lại: ProseMirror có tự restore caret vào đúng NodeView không?

### 11.4 xOffset origin và edge cases

- `xOffset = 0` là góc trái canvas usable area hay góc trái viewport?
- Hành vi khi `blockWidth > canvasUsableWidth` (block rộng hơn canvas)?
- `xOffset` âm có được phép không (block nằm ngoài margin trái)?

### 11.5 Ruling implementation — CSS hay SVG?

Design đề xuất `repeating-linear-gradient`. Architect cần xác nhận:
- CSS `repeating-linear-gradient` đủ chính xác ở pixel density cao (Retina/HiDPI)?
- Hay cần SVG pattern để tránh sub-pixel bleed?
- Z-index stacking context với absolute-positioned NodeView — có conflict không?

### 11.6 MathLive `--math-ink-color` spike

rs-visual kiến nghị dùng CSS var `--math-ink-color` để set màu kết quả (`--result`) vào glyph MathLive. Architect cần spike ≤2h:
- MathLive có expose custom property cho glyph color không?
- Fallback nếu không: wrap `<math-span>` trong container có CSS `color: var(--result)` — có overriding được MathLive internal color không?

### 11.7 NodeView structure cho result block

Result block cần chứa: `{badge ≈ (nếu approx)} + <math-span> + {inline toggle chips}`. Architect cần thiết kế:
- HTML structure của NodeView cho state RESULT-EXACT và RESULT-APPROX.
- State transition EVALUATING → RESULT → EVALUATING lại — ProseMirror transaction vs in-place DOM update.

### 11.8 Canvas max-width — constant hay configurable?

Design chốt 1440px. Architect cần quyết:
- Hard-code vào CSS `max-width: 1440px` hay expose thành CSS variable `--canvas-max-width`?
- Nếu configurable: user setting hay chỉ build-time?
- Ảnh hưởng đến clamp formula `renderX` (§3.1)?

### 11.9 Unified undo manager [CHẶN — §11.5 feature.md]

- MathLive có undo stack riêng; ProseMirror có history riêng.
- `Ctrl+Z` trong block toán: fire MathLive undo hay ProseMirror undo?
- Cần unified undo manager — architect thiết kế trước khi editor-frontend implement nút Tính và state machine.

---

## 12. Phạm vi MVP vs Sau

Bám `feature.md §7.5.5` — bổ sung gì design thấy thêm.

### 12.1 MVP — thiết kế (bắt buộc v1.0)

**Responsive & Canvas:**
- [ ] Sub-compact (820–1023px) + compact/regular/wide breakpoint layout
- [ ] Canvas max-width 1440px centered
- [ ] Ruling grid 64px (CSS `repeating-linear-gradient`)
- [ ] xOffset clamp tại render-time (không persist)
- [ ] Toast "blocks clamped" khi mở doc từ máy rộng trên máy hẹp

**Active-block & UX:**
- [ ] Always-explicit active block (highlight `--accent-subtle` + left-edge line)
- [ ] Toolbar: ẩn khi không có active block; hiện đúng theo loại block + state
- [ ] Toolbar-lift khi virtual keyboard che
- [ ] Starter content + ghost text onboarding

**State feedback:**
- [ ] Spinner EVALUATING inline với debounce 150ms
- [ ] `prefers-reduced-motion`: pulse dot
- [ ] ERROR state — 3 loại lỗi phân biệt + nút Sửa
- [ ] Empty block tự xóa khi blur

**Design system:**
- [ ] Font Inter bundled
- [ ] Token typography/spacing/ruling (đề xuất vào tokens.css)
- [ ] Swatch 8 màu (token + UI picker)
- [ ] Badge ≈ spec đầy đủ
- [ ] Inline toggle chip exact↔decimal

**Icons:**
- [ ] Icon set Tính / Convert / Pen nib / Highlighter / Stroke-eraser / Lasso / Virtual KB / Toggle exact/approx
- [ ] SVG (không emoji)

**Pen palette:**
- [ ] Hiển thị/ẩn theo pointer detection (pen/coarse vs fine)
- [ ] sub-compact: collapse thành floating button < 900px

### 12.2 Sau MVP (không bắt buộc v1.0)

**Responsive:**
- [ ] Side panel ~240px (regular+) — tận dụng canvas padding
- [ ] ultrawide: side panel dùng padding space (~1000px/bên)

**UX:**
- [ ] Cross-block selection model (ProseMirror linear + 2D NodeView)
- [ ] Zoom-box GoodNotes-style (pen)
- [ ] @blockID reference UI

**Design:**
- [ ] Pixel-eraser tool (pen palette)
- [ ] Pencil / brush tool; shape-snap; ruler
- [ ] Rotate / resize ink group; group ink
- [ ] Find/replace; find trong công thức
- [ ] Export PDF/PNG
- [ ] Chỉnh khoảng cách dòng kẻ (mật độ giấy)
- [ ] Paste giữ định dạng nguồn (opt-in)

---

> **Revision log:**
> - `2026-06-12` — Bản đầu tiên. Tổng hợp từ team design-plan: rs-layout (responsive/canvas) · rs-interaction (UX flow) · rs-visual (design system). Gate PASS lead. Synth: synth-planner.
> - `2026-06-12` — Tinh chỉnh cuối (rs-visual verified): (1) `--approx` light `#7A5200` contrast 6.63:1 verified + `--warning` đổi theo; (2) Left-edge line spec: 2px / 100% bounding-box / inset --space-2 / fade 100ms / chỉ EDITING-MATH/TEXT / instant khi prefers-reduced-motion; (3) Badge ≈: hit area 44px via CSS `::before`, 13px w700, ngoài math-span wrapper.
