# ROADMAP — design-agent-library

> Bản đồ chia project thành 4 phase độc lập; **mỗi phase = 1 long-plan riêng** sinh just-in-time khi tới lượt. File này KHÔNG phải long-plan — chỉ mô tả *cần làm gì* + *cần làm rõ gì* để mỗi lần dựa vào đây dựng PLAN/CHECKPOINT (theo skill `plan-long`).
>
> Executor tổng: **team-ops** (chỉ đọc `src/` để trích catalog, KHÔNG ghi `src/`). Lead drive TaskList loop, gate mỗi phase.

---

## Nền tảng đã chốt — [LOCKED, user chốt 2026-06-19, KHÔNG đảo]

1. **Output agent** = mockup HTML/CSS pixel-accurate trong repo (`docs/design-artifacts/*.html`), link `src/styles/tokens.css` + class component Nib → nguồn chân lý cho `editor-frontend` code lại. Không Figma, không claude-design ngoài.
2. **Thư viện** = catalog tham chiếu trong `.claude/design-library/` (KHÔNG phải code `src/`).
3. **Thay thế hẳn `design-figma`** → roster vẫn 9 vai, đổi 1; gỡ Figma MCP khỏi flow.

---

## Cross-cutting — chốt trước khi vào phase liên quan

| CC | Nội dung | Ảnh hưởng | Trạng thái |
|---|---|---|---|
| CC-1 | `src/styles/tokens.css` phải freeze trong suốt Phase 1 (stale-catalog risk nếu thay đổi giữa chừng) | Phase 1 | ⬜ xác nhận trước Session 1.1 |
| CC-2 | Màn proof run Phase 4: Settings Overlay (mặc định) — user có thể đổi | Phase 4 | ⬜ xác nhận trước Phase 4 |
| CC-3 | Revert plan Phase 3: ghi git commit hash của `design-figma.md` + `figma-design/SKILL.md` vào diff proposal trước khi xóa | Phase 3 | ⬜ session 3.1 |

---

## Phases (thứ tự 1→2→4→3)

> ⚠️ **Đề xuất đảo Phase 3↔4** so với thứ tự tự nhiên: proof run (Phase 4) TRƯỚC retire figma (Phase 3). Lý do: nếu proof run fail → không retire, fallback an toàn. Nếu user muốn giữ 1→2→3→4 → user chốt + ghi vào revision log của ROADMAP này.

### Phase 1 — Design-library catalog `.claude/design-library/` ← **ĐANG CHẠY**

- **Cần làm gì:**
  - `INDEX.md` — cách agent tham chiếu thư viện (tra gì ở đâu, quy ước copy snippet, thứ tự đọc).
  - `tokens.md` — catalog toàn bộ CSS custom property từ `tokens.css` + map "khi nào dùng token nào".
  - `components.md` — danh mục component Nib (UnifiedDock, LibraryOverlay, SettingsOverlay, TopStrip, Canvas/ruled-paper…) + class CSS chính + cách tái dùng.
  - `patterns/` — ≥3 blueprint layout (overlay Library/Settings, dock drill-down, ruled-paper canvas).
  - `snippets/` — ≥3 snippet HTML+CSS: link `tokens.css` + class Nib, 0 hex rời, ≥1024px landscape.
- **Cần làm rõ trước:** CC-1 (tokens.css freeze) xác nhận.
- **Done khi:** 5 artifact tồn tại · token count trong tokens.md ≥ số `--[a-z]` trong tokens.css (grep) · `grep -rE "#[0-9a-fA-F]{3,6}" .claude/design-library/` = 0 · mọi component class grep pass trong `src/`.
- **Long-plan:** `plan/design-agent-library/phase-1-catalog/` (đang chạy, team-ops Task #1).
- **Phụ thuộc:** CC-1.

### Phase 2 — Agent `design` + skill

- **Cần làm gì:**
  - `.claude/agents/design.md` — vai code-native, output HTML artifact, tham chiếu design-library theo INDEX.md Phase 1, nhúng 3 req nền [LOCKED] (song ngữ en/vi · desktop ≥1024px · theme qua token), tools Task*+SendMessage, không mention Figma MCP.
  - `.claude/skills/design/SKILL.md` — workflow dựng artifact + 6 done-criteria đo được.
- **Cần làm rõ trước:** Đọc `.claude/design-library/INDEX.md` (Phase 1 output) trước khi viết SKILL.md để trỏ đúng path.
- **Done khi:** 2 file tồn tại · frontmatter `name: design` · `grep "design-library" SKILL.md` ≥ 1 hit · 6 done-criteria liệt kê rõ trong SKILL.md · không mention `mcp__figma` trong design.md.
- **Long-plan:** sinh just-in-time khi Phase 1 gate pass (`plan/design-agent-library/phase-2-agent-skill/`).
- **Phụ thuộc:** Phase 1 gate pass.

### Phase 4 — Proof run *(xác nhận agent hoạt động trước khi retire)*

- **Cần làm gì:** Agent `design` dựng `docs/design-artifacts/settings-overlay.html` từ thư viện Phase 1 + skill Phase 2. `docs/design-artifacts/` tạo nếu chưa tồn tại.
- **Cần làm rõ trước:** CC-2 (màn proof run) xác nhận.
- **Done khi:** Artifact tồn tại · `grep "tokens.css"` = 1 hit · `grep -E "#[0-9a-fA-F]{3,6}"` = 0 · ≥2 i18n key `data-i18n` hoặc placeholder en/vi · có `min-width: 1024px` trong file · ≥1 class từ components.md được dùng. Nếu fail → iterate, KHÔNG sang Phase 3.
- **Long-plan:** sinh just-in-time khi Phase 2 gate pass (`plan/design-agent-library/phase-4-proof-run/`).
- **Phụ thuộc:** Phase 2 gate pass.

### Phase 3 — Wire + retire design-figma ⚠️ HUMAN-GATE

- **Cần làm gì:** Gỡ ref design-figma + Figma MCP khỏi master.md / playbook.md / settings.json · xóa `.claude/agents/design-figma.md` + `.claude/skills/figma-design/SKILL.md`.
- **Cần làm rõ trước:** CC-3 (revert plan / commit hash ghi trước khi xóa) · **user/lead duyệt diff proposal** (session đầu Phase 3 = soạn diff → STOP → chờ approve → session sau apply).
- **Done khi:** `grep -r "design-figma" .claude/` = 0 · `grep -r "mcp__figma" .claude/` = 0 · file đã xóa · roster master.md có `design`, không có `design-figma`, tổng = 9 vai.
- **Long-plan:** sinh just-in-time khi Phase 4 gate pass + user approve (`plan/design-agent-library/phase-3-retire-figma/`).
- **Phụ thuộc:** Phase 4 gate pass + **user duyệt diff** (không bỏ qua).

---

## Thứ tự phụ thuộc

```
[CC-1 freeze] ──► Phase 1 (catalog) ──► Phase 2 (agent+skill) ──► Phase 4 (proof run) ──► Phase 3 (HUMAN-GATE, retire)
```

---

## Bảng tiến độ

| Phase | Long-plan | Trạng thái |
|---|---|---|
| 1 — Design-library catalog | `plan/design-agent-library/phase-1-catalog/` | 🔄 (team-ops Task #1) |
| 2 — Agent `design` + skill | `plan/design-agent-library/phase-2-agent-skill/` | 🔄 (PLAN dựng 2026-06-20, team-ops chờ task) |
| 4 — Proof run | `plan/design-agent-library/phase-4-proof-run/` | 🔄 (PLAN dựng 2026-06-20, chờ agent `design` run Session 4.1) |
| 3 — Wire + retire (HUMAN-GATE) | `plan/design-agent-library/phase-3-retire-figma/` (sinh khi Phase 4 done + approve) | ⬜ |
