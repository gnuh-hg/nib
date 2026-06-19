# CHECKPOINT — Agent Team Setup (note-ch)

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".
- **Subject của plan này = hạ tầng agent-team**, KHÔNG phải code app toán học. Không đụng `src/`, `backend/`, `src-tauri/`.
- **Caveat quan trọng**: skill frontmatter KHÔNG auto-load trong teammate mode → agent body phải trỏ path skill trong "Đọc đầu phiên" để teammate tự Read. Không giả định auto-inject.
- **4 pitfall cần phòng**: (1) permissions spam → settings.json defaultMode:acceptEdits; (2) lead nhầm subagent vs teammate → master+playbook phân biệt rõ; (3) lead bỏ qua master+playbook → agent body "Đọc đầu phiên" + CLAUDE.md §13; (4) lead tự làm hết → bất biến "điều phối, không tự code".

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
| --- | --- | --- | --- |
| Sessions hoàn thành | 10 | 10 | 100% |
| File settings.json | 1 | 1 | 100% |
| File master + playbook | 2 | 2 | 100% |
| Agent bodies mới tạo (planner tái dùng) | 7 | 7 | 100% |
| Skill files | 6 | 6 | 100% |
| Memory files | 4 | 4 | 100% |
| Smoke-test pass | 1 | 1 | 100% |

---

## Đang ở đâu

- **Phase**: 4 HOÀN THÀNH — Session 4.1 + 4.2 đều xong. **PLAN agent-team-setup HOÀN THÀNH (10/10 session).**
- **Session kế tiếp**: — (không còn session trong plan này). Bộ máy team verify end-to-end xong → sẵn sàng chạy các long-plan workstream xây app (Editor/CAS/Handwriting/Glue).
- **Blocker**: — (không có blocker)
- **Reference**: `PLAN.md` Phase 4 → Session 4.2 (PASS)

---

## Per-session log

### 2026-06-11 — Session 4.2 (Smoke-test spawn teammate thật) ✅ — Phase 4 + PLAN HOÀN THÀNH
- Env: Claude Code **v2.1.172** (≥ v2.1.32 ✓) · `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` active ✓.
- Chạy thật end-to-end: `TeamCreate("smoke-test")` không lỗi → `Agent(subagent_type="researcher", run_in_background=true)` → researcher **tự ack ≤2 phút** ("researcher: sẵn sàng. Chờ task.") → `TaskCreate(#1)` brief 4-phần self-contained + `TaskUpdate(owner=researcher)` → `SendMessage("Task #1 — TaskGet(1)…")` → teammate **TaskGet + TaskUpdate(in_progress→completed) cùng turn**, report đầy đủ → `shutdown_request` → `TeamDelete` không lỗi.
- STOP gate PASS: TeamCreate không lỗi ✓ · ack ≤2 phút ✓ · `TaskGet(1)` xác nhận TaskGet+TaskUpdate (thấy `completed` — mạnh hơn `in_progress` vì teammate xong trong 1 turn) ✓ · shutdown sạch (TeamDelete fail nếu còn member active → success = đã shutdown) ✓ · TeamDelete không lỗi ✓ · entry smoke-test append `context.md` đúng format ✓.
- **Bằng chứng cơ chế "Đọc đầu phiên":** researcher report Read thành công đủ 4 file `master.md` / `playbook.md` / `memory/context.md` / `skills/memory/SKILL.md` → caveat skill-không-auto-load (trỏ path để teammate tự Read) verify đúng thực tế.
- **Phase 4 gate PASS · PLAN agent-team-setup HOÀN THÀNH** — settings.json + master + playbook + 7 agent + 6 skill + memory store + issues.md + CLAUDE.md §13 + smoke-test PASS.

### 2026-06-11 — Session 4.1 (Khởi tạo memory store + CLAUDE.md §13) ✅
- Tạo 4 file `.claude/memory/{context,mistakes,patterns,global}.md` — mỗi file header + rule (LUÔN append `## YYYY-MM-DD HH:MM — slug`, không overwrite, dùng 10 entry mới nhất) + 1 entry bootstrap `## 2026-06-11 12:30 — agent-team-setup-bootstrap`. `context.md` ghi trạng thái Phase 4/Session 4.1 + roster 8 vai + việc kế (4.2) + smoke-test chưa chạy. `global.md` ghi stack [LOCKED] + 4 câu hỏi mở §11 chưa chốt. `mistakes.md`/`patterns.md` placeholder + hướng dẫn append.
- Tạo `.claude/teams/issues.md` — file team-ops sở hữu, header + rule (append-only block, `.claude/`-only, code lỗi trỏ team-fix) + entry mẫu `## ISSUE-0 — OTHER — fixed` (fields time/teammate/symptom/target/note, "no issues yet"). Issue thật bắt đầu từ ISSUE-1.
- Thêm section `## 13. Trước khi lập team agent` vào `CLAUDE.md` note-ch — hard gate 3 dòng (a) master.md (b) playbook.md (c) memory/context.md + câu "Không spawn team trước khi đọc 3 file này".
- STOP gate PASS (grep): 4 memory file tồn tại + non-empty (header + 1 entry `## 2026`) ✓ · issues.md tồn tại có format entry `## ISSUE-` ✓ · CLAUDE.md có `## 13.` ✓ · 3 pointer master/playbook/memory ✓.

### 2026-06-11 — Session 3.5 (`team-ops` + skill `team-fix`) ✅ — Phase 3 HOÀN THÀNH
- Tạo `.claude/skills/team-fix/SKILL.md` — phục vụ riêng team-ops: 5 nguyên tắc bất biến (chỉ `.claude/`, mỗi fix map 1 issue-code, fix nhỏ nhất, high-impact→user duyệt, sửa xong đóng issue). §1 format issue-queue (block `## ISSUE-<n> — <CODE> — <status>` + time/teammate/symptom/target/note, append-only) + 1 ví dụ. §2 bảng **10 code lỗi** (SILENT/SLOW-PICKUP/FORGOT-TASKUPDATE/SCOPE/STALE/FORM/GATE/NO-SHUTDOWN-RESP/LEAD-DIY/OTHER) kèm triệu chứng+nguyên nhân+target sửa `.claude/`-only + mapping nhanh từ playbook §6. §3 ngưỡng trigger bảng 4 dòng (đơn lẻ→vá brief / lặp>1 hoặc ≥3 cùng (vai,code)→sửa agent body root-cause / high-impact→user duyệt) + gợi ý re-spawn smoke sau sửa agent body. §4 quy trình 8 bước. §5 ranh giới 6 mục. §6 quick-ref.
- Tạo `.claude/agents/team-ops.md` — model `claude-sonnet-4-6`, tools Read/Grep/Glob/Edit/Write + 4 task tools. **Section "⚠️ Ranh giới cứng" ngay đầu** (phạm vi chỉ `.claude/`, TUYỆT ĐỐI KHÔNG src/backend/src-tauri; issue cần sửa code sản phẩm→báo lead là việc implementer). "Đọc đầu phiên" 5 file (master→playbook→memory/context→team-fix→memory). TeamCreate mode 4 hành vi (ack/TaskGet+Update cùng turn/done=SendMessage diff+high-impact chờ user duyệt/shutdown). **Gate nhẹ sau fix** bảng 4 loại (agent body→frontmatter hợp lệ+diff; skill→diff; issues.md→status open→fixed; high-impact→user duyệt; settings.json→JSON valid check). Hard constraints 6 + anti-pattern 7 dòng.
- STOP gate PASS (grep): 2 file tồn tại ✓ · team-fix format issue-queue (block ISSUE) ✓ · 10 code (≥8) ✓ · ngưỡng trigger (7 hit) ✓ · team-ops frontmatter hợp lệ (name/model sonnet/tools) ✓ · 4 task tools ✓ · section ranh giới cứng + cấm src/backend/src-tauri ✓ · "Đọc đầu phiên" trỏ master/playbook/team-fix ✓ · TeamCreate mode 3 hành vi (ack/TaskGet+TaskUpdate/shutdown) ✓.
- **Phase 3 gate PASS** — 7 agent mới + 6 skill đều tồn tại, mọi agent trỏ master+playbook, agent body mỏng trỏ skill.

### 2026-06-11 — Session 3.4 (`backend-cas`+`latex-sympy-pipeline`; `handwriting`+`handwriting-myscript`; `glue-packaging`+`tauri-packaging`) ✅
- Tạo `.claude/skills/latex-sympy-pipeline/SKILL.md` — pipeline LaTeX→SymPy: 4 nguyên tắc (exact mặc định/không-treo/parse-lossy-phải-dọn/fail-rõ), kiến trúc 5 bước (normalize→latex2sympy2→dispatch-timeout→exact→numeric fallback), bảng normalize 7 pattern lossy (\left\right, e/π, spacing, d/dx, ∫, Σ/Π), **7 fixture** (x²/∫x dx/d-dx x²/Σi=n(n+1)/2/x²+x-2=0/1-3+1-6=1-2 exact/lim sinx-x=1), timeout tập trung EVAL_TIMEOUT, numeric fallback đánh dấu ≈, §11.3 LLM fallback = OPTION chưa chốt (để TODO, KHÔNG tự thêm), ranh giới 5 mục.
- Tạo `.claude/agents/backend-cas.md` — Agent B §8.2–8.3, model `sonnet`, tools Read/Write/Edit/Bash+4 task. "Đọc đầu phiên" 6 file (master→playbook→memory/context→latex-sympy-pipeline→build-verify→memory). TeamCreate mode 5 hành vi (ack/TaskGet+Update/plan-approval/evidence/shutdown). Self-verify 5 gate (pytest/uvicorn/POST eval exact ≥3/≥5 fixture/timeout+fallback). Hard constraints (không float exact, không bỏ timeout, không tự thêm LLM §11.3, không đụng src/Rust) + anti-pattern 7 dòng.
- Tạo `.claude/skills/handwriting-myscript/SKILL.md` — ⚠️ DEPENDENCY GATE đầu file: phụ thuộc §11.2 license + §11.1 thiết bị (cả 2 chưa chốt) → PAUSE. Luồng ink→palm-reject→iink Math recognizer→LaTeX→**hội tụ cùng đường gõ** (§6, KHÔNG pipeline tính thứ 2), tension §8.5 giải bằng block §4.3, self-verify gate (sau §11.2), ranh giới 5 mục. (7 lần nhắc §11.2.)
- Tạo `.claude/agents/handwriting.md` — Agent C §8.4, model `sonnet`. **Section "⚠️ Human gate §11.2" riêng** (kiểm trước mọi task; chưa chốt→SendMessage lead, KHÔNG implement). TeamCreate mode: ack có lưu ý gate, sau TaskGet kiểm §11.2 ngay. Self-verify gate hàng đầu = human gate §11.2. Hard constraints (không vượt §11.2, không tự chọn thiết bị, không pipeline riêng cho bút, giữ block §4.3) + anti-pattern 7 dòng.
- Tạo `.claude/skills/tauri-packaging/SKILL.md` — Tauri 2: kiến trúc ghép webview→Rust #[command]→Python sidecar, spawn sidecar (externalBin/shell-plugin, kill khi thoát), IPC invoke từ `@tauri-apps/api/core` tên-khớp-2-phía, offline fallback (sidecar fail→degraded, app không crash), self-verify Stack-2 gate, ranh giới 6 mục (không logic toán/UI, không đảo Electron).
- Tạo `.claude/agents/glue-packaging.md` — Agent D §6, model `sonnet`. Lớp ghép thuần (không toán/UI). "Đọc đầu phiên" 6 file (…→tauri-packaging→build-verify→memory). Self-verify 5 gate (cargo build [cwd src-tauri/]/release/launch/IPC invoke/offline fallback). Hard constraints (không viết SymPy/UI, không đảo Electron §5, không crash khi sidecar fail, không sidecar mồ côi) + anti-pattern 7 dòng.
- STOP gate PASS (grep): 6 file tồn tại ✓ · latex-sympy 7 fixture (≥5) ✓ · handwriting-myscript có note §11.2 (7) ✓ · handwriting.md có section "Human gate §11.2" ✓ · 3 agent frontmatter hợp lệ (name/model sonnet/tools) ✓ · đủ 4 task tools mỗi agent ✓ · mọi "Đọc đầu phiên" trỏ master.md + playbook.md ✓.

### 2026-06-11 — Session 3.3 (`editor-frontend` + skill `build-verify`) ✅
- Tạo `.claude/skills/build-verify/SKILL.md` — gate idiom đo được cho mọi implementer. 5 stack: (1) Frontend `npm run build` 0 / `tsc --noEmit` 0 error / `vitest run` / render `x^2` console-0; (2) Tauri `cargo build` [cwd src-tauri/] / launch / IPC invoke; (3) Backend `pytest` / uvicorn startup / `POST /eval` LaTeX exact ≥3 fixture / timeout; (4) Pipeline ≥5 fixture parse + exact không làm tròn + timeout+numeric fallback; (5) Vòng-lõi gõ→LaTeX→SymPy→render inline live. + format evidence (bảng Gate|Lệnh|Exit|Kết quả), bảng 6 lỗi thường gặp, quick-ref, ranh giới 5 mục cấm gate cảm tính.
- Tạo `.claude/agents/editor-frontend.md` — Agent A §12 đường găng §8.1. Frontmatter: **model `claude-opus-4-8`** (nâng từ sonnet vì đường găng — PLAN Phase 3 nguyên tắc model), tools=[Read,Write,Edit,Bash,TaskGet,TaskUpdate,TaskList,SendMessage]. "Đọc đầu phiên" 5 file (master→playbook→memory/context→build-verify→memory/SKILL). "Trong TeamCreate mode" 5 hành vi gồm **plan-approval** (task đường găng soạn plan chờ duyệt) + **nộp evidence trước khi báo done**. Self-verify gate bảng 5 dòng (build/type/render/test/vòng-lõi). Hard constraints: không quyết WHAT, không đảo [LOCKED] §5, không tự code contentEditable (dùng TipTap/Lexical §9), không đụng backend/Rust sâu. Anti-pattern 7 dòng.
- STOP gate PASS (grep): 2 file tồn tại ✓ · build-verify đủ 5 stack ✓ · editor-frontend frontmatter hợp lệ (name/model/tools/description) ✓ · tools đủ 4 task tools ✓ · "Đọc đầu phiên" trỏ master.md + playbook.md + build-verify/SKILL.md ✓ · "Trong TeamCreate mode" có hành vi nộp evidence (8 lần nhắc "evidence") ✓.

### 2026-06-11 — Session 3.2 (`architect`, không cần skill riêng) ✅
- Tạo `.claude/agents/architect.md` — format bám `researcher.md`/`planner.md` note-ch. Frontmatter: name/description/model(claude-sonnet-4-6)/tools=[Read,Grep,Glob,TaskGet,TaskUpdate,TaskList,SendMessage]. Vai = chuyển plan WHAT (planner) + context (researcher) → HOW; KHÔNG quyết WHAT/scope, KHÔNG implement.
- "Đọc đầu phiên" 4 file (master→playbook→memory/context→memory/SKILL) + note skill-không-auto-load. "Trong TeamCreate mode" 4 hành vi chuẩn (ack tự gửi / TaskGet+TaskUpdate in_progress cùng turn / done=completed+SendMessage full 5 mục / shutdown ack). Tái dùng skill `memory` (Session 3.1) — không tạo skill riêng.
- Output 5 mục A–E (A: component/module breakdown; B: API contract; C: data flow text-diagram; D: file structure; E: rủi ro kỹ thuật ≥1 cụ thể). Hard constraints (không code/không quyết WHAT/không đảo [LOCKED] §3–§6/không tự chốt §11) + anti-pattern 6 dòng + bảng Liên quan.
- STOP gate PASS (verify bằng grep): file tồn tại ✓ · frontmatter hợp lệ (name/description/model/tools) ✓ · tools đủ 4 task tools (TaskGet/TaskUpdate/TaskList/SendMessage) ✓ · "Đọc đầu phiên" trỏ master.md + playbook.md ✓ · output đủ 5 mục A–E ✓ · "Trong TeamCreate mode" đủ 3 hành vi (ack+TaskGet+TaskUpdate / done / shutdown) ✓.

### 2026-06-11 — Session 3.1 (`researcher` + skill `memory`) ✅
- Tạo `.claude/skills/memory/SKILL.md` — store **duy nhất** `.claude/memory/` (4 file context/mistakes/patterns/global), học cơ chế từ company `hq-memory` (format entry, cap-N, append-only) NHƯNG bỏ domain company (không 2-store HQ-vs-engine, không `memory.ps1`, không branch). Có: format `## YYYY-MM-DD HH:MM — slug`, rule LUÔN append (`>>` không `>`), cap 10 entry mới nhất, bảng ai-đọc-gì + ai-ghi-gì theo roster note-ch, 2 template entry (mathlive-block / latex-sympy), quick-ref, ranh giới 5 mục.
- Tạo `.claude/agents/researcher.md` — format bám `planner.md` note-ch. Frontmatter: name/description/model(sonnet)/tools=[Read,Grep,Glob,WebSearch,TaskGet,TaskUpdate,TaskList,SendMessage]. "Đọc đầu phiên" 4 file (master→playbook→memory/context→memory/SKILL) + note skill-không-auto-load. "Trong TeamCreate mode" 4 hành vi (ack tự gửi / TaskGet+TaskUpdate in_progress cùng turn / done=completed+SendMessage full output / shutdown ack). Output 4 mục (Đã biết/Rủi ro/Câu hỏi-còn-chặn/Nguồn) với rule "chỉ câu thực sự chặn". Hard constraints (không code/không HOW/không chốt §11/không đảo [LOCKED]) + anti-pattern 6 dòng.
- STOP gate PASS (verify bằng grep): 2 file tồn tại ✓ · SKILL có format-entry + luôn-append + cap-10 ✓ · researcher frontmatter hợp lệ ✓ · tools đủ 4 task tools ✓ · "Đọc đầu phiên" trỏ master.md + playbook.md ✓ · "Trong TeamCreate mode" đủ 3 hành vi (ack/TaskGet+TaskUpdate; done; shutdown) ✓.

### 2026-06-11 — Session 2.2 (Viết `.claude/teams/playbook.md`) ✅
- Tạo `/home/gnuh/Documents/project/note-ch/.claude/teams/playbook.md` — học cơ chế từ `company/.claude/teams/playbook.md` (recipe 7 bước, brief 4 phần, tmux block 1/2, issue-queue code), KHÔNG copy domain company (không branch/workflow.json/engine/catalog/run.ps1/prefix hq-).
- 11 section + tham chiếu: (1) bảng 3 cột TeamCreate/lead-tự-làm/Agent-one-shot — 4 ví dụ note-ch mỗi cột (MathLive block / pipeline LaTeX→SymPy / IPC sidecar / toggle exact↔decimal vs sửa i18n / đọc CLAUDE.md / đổi timeout vs tra Tauri IPC / MathLive API / SymPy / latex2sympy2); (2) recipe 7 bước + spawn template 4 dòng + cơ chế **chờ ack tự gửi, resend nếu >45s**; (3) brief 4 phần (context/input/scope/done_criteria/output_format) + quality gate + per-role brief 8 vai; (4) lifecycle + SendMessage protocol (lead↔teammate path chính, no peer-DM, idle bình thường, FAIL diff-style); (5) gate idiom note-ch 5 stack; (6) failure-modes 5 bước IM + luồng ghi issue-queue→quyết-fix→team-ops; (7) bảng PASS-criteria 8 vai đo được; (8) terminal layout 2 mode (in-process default Linux/split-pane tmux) + tmux N=2..5 (4 layout, Block 1/2); (9) box giới hạn Agent Teams 5 điểm (1-team/no-nested/no-resume/permissions-kế-thừa/version); (10) plan-approval mode + human gate §11.2 handwriting; (11) anti-patterns 16 mục (Lead 8 + Teammate 8).
- STOP gate PASS (verify bằng grep): file tồn tại ✓ · bảng 3 cột ≥3 ví dụ/cột (4) ✓ · recipe 7 bước ✓ · brief 4 phần ✓ · anti-patterns ≥10 (16) ✓ · gate idiom ✓ · terminal 2 mode + 4 tmux N (≥2) ✓ · PASS-criteria 8 vai ✓ · box giới hạn 5 điểm (≥4) ✓ · plan-approval mode ✓ · failure-modes trỏ issues.md + team-ops ✓.
- **Phase 2 gate PASS** — cả master.md + playbook.md tồn tại đủ tiêu chí.

### 2026-06-11 — Session 2.1 (Viết `.claude/master.md`) ✅
- Tạo `/home/gnuh/Documents/project/note-ch/.claude/master.md` — học cơ chế từ `company/.claude/hq-master.md` (TaskList loop, recipe spawn, bảng so sánh), KHÔNG copy domain company (không chi nhánh/workflow.json/engine/catalog/prefix hq-).
- 8 section: (1) 3 bất biến — lead điều phối/prose-not-JSON/TaskList loop; (2) Roster bảng 8 vai (planner tái dùng + 7 vai) gồm `team-ops` với ranh giới cứng "chỉ `.claude/`, không đụng src/backend/src-tauri"; (3) Vòng lặp điều phối — cơ chế **chờ ack teammate tự gửi, resend nếu >45s** (không sleep mù); (4) Phân loại task rubric 7 dòng (full chain / sửa-user-mới / chỉ-thiết-kế / nhỏ-1-stack / team-ops / trivial / hỏi-đọc); (5) Bảng subagent-vs-teammate 5 dòng (turn/wake/TaskList/use-case/lifecycle); (6) Spawn 7 bước tóm tắt trỏ playbook; (7) Gate implementer self-verify→evidence→lead-gate + gate idiom note-ch; (8) Trỏ tài liệu.
- STOP gate PASS: file tồn tại ✓, đủ 7 section yêu cầu (+section spawn bonus) ✓, roster 8 vai gồm team-ops ✓, bảng subagent-vs-teammate 5 dòng (≥4) ✓.
- Lưu ý: company không có `master.md` (dùng tên `hq-master.md`); đã đối chiếu cơ chế từ đó.

### 2026-06-11 — Session 1.1 (Tạo `.claude/settings.json`) ✅
- Tạo `/home/gnuh/Documents/project/note-ch/.claude/settings.json` theo mẫu cấu trúc company (chỉ permissions/env, không copy domain content).
- `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"`; `permissions.defaultMode = "acceptEdits"`; allow = [Bash, Read, Edit, Write, WebFetch, WebSearch]; deny = 31 mục (git phá lịch sử + lệnh hủy hệ thống).
- STOP gate PASS: `python3 json.load` exit 0, AGENT_TEAMS=1 ✓, acceptEdits ✓, deny=31 (≥5) ✓, có git-push-force/reset-hard/rm-rf-/sudo/mkfs.
- Lưu ý: `settings.local.json` riêng (local overrides) không bị đụng — không xung đột.
- **Phase 1 gate PASS.**

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| 2026-06-10 | Created from `PLAN.md` | @planner |
| 2026-06-11 | Session 1.1 done — `.claude/settings.json` tạo + gate PASS; Phase 1 hoàn thành | Claude |
| 2026-06-11 | Session 2.1 done — `.claude/master.md` tạo + gate PASS (7 section, roster 8 vai, bảng subagent-vs-teammate 5 dòng) | Claude |
| 2026-06-11 | Session 2.2 done — `.claude/teams/playbook.md` tạo + gate PASS (bảng 3 cột 4 ví dụ/cột, recipe 7 bước, brief 4 phần, anti-patterns 16, PASS-criteria 8 vai, tmux N=2..5, box giới hạn 5 điểm, plan-approval, issue-queue→team-ops); **Phase 2 hoàn thành** | Claude |
| 2026-06-11 | Session 3.1 done — `.claude/skills/memory/SKILL.md` + `.claude/agents/researcher.md` tạo + gate PASS (skill: format entry/append-only/cap-10; researcher: frontmatter hợp lệ, 4 task tools, Đọc-đầu-phiên trỏ master+playbook, TeamCreate mode 3 hành vi, output 4 mục); Phase 3 bắt đầu | Claude |
| 2026-06-11 | Session 3.2 done — `.claude/agents/architect.md` tạo + gate PASS (frontmatter hợp lệ, tools Read/Grep/Glob+4 task tools, Đọc-đầu-phiên trỏ master+playbook, output 5 mục A–E, TeamCreate mode 3 hành vi; tái dùng skill memory) | Claude |
| 2026-06-11 | Session 3.3 done — `.claude/skills/build-verify/SKILL.md` (gate idiom 5 stack + format evidence + cấm gate cảm tính) + `.claude/agents/editor-frontend.md` (model opus, đường găng §8.1, plan-approval + nộp evidence) tạo + gate PASS | Claude |
| 2026-06-11 | Session 3.4 done — 3 skill (`latex-sympy-pipeline` 7 fixture+timeout+numeric fallback+§11.3 TODO / `handwriting-myscript` dependency gate §11.2+§11.1 / `tauri-packaging` IPC sidecar+offline fallback) + 3 agent (`backend-cas` / `handwriting` có section Human gate §11.2 / `glue-packaging`) tạo + gate PASS (6 file, frontmatter hợp lệ, 4 task tools, Đọc-đầu-phiên trỏ master+playbook) | Claude |
| 2026-06-11 | Session 3.5 done — `.claude/skills/team-fix/SKILL.md` (format issue-queue + 10 code lỗi + ngưỡng trigger vá-brief vs sửa-agent-body) + `.claude/agents/team-ops.md` (ranh giới cứng chỉ `.claude/`, gate nhẹ sau fix, high-impact→user duyệt) tạo + gate PASS; **Phase 3 hoàn thành** (7 agent + 6 skill) | Claude |
| 2026-06-11 | Session 4.1 done — 4 memory file (`context`/`mistakes`/`patterns`/`global`, header + entry bootstrap) + `.claude/teams/issues.md` (entry mẫu ISSUE-0) + `CLAUDE.md` §13 hard gate (3 dòng trỏ master/playbook/memory) tạo + gate PASS; Phase 4 đang chạy (còn 4.2 smoke-test) | Claude |
| 2026-06-11 | Session 4.2 done — smoke-test spawn `researcher` thật (v2.1.172, AGENT_TEAMS=1): TeamCreate→ack≤2'→TaskCreate+TaskGet+TaskUpdate cùng turn→shutdown→TeamDelete đều PASS; entry smoke-test-PASS ghi `context.md`; verify cơ chế "Đọc đầu phiên" (4 file Read OK). **Phase 4 + PLAN agent-team-setup HOÀN THÀNH (10/10 session)** | Claude |
