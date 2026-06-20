# Pattern: Overlay lớn (Library / Settings kiểu)

> Dùng khi: màn quản lý (Library), cài đặt (Settings), hoặc bất kỳ modal full-screen nào cần canvas vẫn mounted bên dưới.  
> Snippet copy-được: `../snippets/overlay-panel.html`

---

## Khi nào dùng pattern này

- Màn cần không gian lớn (min 900×600px) và nhiều nội dung cuộn
- Canvas (document) KHÔNG bị unmount — chỉ bị che khuất bởi scrim
- Có Back button rõ ràng để đóng (KHÔNG dùng × góc phải — theo thiết kế Nib)
- Animation slide-in từ dưới lên + fade

**Không dùng pattern này khi:** dialog xác nhận nhỏ (≤400px) → dùng `nib-lib-delete` pattern (components.md §Delete).

---

## Cấu trúc HTML

```
.nib-<name>-overlay                    ← Container toàn màn hình (absolute inset:0)
  ├── .nib-<name>__scrim               ← Lớp mờ click-to-close (z-50)
  └── .nib-<name>__panel               ← Panel nội dung (z-60, centered, 900×600max)
        ├── .nib-<name>__header        ← Header: [Back] [Tiêu đề] [Action phụ]
        │     ├── .nib-<name>__back    ← Nút Back (ghost, 44px hit target)
        │     ├── .nib-<name>__heading ← Tiêu đề (bold)
        │     └── [optional action]    ← Vd nút "Tài liệu mới" (accent fill)
        └── [body content]             ← Phần nội dung chính (cuộn)
```

---

## Token liên quan

| Token | Dùng ở đâu |
|---|---|
| `--scrim` | Nền `.nib-<name>__scrim` |
| `--bg-elevated` | Nền panel |
| `--border` | Viền panel (1px) |
| `--shadow-2` | Shadow panel nổi |
| `--text-primary` | Tiêu đề heading |
| `--text-muted` | Icon nút Back (default) |
| `--bg-subtle` | Hover nút Back |
| `--accent` | Nút action (New/Save) bg + focus ring |
| `--text-on-accent` | Chữ trên nút accent |
| `--accent-hover` | Hover nút accent |

---

## CSS cốt lõi (pattern skeleton)

```css
/* Container: toàn màn hình, transition opacity */
.nib-<name>-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}
.nib-<name>-overlay[data-open='true'] {
  opacity: 1;
  pointer-events: auto;
}

/* Scrim */
.nib-<name>__scrim {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: var(--scrim);
}

/* Panel: centered, slide-in */
.nib-<name>__panel {
  position: absolute;
  inset: 0;
  margin: auto;
  width: min(900px, calc(100% - 80px));
  height: min(600px, calc(100% - 80px));
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background-color: var(--bg-elevated);
  box-shadow: var(--shadow-2);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.2s, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.nib-<name>-overlay[data-open='true'] .nib-<name>__panel {
  opacity: 1;
  transform: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .nib-<name>-overlay, .nib-<name>__panel { transition: none; }
}

/* Header */
.nib-<name>__header {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--border);
}
.nib-<name>__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: none;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}
.nib-<name>__back:hover {
  background-color: var(--bg-subtle);
  color: var(--text-primary);
}
.nib-<name>__heading {
  flex: 1;
  font-size: var(--font-size-ui-md);
  font-weight: 700;
  color: var(--text-primary);
}
```

---

## Biến thể đã có trong src/

| Tên overlay | Class root | Layout bên trong |
|---|---|---|
| Library | `.nib-library-overlay` | Header + Toolbar (search/sort/view) + grid/list body |
| Settings | `.nib-settings-overlay` | Header + Tab bar ngang (48px) + content full-width |

**Khi thiết kế overlay MỚI:** đặt class `.nib-<slug>-overlay`, `.nib-<slug>__scrim`, `.nib-<slug>__panel`, `.nib-<slug>__header`, `.nib-<slug>__back`, `.nib-<slug>__heading`. Bên trong tự do tuỳ nội dung.

---

## Checklist trước khi nộp mockup overlay

- [ ] `data-open="true"` trên `.nib-<name>-overlay` để hiển thị
- [ ] `role="dialog" aria-modal="true"` trên `.panel`
- [ ] `aria-label` hoặc `aria-labelledby` trỏ đến tiêu đề
- [ ] Nút Back có `aria-label` + hit target ≥44px
- [ ] 0 hex rời: `grep -rnE "#[0-9a-fA-F]{3,8}" <file>` = rỗng
- [ ] `data-i18n` trên mọi text hiển thị
- [ ] `data-theme="light"` / `data-theme="dark"` trên `<html>` để test
