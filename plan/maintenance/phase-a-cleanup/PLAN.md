# PLAN — Phase A: Cleanup (archive + annotate + trim)

> Dọn sạch `plan/`, `docs/`, `.claude/memory/` sau đợt build Phase 0: archive plan đã done, archive docs stale, annotate `docs/design.md` một phần superseded, xóa `plan/ROADMAP.md` phẳng (deprecated), trim memory entries.

---

## Context

- **Vì sao nhiều session**: 6 session vì mỗi đơn vị nặng — đọc ≥1 file lớn để trích đúng ref, hoặc output ≥10 file-op, hoặc cần đọc toàn bộ docs/design.md (200+ dòng) để annotate đúng section.
- **Nền**: Audit researcher 2026-06-20 đã xác định toàn bộ targets; không có CC blocker.
- **Workstream**: bảo trì `.claude/` — KHÔNG đụng `src/`, `backend/`, `src-tauri/`.
- **Out of scope phase này**: sửa agent body (Phase B), sửa master/playbook workflow (Phase C), implement bất kỳ tính năng app nào.
- **ROADMAP**: `plan/maintenance/ROADMAP.md`.

---

## Pipeline 1 phase / 6 session

```
[A.1] Grep refs inventory ──────────────────────────────► ref-inventory.md
         │
[A.2] Archive 6 plan dirs + fix master.md §8 + README ─► plan/_archived/ (6 dirs)
         │
[A.3] Archive design-agent-library + xóa flat ROADMAP ─► plan/_archived/design-agent-library/
         │                                                  plan/ROADMAP.md DELETED
[A.4] Archive 6 stale docs ─────────────────────────────► docs/_archived/ (6 files)
         │
[A.5] Annotate docs/design.md ──────────────────────────► banner + 4 section notes
         │
[A.6] Trim memory ──────────────────────────────────────► context.md/patterns.md slim
                                                           context-archive.md / patterns-archive.md
```

---

## Phase A — Cleanup

**Mục tiêu**: Đưa `plan/`, `docs/`, `.claude/memory/` về trạng thái sạch: chỉ còn plan đang-chạy + docs live + memory 10-entry; tất cả item done/stale ở `_archived/`.

---

### Session A.1 — Reference inventory

- **Scope**: Grep toàn bộ `.claude/`, `docs/`, `plan/` (bao gồm cả file active như `settings-redesign/`) để tìm mọi ref tới 13 item sẽ archive. Ghi kết quả vào `ref-inventory.md`.

- **Targets grep** (tên file/thư mục sẽ archive):
  ```
  agent-team-setup | nib-mock-ui | dock-v2 | tauri-shell
  nib-editor-rebuild | nav-dock-redesign | design-agent-library
  Nib-Dock-v2-ref | design-ref-editor | dock-handoff
  sidebar-handoff | sidebar-mockup | nav-dock-design\.md
  plan/ROADMAP\.md   (flat — phân biệt với plan/maintenance/ROADMAP.md)
  ```

- **Files cần grep** (không bỏ qua):
  - `.claude/master.md`
  - `.claude/teams/playbook.md`
  - `.claude/agents/*.md` (9 files)
  - `.claude/memory/*.md`
  - `.claude/design-library/*.md` + `snippets/*.html`
  - `docs/*.md` + `docs/design-artifacts/*.html`
  - `plan/README.md`
  - `plan/settings-redesign/PLAN.md` + `CHECKPOINT.md` (plan đang active)

- **Output artifact**: `plan/maintenance/phase-a-cleanup/ref-inventory.md`
  - Format: bảng 3 cột: `File | Ref tìm thấy | Hành động cần làm (update path / xóa row / note)`
  - Bao gồm row: `.claude/master.md §8` → "plan hạ tầng team" trỏ `plan/agent-team-setup/` → hành động: update path → `plan/_archived/agent-team-setup/`

- **STOP gate**: `ref-inventory.md` tồn tại; bảng có ≥ 5 row (biết được ít nhất 5 ref cần xử lý); không có file trong danh sách grep bị bỏ sót.

---

### Session A.2 — Archive 6 plan dirs + sửa master.md + update README

- **Scope**: Move 6 plan dirs đã done → `plan/_archived/`. Sửa tất cả ref tìm thấy trong A.1 liên quan đến 6 dirs này.

- **File move** (6 dirs):
  ```
  plan/agent-team-setup/     → plan/_archived/agent-team-setup/
  plan/nib-mock-ui/          → plan/_archived/nib-mock-ui/
  plan/dock-v2/              → plan/_archived/dock-v2/
  plan/tauri-shell/          → plan/_archived/tauri-shell/
  plan/nib-editor-rebuild/   → plan/_archived/nib-editor-rebuild/
  plan/nav-dock-redesign/    → plan/_archived/nav-dock-redesign/
  ```

- **Reference updates bắt buộc**:
  - `.claude/master.md §8` row "Plan hạ tầng team":
    - Cũ: `plan/agent-team-setup/PLAN.md + CHECKPOINT.md`
    - Mới: `plan/_archived/agent-team-setup/PLAN.md` (archived 2026-06-20)
  - `plan/README.md`: cập nhật 6 row (agent-team-setup, nib-mock-ui, dock-v2, tauri-shell, nib-editor-rebuild, nav-dock-redesign) → thêm note "(archived → `plan/_archived/<slug>/`)", trạng thái ✅.
  - Mọi ref khác tìm thấy trong ref-inventory.md liên quan 6 dirs này → xử lý theo cột "Hành động".

- **STOP gate**:
  - `ls plan/_archived/` shows ≥ 6 dirs (agent-team-setup, nib-mock-ui, dock-v2, tauri-shell, nib-editor-rebuild, nav-dock-redesign).
  - `grep -r "plan/agent-team-setup\|plan/nib-mock-ui\|plan/dock-v2\|plan/tauri-shell\|plan/nib-editor-rebuild\|plan/nav-dock-redesign" .claude/ docs/ plan/README.md plan/settings-redesign/` = 0 live refs (hoặc chỉ còn ref `plan/_archived/...` trong README).
  - `cat .claude/master.md` không còn trỏ `plan/agent-team-setup/` (mà trỏ `plan/_archived/` hoặc ghi "archived").

---

### Session A.3 — Archive design-agent-library + xóa plan/ROADMAP.md phẳng + update README

- **Scope**: Move toàn bộ `plan/design-agent-library/` (cả ROADMAP.md + 3 phase dirs). Xóa `plan/ROADMAP.md` (phẳng). Update `plan/README.md`.

- **File move**:
  ```
  plan/design-agent-library/   → plan/_archived/design-agent-library/
    (bao gồm ROADMAP.md + phase-1-catalog/ + phase-2-agent-skill/ + phase-4-proof-run/)
  ```

- **File delete**:
  ```
  plan/ROADMAP.md   (flat, deprecated bởi plan/maintenance/ROADMAP.md)
  ```

- **Reference updates bắt buộc**:
  - `plan/README.md`:
    - Xóa row `ROADMAP.md` (flat) khỏi bảng index.
    - Cập nhật 4 rows design-agent-library: slug, loại, trạng thái → note "(archived → `plan/_archived/design-agent-library/`)", ✅.
    - Thêm 2 rows mới vào bảng: `maintenance` (roadmap) + `maintenance/phase-a-cleanup` (long-plan, 🔄).
  - Mọi ref khác tìm thấy trong ref-inventory.md liên quan design-agent-library / plan/ROADMAP.md flat → xử lý.

- **STOP gate**:
  - `ls plan/_archived/design-agent-library/` shows ROADMAP.md + ≥ 3 subdir.
  - `ls plan/ROADMAP.md` → "No such file or directory".
  - `plan/README.md` không còn row trỏ `plan/ROADMAP.md` (flat) hoặc `plan/design-agent-library/` non-archived.
  - `plan/README.md` có row cho `maintenance` + `maintenance/phase-a-cleanup`.

---

### Session A.4 — Archive 6 stale docs

- **Scope**: Move 6 docs stale → `docs/_archived/`. Sửa mọi ref còn sống từ ref-inventory.md.

- **File move** (6 files):
  ```
  docs/Nib-Dock-v2-ref.html    → docs/_archived/Nib-Dock-v2-ref.html
  docs/design-ref-editor.html  → docs/_archived/design-ref-editor.html
  docs/dock-handoff.md         → docs/_archived/dock-handoff.md
  docs/sidebar-handoff.md      → docs/_archived/sidebar-handoff.md
  docs/sidebar-mockup.html     → docs/_archived/sidebar-mockup.html
  docs/nav-dock-design.md      → docs/_archived/nav-dock-design.md
  ```

- **Reference updates**: Theo ref-inventory.md — mọi file ngoài `_archived/` còn trỏ tới 6 item trên → update path → `docs/_archived/...` hoặc xóa ref nếu không còn cần.

- **STOP gate**:
  - `ls docs/_archived/` shows ≥ 6 files (đủ tên trên).
  - `grep -r "Nib-Dock-v2-ref\|design-ref-editor\|dock-handoff\|sidebar-handoff\|sidebar-mockup\|nav-dock-design" docs/ .claude/ plan/` không có hit ngoài `docs/_archived/` và `plan/_archived/`.

---

### Session A.5 — Annotate docs/design.md (SUPERSEDED banner + section notes)

- **Scope**: Đọc toàn bộ `docs/design.md`, thêm banner tổng + inline note tại 4 section bị lật. KHÔNG rewrite nội dung — chỉ thêm dòng chú thích trên đầu mỗi section bị supersede.

- **Files đọc**: `docs/design.md` (toàn bộ).

- **Edits cụ thể**:

  1. **Đầu file** (trước mọi nội dung, dòng 1–3): thêm banner:
     ```
     > ⚠️ **PARTIALLY SUPERSEDED** — §2.3, §4.1, §4.3, §4.4 đã bị lật bởi toolbar-redesign + nav-dock-redesign (2026-06-13/17). Xem code thật `src/` làm nguồn sự thật. Chi tiết: chú thích inline bên dưới từng section. Phần còn lại (§1/§2.1/§2.2/§3/§5/§6/§7/§8/§9/§10/§11) vẫn valid.
     ```

  2. **Tại §2.3** (tìm bằng heading hoặc text pattern "2.3"): thêm 1 dòng chú thích ngay dưới heading:
     ```
     > <!-- SUPERSEDED §2.3 — nav-dock-redesign (2026-06-17) lật layout này; xem src/components/ làm nguồn sự thật. -->
     ```

  3. **Tại §4.1**: thêm tương tự:
     ```
     > <!-- SUPERSEDED §4.1 — toolbar-redesign (2026-06-13) thay đổi UX lớp 2; xem src/. -->
     ```

  4. **Tại §4.3**: thêm:
     ```
     > <!-- SUPERSEDED §4.3 — nav-dock-redesign (2026-06-17) thay đổi dock structure; xem src/. -->
     ```

  5. **Tại §4.4**: thêm:
     ```
     > <!-- SUPERSEDED §4.4 — nav-dock-redesign (2026-06-17) thay đổi nav flow; xem src/. -->
     ```

- **STOP gate**:
  - `grep "SUPERSEDED" docs/design.md | wc -l` ≥ 5 (1 banner + 4 section notes).
  - `docs/design.md` còn là valid markdown (không bị broken heading/structure).
  - File size không giảm (chỉ thêm, không xóa).

---

### Session A.6 — Trim memory

- **Scope**: Slim 3 memory files: context.md (22→10 entries), patterns.md (~13→10), issues.md (append header). Tạo 2 archive files cho entries cũ.

- **Files đọc**: `.claude/memory/context.md`, `.claude/memory/patterns.md`, `.claude/memory/issues.md`.

- **Edits cụ thể**:

  1. **context.md** — giữ 10 entry MỚI NHẤT (tính theo timestamp đầu `## YYYY-MM-DD`). Move 12 entry cũ vào `context-archive.md` (tạo file mới, append-only, header ghi "archived từ context.md 2026-06-20"). Không xóa vĩnh viễn.

  2. **patterns.md** — giữ 10 entry (hoặc tất cả nếu hiện tại ≤10 sau đọc kỹ). Move entry cũ hơn vào `patterns-archive.md` (tạo file mới). Nếu tổng ≤10 → không cần archive, chỉ ghi note "đã review 2026-06-20".

  3. **issues.md** — KHÔNG xóa bất kỳ entry nào (append-only). Thêm header section mới ngay sau frontmatter comment:
     ```
     ## Status tổng quan (2026-06-20)
     Open issues: #7, #10, #11, #12
     Fixed issues: #0, #1, #2, #3, #4, #5, #6, #8, #9
     ```

- **STOP gate**:
  - Count entry blocks (`## 20` pattern) trong `context.md` ≤ 10.
  - `context-archive.md` tồn tại + `grep "^## 20" .claude/memory/context-archive.md | wc -l` ≥ 1.
  - `grep "Open issues" .claude/memory/issues.md` = 1 hit.
  - `issues.md` không ngắn hơn trước (append-only, tổng dòng chỉ tăng).

---

## Outcome cuối

- `plan/_archived/` chứa ≥ 7 thư mục (6 plan + design-agent-library).
- `docs/_archived/` chứa ≥ 6 file stale.
- `plan/ROADMAP.md` (phẳng) không còn tồn tại.
- `docs/design.md` có banner SUPERSEDED + 4 inline notes.
- `.claude/memory/context.md` ≤ 10 entries; `context-archive.md` có entries cũ.
- `plan/README.md` cập nhật: rows cũ ghi archived, rows mới cho `maintenance` + `maintenance/phase-a-cleanup`.
- `.claude/master.md §8` không còn trỏ non-archived path.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-20 | Initial | Phase A của maintenance roadmap — dựa trên audit researcher |
