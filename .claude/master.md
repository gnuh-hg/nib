# master — orchestration doc (note-ch)

> Điểm vào "bộ não" của **lead** khi vận hành note-ch như một **native Claude Code team** (Agent Teams).
> Đọc file này + `.claude/teams/playbook.md` (chi tiết thao tác) **TRƯỚC** khi spawn bất kỳ team nào.
>
> **note-ch build APP "notepad toán học sống"** (Tauri 2 + React/TS/Vite + TipTap/Lexical + MathLive +
> MyScript + FastAPI/SymPy). Đường găng = **editor** (gõ/bút → 1 block → kết quả symbolic inline, live).
> Xem `CLAUDE.md` §3–§6 **[LOCKED]** (không bàn ngược), §8 rủi ro (định ưu tiên), §11 câu hỏi mở
> (đừng tự chốt), §12 workstream.

---

## 1. Ba nguyên tắc bất biến

1. **Lead điều phối, KHÔNG tự code/build task phức tạp.** Lead chỉ tự xử **trivial**: ≤3 file, scope
   rõ ràng, ≤15 dòng thay đổi, hoặc thuần đọc/hỏi/tra file. Mọi thứ vượt ngưỡng → giao teammate.
   Vi phạm điển hình = "lead-DIY" (lead tự ngồi viết editor/CAS thay vì spawn) → cấm.
2. **Teammate giao tiếp bằng văn xuôi markdown** — KHÔNG JSON ceremony, KHÔNG trao đổi plan-as-data
   giữa các vai. Artifact code (file `src/`, `backend/`, `src-tauri/`) là output; thông điệp giữa
   lead↔teammate là prose. Implementer nộp **evidence đo được** (output lệnh build/test), không phải
   mô tả cảm tính.
3. **Lead drive MỘT TaskList loop** — giao task → chờ report → gate bằng evidence → task kế — lặp tới
   khi TaskList rỗng. KHÔNG chạy researcher→…→implementer một lượt linear rồi quên gate giữa chừng.

---

## 2. Roster 9 vai (`.claude/agents/*.md`)

| Vai | File | Vai trò | Tools | Output |
|---|---|---|---|---|
| `planner` (**TÁI DÙNG**) | `planner.md` | WHAT — phân loại scope + sinh plan artifact (roadmap/long/short). KHÔNG implement. | Read, Write, Edit, Grep, Glob | plan markdown (inline / `plan/<slug>/`) |
| `researcher` | `researcher.md` | Gom context repo (CLAUDE.md + plan/ + src/) + WebSearch docs kỹ thuật (MathLive/TipTap/SymPy/Tauri) + đọc memory → tóm tắt. | Read, Grep, Glob, WebSearch, TaskGet, TaskUpdate, TaskList, SendMessage | prose 4 mục (Đã biết / Rủi ro / Câu hỏi còn chặn / Nguồn) |
| `architect` | `architect.md` | HOW — component tree, API contract, data flow, file structure đủ để implementer không phải đoán. (planner=WHAT, architect=HOW.) | Read, Grep, Glob, TaskGet, TaskUpdate, TaskList, SendMessage | prose 5 mục (A breakdown / B API contract / C data flow / D file structure / E rủi ro) |
| `design-figma` | `design-figma.md` | Thiết kế visual trong Figma (layout, design system, component visual, token Figma) → xuất Figma URL + screenshot + token spec + i18n key list en/vi cho editor-frontend. KHÔNG ghi src/; KHÔNG quyết WHAT/scope; bám 3 req nền [LOCKED]. | Figma MCP (17 tool) + Read, Write, Edit, Glob, Grep, TaskGet, TaskUpdate, TaskList, SendMessage | Figma file URL + screenshot ref + token spec bảng + i18n key list en/vi |
| `editor-frontend` | `editor-frontend.md` | Agent A §12 — đường găng §8.1: Tauri scaffold + React/TS/Vite + TipTap/Lexical block + MathLive block. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (`npm run build` 0 / `tsc --noEmit` 0 / block render `x²`) |
| `backend-cas` | `backend-cas.md` | Agent B §12 — §8.2–8.3: FastAPI + SymPy + pipeline LaTeX→SymPy + timeout + numeric fallback. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (`pytest` pass / `POST /eval` trả LaTeX chính xác ≥3 fixture) |
| `handwriting` | `handwriting.md` | Agent C §12: MyScript iink, bút→LaTeX, palm rejection, gesture. **Human gate §11.2 (license) bắt buộc trước khi implement.** | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (bút→LaTeX ≥1 ký hiệu / `npm run build` 0) — chỉ sau §11.2 chốt |
| `glue-packaging` | `glue-packaging.md` | Agent D §12: IPC frontend↔sidecar + Tauri packaging + build desktop + offline fallback. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (`cargo build` trong `src-tauri/` pass / app launch / ≥1 IPC call console 0 error) |
| `team-ops` | `team-ops.md` | FIX sự cố phối hợp team (agent body thiếu tool, playbook sai, scope chồng) theo issue-queue `.claude/teams/issues.md`. | Read, Grep, Glob, Edit, Write, TaskGet, TaskUpdate, TaskList, SendMessage | diff file `.claude/` + báo lead |

> **⚠️ Ranh giới cứng `team-ops`:** chỉ sửa trong `.claude/` (`agents/*.md`, `teams/playbook.md`,
> `master.md`, `skills/*`, `settings.json`, `teams/issues.md`). **TUYỆT ĐỐI KHÔNG đụng `src/`,
> `backend/`, `src-tauri/`** — đó là việc của implementer. Thay đổi high-impact (`master.md` /
> `playbook.md` / `settings.json`) → lead trình **user duyệt** trước khi coi là done.

> **Lưu ý tool (bài học chung):** mỗi agent body PHẢI có `TaskGet/TaskUpdate/TaskList/SendMessage`
> trong `tools:`. Nếu chỉ liệt tool domain (Read/Bash/Write…) thì teammate KHÔNG report/TaskUpdate
> được → câm (issue code `SILENT`).

> **KHÔNG có vai tester riêng.** Mỗi implementer (editor-frontend / backend-cas / handwriting /
> glue-packaging) **tự chạy gate** bằng skill `build-verify` rồi nộp evidence. Lead gate bằng
> evidence nộp — không cần vai tester độc lập. Xem §7.

Mỗi agent body có sẵn section **"Trong TeamCreate mode"** (ack + `TaskGet` + `TaskUpdate in_progress`
**cùng turn**; xong = `TaskUpdate completed` rồi `SendMessage` paste-full-output; shutdown_request =
ack). Lead KHÔNG cần lặp lại protocol đó trong brief.

---

## 3. Vòng lặp điều phối (lead-driven TaskList loop)

Lead **không** chạy researcher→…→implementer một lượt rồi return. Lead quản một **TaskList** và drive
từng bước, gate sau mỗi handoff, lặp tới khi TaskList rỗng.

```
LEAD nhận user_request
  │
  ├─ Phân loại (xem §4)
  │     ├── trivial / 1–2 tool call → LEAD tự xử (không spawn)
  │     ├── XÂY tính năng MỚI multi-file/domain → lập team full chain ↓
  │     ├── SỬA có yêu cầu user mới → lập team chain rút gọn ↓
  │     └── FIX sự cố team → team-ops ↓
  │
  ├─ TeamCreate(team_name) → spawn từng teammate cần thiết:
  │     Agent(team_name, name="<role>", subagent_type="<role>", run_in_background=true)
  │     spawn song song (cùng 1 response block) các teammate độc lập
  │
  ├─ CHỜ ACK — teammate TỰ gửi ack "sẵn sàng" cho lead khi đọc xong đầu phiên.
  │     KHÔNG sleep mù. Nếu sau ~45s vẫn im → resend SendMessage 1 lần cụ thể.
  │
  ├─ Lập TaskList: tách request thành bước/deliverable (TaskCreate mỗi bước, brief self-contained)
  │
  └─ LOOP từng task (theo thứ tự):
        │
        ├─ HANDOFF CHAIN (mỗi mũi tên = 1 gate của lead):
        │    researcher  → [gate: câu-hỏi-còn-chặn? → hỏi user]
        │    → planner   → [gate: Goal/Done-criteria đo được? WHAT không HOW?]
        │    → architect → [gate: pipeline+API contract+file structure đủ để implementer không đoán?]
        │    → design-figma (song song architect, khi task cần visual design Figma)
        │    → implementer (editor-frontend/backend-cas/handwriting/glue-packaging)
        │                 → self-verify build-verify → nộp evidence
        │
        │    Mỗi handoff: TaskUpdate(owner=teammate) + SendMessage wake → CHỜ report → gate
        │
        ├─ EVIDENCE PASS → ghi memory → TaskList còn task?
        │                   ├── còn → task kế (lặp LOOP)
        │                   └── hết → thoát LOOP
        │
        └─ EVIDENCE FAIL → đọc lý do cụ thể (output lệnh, dòng lỗi)
                            ├── bug nhỏ      → SendMessage implementer re-fix → re-verify
                            ├── sai kế hoạch → SendMessage planner/architect re-plan → chain lại
                            └── fail ≥3 vòng → dừng, ghi mistakes.md, escalate user

  Khi thoát LOOP (mọi task pass):
    → ghi context.md + patterns.md (skill memory)
    → shutdown_request tới mọi teammate → chờ ack → TeamDelete
    → báo user (task nào pass, file ở đâu, cách chạy)
```

> **⚠️ PLAN-GATE BẮT BUỘC (defect ISSUE-3/5 — lead bỏ qua bước plan, đã tái diễn ≥2 lần).** Khi
> request = **xây cả phase / app / feature mới multi-session** (KHÔNG phải fix nhỏ): **plan artifact phải
> TỒN TẠI & gate PASS TRƯỚC khi giao bất kỳ task nào cho `architect`/implementer.** Cụ thể: long-plan
> (`plan/<roadmap>/<slug>/PLAN.md` + `CHECKPOINT.md`) cho phase hiện tại — thêm `ROADMAP.md` nếu route đa
> phase. **Spawn `planner` là bước MẶC ĐỊNH của full chain, KHÔNG phải tùy chọn** — KHÔNG được nhảy
> thẳng researcher→architect hay architect→implementer khi chưa có plan artifact gate được. Chỉ bỏ
> `planner` khi request rơi vào "yêu cầu nhỏ rõ 1 stack" / "trivial" (xem §4 rubric).
>
> **⚠️ "1 chat = 1 session" KHÔNG ràng buộc lead.** Quy ước plan-long "mỗi chat 1 session" chỉ áp cho
> **teammate** (mỗi teammate làm đúng 1 task, STOP tại done-criteria) và cho người tự tay chạy plan.
> Khi user giao cả một **phase** cho lead mà không giới hạn rõ, lead ngầm hiểu = làm hết các session
> liên tiếp trong cùng chat — gate + update CHECKPOINT sau MỖI session. Lead chỉ dừng khi: user giới
> hạn rõ · blocker thật · cần user-gate (vd §11.2 license MyScript, hoặc diff high-impact của team-ops).

---

## 4. Phân loại loại task (rubric)

| Loại request | Vai cần (chain) | Bỏ qua / ghi chú |
|---|---|---|
| Xây tính năng mới multi-file / domain mới (vd MathLive block, pipeline LaTeX→SymPy) | researcher → **planner (BẮT BUỘC, plan-gate)** → architect → implementer | full chain — **plan artifact PASS trước khi architect/implementer chạy** (xem PLAN-GATE §3) |
| Sửa có yêu cầu user mới trên code đã có (vd "thêm toggle exact↔decimal") | planner (light) → implementer | bỏ researcher/architect; implementer đọc code hiện có TRƯỚC, Edit phẫu thuật, KHÔNG ghi đè |
| Chỉ thiết kế UI/visual (Figma) — multi-screen, design system | researcher → planner → **design-figma** | bỏ implementer; design-figma xuất Figma URL + token spec + i18n key list |
| Chỉ thiết kế (chưa build, không cần Figma) | researcher → planner → architect | bỏ implementer |
| Yêu cầu nhỏ rõ, 1 stack | planner (light) → implementer | bỏ researcher/architect |
| FIX sự cố phối hợp team (teammate câm / sai scope / playbook lỗi) | team-ops | đọc `.claude/teams/issues.md`; KHÔNG đụng code sản phẩm |
| **Trivial** — ≤3 file, scope rõ, ≤15 dòng | LEAD tự làm | không spawn |
| Hỏi / đọc / tra file | LEAD tự làm | không spawn |

> **"Sửa có yêu cầu user mới" ≠ re-fix từ verdict FAIL.** Loại đầu = user yêu cầu thay đổi code đang
> tồn tại → cần planner-light chốt WHAT rồi implementer Edit chính xác. Loại sau = trong LOOP,
> evidence FAIL → implementer re-fix bug, không có user-request mới.

---

## 5. Subagent (Agent one-shot) vs Teammate (TeamCreate)

| Tiêu chí | **Subagent** (`Agent` one-shot, không team) | **Teammate** (`TeamCreate` + `Agent`) |
|---|---|---|
| Số turn | 1 lượt: nhận prompt → chạy → trả 1 kết quả rồi kết thúc | Nhiều turn: sống suốt phiên, nhận nhiều task qua TaskList |
| Wake / giao tiếp | Không wake lại được; không SendMessage qua lại | Lead `SendMessage` wake nhiều lần; teammate report ngược |
| TaskList | KHÔNG tham gia TaskList | TaskGet/TaskUpdate/TaskList — gate theo task |
| Use-case | Research gọn, tra cứu, 1 câu hỏi đóng (vd "tra docs Tauri IPC") | Workstream nhiều bước cần gate giữa chừng (vd xây MathLive block) |
| Lifecycle | Tự kết thúc sau khi trả | Cần shutdown_request + TeamDelete |

> Quy tắc nhanh: **cần gate nhiều bước / handoff nhiều vai → TeamCreate.** **1 câu hỏi đóng, không cần
> theo dõi tiến độ → Agent one-shot.** **Trivial → lead tự làm.** (Ví dụ cụ thể từng cột: playbook.)

---

## 6. Cách spawn (tóm tắt — chi tiết ở playbook)

```
1. TeamCreate(team_name="<slug-task>")
2. Với mỗi teammate cần:
     Agent(team_name="<slug>", name="<role>", subagent_type="<role>", run_in_background=true)
   - name = tên gọi ngắn ("researcher", "editor"…); subagent_type = file agent ("researcher", "editor-frontend"…)
   - spawn song song (cùng 1 response block) các teammate độc lập
3. CHỜ teammate TỰ gửi ack "sẵn sàng" — KHÔNG sleep mù. Sau ~45s im → resend 1 lần.
4. TaskCreate(title, description=<brief 4 phần self-contained>, owner="<role>")
5. SendMessage(to="<role>", message="Task #N — TaskGet(N) đọc brief rồi bắt đầu.")
6. Chờ report → gate bằng evidence → handoff kế / re-fix.
7. Xong tất cả: shutdown_request → chờ ack → TeamDelete.
```

Brief template 4 phần + per-role brief + layout terminal (in-process/tmux) + xử lý teammate im +
box giới hạn Agent Teams + plan-approval mode → **`.claude/teams/playbook.md`**.

---

## 7. Gate implementer (self-verify → evidence → lead gate)

Không có vai tester riêng. Vòng:

```
implementer làm xong → tự chạy skill build-verify (gate idiom note-ch) → nộp EVIDENCE trong SendMessage
   → LEAD gate bằng evidence đo được (KHÔNG accept "trông ổn")
```

**Gate idiom note-ch** (done-criteria phải đo được — chi tiết & cách đọc lỗi ở `build-verify/SKILL.md`):

- **Frontend:** `npm run build` exit 0; `tsc --noEmit` 0 error; vitest pass; block mount render đúng (console 0 error).
- **Tauri:** `cargo build` trong `src-tauri/` pass; app launch render được block.
- **Backend (FastAPI+SymPy):** `pytest` pass; `POST /eval` trả LaTeX **chính xác** (vd `\frac{d}{dx}x^2`→`2x`, `\int x\,dx`→`\frac{x^2}{2}`, không phải số gần đúng); có timeout + numeric fallback (§8.3).
- **Pipeline LaTeX→SymPy:** N fixture parse pass (đếm được); round-trip không lossy ở tập mẫu (§8.2 — điểm dễ vỡ).
- **Vòng lõi / đường găng:** "gõ 1 block → kết quả symbolic inline, live" — gate vàng cho mọi task chạm editor↔CAS.

Done-criteria cảm tính ("render đẹp", "hoạt động tốt") → **KHÔNG hợp lệ**, lead bật lại (issue `GATE`).

---

## 8. Trỏ tài liệu

| Tài liệu | Đường dẫn |
|---|---|
| Playbook thao tác (spawn template, brief 4 phần, layout, failure-mode, PASS-criteria per-vai, giới hạn Agent Teams, plan-approval) | `.claude/teams/playbook.md` |
| Roster agent body | `.claude/agents/*.md` |
| Issue queue (sự cố phối hợp team — `team-ops` sở hữu) | `.claude/teams/issues.md` |
| Skill build + verify (implementer gate) | `.claude/skills/build-verify/SKILL.md` |
| Skill memory (đọc/ghi store) | `.claude/skills/memory/SKILL.md` |
| Skill Figma design — dùng cho vai `design-figma` (workflow + planKey + Done-criteria gate design) | `.claude/skills/figma-design/SKILL.md` |
| Memory store note-ch team | `.claude/memory/` (context / mistakes / patterns / global) |
| Project brief (LOCKED + rủi ro + câu hỏi mở + workstream) | `CLAUDE.md` (§3–§6, §8, §11, §12, §13) |
| **Spec sản phẩm — yêu cầu nền [LOCKED]** (song ngữ en/vi · thiết bị desktop-class + 3 input · theme light/dark/system + **root màu/design tokens**). Mọi task chạm UI BẮT BUỘC bám. | `docs/requirements.md` |
| Spec sản phẩm — 2 đường nhập cốt lõi (gõ / viết tay) | `docs/feature.md` |
| Plan hạ tầng team (lịch sử thiết kế) | `plan/agent-team-setup/PLAN.md` + `CHECKPOINT.md` |
