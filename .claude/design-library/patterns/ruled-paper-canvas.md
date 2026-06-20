# Pattern: Canvas giấy kẻ ngang + block toán

> Dùng khi: dựng mockup có canvas viết/tính (tờ giấy 664px + ruling + block toán).  
> Snippet copy-được: `../snippets/ruled-paper-canvas.html`

---

## Khi nào dùng pattern này

- Màn chính editor Nib (workspace với giấy kẻ ngang)
- Mockup demo block toán inline (đặt tự do trên giấy)
- Preview nhỏ trong card Library (ruling stripe đơn giản hơn — xem `nib-lib-card__preview`)

**Không dùng pattern này khi:** overlay (Settings/Library), dock, hay UI chrome không phải canvas.

---

## Cấu trúc tổng thể (Workspace → Canvas)

```
.nib-workspace                         ← Positioning context (relative)
  ├── .nib-strip                       ← TopStrip overlay (absolute, pointer-events:none)
  └── .nib-desk                        ← Mặt bàn (--desk bg, centers + scrolls paper)
        └── .nib-paper                 ← Tờ giấy 664px fixed-width
              ├── .nib-margin-line     ← Đường dọc margin trái (44px, 1px accent 22%)
              ├── .nib-ruled-paper     ← Ruling background (1px mỗi 64px)
              ├── .nib-editor-host     ← ProseMirror host (z-1)
              │     └── .nib-pm       ← ProseMirror root
              │           └── .nib-block × N   ← Block toán absolute-positioned
              ├── .nib-selection-overlay        ← Overlay chọn vùng (hidden default)
              └── .nib-hint-pill                ← Pill gợi ý (hidden default)
```

---

## Block toán — vị trí và anatomy

Block đặt tuyệt đối theo `(lineIndex, xOffset)` — tính từ paper:

```
top  = lineIndex × --ruled-line-height  (64px mỗi dòng)
left = xOffset   (px từ mép trái paper; mặc định 56px cho khối đầu)
```

```html
<!-- Block toán active (đang edit) -->
<div class="nib-block" data-active="true" data-show-edge="true"
     style="top: 64px; left: 56px;">
  <div class="nib-block__surface">
    <div class="nib-block__content">
      <!-- MathLive hoặc text render ở đây -->
      x²
    </div>
    <!-- Left-edge accent 2px (visible khi data-show-edge) -->
    <div class="nib-block__edge" aria-hidden="true"></div>
  </div>
</div>

<!-- Kết quả symbolic (render bên dưới / cùng dòng, màu --result) -->
<div class="nib-block" style="top: 128px; left: 56px;">
  <div class="nib-block__surface">
    <div class="nib-block__content" style="color: var(--result);">
      = 2x
    </div>
  </div>
</div>
```

---

## Ruling CSS (tái tạo giấy kẻ)

```css
/* Mỗi 64px có 1 đường kẻ 1px màu --border */
.nib-ruled-paper {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 63px,
    var(--border) 63px,
    var(--border) var(--ruled-line-height)  /* = 64px */
  );
}
```

---

## Token liên quan

| Token | Dùng ở đâu |
|---|---|
| `--desk` | Nền mặt bàn ngoài giấy |
| `--bg-app` | Nền giấy (paper background) |
| `--sheet-shadow` | Shadow tờ giấy nổi trên bàn |
| `--border` | Đường kẻ ruling (1px) |
| `--ruled-line-height` | 64px — khoảng cách dòng kẻ [LOCKED] |
| `--accent` | Đường margin-line (22% opacity) + left-edge block active |
| `--accent-subtle` | Nền surface block active |
| `--result` | Màu chữ kết quả symbolic exact |
| `--approx` | Màu chữ kết quả số gần đúng |
| `--text-primary` | Chữ nội dung toán/text |
| `--text-muted` | Placeholder block rỗng |

---

## Geometry cố định (không thay đổi)

| Thông số | Giá trị | Nguồn |
|---|---|---|
| Paper width | `664px` | design-ref |
| Ruled line height | `64px` → `var(--ruled-line-height)` | [LOCKED] `tokens.css` |
| Default paper min-height | `calc(var(--ruled-line-height) * 16)` = 1024px | canvas.css |
| Margin-line position | `left: 44px` (từ mép giấy) | canvas.css |
| Block default xOffset | `56px` (bên phải margin-line) | blocks STARTER |
| Canvas max-width | `var(--canvas-max-width)` = 1440px | tokens.css |

---

## Mockup mini (LibraryOverlay card preview)

Khi cần preview nhỏ hơn trong card (không cần block logic):

```html
<!-- Dùng trong .nib-lib-card__preview (100px height) -->
<div class="nib-lib-card__preview"></div>
<!-- CSS đã có trong library-overlay.css:
     repeating-linear-gradient dùng --border mỗi 20px (thu nhỏ từ 64px) -->
```

---

## Checklist mockup canvas

- [ ] `.nib-desk` có `position: static` (KHÔNG `position: relative`) — tránh làm offsetParent của blocks
- [ ] `.nib-editor-host` có `position: relative` và `min-height: calc(var(--ruled-line-height) * N)`
- [ ] Block position dùng `top` và `left` bằng bội số `var(--ruled-line-height)` và px
- [ ] `data-active="true"` + `data-show-edge="true"` chỉ trên block EDITING (không INK-CAPTURE)
- [ ] Kết quả `--result` dùng `color: var(--result)` (KHÔNG hardcode màu)
- [ ] `var(--ruled-line-height)` trong CSS, KHÔNG hardcode `64px`
- [ ] 0 hex rời trong toàn file
