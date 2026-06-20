# PLAN — Phase 2: Agent `design` + skill

> Sinh 2 file cấu hình: `.claude/agents/design.md` (vai code-native thay design-figma) + `.claude/skills/design/SKILL.md` (workflow dựng mockup HTML artifact + ≥6 done-criteria đo được), để agent `design` có thể nhận task, đọc `.claude/design-library/`, và xuất HTML/CSS pixel-accurate vào `docs/design-artifacts/` mà không cần Figma MCP.

---

## Context

- **Vì sao chia session:** 2 deliverable có nội dung dài + phụ thuộc chéo (SKILL.md phải trỏ path `.claude/design-library/` thật từ INDEX.md Phase 1; design.md phải liệt kê tool list chính xác). Mỗi file cần review độc lập để tránh drift.
- **Executor:** team-ops (chỉ ghi `.claude/agents/` và `.claude/skills/design/`; KHÔNG ghi `src/`, `master.md`, `playbook.md`, `settings.json`).
- **Ràng buộc LOCKED:**
  1. Agent `design` output = mockup HTML/CSS trong `docs/design-artifacts/*.html`, link `../../src/styles/tokens.css` (relative), class Nib — KHÔNG Figma, KHÔNG claude-design.
  2. Thư viện = `.claude/design-library/` — `INDEX.md` là entry point; 3 req nền [LOCKED] (song ngữ en/vi · desktop ≥1024px · theme qua token) bắt buộc xuất hiện trong cả agent body lẫn SKILL.md.
  3. KHÔNG mention `mcp__figma` trong `.claude/agents/design.md` — gỡ hoàn toàn Figma MCP khỏi tools list.
- **Rủi ro / dependency:**
  - **R1 — Tool list silent risk:** nếu `design.md` frontmatter thiếu `TaskGet` / `TaskUpdate` / `SendMessage` → agent không thể nhận task + report, toàn bộ Phase 4 fail. Gate grep bắt buộc.
  - **R2 — Path drift:** SKILL.md phải trỏ path thật trong `.claude/design-library/` (xác nhận bằng `Glob` hoặc `Grep` tại session 2.2). Nếu Phase 1 đổi tên file → cập nhật SKILL.md trước khi gate.
  - **R3 — Hex leak trong SKILL.md:** SKILL.md là tài liệu hướng dẫn, không phải HTML; nhưng nếu có ví dụ code inline chứa hex → gây confusion cho agent. Gate grep mở rộng sang SKILL.md.
- **Out of scope:** Viết nội dung agent/skill thật (đó là team-ops), ghi `src/`, sửa `master.md` / `playbook.md` / `settings.json`, phase khác (Phase 4 proof run, Phase 3 retire).
- **Workstream liên quan:** `plan/design-agent-library/ROADMAP.md` Phase 2.

---

## Pipeline: 1 phase / 2 session

```
[Session 2.1] design.md ──────────────────► .claude/agents/design.md
                   │
[Session 2.2] SKILL.md + gate verify ─────► .claude/skills/design/SKILL.md
                                             Phase 2 gate pass
```

---

## Phase 2 — Agent `design` + skill

**Mục tiêu:** 2 file tồn tại, đúng frontmatter, không mention Figma MCP, trỏ đúng path `.claude/design-library/`, có ≥6 done-criteria đo được trong SKILL.md — sẵn sàng cho Phase 4 proof run.

---

### Session 2.1 — `.claude/agents/design.md`

- **Scope:** Đọc `.claude/agents/design-figma.md` (mẫu cấu trúc) + `.claude/design-library/INDEX.md` (để biết entry point thư viện) → sinh `.claude/agents/design.md` với:
  - **Frontmatter:** `name: design`, `model: claude-sonnet-4-6`, `tools:` liệt kê đủ Read/Write/Edit/Glob/Grep + TaskGet/TaskUpdate/TaskList/SendMessage — **không có bất kỳ `mcp__figma*` nào**.
  - **Agent body:** vai code-native (không Figma), output = `docs/design-artifacts/*.html`, workflow tham chiếu design-library qua `INDEX.md` (Bước 1–5: tokens → pattern → snippet → component → verify), 3 req nền [LOCKED] nhúng rõ.
  - **"Đọc đầu phiên"** section: 5 file phải đọc theo thứ tự (master.md · playbook.md · context.md · memory/SKILL.md · `.claude/skills/design/SKILL.md`).
  - **TeamCreate mode** section: ack → TaskGet+TaskUpdate cùng turn → TaskUpdate(completed)+SendMessage khi xong.

- **STOP gate:**
  - File `.claude/agents/design.md` tồn tại.
  - `grep "^name: design" .claude/agents/design.md` = 1 hit.
  - `grep "mcp__figma" .claude/agents/design.md` = 0 kết quả.
  - `grep -E "TaskGet|TaskUpdate|SendMessage" .claude/agents/design.md` ≥ 3 hit (cả 3 tool đều có mặt).
  - `grep "design-library" .claude/agents/design.md` ≥ 1 hit (trỏ thư viện).
  - `grep "docs/design-artifacts" .claude/agents/design.md` ≥ 1 hit (output path đúng).

- **Output artifact:** `.claude/agents/design.md`

---

### Session 2.2 — `.claude/skills/design/SKILL.md` + gate verify toàn Phase 2

- **Scope:** Đọc `.claude/design-library/INDEX.md` + `tokens.md` + `components.md` (để biết path thật + quy ước) → sinh `.claude/skills/design/SKILL.md` với:
  - **Frontmatter:** `name: design`, `description:` 1 câu mô tả workflow.
  - **Workflow dựng artifact** (5 bước theo INDEX.md: tokens → pattern → snippet → component → verify), mỗi bước nêu file cụ thể trong `.claude/design-library/`.
  - **≥6 done-criteria đo được** (xem "Done-criteria Phase 2" bên dưới).
  - **Anti-pattern** section: hex rời / text hardcode / class tự đặt / path tuyệt đối / mention Figma.
  - **Gate idiom:** lệnh `grep` cụ thể để agent tự verify trước khi nộp.
  - Sau khi sinh SKILL.md → chạy gate verify toàn Phase 2 (xem "Phase 2 gate" dưới).

- **Done-criteria cho SKILL.md (phải xuất hiện trong file):**
  1. Artifact `docs/design-artifacts/<tên>.html` tồn tại.
  2. `grep "tokens.css" docs/design-artifacts/<tên>.html` ≥ 1 hit (link đúng, relative path `../../src/styles/tokens.css`).
  3. `grep -rnE "#[0-9a-fA-F]{3,8}" docs/design-artifacts/<tên>.html` = 0 kết quả.
  4. `grep -c "data-i18n" docs/design-artifacts/<tên>.html` ≥ số chuỗi hiển thị (mọi text qua i18n key).
  5. `grep 'min-width.*1024' docs/design-artifacts/<tên>.html` ≥ 1 hit (hoặc kiểm `<html style="min-width:1024px">`).
  6. `grep -f <(grep "class:" .claude/design-library/components.md | grep -oP '`[^`]+`') docs/design-artifacts/<tên>.html` ≥ 1 hit (tái dùng ≥1 class từ catalog).

- **STOP gate:**
  - File `.claude/skills/design/SKILL.md` tồn tại.
  - `grep "^name: design" .claude/skills/design/SKILL.md` = 1 hit.
  - `grep "design-library" .claude/skills/design/SKILL.md` ≥ 3 hit (trỏ nhiều file trong thư viện).
  - `grep -E "#[0-9a-fA-F]{3,8}" .claude/skills/design/SKILL.md` = 0 kết quả (không có hex trong tài liệu).
  - 6 done-criteria kể trên xuất hiện dưới dạng check-list trong file.

- **Output artifact:** `.claude/skills/design/SKILL.md`

**Phase 2 gate (trước khi sang Phase 4):**
- `.claude/agents/design.md` tồn tại + frontmatter `name: design` + 0 `mcp__figma` + tools có TaskGet/TaskUpdate/SendMessage + trỏ design-library.
- `.claude/skills/design/SKILL.md` tồn tại + frontmatter `name: design` + `grep "design-library"` ≥ 3 hit + 0 hex rời + 6 done-criteria đo được.
- Cross-check: `grep "design-library/INDEX.md" .claude/agents/design.md` ≥ 1 hit (entry point đúng).

---

## Outcome cuối Phase 2

- Agent `design` có thể nhận task từ lead (via TaskGet+TaskUpdate), đọc `.claude/design-library/INDEX.md` → biết quy trình → sinh HTML artifact đúng chuẩn — mà không cần Figma MCP.
- Phase 4 (proof run) có thể bắt đầu: spawn agent `design`, giao task dựng `docs/design-artifacts/settings-overlay.html`.

---

## Revision log

| Date | Change | Lý do |
|---|---|---|
| 2026-06-20 | Initial | Phase 1 done, dựng Phase 2 long-plan |
