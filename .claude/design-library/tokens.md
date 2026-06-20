# tokens.md — Catalog CSS token Nib

> Nguồn: `src/styles/tokens.css` (đọc version tại 2026-06-19, freeze trong Phase 1).  
> **CẤM hex rời trong snippet/mockup** — mọi màu qua `var(--tên-token)`.  
> Nếu cần màu cụ thể → tra token ở đây → dùng `var(--token)`.  
> Nguồn chân lý = `src/styles/tokens.css`; file này là bản tóm tắt để tra nhanh.

---

## §1 — Màu nền (background)

| Token | Light | Dark | Khi nào dùng |
|---|---|---|---|
| `--bg-app` | Ấm hơi vàng (off-white) | Graphite ấm tối | Nền toàn trang / mặt bàn — lớp ngoài cùng |
| `--bg-surface` | Giấy ấm (trắng hơi ngà) | Dark nhẹ hơn bg-app | Nền block toán, thẻ doc, cell list |
| `--bg-elevated` | Trắng tinh | Dark nổi hơn surface | Popover, dropdown, dock, panel overlay, modal |
| `--bg-subtle` | Xám ấm nhạt | Giống bg-app (dark) | Input nền chìm, vùng phụ, hover row, chip ẩn |
| `--desk` | Xám ấm vừa (đậm hơn bg-app) | Đậm hơn bg-app tối | Mặt bàn ngoài tờ giấy (canvas.css `.nib-desk`) |

**Thứ bậc nền (từ xa đến gần):** `--desk` → `--bg-app` → `--bg-surface` → `--bg-elevated` → shadow/overlay

---

## §2 — Màu chữ (text)

| Token | Khi nào dùng |
|---|---|
| `--text-primary` | Chữ chính: tiêu đề, nội dung toán, tên doc, body text |
| `--text-secondary` | Chữ phụ: nhãn, meta, nút ghost, description |
| `--text-muted` | Chữ mờ: placeholder, timestamp, badge Coming soon, icon disabled |
| `--text-on-accent` | Chữ trên nền accent (nút teal primary, badge accent) — sáng hay tối tuỳ theme |

---

## §3 — Màu viền (border)

| Token | Khi nào dùng |
|---|---|
| `--border` | Viền mặc định: card, panel, input, divider, ruling preview trong card |
| `--border-strong` | Viền nhấn: hover card, focus state cần viền đậm hơn (không dùng outline) |

---

## §4 — Màu chủ đạo Teal Ink (brand / tương tác)

| Token | Khi nào dùng |
|---|---|
| `--accent` | Màu brand chính: nút primary (bg), active state (text/icon), tab indicator underline, focus ring, left-edge active block |
| `--accent-hover` | Hover trên nền accent (nút primary hover) |
| `--accent-subtle` | Nền nhạt vùng active: tab active bg, block active bg, option selected bg, text selection |
| `--caret` | Con trỏ nhập (MathLive caret, text input caret) — gần như = accent nhưng có thể khác dark |

---

## §5 — Màu mực bút (ink / stylus)

| Token | Khi nào dùng |
|---|---|
| `--ink` | Nét mực viết tay (stylus stroke render), swatch mặc định pen, màu ngòi bút Nib icon |

---

## §6 — Màu kết quả symbolic EXACT (indigo/violet)

| Token | Khi nào dùng |
|---|---|
| `--result` | Chữ/icon kết quả tính toán CHÍNH XÁC (phân số, căn, đạo hàm ra hàm số…) |
| `--result-subtle` | Nền nhạt vùng result exact (ô kết quả inline, badge ≈ khi không có) |

> Tách hẳn khỏi `--accent` teal để input↔output không lẫn màu (requirements §3).

---

## §7 — Màu kết quả số GẦN ĐÚNG (amber / --approx)

| Token | Khi nào dùng |
|---|---|
| `--approx` | Chữ kết quả số gần đúng (numeric fallback §8.3), badge ≈, toggle decimal mode |
| `--approx-subtle` | Nền nhạt vùng approx (phân biệt với result exact teal/indigo) |

> Light `--approx` đã đạt WCAG AA 6.63:1 trên `--bg-surface` (design §10.2 user chốt).

---

## §8 — Màu trạng thái (state)

| Token | Khi nào dùng |
|---|---|
| `--success` | Xác nhận, toast thành công, icon check |
| `--warning` | Cảnh báo nhẹ (= `--approx` light, đồng semantic amber) |
| `--error` | Lỗi, nút delete/danger, delete modal border, error state input |
| `--info` | Thông tin (= `--accent` teal — cùng màu brand) |

---

## §9 — Overlay & scrim

| Token | Khi nào dùng |
|---|---|
| `--overlay` | Modal backdrop nhẹ (rgba bán trong suốt) — dùng cho dialog nhỏ |
| `--scrim` | Lớp mờ nền Library / Settings overlay (rgba đậm hơn overlay) — dùng cho `.nib-library__scrim`, `.nib-settings__scrim`, `.nib-lib-delete` |

---

## §10 — Swatch 8 màu (annotation + ink)

Dùng cho SwatchPicker: màu mực tự do + màu chú thích văn bản.

| Token | Màu ngữ nghĩa |
|---|---|
| `--swatch-teal` | Teal (= brand accent) |
| `--swatch-blue` | Xanh dương |
| `--swatch-green` | Xanh lá |
| `--swatch-red` | Đỏ |
| `--swatch-purple` | Tím |
| `--swatch-rose` | Hồng |
| `--swatch-orange` | Cam |
| `--swatch-slate` | Xám đậm |

---

## §11 — Hình khối (border-radius)

| Token | Giá trị | Khi nào dùng |
|---|---|---|
| `--radius-sm` | `6px` | Nút nhỏ, input, badge, icon button |
| `--radius-md` | `10px` | Card, flyout, inline element |
| `--radius-lg` | `16px` | Panel overlay lớn, modal dialog |

---

## §12 — Shadow

| Token | Khi nào dùng |
|---|---|
| `--shadow-1` | Shadow nhẹ: nút nổi nhẹ, chip, element có độ sâu nhỏ |
| `--shadow-2` | Shadow chính: dock, popover, panel overlay, modal — element nổi hẳn |
| `--sheet-shadow` | Shadow riêng tờ giấy 664px nổi trên mặt bàn (`.nib-paper` trong canvas.css) |

---

## §13 — Typography

### Font family

| Token | Khi nào dùng |
|---|---|
| `--font-ui` | Mọi text UI chrome: nhãn, nút, sidebar, tiêu đề panel, input — Inter Variable |

> Math render: Computer Modern (do MathLive quản, không có token CSS riêng).

### Cỡ chữ UI chrome

| Token | Giá trị | Khi nào dùng |
|---|---|---|
| `--font-size-ui-xs` | `11px` | Badge, label nhỏ nhất (Coming soon, shortcut hint) |
| `--font-size-ui-sm` | `13px` | Text UI phổ thông: menu item, label, metadata |
| `--font-size-ui-md` | `15px` | Tiêu đề panel nhỏ, tiêu đề section nhỏ |

### Cỡ chữ document

| Token | Giá trị | Khi nào dùng |
|---|---|---|
| `--font-size-doc-heading` | `20px` | Tiêu đề section trong Settings (`.nib-settings__section-title`) |
| `--font-size-doc-body` | `16px` | Body text trong document/note |
| `--font-size-doc-small` | `13px` | Caption, phụ chú, label nhỏ trong document |

### Cỡ chữ toán

| Token | Giá trị | Khi nào dùng |
|---|---|---|
| `--font-math-inline` | `16px` | MathLive inline (trong dòng văn bản) |
| `--font-math-display` | `18px` | MathLive display mode (block toán độc lập) |

---

## §14 — Spacing (khoảng cách)

Base = 4px, bội số 8px. Dùng token — không hardcode `px`.

| Token | Giá trị | Khi nào dùng phổ biến |
|---|---|---|
| `--space-1` | `4px` | Gap icon + text trong nút nhỏ, padding badge |
| `--space-2` | `8px` | Gap nội bộ row, gap giữa icon, padding chip |
| `--space-3` | `12px` | Padding nút, gap row compact, padding badge lớn |
| `--space-4` | `16px` | Padding section, gap chính giữa element |
| `--space-5` | `24px` | Padding section đứng, gap card grid |
| `--space-6` | `32px` | Margin giữa section lớn |
| `--space-7` | `48px` | Padding ngoài cùng lớn (tránh sát mép) |
| `--space-8` | `64px` | Chiều cao dòng kẻ giấy (= `--ruled-line-height`) |

---

## §15 — Canvas-specific

| Token | Giá trị | Khi nào dùng |
|---|---|---|
| `--ruled-line-height` | `64px` | Khoảng cách dòng kẻ giấy — sync với `geometry.ts`. Không đổi khi cỡ toán thay đổi [LOCKED] |
| `--canvas-max-width` | `1440px` | Max-width canvas area. Exposed as var để cấu hình sau nếu cần |

---

## §16 — Dark theme overrides (đầy đủ)

> Các token dưới đây có giá trị khác trong `[data-theme='dark']`. Cùng tên token, chỉ khác giá trị.
> Agent design CHỈ cần dùng `var(--token)` — browser tự resolve đúng theo `data-theme`.
> Section này liệt kê để agent biết token nào THAY ĐỔI trong dark (để tránh giả định màu cố định).

| Token | Dark đặc điểm | Ghi chú |
|---|---|---|
| `--bg-app` | Graphite ấm tối (không đen tuyền) | Vẫn ấm, tránh pure black |
| `--bg-surface` | Dark nhẹ hơn bg-app dark | Phân biệt được với bg-app |
| `--bg-elevated` | Dark nổi rõ hơn surface | Dock/popover nổi trên surface |
| `--bg-subtle` | Giống `--bg-app` dark (chìm lại) | Vùng input chìm trong dark |
| `--desk` | Đậm nhất, nền xa nhất | Nền bàn ngoài paper |
| `--text-primary` | Off-white ấm (không thuần trắng) | Tránh chói mắt dark mode |
| `--text-secondary` | Mid-tone ấm | Chữ phụ, label |
| `--text-muted` | Mờ hơn secondary | Placeholder, disabled |
| `--text-on-accent` | Dark (ngược với light) | Chữ trên accent teal sáng |
| `--border` | Muted dark | Viền card, panel |
| `--border-strong` | Đậm hơn border dark | Hover, focus non-accent |
| `--accent` | Teal sáng hơn light | Đảm bảo contrast trên nền tối |
| `--accent-hover` | Còn sáng hơn accent dark | Hover state |
| `--accent-subtle` | Teal rất tối (nền nhạt dark) | Block active bg dark mode |
| `--caret` | Sáng hơn accent dark | Con trỏ nhìn thấy được |
| `--ink` | Teal sáng (bút trên nền tối) | Stroke render dark |
| `--result` | Indigo/lavender sáng | Đọc được trên nền tối |
| `--result-subtle` | Indigo rất tối | Nền ô result dark |
| `--approx` | Amber sáng | WCAG AA trên bg-surface dark |
| `--approx-subtle` | Amber rất tối | Nền ô approx dark |
| `--success` | Green sáng | Đọc được trên dark |
| `--warning` | = `--approx` dark | Đồng semantic amber |
| `--error` | Red sáng hơn | Contrast dark mode |
| `--info` | = `--accent` dark | Đồng semantic teal |
| `--shadow-1` | Tối hơn (rgba đậm) | Nền tối cần shadow mạnh hơn |
| `--shadow-2` | Rất đậm | Popover/dock trên dark |
| `--sheet-shadow` | Rất đậm | Paper nổi trên desk dark |
| `--overlay` | rgba(0,0,0,0.5) | Dialog nhỏ dark |
| `--scrim` | rgba(0,0,0,0.55) | Overlay scrim dark |
| `--swatch-teal` | Teal sáng (pastel dark) | Ink palette dark |
| `--swatch-blue` | Blue sáng | Ink palette dark |
| `--swatch-green` | Green sáng | Ink palette dark |
| `--swatch-red` | Red sáng | Ink palette dark |
| `--swatch-purple` | Purple sáng | Ink palette dark |
| `--swatch-rose` | Rose sáng | Ink palette dark |
| `--swatch-orange` | Orange ấm sáng | Ink palette dark |
| `--swatch-slate` | Slate sáng | Ink palette dark |

---

## Bảng tra nhanh "dùng màu gì cho X"

| Tình huống | Token dùng |
|---|---|
| Nút primary (accent fill) | `--accent` bg + `--text-on-accent` text |
| Nút primary hover | `--accent-hover` bg |
| Nút ghost / secondary | `--border` border + `--text-secondary` text + `--bg-subtle` hover bg |
| Nút danger (xoá) | `--error` bg + `--text-on-accent` text |
| Tab active | `--accent` text + `--accent` underline 2px + `--accent-subtle` bg |
| Tab inactive | `--text-secondary` text |
| Input border default | `--border` |
| Input border focus | `--accent` (outline 2px) |
| Input background | `--bg-subtle` |
| Kết quả symbolic exact | `--result` text |
| Kết quả số gần đúng | `--approx` text |
| Block toán active | `--accent-subtle` bg + `--accent` left-edge 2px |
| Scrim (Library/Settings) | `--scrim` |
| Backdrop modal nhỏ | `--overlay` |
| Doc card/row hover | `--bg-subtle` bg |
| Divider | `--border` 1px |
| Placeholder text | `--text-muted` |
| Icon disabled | `--text-muted` |
| Delete/danger text | `--error` |
| Success feedback | `--success` |
| Ink bút mặc định | `--swatch-teal` (= `--ink` semantic) |
