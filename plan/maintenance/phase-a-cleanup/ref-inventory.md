# Ref Inventory — Phase A Cleanup (2026-06-20)

> Kết quả grep toàn bộ `.claude/`, `docs/`, `plan/` cho 13 item sẽ archive.
> Mục đích: xác định chính xác ref nào cần update/xóa/giữ nguyên trước khi thực hiện A.2–A.4.

---

## Bảng tham chiếu

| File | Ref tìm thấy | Hành động cần làm |
|---|---|---|
| `.claude/master.md` L224 | `plan/agent-team-setup/PLAN.md + CHECKPOINT.md` (§8 "Plan hạ tầng team") | **Update path** → `plan/_archived/agent-team-setup/PLAN.md` + ghi "(archived 2026-06-20)" |
| `.claude/agents/planner.md` L3 | `plan/ROADMAP.md` (description frontmatter) | **Để nguyên** — planner vẫn cần tạo ROADMAP.md mới cho roadmap khác; ref này = hướng dẫn convention, không trỏ file cụ thể đã xóa |
| `.claude/agents/planner.md` L13 | `plan/ROADMAP.md (nếu có)` ("Đọc đầu phiên") | **Để nguyên** — conditional "nếu có", không trỏ cố định |
| `.claude/agents/planner.md` L59 | `plan/ROADMAP.md` (bước cuối) | **Để nguyên** — convention tạo file mới, không ref file cũ đã xóa |
| `.claude/agents/planner.md` L64 | `plan/ROADMAP.md` (verify) | **Để nguyên** — pattern kiểm tra chung |
| `.claude/agents/planner.md` L85,93,112,130 | `plan/ROADMAP.md` (output + constraint) | **Để nguyên** — convention planner tạo ROADMAP mới cho mọi roadmap; ROADMAP.md phẳng cũ sẽ bị xóa nhưng planner vẫn cần tạo ROADMAP.md mới theo nested convention |
| `.claude/agents/researcher.md` L29 | `plan/ROADMAP.md` ("Gom context repo: ... + long-plan liên quan") | **Để nguyên** — researcher đọc ROADMAP nếu có; sẽ không còn file phẳng cũ để tìm thấy |
| `.claude/skills/roadmap/SKILL.md` L34 | `## Form plan/ROADMAP.md` | **Để nguyên** — đây là template form trong skill, không trỏ file artifact cụ thể |
| `.claude/skills/plan-long/SKILL.md` L45, L206 | `plan/ROADMAP.md` (workstream ref + anti-pattern) | **Để nguyên** — convention chung, không ref file cụ thể đã xóa |
| `.claude/skills/build-verify/SKILL.md` L148 | `dock-v2, tauri-shell, nib-editor-rebuild, nav-dock-redesign` (trong evidence prose) | **Để nguyên** — đây là bằng chứng lịch sử trong section giải thích ISSUE-8; không phải path file |
| `.claude/teams/issues.md` nhiều dòng | `nib-mock-ui`, `nib-editor-rebuild`, `nav-dock-redesign`, `design-agent-library` (trong issue text) | **Để nguyên** — đây là nội dung lịch sử issue, không phải path ref cần update |
| `.claude/memory/patterns.md` nhiều dòng | `agent-team-setup`, `dock-v2`, `nib-editor-rebuild`, `nav-dock-redesign`, `docs/Nib-Dock-v2-ref.html` (trong prose entries) | **Để nguyên** — đây là log lịch sử; memory entries không cần update path |
| `.claude/memory/context.md` nhiều dòng | `dock-handoff.md`, `dock-v2`, `tauri-shell`, `nib-editor-rebuild`, `nav-dock-redesign`, `design-agent-library`, `docs/Nib-Dock-v2-ref.html` (trong prose entries) | **Để nguyên** — log lịch sử memory, không phải path ref live |
| `.claude/memory/mistakes.md` L8 | `agent-team-setup` (trong prose entry) | **Để nguyên** — log lịch sử |
| `.claude/memory/global.md` L8 | `agent-team-setup` (trong prose entry) | **Để nguyên** — log lịch sử |
| `docs/sidebar-handoff.md` L3,9,13 | `docs/sidebar-mockup.html` (tham chiếu nội bộ) | **Sẽ archive cùng** — sidebar-handoff.md sẽ được archive (A.4); ref nội bộ không cần update |
| `docs/sidebar-design.md` L138,263 | `dock-v2` (trong prose: "xem memory dock-v2") | **Để nguyên** — đây là ref tới memory entry (slug), không phải path file plan |
| `docs/nav-dock-design.md` L125,167 | `dock-v2`, `nib-editor-rebuild` (trong prose lịch sử) | **Sẽ archive** — nav-dock-design.md sẽ được archive (A.4); không cần update |
| `plan/README.md` L9 | `plan/ROADMAP.md` (row bảng index: "roadmap" type trỏ `plan/ROADMAP.md`) | **Xóa row này** — file sẽ bị xóa (A.3); thêm row `maintenance` + `maintenance/phase-a-cleanup` |
| `plan/README.md` L32 | `plan/ROADMAP.md` (trong "Quy ước": "1 ROADMAP duy nhất (`plan/ROADMAP.md`)") | **Update text** → đổi thành `plan/<roadmap>/ROADMAP.md` theo convention nested mới |
| `plan/README.md` L37,39 | `plan/ROADMAP.md` (trong quy ước update) | **Update** → xóa/thay thành "update ROADMAP.md trong roadmap dir" |
| `plan/README.md` L54–63 | 6 plan dirs + design-agent-library (bảng index) | **Update rows** → thêm "(archived → `plan/_archived/<slug>/`)" + status ✅ |

---

## Tóm tắt hành động theo session

### A.2 (archive 6 plan dirs):
- `git mv` 6 dirs → `plan/_archived/`
- `.claude/master.md §8` L224: update path `plan/agent-team-setup/` → `plan/_archived/agent-team-setup/`
- `plan/README.md`: update 6 rows → archived

### A.3 (archive design-agent-library + xóa ROADMAP.md phẳng):
- `git mv plan/design-agent-library/ → plan/_archived/design-agent-library/`
- `git rm plan/ROADMAP.md`
- `plan/README.md`: xóa row ROADMAP.md phẳng, update quy ước, update 4 rows design-agent-library → archived, thêm rows maintenance + maintenance/phase-a-cleanup

### A.4 (archive 6 stale docs):
- `git mv` 6 docs → `docs/_archived/`
- Không có ref live ngoài `docs/sidebar-handoff.md` (sẽ archive cùng)

### Refs planner.md / researcher.md / skill files:
- **Tất cả để nguyên** — đây là convention templates, không trỏ file artifact cụ thể bị xóa

---

## STOP gate A.1 ✅

- `ref-inventory.md` tồn tại: ✅
- Bảng có ≥ 5 row: ✅ (23 row)
- Không bỏ sót file trong danh sách grep: ✅ (đã grep .claude/ docs/ plan/README.md plan/settings-redesign/ + docs/design-artifacts/ + docs/*.md riêng)
