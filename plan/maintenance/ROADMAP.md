# Maintenance — Roadmap bảo trì hệ thống `.claude/`

> Bản đồ chia công việc bảo trì thành 3 phase độc lập; **mỗi phase = 1 long-plan** soạn riêng khi user yêu cầu.
> File này KHÔNG phải long-plan — chỉ mô tả *cần làm gì* + *cần làm rõ gì* + thứ tự phụ thuộc.
> Nền: audit researcher đã PASS (2026-06-20) — dùng làm baseline.

---

## Nền tảng đã chốt (không bàn lại)

- Scope maintenance: **chỉ `.claude/` + `plan/` + `docs/`** — TUYỆT ĐỐI KHÔNG đụng `src/`, `backend/`, `src-tauri/`.
- Convention plan mới (ISSUE-4 đã chốt): `plan/<roadmap>/<phase-slug>/` nested — KHÔNG đặt phẳng.
- **[USER-CHỐT]** GSAP 8 skill: GIỮ — sẽ dùng khi fix animation sau; KHÔNG xóa, chỉ ghi note.
- **[USER-CHỐT]** Archive: plan done + docs stale → move `_archived/` (KHÔNG xóa hẳn).
- **[USER-CHỐT]** `plan/ROADMAP.md` (phẳng) → XÓA (deprecated bởi convention mới).
- **[USER-CHỐT]** Workflow defects ISSUE-10/11/12/7: làm CẢ 4.
- **HIGH-IMPACT flag:** Phase C đụng `master.md` / `playbook.md` / (có thể) `settings.json` → bắt buộc user duyệt diff TRƯỚC khi coi là done.

---

## Cross-cutting — không có câu hỏi mở chặn

> Toàn bộ user-decision cho maintenance đã chốt ở audit 2026-06-20. Không có gate CC nào chặn Phase A hoặc B.
> Phase C có thể cần test runtime cho ISSUE-7 — nếu không test được thì document workaround only (không chặn).

---

## Các phase

### Phase A — Cleanup (archive + annotate + trim) 🟡 ƯU TIÊN ĐẦU

- **Cần làm gì (WHAT)**:
  1. **Grep reference inventory** — lập danh sách toàn bộ ref tới các item sẽ archive, output vào `ref-inventory.md`.
  2. **Archive 6 plan/ dirs** (đã done): `agent-team-setup`, `nib-mock-ui`, `dock-v2`, `tauri-shell`, `nib-editor-rebuild`, `nav-dock-redesign` → `plan/_archived/` + sửa `.claude/master.md §8` + update `plan/README.md`.
  3. **Archive `design-agent-library/`** (whole dir, 4 phase done) → `plan/_archived/design-agent-library/` + delete `plan/ROADMAP.md` (phẳng) + update `plan/README.md`.
  4. **Archive 6 stale docs/** → `docs/_archived/`: `Nib-Dock-v2-ref.html`, `design-ref-editor.html`, `dock-handoff.md`, `sidebar-handoff.md`, `sidebar-mockup.html`, `nav-dock-design.md`.
  5. **Annotate `docs/design.md`** (một phần stale): thêm banner SUPERSEDED ở đầu file + inline note tại §2.3/§4.1/§4.3/§4.4 — KHÔNG rewrite toàn bộ.
  6. **Trim `.claude/memory/`**: `context.md` 22 entry → giữ 10 mới nhất, move cũ → `context-archive.md`; `patterns.md` ~13 → 10, move cũ → `patterns-archive.md`; `issues.md` append header "Open: 7, 10, 11, 12".

- **Cần làm rõ trước**: Không — audit đã xác định đủ file targets.

- **Done khi**:
  - `ls plan/_archived/` shows ≥7 dirs (6 plan + design-agent-library).
  - `ls plan/ROADMAP.md` → not found (file đã xóa).
  - `ls docs/_archived/` shows 6 files.
  - `grep "SUPERSEDED" docs/design.md` ≥ 5 hits (1 banner + 4 section notes).
  - `wc` context.md ≤ 10 entry blocks; `context-archive.md` tồn tại.

- **Phụ thuộc**: Không (phase đầu tiên).
- **Long-plan**: `plan/maintenance/phase-a-cleanup/` — 1 phase / 6 session.

---

### Phase B — Agent/Skill wiring upgrade ⬜

- **Cần làm gì (WHAT)**:
  1. **Fix planner.md "Đọc đầu phiên"**: thêm `master.md` + `playbook.md` vào danh sách đọc đầu phiên (hiện chỉ có CLAUDE.md / ROADMAP / README / long-plan / skill) — khắc phục gap wiring so với mọi agent khác.
  2. **Fix "8 vai" → "9 vai"** toàn `.claude/`: grep tất cả file → sửa tại 7 agent bodies + `playbook.md` (2 chỗ). Bỏ qua `context.md` (log lịch sử).
  3. **Thêm GSAP keep-note**: ghi 1 dòng "8 gsap-* skills: GIỮ chủ đích — sẽ dùng khi fix animation sau" vào `.claude/design-library/INDEX.md` (hoặc skills README nếu có) để audit sau không flag lại.

- **Cần làm rõ trước**: Không — tất cả decisions đã rõ từ audit.

- **HIGH-IMPACT**: ❌ Không — chỉ sửa agent body text + 1 dòng note. Không cần user duyệt diff riêng.

- **Done khi**:
  - `grep "8 vai" .claude/agents/*.md .claude/teams/playbook.md` = 0 hits.
  - `planner.md` "Đọc đầu phiên" có dòng trỏ `master.md` + `playbook.md`.
  - GSAP keep-note tồn tại trong INDEX.md (grep "gsap.*GIỮ" hoặc tương đương).

- **Phụ thuộc**: Phase A (vì A xóa plan/ROADMAP.md phẳng → planner.md mục 2 cần trỏ đúng path mới).
- **Long-plan**: sinh just-in-time khi user yêu cầu.

---

### Phase C — Workflow hardening ⚠️ HIGH-IMPACT ⬜

> **⚠️ TẤT CẢ việc phase này đụng `master.md` / `playbook.md` / (có thể) `settings.json` — bắt buộc user duyệt từng diff TRƯỚC khi áp. Không tự merge.**

- **Cần làm gì (WHAT)**:
  1. **ISSUE-10** (Lead-DIY design): Harden `master.md §1` + `playbook.md §11` Anti-patterns Lead: thêm rule "giao design cho agent `design`, KHÔNG tự dựng layout/mockup ép user chọn". Sửa text ISSUE-10 trong `issues.md`: đổi "design-figma" → "design" (agent đã retire).
  2. **ISSUE-11** (tmux lặp): Fix `playbook.md §8` + `§2`: set `main-pane-width 60%` TRƯỚC `select-layout`; re-apply layout sau MỖI lần đổi N (cả spawn LẪN shutdown); guard đếm N động (main-vertical N≤4, tiled N≥5). Ghi rõ "nếu in-process (không tmux) → skip §8, no-op".
  3. **ISSUE-12** (Lead tự soạn plan): Harden `master.md §1` + `playbook.md §11`: thêm "soạn/soát plan artifact = việc planner, KHÔNG phải lead".
  4. **ISSUE-7** (plan-approval × permission): Điều tra flow `ExitPlanMode → acceptEdits` → tại sao không về `acceptEdits` → prompt storm. Ghi findings vào `phase-c-workflow/findings-issue7.md`. Đề xuất fix `playbook.md §9/§10` ± `settings.json` hoặc document workaround "không spawn `mode:plan` cho session ghi nhiều". Nếu không test được runtime → workaround only.

- **Cần làm rõ trước**: ISSUE-7 có thể cần test runtime — nếu không test được thì document workaround (không chặn phase).

- **HIGH-IMPACT** ⚠️: `master.md` + `playbook.md` + có thể `settings.json` → **user duyệt diff TRƯỚC khi done**. Ghi rõ "chờ user duyệt diff" trong CHECKPOINT trước khi đổi trạng thái ✅.

- **Done khi**:
  - ISSUE-10/11/12: diff đã được user duyệt + áp vào master.md + playbook.md.
  - ISSUE-7: `findings-issue7.md` tồn tại, có kết luận workaround hoặc fix cụ thể.
  - `grep "design-figma" .claude/` = 0 hits.

- **Phụ thuộc**: Phase A (cleanup) — Phase B không bắt buộc phải xong trước.
- **Long-plan**: sinh just-in-time khi user yêu cầu; ghi rõ gate "user duyệt diff" trong PLAN + CHECKPOINT.

---

## Thứ tự phụ thuộc

```
Phase A (Cleanup) ──────────────────────────────────────► plan sạch, docs sạch, memory trim
   │
   ├──────────────────────────────────────────────────────► Phase B (Wiring upgrade) — LOW-IMPACT, sau A
   │
   └──────────────────────────────────────────────────────► Phase C (Workflow hardening) — HIGH-IMPACT, cần user gate, sau A
```

Phase B và C có thể chạy song song sau khi A xong, nhưng C cần user duyệt nên thường sẽ sau B.

---

## Bảng tiến độ

| Phase | Long-plan | Trạng thái |
|---|---|---|
| Phase A — Cleanup | `plan/maintenance/phase-a-cleanup/` | ✅ DONE (2026-06-20, lead verify) |
| Phase B — Wiring upgrade | (exec từ ROADMAP, không cần long-plan riêng) | ✅ DONE (2026-06-20, lead verify) |
| Phase C — Workflow hardening | `plan/maintenance/phase-c-workflow/findings-issue7.md` | ✅ DONE (2026-06-20, USER DUYỆT diff) |

> Maintenance roadmap HOÀN TẤT toàn bộ 3 phase (2026-06-20). Issue queue Open=0. Xem `.claude/memory/context.md` entry 2026-06-20 maintenance.
