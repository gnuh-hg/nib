# PLAN — Agent Team Setup (note-ch)

> Sau khi xong pipeline này: repo note-ch có một bộ máy multi-agent đầy đủ — lead biết điều phối đúng (TeamCreate + TaskList loop, không lead-DIY), teammate có role rõ, permissions an toàn, skills gắn liền agent dùng, memory store, playbook + master buộc đọc trước spawn — sẵn sàng chạy các workstream xây app (Editor/Frontend, Backend/CAS, Handwriting, Glue/Packaging).

---

## Context

- **Vì sao nhiều session:** Setup bao gồm: viết settings.json (gate kiểm lệnh bị chặn thật), viết master + playbook (gate là lead đọc được và spawn đúng), viết 7 agent body mới + skill đi kèm từng agent (gate là spawn thử 1 teammate hoạt động được), và bước cuối smoke-test toàn team. Không thể làm tốt trong 1 chat.
- **Không có external gate chặn trên đường — trừ §11.2:** Tất cả file, tất cả verify có thể làm local. Workstream này thuần hạ tầng. Ngoại lệ: agent `handwriting` sẽ có human gate tại §11.2 (license MyScript) — ghi vào agent body nhưng KHÔNG chặn các session khác.
- **Scope ngoài plan này:** Không bao gồm việc xây app (Editor, CAS, Handwriting, Glue) — đó là các long-plan riêng sẽ chạy sau khi team setup xong. Không bao gồm CI/CD hay deployment.
- **Tái dùng agent có sẵn:** `.claude/agents/planner.md` ĐÃ TỒN TẠI và đúng domain — KHÔNG tạo lại. Roster 8 vai = `planner` (tái dùng) + 7 vai mới tạo.
- **Caveat kỹ thuật — skill frontmatter không auto-load trong teammate mode:** Agent Teams docs: field `skills:` trong frontmatter agent definition KHÔNG áp dụng khi chạy như teammate. Giải pháp: skill files đặt tại `.claude/skills/*/SKILL.md` (project-scope), agent body trỏ path tương đối (`.claude/...`, tính từ root repo) trong section "Đọc đầu phiên" để teammate tự Read. Không dựa vào auto-inject.
- **Skill đi kèm agent:** Mỗi skill được tạo chung session với agent dùng nó — không build tất cả skill trước rồi agent sau. Skill dùng chung (`build-verify`, `memory`) đặt kèm agent cần chính nó; agent khác cùng dùng chỉ cần trỏ path.
- **Ranh giới tham khảo company/:** Chỉ học cơ chế setup từ company (mẫu permissions, khái niệm TaskList loop, recipe spawn, brief 4 phần, anti-patterns). KHÔNG lấy roster (researcher→planner→cto→builder→tester), domain content (chi nhánh, workflow.json, engine, catalog), hay prefix tên (hq-/nc-). Format agent body bám `.claude/agents/planner.md` hiện có trong note-ch.
- **Workstream liên quan:** `plan/ROADMAP.md` (chưa tạo) — agent-team-setup là tiền đề để chạy bất kỳ phase ROADMAP nào.

---

## Roster 8 vai (chốt)

| Vai | File | Lý do tồn tại | Tools |
|---|---|---|---|
| `planner` | `.claude/agents/planner.md` (**TÁI DÙNG**) | Phân loại + sinh plan artifact (roadmap/long/short). Đã có, đúng domain. | Read, Write, Edit, Grep, Glob |
| `researcher` | `.claude/agents/researcher.md` | Gom context repo + tra docs kỹ thuật (MathLive/TipTap/SymPy/Tauri) trước khi plan. Cần vì §8 rủi ro cao — cần research trước khi design. | Read, Grep, Glob, WebSearch, TaskGet, TaskUpdate, TaskList, SendMessage |
| `architect` | `.claude/agents/architect.md` | Thiết kế HOW — component tree, API contract, data flow, file structure. Tách khỏi planner (planner = WHAT, architect = HOW). | Read, TaskGet, TaskUpdate, TaskList, SendMessage |
| `editor-frontend` | `.claude/agents/editor-frontend.md` | Agent A §12: Tauri scaffold + React/TS + TipTap/Lexical block + MathLive. Đường găng §8.1. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage |
| `backend-cas` | `.claude/agents/backend-cas.md` | Agent B §12: FastAPI + SymPy + pipeline LaTeX→SymPy + timeout + fallback. §8.2–8.3. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage |
| `handwriting` | `.claude/agents/handwriting.md` | Agent C §12: MyScript iink tích hợp. Human gate §11.2 license. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage |
| `glue-packaging` | `.claude/agents/glue-packaging.md` | Agent D §12: IPC frontend↔sidecar + Tauri packaging + build desktop + offline. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage |
| `team-ops` | `.claude/agents/team-ops.md` | FIX sự cố phối hợp team (agent body thiếu tool, playbook sai, scope chồng...) theo issue-queue `.claude/teams/issues.md` — không để lead ôm việc fix, không dừng cả pipeline. KHÔNG đụng code sản phẩm. | Read, Grep, Glob, Edit, Write, TaskGet, TaskUpdate, TaskList, SendMessage |

**Không có vai tester riêng.** Mỗi implementer (editor-frontend/backend-cas/handwriting/glue-packaging) tự chạy gate bằng skill `build-verify` rồi nộp evidence. Lead gate bằng evidence nộp — không cần vai tester độc lập. Phản ánh trong master (vòng lặp: implementer self-verify → nộp evidence → lead gate) và playbook (rubric "implementer done-criteria = build pass + gate evidence").

---

## Pipeline 4 phase / 10 session

```
[Phase 1] Permissions + Feature flag ──────► .claude/settings.json hoạt động
                                                │
[Phase 2] Master + Playbook ───────────────► lead có "bộ não" điều phối đúng
                                                │
[Phase 3] Roster agents + Skills ──────────► 7 agent mới + skill đi kèm sẵn sàng
          (5 session, mỗi session 1–2 agent     │
           cùng skill bổ trợ của nó)            │
[Phase 4] Smoke-test & Bootstrap ──────────► toàn team spawn được, memory + issues
                                             khởi tạo, CLAUDE.md §13 cập nhật
```

---

## Phase 1 — Permissions & Feature Flag

**Mục tiêu**: Thiết lập `.claude/settings.json` với `defaultMode: acceptEdits`, allow rộng, deny list an toàn — để teammate không bị spam permission prompt và lệnh nguy hiểm bị chặn thật sự. Phòng ngừa **Pitfall #1**.

### Session 1.1 — Tạo `.claude/settings.json`

- **Scope**: Tạo file `.claude/settings.json` cho note-ch với:
  - `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` trong block `env`.
  - `"defaultMode": "acceptEdits"` trong block `permissions`.
  - `allow`: `["Bash", "Read", "Edit", "Write", "WebFetch", "WebSearch"]`.
  - `deny`: danh sách git phá lịch sử (force push, rebase, reset --hard, amend, filter-branch, filter-repo, reflog delete/expire, update-ref -d, branch -D, tag -d, gc --prune, prune, checkout --orphan) + lệnh hủy hệ thống (rm -rf /, rm -rf /*, rm -rf ~, rm -rf $HOME, sudo, shutdown, reboot, mkfs, dd if=, chmod -R 777).
  - Mẫu cấu trúc JSON: bám `/home/gnuh/Documents/company/.claude/settings.json` (chỉ dùng cấu trúc permissions/env — không copy domain content).
- **STOP gate**: File `.claude/settings.json` tồn tại + JSON valid (parse `python3 -c "import json; json.load(open('.claude/settings.json'))"` exit 0) + có `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` + có `defaultMode: acceptEdits` + deny list có ít nhất 5 mục kiểm tra được.
- **Output artifact**: `/home/gnuh/Documents/project/note-ch/.claude/settings.json`.

**Phase 1 gate**: `.claude/settings.json` tồn tại, JSON valid, có `AGENT_TEAMS=1`, có `acceptEdits`, ≥5 deny entry.

---

## Phase 2 — Master + Playbook

**Mục tiêu**: Tạo 2 tài liệu điều phối cốt lõi của lead — `master.md` (nguyên tắc bất biến + roster bảng 8 vai + vòng lặp TaskList loop + phân biệt subagent vs teammate) và `playbook.md` (thao tác chi tiết: khi nào TeamCreate vs Agent one-shot vs lead tự làm, recipe 7 bước spawn, brief 4 phần, failure modes, anti-patterns). Phòng ngừa **Pitfall #2** (lead nhầm subagent vs teammate) và **Pitfall #4** (lead tự làm hết). Nền cho **Pitfall #3** (buộc đọc trước spawn). Nội dung thuần orchestration note-ch — không nhắc domain công ty khác (chi nhánh, workflow.json, engine, catalog).

### Session 2.1 — Viết master doc

- **Scope**: Tạo `.claude/master.md` với:
  - **3 nguyên tắc bất biến**: (1) lead điều phối, không tự code/build task phức tạp — chỉ tự xử trivial (≤3 file, scope rõ, ≤15 dòng); (2) teammate giao tiếp văn xuôi markdown — KHÔNG JSON ceremony; (3) lead drive TaskList loop (giao → chờ → gate → task kế) — KHÔNG chạy 1 lượt linear rồi quên.
  - **Roster bảng 8 vai** (từ bảng trên): tên file agent, tools, output format mỗi vai — bao gồm `team-ops` với ghi chú ranh giới cứng "chỉ sửa `.claude/`, không đụng code sản phẩm".
  - **Vòng lặp điều phối**: TeamCreate → spawn → **chờ teammate tự gửi ack "sẵn sàng" cho lead** (teammate tự báo khi khởi tạo xong — không sleep mù; nếu sau ~45s chưa ack thì mới resend) → TaskCreate (brief self-contained) → SendMessage → chờ report → gate evidence → handoff/re-fix → TeamDelete.
  - **Phân loại loại task**: bảng rubric (xây tính năng mới multi-file/domain = full chain; sửa có yêu cầu user mới = chain rút gọn; trivial 1 file ≤15 dòng = lead tự làm; hỏi/đọc file = lead tự làm).
  - **Bảng so sánh subagent vs teammate** (ít nhất 4 dòng phân biệt: turn count / wake / TaskList / use-case).
  - **Cách spawn 7 bước** (chi tiết ở playbook, master chỉ tóm tắt + trỏ).
  - **Gate implementer**: vòng lặp "implementer self-verify bằng build-verify → nộp evidence → lead gate bằng evidence". Không có vai tester riêng.
  - **Trỏ tài liệu**: `.claude/teams/playbook.md`, `.claude/agents/`, `.claude/skills/`, `.claude/memory/`.
- **STOP gate**: File `.claude/master.md` tồn tại + có đủ 7 section (bất biến / roster / vòng lặp / phân loại / subagent-vs-teammate / gate-implementer / trỏ tài liệu) + bảng so sánh subagent vs teammate ≥4 dòng + roster bảng đủ 8 vai (bao gồm `team-ops`).
- **Output artifact**: `/home/gnuh/Documents/project/note-ch/.claude/master.md`.

### Session 2.2 — Viết playbook

- **Scope**: Tạo `.claude/teams/playbook.md` với:
  - **Khi nào TeamCreate vs lead tự làm vs Agent one-shot** — bảng 3 cột với ≥3 ví dụ note-ch cụ thể mỗi cột (vd "xây MathLive block → TeamCreate"; "fix 1 bug nhỏ CAS → lead tự làm"; "research docs Tauri IPC → Agent one-shot").
  - **Recipe TeamCreate 7 bước** đầy đủ: (1) TeamCreate(team_name) → (2) Agent spawn song song với run_in_background=true → (3) **chờ teammate tự gửi ack "sẵn sàng"** (teammate tự báo lead khi khởi tạo xong; chỉ resend nếu sau ~45s vẫn im) → (4) TaskCreate(description=brief self-contained) → (5) SendMessage("Task #N — TaskGet(N) rồi bắt đầu") → (6) chờ report → gate → handoff/re-fix → (7) shutdown_request + TeamDelete.
  - **Spawn prompt template** 4 dòng bắt buộc khi wake teammate (vai / teammate-khác / quy trình: TaskGet → TaskUpdate in_progress → làm → TaskUpdate completed + SendMessage).
  - **Brief 4 phần** (Context + Input + Scope + done-criteria đo được). Rule: brief < 5 dòng hoặc done-criteria cảm tính → viết lại trước spawn.
  - **Done-criteria implementer**: "build pass + evidence" — bám gate idiom note-ch (`npm run build` exit 0 / `tsc --noEmit` 0 error / `pytest` pass / `POST /eval` trả LaTeX chính xác / N fixture parse / vòng gõ→inline chạy). Cấm gate cảm tính.
  - **Lifecycle + SendMessage protocol**: lead↔teammate là path chính; KHÔNG peer-DM; idle bình thường; feedback FAIL diff-style (FAIL/Hiện tại/Expected/Action).
  - **Failure modes** khi teammate im (5 bước: TaskGet status → resend cụ thể → first-spawn delay → verify-already-done → escalate). Khi lead phát hiện lỗi phối hợp (teammate câm, làm sai scope, phán cảm tính...): (a) ghi vào issue-queue `.claude/teams/issues.md` (code + triệu chứng); (b) quyết để cuối task hiện tại fix hay gọi `team-ops` fix ngay; `team-ops` sửa bộ máy team (agent body/playbook/skill), KHÔNG đụng code sản phẩm.
  - **Anti-patterns** ≥10 mục (Lead: chạy linear rồi quên / spawn thừa / brief thiếu gate / không chờ ack / lead-DIY vượt ngưỡng / accept cảm tính. Teammate: silent-complete / peer-DM / làm ngoài scope / tự thoát / phán "có vẻ pass").
  - **Terminal layout** — 2 display mode:
    - `in-process` (mặc định Linux khi KHÔNG dùng tmux/iTerm2): teammate chạy trong cùng process; dùng Shift+Down cycle qua teammate, Ctrl+T toggle task list. Config: `"teammateMode": "in-process"` trong project `.claude/settings.json` (note-ch) hoặc flag `claude --teammate-mode in-process`.
    - `split-pane` (cần tmux hoặc iTerm2): mỗi teammate = 1 pane riêng, dễ quan sát song song. Config: `"teammateMode": "tmux"` hoặc `"auto"`. Note: KHÔNG hỗ trợ trong VS Code terminal / Windows Terminal / Ghostty → fallback in-process.
    - tmux pane layout cho N teammate realistic note-ch (N=2..5, spawn order = pane index, lead = pane 1 luôn):
      - N=2: `tmux select-layout main-vertical` (2 pane dọc phải).
      - N=3: `tmux select-layout main-vertical` (3 pane dọc phải).
      - N=4: `tmux select-layout main-vertical && tmux join-pane -h -s :.3 -t :.2 && tmux join-pane -h -s :.5 -t :.4` (main + 2×2 grid).
      - N=5 (full chain note-ch): thêm `&& tmux resize-pane -t :.6 -y 18` cho pane cuối full-width. Sau kill pane: thêm `tmux move-window -r -s 1:1 &&` trước các lệnh trên (Block 2).
  - **Bảng PASS-criteria per-vai** (lead gate mỗi handoff — đo được, không cảm tính):
    - `researcher`: 4 mục đầy đủ (Đã biết / Rủi ro / Câu hỏi còn chặn / Nguồn); open_questions chỉ câu thực sự chặn (không câu "nice to know").
    - `planner` (qua planner agent): Goal 1 câu đo được; Steps là WHAT không HOW; mỗi done-criteria có cách kiểm khách quan; output là markdown không JSON.
    - `architect`: pipeline/component tree + API contract + file structure đủ để implementer không phải đoán; có ≥1 cảnh báo rủi ro kỹ thuật cụ thể.
    - `editor-frontend`: `npm run build` exit 0 + `tsc --noEmit` 0 error + ≥1 MathLive block render `x^2` không lỗi console.
    - `backend-cas`: `pytest` pass + `POST /eval` trả LaTeX chính xác cho ≥3 fixture + timeout config có trong code.
    - `handwriting`: chỉ PASS sau khi §11.2 (license) đã chốt; sau đó: bút→LaTeX nhận diện ≥1 ký hiệu; `npm run build` exit 0.
    - `glue-packaging`: `cargo build` trong `src-tauri/` pass + app launch + ≥1 IPC call frontend→sidecar trả về (console 0 error).
    - `team-ops`: issue-queue được đọc; diff thay đổi báo lead; thay đổi high-impact (`master.md`/`playbook.md`/`settings.json`) chờ user duyệt trước khi coi là done; KHÔNG sửa file ngoài `.claude/`.
  - **Giới hạn Agent Teams** (box ngắn, lead đọc trước spawn):
    - 1 team tại 1 thời điểm — cleanup (`TeamDelete`) team cũ trước khi `TeamCreate` mới.
    - KHÔNG nested team — teammate không được spawn team con.
    - in-process teammate KHÔNG resume qua `/resume` hoặc `/rewind` — nếu session bị gián đoạn phải spawn lại từ đầu.
    - Permissions teammate = kế thừa mode của lead lúc spawn — không set riêng cho từng teammate.
    - Cần Claude Code ≥ v2.1.32 + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
  - **Plan-approval mode** (cho task rủi ro cao): Lead spawn teammate với flag plan-approval — teammate chạy read-only, soạn plan và dừng chờ lead duyệt; lead duyệt (kèm feedback nếu từ chối) trước khi teammate implement. Khuyến nghị dùng cho `editor-frontend` và `backend-cas` trên task đường găng (§8.1–8.3). Lead đặt tiêu chí duyệt trong brief (vd "chỉ duyệt plan có test coverage cho ≥3 fixture" hoặc "phải có timeout config trước khi implement").
- **STOP gate**: File `.claude/teams/playbook.md` tồn tại + có bảng 3 cột với ≥3 ví dụ note-ch mỗi cột + có recipe 7 bước đầy đủ + có brief template 4 phần + có anti-patterns ≥10 mục + có gate idiom note-ch + có section terminal layout (2 mode + ≥2 tmux layout N) + có bảng PASS-criteria 8 vai đo được + có box giới hạn Agent Teams (≥4 điểm) + có mục plan-approval mode.
- **Output artifact**: `/home/gnuh/Documents/project/note-ch/.claude/teams/playbook.md`.

**Phase 2 gate**: Cả 2 file tồn tại + `master.md` có roster 8 vai (bao gồm `team-ops`) + bảng subagent-vs-teammate ≥4 dòng + `playbook.md` có bảng 3 cột ≥3 ví dụ note-ch mỗi cột + có section terminal layout + có bảng PASS-criteria 8 vai + có box giới hạn Agent Teams + có mục plan-approval mode + failure-modes trỏ issue-queue + `team-ops`.

---

## Phase 3 — Roster Agents + Skills (skill đi kèm agent)

**Mục tiêu**: Tạo 7 agent body mỏng mới (planner đã có, tái dùng), mỗi agent tạo chung session với skill bổ trợ của nó. Agent body format bám `.claude/agents/planner.md` (đúng domain note-ch), KHÔNG bám company agent body. Phòng ngừa **Pitfall #3** (agent body trỏ master+playbook trong "Đọc đầu phiên"). Caveat skill frontmatter: agent body trỏ path skill để teammate tự Read.

**Nguyên tắc session Phase 3**: mỗi session = 1 hoặc 2 agent + skill đi kèm. Skill dùng chung (`build-verify`, `memory`) tạo lần đầu với agent cần nó, agent khác dùng sau chỉ trỏ path.

**Chọn `model` cho frontmatter**: suy theo độ nặng task của vai — **mặc định `sonnet`** cho đa số (researcher/architect/backend-cas/handwriting/glue-packaging/team-ops). Nâng lên `opus` chỉ cho vai cần suy luận nặng/đường găng nếu xét thấy cần (vd `editor-frontend`); hạ xuống `haiku` cho vai thuần đọc/format nhẹ. Không chốt cứng bảng — session tự quyết theo task, đa phần sonnet.

### Session 3.1 — `researcher` + skill `memory`

- **Scope**:
  1. `.claude/skills/memory/SKILL.md` — skill dùng chung cho mọi agent: đọc/ghi `.claude/memory/` (context.md, mistakes.md, patterns.md, global.md), format entry `## YYYY-MM-DD HH:MM — slug`, luôn append (KHÔNG overwrite), cap N=10 entry mới nhất khi đọc.
  2. `.claude/agents/researcher.md` — vai: gom context repo note-ch (CLAUDE.md + plan/ + src/ nếu có) + WebSearch tài liệu kỹ thuật (MathLive API, TipTap/Lexical docs, SymPy docs, Tauri IPC docs) + đọc memory context → trả output 4 mục (Đã biết / Rủi ro / Câu hỏi còn chặn / Nguồn). Body trỏ skill `memory/SKILL.md` trong "Đọc đầu phiên".
  - Frontmatter bắt buộc: name/description/tools/model. Tools: Read, Grep, Glob, WebSearch, TaskGet, TaskUpdate, TaskList, SendMessage.
  - "Đọc đầu phiên": `.claude/master.md` → `.claude/teams/playbook.md` → `.claude/memory/context.md` → `.claude/skills/memory/SKILL.md`.
  - "Trong TeamCreate mode": ack + TaskGet + TaskUpdate in_progress cùng turn; xong = TaskUpdate completed + SendMessage paste full output; shutdown_request = ack.
- **STOP gate**: 2 file tồn tại (skill + agent) + `memory/SKILL.md` có format entry, luôn-append rule, cap-10 rule + `researcher.md` frontmatter hợp lệ + tools có TaskGet/TaskUpdate/TaskList/SendMessage + "Đọc đầu phiên" trỏ `master.md` và `playbook.md` + "Trong TeamCreate mode" có đủ 3 hành vi (ack/TaskGet/TaskUpdate; done; shutdown).
- **Output artifact**: `.claude/skills/memory/SKILL.md` + `.claude/agents/researcher.md`.

### Session 3.2 — `architect` (không cần skill riêng)

- **Scope**:
  1. `.claude/agents/architect.md` — vai: nhận plan WHAT (từ planner) + context repo → thiết kế HOW (component tree / API contract / data flow / file structure đủ để implementer không phải đoán). Output: 5 mục (A: component/module breakdown; B: API contract; C: data flow diagram text; D: file structure; E: rủi ro kỹ thuật). Body trỏ skill `memory/SKILL.md` trong "Đọc đầu phiên" (tái dùng skill đã có từ Session 3.1). Không cần skill riêng — architect output là prose thiết kế, không cần how-to kỹ thuật đặc thù.
  - Frontmatter: name/description/tools/model. Tools: Read, Grep, Glob, TaskGet, TaskUpdate, TaskList, SendMessage.
  - "Đọc đầu phiên": `.claude/master.md` → `.claude/teams/playbook.md` → `.claude/memory/context.md` → `.claude/skills/memory/SKILL.md`.
  - "Trong TeamCreate mode": chuẩn (ack/TaskGet/TaskUpdate; done; shutdown).
- **STOP gate**: File `.claude/agents/architect.md` tồn tại + frontmatter hợp lệ + tools có TaskGet/TaskUpdate/TaskList/SendMessage + "Đọc đầu phiên" trỏ `master.md` và `playbook.md` + output format có đủ 5 mục A–E + "Trong TeamCreate mode" có đủ 3 hành vi.
- **Output artifact**: `.claude/agents/architect.md`.

### Session 3.3 — `editor-frontend` + skill `build-verify`

- **Scope**:
  1. `.claude/skills/build-verify/SKILL.md` — skill dùng chung cho mọi implementer: gate idiom note-ch đầy đủ (`npm run build` exit 0; `tsc --noEmit` 0 error; `npx vitest run` pass; `cargo build` trong `src-tauri/` pass; `pytest` pass; `POST /eval` trả LaTeX chính xác với ví dụ mẫu; N fixture parse; vòng gõ→inline), format output evidence, cách đọc lỗi thường gặp, cấm gate cảm tính.
  2. `.claude/agents/editor-frontend.md` — vai: Agent A §12 (đường găng §8.1): Tauri scaffold + React/TS + Vite + TipTap/Lexical block model + MathLive nhúng làm block type. Body trỏ `build-verify/SKILL.md` + `memory/SKILL.md` trong "Đọc đầu phiên". Self-verify gate: `npm run build` exit 0 + `tsc --noEmit` 0 error + 1 MathLive block render được `x^2` (console 0 error).
  - Frontmatter: name/description/tools/model. Tools: Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage.
  - "Đọc đầu phiên": `.claude/master.md` → `.claude/teams/playbook.md` → `.claude/memory/context.md` → `.claude/skills/build-verify/SKILL.md` → `.claude/skills/memory/SKILL.md`.
  - "Trong TeamCreate mode": chuẩn + nộp evidence self-verify trước khi SendMessage done.
- **STOP gate**: 2 file tồn tại + `build-verify/SKILL.md` có gate idiom đủ 5 stack (frontend/Tauri/backend/pipeline/vòng-lõi) + `editor-frontend.md` frontmatter hợp lệ + tools có 4 task tools + "Đọc đầu phiên" trỏ `master.md`, `playbook.md`, `build-verify/SKILL.md` + "Trong TeamCreate mode" có hành vi nộp evidence.
- **Output artifact**: `.claude/skills/build-verify/SKILL.md` + `.claude/agents/editor-frontend.md`.

### Session 3.4 — `backend-cas` + skill `latex-sympy-pipeline`; `handwriting` + skill `handwriting-myscript`; `glue-packaging` + skill `tauri-packaging`

- **Scope**: Tạo 3 agent + 3 skill trong 1 session (cả 3 agent đều tương đối nhỏ và cùng pattern):
  1. `.claude/skills/latex-sympy-pipeline/SKILL.md` — pipeline LaTeX→SymPy: latex2sympy2 dọn dẹp input, ≥5 fixture mẫu (vd `x^2`→`x**2`; `\int x\,dx`→`x**2/2`; `\frac{d}{dx}x^2`→`2*x`; `\sum_{i=1}^{n}i`→`n*(n+1)/2`; `x^2+x-2=0`→`[-2,1]`), timeout config, numeric fallback khi SymPy treo. Note: §11.3 LLM fallback — xem Open questions.
  2. `.claude/agents/backend-cas.md` — vai: Agent B §12: FastAPI + SymPy + pipeline LaTeX→SymPy + timeout + numeric fallback (§8.2–8.3). Body trỏ `build-verify/SKILL.md` + `latex-sympy-pipeline/SKILL.md` + `memory/SKILL.md`. Self-verify: `pytest` pass + `POST /eval` trả LaTeX chính xác cho ≥3 fixture.
  3. `.claude/skills/handwriting-myscript/SKILL.md` — tích hợp MyScript iink: luồng bút→LaTeX (ink→recognition→LaTeX), SDK setup, palm rejection, gesture xóa/sửa, auto-convert mực→toán. **GHI RÕ ĐẦU FILE**: "Skill này phụ thuộc §11.2 (ngân sách license MyScript) và §11.1 (thiết bị: iPad Pro/Surface/Windows 2-in-1). Agent `handwriting` PAUSE tại human gate §11.2 nếu chưa chốt."
  4. `.claude/agents/handwriting.md` — vai: Agent C §12: MyScript iink tích hợp. Body trỏ `handwriting-myscript/SKILL.md` + `build-verify/SKILL.md` + `memory/SKILL.md`. **BẮT BUỘC** có section "Human gate §11.2": "Trước khi bắt đầu bất kỳ task implement nào, xác nhận user đã chốt §11.2 (ngân sách license MyScript). Nếu chưa → SendMessage lead hỏi lại, KHÔNG tiến hành."
  5. `.claude/skills/tauri-packaging/SKILL.md` — đóng gói Tauri 2: `cargo build --release`, IPC frontend↔sidecar (Tauri command + invoke), spawn Python sidecar (`tauri.conf.json` sidecar config), build desktop artifact, offline fallback khi sidecar không start.
  6. `.claude/agents/glue-packaging.md` — vai: Agent D §12: IPC frontend↔sidecar + Tauri packaging + build desktop + offline. Body trỏ `tauri-packaging/SKILL.md` + `build-verify/SKILL.md` + `memory/SKILL.md`. Self-verify: `cargo build` trong `src-tauri/` pass + app launch + IPC call trả về (console 0 error).
  - Tất cả agent: frontmatter hợp lệ, tools có 4 task tools, "Đọc đầu phiên" trỏ `master.md` + `playbook.md` + skill liên quan, "Trong TeamCreate mode" chuẩn.
- **STOP gate**: 6 file tồn tại (3 skill + 3 agent) + `latex-sympy-pipeline/SKILL.md` có ≥5 fixture mẫu + `handwriting-myscript/SKILL.md` có note §11.2 rõ ràng + `handwriting.md` có section "Human gate §11.2" + mọi agent frontmatter hợp lệ + mọi agent "Đọc đầu phiên" trỏ `master.md` và `playbook.md`.
- **Output artifact**: 3 skill file + 3 agent file.

### Session 3.5 — `team-ops` + skill `team-fix`

- **Scope**:
  1. `.claude/skills/team-fix/SKILL.md` — phục vụ riêng `team-ops`: (a) format entry issue-queue `.claude/teams/issues.md` (fields: thời gian, code, teammate, triệu chứng, trạng thái open/fixed, target sửa); (b) bảng ≥8 code lỗi + playbook sửa từng loại (`SILENT` không ack/báo xong → kiểm tools frontmatter, thêm TaskGet/TaskUpdate/SendMessage; `SLOW-PICKUP` cần resend → kiểm first-spawn delay; `FORGOT-TASKUPDATE` → thêm nhắc nhở "Trong TeamCreate mode"; `SCOPE` làm ngoài brief → siết scope trong brief template; `STALE` context cũ → nhắc "Đọc đầu phiên" trỏ memory/context.md; `FORM` sai định dạng output → siết output format trong agent body; `GATE` phán cảm tính → thêm gate idiom vào agent body; `NO-SHUTDOWN-RESP` → thêm shutdown handler; `OTHER`); (c) ngưỡng trigger: 1 code lặp >1 trong session hoặc ≥3 cùng (vai, code) → đề xuất sửa agent body (cần user duyệt) thay vì chỉ vá brief.
  2. `.claude/agents/team-ops.md` — vai: đọc issue-queue → fix bộ máy team bằng Edit/Write file `.claude/` (agent body/playbook/master/skills/settings.json/issues.md). Body trỏ `team-fix/SKILL.md` + `memory/SKILL.md` trong "Đọc đầu phiên". **Có section ranh giới cứng** ("Phạm vi sửa: `.claude/agents/*.md`, `.claude/teams/playbook.md`, `.claude/master.md`, `.claude/skills/*`, `.claude/settings.json`, `.claude/teams/issues.md`. TUYỆT ĐỐI KHÔNG đụng `src/`, `backend/`, `src-tauri/` — đó là việc của implementer."). Gate nhẹ sau khi fix: báo lead diff thay đổi; thay đổi high-impact (`master.md`/`playbook.md`/`settings.json`) → lead trình user trước khi coi là done; nếu sửa agent body → gợi ý lead chạy re-spawn smoke 1 teammate ack được.
  - Frontmatter: name/description/tools/model. Tools: Read, Grep, Glob, Edit, Write, TaskGet, TaskUpdate, TaskList, SendMessage.
  - "Đọc đầu phiên": `.claude/master.md` → `.claude/teams/playbook.md` → `.claude/memory/context.md` → `.claude/skills/team-fix/SKILL.md` → `.claude/skills/memory/SKILL.md`.
  - "Trong TeamCreate mode": chuẩn (ack/TaskGet/TaskUpdate; done; shutdown).
- **STOP gate**: 2 file tồn tại + `team-fix/SKILL.md` có format issue-queue + bảng ≥8 code lỗi kèm target sửa + ngưỡng trigger rõ + `team-ops.md` frontmatter hợp lệ + có section ranh giới cứng (phạm vi `.claude/` + cấm đụng `src/backend/src-tauri/`) + "Đọc đầu phiên" trỏ `master.md`, `playbook.md`, `team-fix/SKILL.md` + "Trong TeamCreate mode" có đủ 3 hành vi.
- **Output artifact**: `.claude/skills/team-fix/SKILL.md` + `.claude/agents/team-ops.md`.

**Phase 3 gate** (sau Session 3.5): Tổng 7 agent mới (researcher/architect/editor-frontend/backend-cas/handwriting/glue-packaging/team-ops) + 6 skill file (memory/build-verify/latex-sympy-pipeline/handwriting-myscript/tauri-packaging/team-fix) tất cả tồn tại + mọi agent trỏ `master.md` và `playbook.md` + không agent body nào chứa how-to dài (>40 dòng) mà không trỏ skill file.

---

## Phase 4 — Smoke-test & Bootstrap

**Mục tiêu**: Verify end-to-end — settings.json có hiệu lực, spawn thật 1 teammate bằng TeamCreate, teammate ack + TaskGet + TaskUpdate đúng cùng turn, memory store khởi tạo, CLAUDE.md cập nhật cơ chế buộc đọc master. Phòng ngừa **Pitfall #3** bằng CLAUDE.md §13 hook cứng.

### Session 4.1 — Khởi tạo memory store + cập nhật CLAUDE.md

- **Scope**:
  1. Tạo thư mục `.claude/memory/` với 4 file bootstrap (context.md, mistakes.md, patterns.md, global.md) — mỗi file có header + 1 entry bootstrap format `## YYYY-MM-DD HH:MM — agent-team-setup-bootstrap` + trạng thái "agent-team-setup in progress".
  2. Tạo `.claude/teams/issues.md` bootstrap — header + 1 entry mẫu format đúng (ghi "no issues yet" hoặc entry placeholder) để `team-ops` có file sẵn append vào; file do `team-ops` sở hữu về sau.
  3. Cập nhật `CLAUDE.md` của note-ch: thêm section mới `## 13. Trước khi lập team agent` với chỉ dẫn cứng: "(a) Đọc `.claude/master.md` (nguyên tắc bất biến + roster 8 vai + vòng lặp TaskList loop + phân biệt subagent vs teammate); (b) Đọc `.claude/teams/playbook.md` (khi nào TeamCreate vs Agent one-shot vs lead tự làm, recipe 7 bước spawn, brief 4 phần); (c) Đọc `.claude/memory/context.md` (trạng thái hiện tại + task đang chạy). Không spawn team trước khi đọc 3 file này." — Đây là cơ chế hard buộc đọc, phòng Pitfall #3.
- **STOP gate**: 4 file `.claude/memory/*.md` tồn tại + `.claude/teams/issues.md` tồn tại (có header + format entry mẫu) + mỗi memory file không rỗng (có header + ≥1 entry đúng format) + `CLAUDE.md` chứa section `## 13.` với 3 dòng chỉ dẫn tường minh trỏ `master.md`, `playbook.md`, `memory/context.md`.
- **Output artifact**: `.claude/memory/{context,mistakes,patterns,global}.md` + `.claude/teams/issues.md` + `CLAUDE.md` (edited).

### Session 4.2 — Smoke-test spawn teammate thật

- **Scope**: Chạy smoke-test end-to-end:
  1. Kiểm tra Claude Code version ≥ v2.1.32 (yêu cầu Agent Teams feature).
  2. Verify `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` active (từ settings.json).
  3. Spawn team nhỏ: `TeamCreate(team_name="smoke-test")` → `Agent(team_name="smoke-test", name="researcher", subagent_type="researcher", run_in_background=true)` → **chờ teammate tự gửi ack "sẵn sàng"** (resend nếu sau ~45s vẫn im) → `TaskCreate(title="smoke-ack", description="<brief self-contained: ack và TaskUpdate in_progress ngay, xong TaskUpdate completed + SendMessage>", owner="researcher")` → `SendMessage(to="researcher", message="Task #1 — TaskGet(1) rồi bắt đầu.")` → chờ ack + TaskUpdate in_progress.
  4. Sau khi ack: `SendMessage(to="researcher", '{"type": "shutdown_request"}')` → chờ ack → `TeamDelete`.
  5. Ghi kết quả vào `.claude/memory/context.md` (append entry smoke-test pass/fail + ngày).
- **STOP gate**:
  - `TeamCreate("smoke-test")` không lỗi.
  - Teammate `researcher` ack ("researcher: sẵn sàng. Chờ task." hoặc tương đương) trong vòng 2 phút.
  - `TaskGet(1)` trả về status `in_progress` — xác nhận teammate thực hiện TaskGet + TaskUpdate cùng turn.
  - Teammate ack shutdown_request ("Shutdown ack" hoặc tương đương).
  - `TeamDelete` không lỗi.
  - Entry smoke-test ghi vào `.claude/memory/context.md` (append, đúng format).
- **Output artifact**: entry trong `.claude/memory/context.md`.

**Phase 4 gate**: Smoke-test pass theo STOP gate trên + memory store có entry smoke-test + CLAUDE.md có section `## 13.` với 3 chỉ dẫn tường minh.

---

## Outcome cuối

- `.claude/settings.json`: `acceptEdits` + `AGENT_TEAMS=1` + deny list an toàn.
- `.claude/master.md` + `.claude/teams/playbook.md`: lead có "bộ não" điều phối đúng, phân biệt TeamCreate vs Agent one-shot, không lead-DIY task phức tạp, biết gate bằng evidence implementer.
- 7 agent body mới mỏng (researcher/architect/editor-frontend/backend-cas/handwriting/glue-packaging/team-ops) + planner tái dùng = 8 vai, đều trỏ `master.md` và `playbook.md` trong "Đọc đầu phiên".
- 6 skill file tách riêng (memory/build-verify/latex-sympy-pipeline/handwriting-myscript/tauri-packaging/team-fix), mỗi skill đi kèm agent dùng chính nó.
- `.claude/memory/` khởi tạo với 4 file + `.claude/teams/issues.md` bootstrap (sở hữu bởi `team-ops`).
- `CLAUDE.md` §13 buộc đọc master+playbook+memory trước spawn.
- Smoke-test: TeamCreate + 1 teammate ack + TaskUpdate `in_progress` đúng cùng turn + shutdown clean.

---

## Thiết kế điểm quan trọng

### Caveat skill frontmatter (skill KHÔNG auto-load trong teammate mode)

Agent Teams docs: field `skills:` trong frontmatter agent definition KHÔNG áp dụng khi chạy như teammate. **Giải pháp**: skill files đặt tại `.claude/skills/*/SKILL.md` (project-scope, tự available), agent body trỏ path tương đối (`.claude/...`, tính từ root repo) trong section "Đọc đầu phiên" để teammate tự Read đầu phiên. Không dựa vào auto-inject — đây là cơ chế duy nhất đảm bảo teammate đọc skill.

### Skill đi kèm agent (không build rời)

Mỗi skill tạo chung session với agent cần nó: tránh orphan skill không ai dùng, tránh session dài tạo skill rồi agent dùng khác context. Skill dùng chung (memory, build-verify) tạo 1 lần với agent đầu tiên cần — agent sau chỉ trỏ path.

### Không có vai tester riêng

Mỗi implementer (editor-frontend/backend-cas/handwriting/glue-packaging) tự chạy gate bằng `build-verify/SKILL.md` rồi nộp evidence trong SendMessage done. Lead gate bằng evidence — không cần vai tester độc lập cho phase setup này. Gate implementer = "build pass + evidence đo được", không phải "trông ổn".

### Pitfall map → step

| Pitfall | Step phòng ngừa |
|---|---|
| #1 Permissions spam teammate | Session 1.1: settings.json `defaultMode:acceptEdits` + deny list |
| #2 Lead nhầm subagent vs teammate; lead spam | Session 2.1 master: bảng so sánh ≥4 dòng; Session 2.2 playbook: bảng 3 cột + recipe 7 bước; rubric "khi nào TeamCreate" |
| #3 Lead bỏ qua master+playbook | Session 2.1/2.2: viết file; Session 3.*: mọi agent "Đọc đầu phiên" trỏ master+playbook; Session 4.1: CLAUDE.md §13 hook cứng |
| #4 Lead tự làm hết | Session 2.1 master: bất biến "lead điều phối, không tự code task phức tạp" + ngưỡng trivial rõ; Session 2.2 playbook: anti-pattern Lead-DIY |
| Skill rời rạc (build trước, agent sau) | Phase 3: skill và agent cùng 1 session, skill đi kèm agent dùng nó |
| Tạo lại agent đã có | Roster chốt rõ: `planner.md` TÁI DÙNG — không tạo file mới; 7 vai còn lại tạo mới |
| Sự cố team không ai xử lý | Session 3.5: `team-ops` + `team-fix` — issue-queue `.claude/teams/issues.md` in-scope, team-ops là chủ sở hữu |

### Open questions (không tự chốt — §11 CLAUDE.md)

- **§11.1 Thiết bị cụ thể**: ảnh hưởng agent `handwriting` (MyScript SDK bản nào, cách test). Chưa chốt → ghi placeholder trong `handwriting-myscript/SKILL.md`.
- **§11.2 Ngân sách license MyScript**: agent `handwriting` có human gate bắt buộc; skill `handwriting-myscript/SKILL.md` ghi note dependency. Cần user chốt trước khi agent C chạy thật.
- **§11.3 Lớp AI** (LLM parse + giải thích): ảnh hưởng `latex-sympy-pipeline/SKILL.md` (LLM fallback) và `backend-cas`. Chưa chốt → skill ghi "cân nhắc giai đoạn sau, LLM fallback là option".
- **§11.4 Tên dự án**: ảnh hưởng naming trong memory và agent body. Hiện dùng tên file không prefix.
- **Hooks settings.json** (tùy chọn): `TaskCreated` (chặn task thiếu done-criteria), `TeammateIdle` (giữ teammate tiếp tục), `TaskCompleted` (enforce quality gate). Cân nhắc sau khi team chạy ổn định — không ép vào setup ban đầu.

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| 2026-06-11 | Revision 4 — Gỡ 4 điểm mơ hồ: (1) thêm hướng dẫn chọn `model` frontmatter (mặc định sonnet, suy theo task) vào nguyên tắc Phase 3; (2) thay "đợi ≥30–45s" (sleep mù) bằng cơ chế "chờ teammate tự gửi ack, resend nếu >45s im" ở master loop / recipe 7 bước / smoke-test; (3) `teammateMode` chốt dùng project `.claude/settings.json` thay `~/.claude`; (4) path skill trong agent body chốt **tương đối** thay "tuyệt đối" | User review các phần mơ hồ |
| 2026-06-10 | Initial | Tạo plan agent-team-setup |
| 2026-06-10 | Revision 3 — Thêm vai `team-ops` (roster 7→8): (1) Roster bảng 8 vai + lý do; (2) Session 3.5 `team-ops`+skill `team-fix` (format issue-queue, ≥8 code lỗi, ngưỡng trigger, ranh giới cứng chỉ `.claude/`); (3) Session 4.1 bootstrap `.claude/teams/issues.md`; (4) Playbook Session 2.2 failure-modes bổ sung luồng ghi issue-queue + gọi team-ops; (5) PASS-criteria bảng thêm dòng `team-ops`; (6) Phase 3 gate cập nhật 7 agent + 6 skill; (7) Pipeline 9→10 session + Phase 3 4→5 session; (8) Outcome/Pitfall map cập nhật; (9) Open questions bỏ mục issue-queue (đã in-scope) | User thêm vai team-ops — cơ chế fix sự cố team không dừng pipeline |
| 2026-06-10 | Revision 2 — Bổ sung vào Session 2.2 scope + STOP gate: (1) Terminal layout (2 display mode in-process/split-pane + tmux layout N=2..5 + spawn-order/pane-index rule); (2) Bảng PASS-criteria per-vai 7 dòng đo được; (3) Box giới hạn Agent Teams (1-team-tại-1-lúc/no-nested/no-resume/permissions-kế-thừa/version); (4) Plan-approval mode cho task rủi ro (editor-frontend/backend-cas); Phase 2 gate cập nhật khớp. Open questions thêm 2 mục tùy chọn (issue-queue nhẹ + hooks). | User soát thiếu terminal layout; planner soát thêm PASS-criteria/giới-hạn/plan-approval |
| 2026-06-10 | Revision 1 — 6 thay đổi: (1) Bỏ prefix nc- toàn bộ; (2) Roster 7 vai: planner tái dùng, bỏ tester riêng, cto→architect, 4 implementer tự gate; (3) Skill đi kèm agent (không build rời trước) — Phase 3 restructure 4 session thay 3; (4) Master+playbook sạch domain company (bỏ chi nhánh/workflow.json/engine/catalog); (5) Gate Session 1.1 bỏ claude --dangerously-skip-permissions, dùng python3 JSON parse; (6) Pitfall map thêm 2 dòng mới (skill rời rạc; tái dùng agent) | User review sau Initial — ranh giới tham khảo company/ + roster + cấu trúc skill |
