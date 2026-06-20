# PLAN — Phase 1: Design-library catalog

> Sinh đủ 5 artifact trong `.claude/design-library/` (INDEX.md, tokens.md, components.md, patterns/, snippets/) để agent `design` ở Phase 2 có thể tham chiếu chính xác token + component + pattern mà không cần đọc `src/` trực tiếp.

---

## Context

- **Vì sao multi-session:** Catalog cần đọc toàn bộ `src/styles/tokens.css` + `src/components/` — bulk read + nhiều file output, vượt 1 chat.
- **Executor:** team-ops (chỉ đọc `src/`, KHÔNG ghi `src/`). PLAN mô tả WHAT — HOW là việc của team-ops.
- **Ràng buộc:** `src/styles/tokens.css` là nguồn chân lý — KHÔNG sửa trong suốt Phase 1 (stale-catalog risk). Xác nhận CC-1 với lead trước Session 1.1.
- **Out of scope:** Viết agent/skill (Phase 2), dựng HTML artifact (Phase 4), đụng master/playbook/settings (Phase 3). Phase 1 chỉ tạo file trong `.claude/design-library/`.
- **Workstream liên quan:** `plan/design-agent-library/ROADMAP.md` Phase 1.

---

## Pipeline: 1 phase / 3 session

```
[Session 1.1] INDEX.md + tokens.md ──────────────► .claude/design-library/INDEX.md
                                                     .claude/design-library/tokens.md
                        │
[Session 1.2] components.md + patterns/ ──────────► .claude/design-library/components.md
                                                     .claude/design-library/patterns/ (≥3 file)
                        │
[Session 1.3] snippets/ + gate verify ────────────► .claude/design-library/snippets/ (≥3 file)
                                                     Phase 1 gate pass
```

---

## Phase 1 — Design-library catalog

**Mục tiêu:** `.claude/design-library/` có đủ 5 artifact, mọi token khớp `tokens.css`, 0 hex rời toàn thư viện, mọi component class xác nhận tồn tại trong `src/`.

### Session 1.1 — INDEX.md + tokens.md

- **Scope:** Đọc `src/styles/tokens.css` → sinh hai file:
  - `INDEX.md`: mục đích từng file trong thư viện, thứ tự đọc khi mới vào, quy ước copy snippet vào artifact (dùng token variable, không hex rời, class Nib).
  - `tokens.md`: catalog toàn bộ CSS custom property (nhóm theo chủ đề: color, spacing, typography, border, shadow…) + cột "khi nào dùng" cho từng token.
- **STOP gate:**
  - `INDEX.md` tồn tại · có section "Thứ tự đọc" · có section "Quy ước copy snippet".
  - `tokens.md` tồn tại · số token (dòng có `--`) ≥ `grep -c "^\s*--" src/styles/tokens.css`.
  - `grep -E "#[0-9a-fA-F]{3,6}" .claude/design-library/tokens.md` = 0 kết quả.
- **Output artifact:** `.claude/design-library/INDEX.md`, `.claude/design-library/tokens.md`.

### Session 1.2 — components.md + patterns/

- **Scope:** Đọc `src/components/` → sinh:
  - `components.md`: danh mục ≥5 component Nib (UnifiedDock, LibraryOverlay, SettingsOverlay, TopStrip, Canvas/ruled-paper…), mỗi entry ghi class CSS chính + mô tả ngắn + cách tái dùng trong snippet.
  - `patterns/`: ≥3 file blueprint layout dạng markdown mô tả cấu trúc HTML/class (overlay Library/Settings, dock drill-down, ruled-paper canvas) — KHÔNG phải HTML thật, chỉ blueprint.
- **STOP gate:**
  - `components.md` tồn tại · ≥5 component được catalog · mỗi entry có class CSS chính + mô tả cách dùng.
  - `patterns/` tồn tại + ≥3 file (`.md`).
  - Mỗi class CSS chính trong components.md: `grep -r "<class>" src/` ≥ 1 hit (xác nhận tồn tại thật trong src/).
- **Output artifact:** `.claude/design-library/components.md`, `.claude/design-library/patterns/<tên>.md` (≥3 file).

### Session 1.3 — snippets/ + gate verify toàn Phase 1

- **Scope:** Sinh `snippets/` (≥3 snippet HTML+CSS mẫu hoàn chỉnh: link `tokens.css`, dùng class Nib, 0 hex rời, viewport/layout ≥1024px landscape) → chạy gate verify đầy đủ toàn Phase 1.
- **STOP gate:**
  - `snippets/` tồn tại + ≥3 file HTML.
  - Mỗi snippet: `grep "tokens.css"` ≥ 1 hit.
  - `grep -rE "#[0-9a-fA-F]{3,6}" .claude/design-library/snippets/` = 0 kết quả.
  - `grep -rE "#[0-9a-fA-F]{3,6}" .claude/design-library/` = 0 kết quả (toàn thư viện, không chỉ snippets/).
- **Output artifact:** `.claude/design-library/snippets/<tên>.html` (≥3 file).

**Phase 1 gate (trước khi sang Phase 2):**
5 artifact tồn tại · token count ≥ tokens.css · 0 hex rời toàn `.claude/design-library/` · ≥5 component class grep pass trong `src/` · ≥3 pattern file · ≥3 snippet link tokens.css.

---

## Outcome cuối Phase 1

- `.claude/design-library/` sẵn sàng làm nguồn tham chiếu cho Phase 2 (agent `design` + skill).
- Agent Phase 2 có thể đọc `INDEX.md` → biết ngay path và quy ước → trỏ đúng vào từng file mà không cần đọc `src/`.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-19 | Initial | — |
