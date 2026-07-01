# master — orchestration doc (Nib)

> Điểm vào "bộ não" của **lead** khi vận hành Nib như một **native Claude Code team** (Agent Teams).
> Đọc file này + `.claude/teams/playbook.md` (chi tiết thao tác) **TRƯỚC** khi spawn bất kỳ team nào.
>
> **Nib build APP "notepad toán học sống"** (Tauri 2 + React/TS/Vite + TipTap/Lexical + MathLive +
> MyScript + FastAPI/SymPy). Đường găng = **editor** (gõ/bút → 1 block → kết quả symbolic inline, live).
> Xem `CLAUDE.md` §3–§6 **[LOCKED]** (không bàn ngược), §8 rủi ro (định ưu tiên), §11 câu hỏi mở
> (đừng tự chốt), §12 workstream.

---

## 1. Ba nguyên tắc bất biến

1. **Lead điều phối, KHÔNG tự code/build task phức tạp.** Lead chỉ tự xử **trivial**: ≤3 file, scope
   rõ ràng, ≤15 dòng thay đổi, hoặc thuần đọc/hỏi/tra file. Mọi thứ vượt ngưỡng → giao teammate.
   Vi phạm điển hình = "lead-DIY" (lead tự ngồi viết editor/CAS thay vì spawn) → cấm.
   **Mở rộng lead-DIY — 2 loại hay tái diễn (ISSUE-10/12):**
   - **Soạn/soát plan artifact** (ROADMAP / PLAN.md / CHECKPOINT.md) = việc `planner`. Lead CHỈ phân loại scope + gate kết quả. Lead tự viết plan → bỏ chuyên môn planner, bỏ qua gate → lỗi cấu trúc, lặp ISSUE-3/5/12.
   - **Dựng layout / visual / mockup** = việc `design` (agent code-native). Lead CHỈ hỏi user quyết WHAT (container kiểu gì, scope tính năng) — KHÔNG hỏi "bố cục nào đẹp hơn" bằng ASCII mockup tự vẽ ép user chọn phương án trừu tượng. Giao `design` dựng bản thật present (ISSUE-10, [[lead-no-diy-design]]).
2. **Teammate giao tiếp bằng văn xuôi markdown** — KHÔNG JSON ceremony, KHÔNG trao đổi plan-as-data
   giữa các vai. Artifact code (file `src/`, `backend/`, `src-tauri/`) là output; thông điệp giữa
   lead↔teammate là prose. Implementer nộp **evidence đo được** (output lệnh build/test), không phải
   mô tả cảm tính.
   **Peer-DM CÓ CẤU TRÚC (whitelist hẹp)** — teammate ĐƯỢC phép SendMessage trực tiếp cho nhau CHỈ để
   consult/clarify (không handoff deliverable, không thay path lead↔teammate làm kênh chính). Danh
   sách cặp vai + rule chi tiết: `.claude/teams/playbook.md §4`. Tóm tắt bất biến: (a) lead vẫn sở hữu
   TaskList + gate cuối; (b) câu trả lời peer quan trọng phải được tóm tắt lại trong report gửi lead
   (visibility); (c) chỉ hỏi-đáp ngắn, tranh luận thiết kế → escalate lead; (d) deliverable luôn về lead
   để gate, không peer-handoff; (e) ngoài whitelist = SAI (issue `SCOPE`).
3. **Lead drive MỘT TaskList loop** — giao task → chờ report → gate bằng evidence → task kế — lặp tới
   khi TaskList rỗng. KHÔNG chạy researcher→…→implementer một lượt linear rồi quên gate giữa chừng.

---

## 2. Roster 10 vai (`.claude/agents/*.md`)

| Vai | File | Vai trò | Tools | Output |
|---|---|---|---|---|
| `planner` (**TÁI DÙNG**) | `planner.md` | WHAT — phân loại scope + sinh plan artifact (roadmap/long/short). KHÔNG implement. | Read, Write, Edit, Grep, Glob | plan markdown (inline / `plan/<slug>/`) |
| `researcher` | `researcher.md` | Gom context repo (CLAUDE.md + plan/ + src/) + WebSearch docs kỹ thuật (MathLive/TipTap/SymPy/Tauri) + đọc memory → tóm tắt. | Read, Grep, Glob, WebSearch, TaskGet, TaskUpdate, TaskList, SendMessage | prose 4 mục (Đã biết / Rủi ro / Câu hỏi còn chặn / Nguồn) |
| `architect` | `architect.md` | HOW — component tree, API contract, data flow, file structure đủ để implementer không phải đoán. (planner=WHAT, architect=HOW.) | Read, Grep, Glob, TaskGet, TaskUpdate, TaskList, SendMessage | prose 5 mục (A breakdown / B API contract / C data flow / D file structure / E rủi ro) |
| `design` | `design.md` | Thiết kế visual code-native (mockup HTML/CSS pixel-accurate) → xuất `docs/design-artifacts/<slug>.html` link tokens.css + class Nib, kèm i18n key list en/vi + motion-intent spec cho editor-frontend. KHÔNG ghi src/; KHÔNG dùng Figma; KHÔNG quyết WHAT/scope; bám 3 req nền [LOCKED]. | Read, Write, Edit, Glob, Grep, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | `docs/design-artifacts/<slug>.html` + i18n key list en/vi + motion-intent spec |
| `editor-frontend` | `editor-frontend.md` | Agent A §12 — đường găng §8.1: Tauri scaffold + React/TS/Vite + TipTap/Lexical block + MathLive block. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (`npm run build` 0 / `tsc --noEmit` 0 / block render `x²`) |
| `backend-cas` | `backend-cas.md` | Agent B §12 — §8.2–8.3: FastAPI + SymPy + pipeline LaTeX→SymPy + timeout + numeric fallback. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (`pytest` pass / `POST /eval` trả LaTeX chính xác ≥3 fixture) |
| `handwriting` | `handwriting.md` | Agent C §12: MyScript iink, bút→LaTeX, palm rejection, gesture. **Human gate §11.2 (license) bắt buộc trước khi implement.** | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (bút→LaTeX ≥1 ký hiệu / `npm run build` 0) — chỉ sau §11.2 chốt |
| `glue-packaging` | `glue-packaging.md` | Agent D §12: IPC frontend↔sidecar + Tauri packaging + build desktop + offline fallback. | Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage | file + evidence (`cargo build` trong `src-tauri/` pass / app launch / ≥1 IPC call console 0 error) |
| `team-ops` | `team-ops.md` | FIX sự cố phối hợp team (agent body thiếu tool, playbook sai, scope chồng) theo issue-queue `.claude/teams/issues.md`. | Read, Grep, Glob, Edit, Write, TaskGet, TaskUpdate, TaskList, SendMessage | diff file `.claude/` + báo lead |
| `tester` | `tester.md` | E2E browser tester: lên kế hoạch flow test (`tests/flows/<slug>.flow.md` bằng skill `test-planning`) + thực thi Chrome foreground (skill `browser-test`) + thu evidence. **Pha plan chạy background; execute Chrome CHỈ foreground (ISSUE-8).** KHÔNG sửa code sản phẩm. | Read, Write, Edit, Grep, Glob, Bash + 12 chrome MCP tool + TaskGet, TaskUpdate, TaskList, SendMessage | `tests/flows/<slug>.flow.md` (status `ready/executed`) + evidence screenshot/GIF + verdict PASS/FAIL đo được |

> **⚠️ Ranh giới cứng `team-ops`:** chỉ sửa trong `.claude/` (`agents/*.md`, `teams/playbook.md`,
> `master.md`, `skills/*`, `settings.json`, `teams/issues.md`). **TUYỆT ĐỐI KHÔNG đụng `src/`,
> `backend/`, `src-tauri/`** — đó là việc của implementer. Thay đổi high-impact (`master.md` /
> `playbook.md` / `settings.json`) → lead trình **user duyệt** trước khi coi là done.

> **Lưu ý tool (bài học chung):** mỗi agent body PHẢI có `TaskGet/TaskUpdate/TaskList/SendMessage`
> trong `tools:`. Nếu chỉ liệt tool domain (Read/Bash/Write…) thì teammate KHÔNG report/TaskUpdate
> được → câm (issue code `SILENT`).

> **4 nhóm MCP tool (gitnexus / gsap / figma / chrome) — checklist 2 chiều** ở
> `.claude/skills/team-fix/SKILL.md §7` (**nguồn sự thật duy nhất**; note này chỉ trỏ tới):
> - **§7.A Create-time** — khi LEAD tạo/sửa agent body hoặc skill MỚI: chạy checklist gắn đúng tool
>   vào `tools:` frontmatter TRƯỚC khi commit (hoặc giao `team-ops`). Tránh lặp ISSUE-8 (chrome) /
>   ISSUE-9 (gitnexus) — "spawn xong mới phát hiện tool thiếu".
> - **§7.B Use-time** — khi đang LÀM VIỆC: với tay tới đúng skill/tool theo trigger (đọc/sửa code →
>   gitnexus, **impact trước khi sửa symbol**; animation → gsap; thiết kế Figma → figma MCP; verify
>   UI browser → chrome, lead-foreground-only). Có tool mà quên dùng cũng vô nghĩa.

> **Hai lớp kiểm chứng — KHÔNG thay nhau:**
> 1. **Implementer self-verify (build-verify):** mỗi implementer (editor-frontend / backend-cas / handwriting / glue-packaging) **tự chạy gate** `build-verify` (build/test/typecheck) rồi nộp evidence. Đây là gate kỹ thuật bắt buộc — không thể bỏ.
> 2. **`tester` E2E browser:** vai BỔ SUNG, lái Chrome thực thi flow toàn cục từ góc nhìn user (nhiều case / luồng / 3 req nền [LOCKED]). **Pha plan chạy background OK; execute Chrome CHỈ foreground** (ISSUE-8). Tester KHÔNG thay build-verify — cả hai cùng tồn tại.
> Khi nào spawn `tester`: xem §4 rubric + hướng dẫn lead §7.

Mỗi agent body có sẵn section **"Trong TeamCreate mode"** (ack + `TaskGet` + `TaskUpdate in_progress`
**cùng turn**; xong = `TaskUpdate completed` rồi `SendMessage` paste-full-output; shutdown_request =
ack). Lead KHÔNG cần lặp lại protocol đó trong brief.

---

## 3. Vòng lặp điều phối (lead-driven TaskList loop)

> **Trước khi spawn**: dùng skill `.claude/skills/orchestration-routing/SKILL.md` để vẽ nhanh dispatch
> map (request → chain vai → gate → khi nào tester). Skill này KHÔNG thay `planner` (WHAT) — chỉ giúp
> lead điều phối đúng thứ tự/vai/gate.

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
        │    → design (song song architect, khi task cần visual design mockup HTML/CSS)
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
| Chỉ thiết kế UI/visual — multi-screen, design system, mockup HTML/CSS | researcher → planner → **design** | bỏ implementer; design xuất `docs/design-artifacts/*.html` + i18n key list + motion-intent spec |
| Chỉ thiết kế (chưa build, không cần Figma) | researcher → planner → architect | bỏ implementer |
| Yêu cầu nhỏ rõ, 1 stack | planner (light) → implementer | bỏ researcher/architect |
| FIX sự cố phối hợp team (teammate câm / sai scope / playbook lỗi) | team-ops | đọc `.claude/teams/issues.md`; KHÔNG đụng code sản phẩm |
| **Test/QA E2E** — kiểm luồng toàn cục nhiều case từ góc nhìn user (sau feature đạt trạng thái testable, trước release, khi đụng vùng liên quan) | tester | plan flow (background OK) → execute Chrome foreground (ISSUE-8: nếu teammate background → nộp click-through checklist cho user) |
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

## 7. Gate implementer + tester E2E

**Implementer self-verify (build-verify) — bắt buộc, không thay được.** Vòng:

```
implementer làm xong → tự chạy skill build-verify (gate idiom Nib) → nộp EVIDENCE trong SendMessage
   → LEAD gate bằng evidence đo được (KHÔNG accept "trông ổn")
```

**Gate idiom Nib** (done-criteria phải đo được — chi tiết & cách đọc lỗi ở `build-verify/SKILL.md`):

- **Frontend:** `npm run build` exit 0; `tsc --noEmit` 0 error; vitest pass; block mount render đúng (console 0 error).
- **Tauri:** `cargo build` trong `src-tauri/` pass; app launch render được block.
- **Backend (FastAPI+SymPy):** `pytest` pass; `POST /eval` trả LaTeX **chính xác** (vd `\frac{d}{dx}x^2`→`2x`, `\int x\,dx`→`\frac{x^2}{2}`, không phải số gần đúng); có timeout + numeric fallback (§8.3).
- **Pipeline LaTeX→SymPy:** N fixture parse pass (đếm được); round-trip không lossy ở tập mẫu (§8.2 — điểm dễ vỡ).
- **Vòng lõi / đường găng:** "gõ 1 block → kết quả symbolic inline, live" — gate vàng cho mọi task chạm editor↔CAS.

Done-criteria cảm tính ("render đẹp", "hoạt động tốt") → **KHÔNG hợp lệ**, lead bật lại (issue `GATE`).

**Tester E2E (bổ sung, không thay build-verify) — hướng dẫn lead:**

Spawn `tester` khi: (a) feature đạt trạng thái testable (implementer báo done + evidence pass); (b) cần kiểm luồng toàn cục nhiều case từ góc nhìn user; (c) trước release; (d) khi đụng vùng có rủi ro regression.

> **⚠️ Checklist DONE bắt buộc trước khi kết thúc LOOP (chống quên tester)**: dùng
> `.claude/skills/orchestration-routing/SKILL.md §3` — dòng nhớ: *"Feature đạt testable → đã spawn
> tester chưa? Chưa → chưa được kết thúc LOOP."* Kết thúc LOOP mà chưa cân nhắc tester (hoặc N/A không
> ghi lý do) = anti-pattern lead mới (`playbook.md §11` #20).

Luồng spawn:
1. Lead giao task tester với **changeset block** trong brief (BẮT BUỘC khi test sau implementer task): (a) file/symbol đã sửa, (b) hành vi đã đổi 1–2 câu, (c) acceptance criterion nguyên văn user. Tester bám changeset → scope case đúng vùng, không phủ tràn toàn tính năng. (ISSUE-21)
2. `tester` **plan flow** (background OK) → soạn `tests/flows/<slug>.flow.md` (status `ready`).
3. Lead gate flow: đủ 6 nhóm case scope-driven (3 req nền chỉ khi changeset CHẠM) + hành vi "bất kỳ" đã phân hoạch `test-planning/SKILL.md §3b` + trigger đo được.
4. `tester` **execute** → Playwright headless (primary, background-safe) hoặc Chrome MCP (secondary, foreground-only, ISSUE-8).
5. Evidence: verdict per-case + acceptance nguyên văn được chứng minh bởi case #N, #M.

**Khi user/lead nghi ngờ verdict PASS của tester (ISSUE-24) — KHÔNG tự lái browser:**
1. ĐỌC `tests/flows/<slug>.flow.md` — danh sách case đã liệt. Tìm lỗ hổng coverage.
2. ĐỌC `tests/evidence/<slug>/` — đã chụp gì, ở vị trí nào.
3. Giao tester **MỞ RỘNG case** theo lỗ hổng tìm thấy.
4. Lead KHÔNG tự lái browser test khi flow + evidence đã tồn tại — lead-DIY browser = vừa lãng phí vừa bỏ qua artifact.

---

## 8. Trỏ tài liệu

| Tài liệu | Đường dẫn |
|---|---|
| Playbook thao tác (spawn template, brief 4 phần, layout, failure-mode, PASS-criteria per-vai, giới hạn Agent Teams, plan-approval) | `.claude/teams/playbook.md` |
| Roster agent body | `.claude/agents/*.md` |
| Issue queue (sự cố phối hợp team — `team-ops` sở hữu) | `.claude/teams/issues.md` |
| Skill build + verify (implementer gate) | `.claude/skills/build-verify/SKILL.md` |
| Skill dispatch/điều phối cho lead (dispatch map + checklist DONE + tester reminder) | `.claude/skills/orchestration-routing/SKILL.md` |
| Skill memory (đọc/ghi store) | `.claude/skills/memory/SKILL.md` |
| Skill design code-native — dùng cho vai `design` (workflow 5 bước + done-criteria gate + motion-intent spec) | `.claude/skills/design/SKILL.md` |
| Memory store Nib team | `.claude/memory/` (context / mistakes / patterns / global) |
| Project brief (LOCKED + rủi ro + câu hỏi mở + workstream) | `CLAUDE.md` (§3–§6, §8, §11, §12, §13) |
| **Spec sản phẩm — yêu cầu nền [LOCKED]** (song ngữ en/vi · thiết bị desktop-class + 3 input · theme light/dark/system + **root màu/design tokens**). Mọi task chạm UI BẮT BUỘC bám. | `docs/requirements.md` |
| Spec sản phẩm — 2 đường nhập cốt lõi (gõ / viết tay) | `docs/feature.md` |
| Plan hạ tầng team (lịch sử thiết kế) | `plan/_archived/agent-team-setup/PLAN.md` + `CHECKPOINT.md` (archived 2026-06-20) |
