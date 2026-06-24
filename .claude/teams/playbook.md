# playbook — orchestration thao tác (Nib)

> "Bộ não" thao tác của **lead** khi vận hành Nib như native Claude Code team (Agent Teams).
> Đọc cùng `.claude/master.md` (3 bất biến + roster 10 vai + vòng lặp TaskList loop + subagent-vs-teammate).
> File này = **HOW chi tiết**: khi nào lập team, recipe spawn, brief template, layout terminal,
> failure-mode + issue-queue, PASS-criteria per-vai, giới hạn Agent Teams, plan-approval mode.
>
> **Nguyên tắc xuyên suốt** (từ master §1): lead **điều phối** (không tự code task phức tạp) ·
> teammate giao tiếp **văn xuôi markdown** (KHÔNG JSON ceremony) · implementer nộp **evidence đo
> được** · lead **drive MỘT TaskList loop** (giao → chờ → gate → task kế). Domain = build APP
> "notepad toán học sống" (Tauri 2 + React/TS/Vite + TipTap/Lexical + MathLive + MyScript +
> FastAPI/SymPy). KHÔNG đụng `src/` `backend/` `src-tauri/` ở vai lead — đó là việc implementer.

---

## 1. Khi nào TeamCreate vs lead tự làm vs Agent one-shot

Lập team **không phải mặc định** — tốn token + tăng coordination overhead. Chọn đúng kênh theo bảng:

| Cột A — **TeamCreate** (chain nhiều vai, gate giữa bước) | Cột B — **lead tự làm** (trivial, không spawn) | Cột C — **Agent one-shot** (1 câu hỏi đóng, không theo dõi) |
|---|---|---|
| Xây **MathLive block** vào TipTap document model (editor §8.1, multi-file React/TS) → full chain | Sửa 1 chuỗi i18n / đổi label nút trong 1 file frontend (≤15 dòng) | Tra **docs Tauri 2 IPC** (`invoke` + sidecar config) — 1 lần, không follow-up |
| Dựng **pipeline LaTeX→SymPy** + timeout + numeric fallback (backend §8.2–8.3, nhiều fixture) → full chain | Đọc `CLAUDE.md` §8 trả lời "rủi ro lớn nhất là gì" | Tra **MathLive API**: lệnh xuất MathJSON từ `<math-field>` — câu hỏi đóng |
| Tích hợp **IPC frontend↔Python sidecar** + đóng gói Tauri desktop (glue §12, đường găng cross-stack) → full chain | Đổi `timeout` từ 5s→8s trong 1 hàm backend đã có (scope rõ, ≤3 file) | Tra **SymPy**: `integrate` có hỗ trợ hàm X không — tra cứu đóng |
| Thêm tính năng "toggle exact↔decimal" chạm cả editor + CAS (≥2 stack) → chain rút gọn (planner-light → implementer) | Trả lời "file nào giữ block model" / `grep` 1 symbol | Tra **latex2sympy2**: cú pháp `\frac{d}{dx}` parse ra gì — 1 shot |
| **Thiết kế visual multi-screen** (mockup HTML/CSS pixel-accurate, design system, component mới) → researcher → planner → design | Đọc mockup HTML đã có (`docs/design-artifacts/`) — không tạo mới | **Đọc artifact HTML** hiện có + grep class/token tham chiếu (1 shot, không follow-up) |
| **Test/QA E2E** — kiểm luồng toàn cục nhiều case từ góc nhìn user (sau feature testable / trước release / khi đụng vùng liên quan) → **tester** | Lead kiểm flow đã có (`tests/flows/`) — 1 shot | Tra flow file đã có (1 shot) |

> **Dấu hiệu BẮT BUỘC spawn team** (bất kỳ 1): deliverable > 3 file hoặc > 1 stack/domain · cần
> research context trước khi plan · cần thiết kế HOW (architect) trước khi code · cần self-verify
> chạy lệnh build/test thật. **KHÔNG spawn khi**: fix typo / rename local / 1 file < 15 dòng scope
> rõ · câu hỏi "X là gì" / đọc file · lead làm xong trong 1–2 tool call.
>
> **⚠️ PLAN-GATE (defect ISSUE-3/5, tái diễn ≥2 lần):** khi request = **xây cả phase/app/feature mới
> multi-session** → `planner` sinh **plan artifact** (long-plan `plan/<roadmap>/<slug>/`, +roadmap nếu đa
> phase) và artifact đó phải **gate PASS TRƯỚC** khi giao task cho `architect`/implementer. Lead spawn
> `planner` là bước **MẶC ĐỊNH** của full chain — KHÔNG nhảy thẳng researcher→architect hay
> architect→code khi chưa có plan gate được. (Bỏ planner chỉ khi "yêu cầu nhỏ rõ 1 stack"/"trivial".)
>
> **Quy tắc size:** spawn **tối thiểu cần thiết**. Full chain Nib tối đa 6 vai
> (researcher → planner → architect → design → editor-frontend → backend-cas; design song song architect khi cần visual mockup HTML/CSS). Over-staffing = anti-pattern
> Lead #2. **1 team tại 1 thời điểm** — TeamDelete team cũ trước khi TeamCreate mới (xem §9).
> **`tester` là vai E2E TÁCH BIỆT** build chain — KHÔNG tính vào 6 vai build; spawn riêng sau khi implementer báo done. Execute Chrome CHỈ foreground (ISSUE-8).

---

## 2. Recipe TeamCreate — 7 bước

```
1. TeamCreate(team_name="<slug-task>")            # vd "mathlive-block", "latex-sympy"

2. Spawn teammate cần dùng:
     Agent(team_name="<slug>", name="<role>", subagent_type="<role>", run_in_background=true)
   - name          = tên gọi ngắn trong SendMessage: "researcher" / "architect" / "editor" / "cas" ...
   - subagent_type = file agent trong .claude/agents/: "researcher" / "architect" / "editor-frontend" / "backend-cas" ...
   - Spawn SONG SONG (cùng 1 response block) các teammate độc lập; tuần tự nếu có dependency
     (vd architect cần plan của planner trước → spawn sau / giao task sau).
   - **Sau khi spawn N teammate → áp layout terminal (§8). Guard = KIỂM `$TMUX` RUNTIME, KHÔNG đọc
     `teammateMode` setting** (đính chính ISSUE-2: Claude Code auto-detect tmux đang chạy → teammate VẪN
     nhận pane riêng dù `.claude/settings.json` KHÔNG set `teammateMode`). Chạy `[ -n "$TMUX" ] && tmux list-panes`:
     → **`$TMUX` set (tmux đang chạy)**: PHẢI áp lệnh layout §8 tương ứng N — dùng block lệnh có `main-pane-width 60%` TRƯỚC `select-layout` (main-vertical N≤4, tiled N≥5) — KHÔNG được bỏ sót (defect ISSUE-2/6/11).
     → **`$TMUX` rỗng (không tmux)**: in-process, KHÔNG có pane → bỏ qua (no-op).
   - **Re-apply layout sau MỖI lần đổi N** (spawn MỚI hoặc shutdown/TeamDelete) — không chỉ sau spawn đầu. Dùng "Re-apply helper" ở §8: đếm N động, chọn layout phù hợp. Pane thoát → tmux tự dọn nhưng KHÔNG tự cân layout → lead phải chủ động (ISSUE-11).

3. CHỜ ACK — teammate TỰ gửi ack "sẵn sàng" cho lead sau khi đọc xong "Đọc đầu phiên".
   KHÔNG sleep mù, KHÔNG đoán mốc thời gian. Chỉ khi sau ~45s teammate vẫn IM → resend 1 lần
   SendMessage cụ thể ("<role>: bạn đã đọc xong master+playbook chưa? Ack rồi chờ task.").

4. TaskCreate(title="...", description="<brief 4 phần self-contained — xem §3>", owner="<role>")

5. SendMessage(to="<role>", message="Task #N — TaskGet(N) đọc brief rồi bắt đầu.")
   KHÔNG paste full brief vào message — brief nằm trong Task (teammate TaskGet tự đọc).

6. Chờ teammate SendMessage report → GATE bằng evidence (§5 + §7) → handoff task kế / re-fix.

7. Xong TẤT CẢ task (TaskList rỗng): SendMessage shutdown_request mỗi teammate → chờ ack → TeamDelete.
```

### Spawn prompt template — 4 dòng BẮT BUỘC khi wake teammate đầu tiên

Agent body đã có chi tiết protocol, nhưng message wake đầu nhắc lại để teammate vào đúng loop:

```
Bạn là <role> của team <slug>. Teammate khác đang online: <list role khác / "chưa có">.
Quy trình BẮT BUỘC:
1. Nhận "Task #N" qua SendMessage → TaskGet(N) đọc brief + TaskUpdate(in_progress) NGAY trong turn này.
2. Làm đúng scope brief. KHÔNG tự lấy task khác từ TaskList khi chưa được giao.
3. Xong → TaskUpdate(completed) RỒI SendMessage(to="team-lead", <paste TOÀN BỘ output theo Output format trong agent body>).
4. Chờ task kế hoặc shutdown_request. KHÔNG tự thoát, KHÔNG peer-DM teammate khác.
```

---

## 3. Brief template — 4 phần (trong `TaskCreate.description`)

Mọi brief **self-contained** (teammate KHÔNG kế thừa history — load context từ file/paste trong brief):

```
context:       <tóm tắt research/plan/thiết kế teammate cần; path tuyệt đối nếu dài, vd /home/gnuh/Documents/project/Nib/plan/...>
input:         <yêu cầu gốc user nguyên văn + output bước trước (paste) nếu là handoff chain>
scope:         <làm gì — KHÔNG làm gì (ranh giới file/stack rõ ràng)>
done_criteria: <danh sách CỤ THỂ, ĐO ĐƯỢC — file tồn tại / lệnh exit 0 / hành vi quan sát; xem §5 gate idiom>
output_format: <lead expect nhận gì — trỏ "Output format" trong agent body của vai đó>
```

> 📋 **Brief quality gate (lead tự check TRƯỚC spawn):** brief < 5 dòng **HOẶC** done_criteria cảm
> tính ("render đẹp", "chạy ổn") → **viết lại, KHÔNG spawn**. Brief mơ hồ = SCOPE-drift + GATE cảm
> tính được bảo đảm.

### Per-role brief (điền vào `description`)

- **researcher** — `input` + gợi ý nguồn cần đọc (CLAUDE.md §X, docs MathLive/TipTap/SymPy/Tauri). **STOP**: trả 4 mục (Đã biết / Rủi ro / Câu hỏi còn chặn / Nguồn); `câu-hỏi-còn-chặn` chỉ câu **thực sự chặn** (không "nice to know").
- **planner** — `input` + research output (paste) + verdict trước (nếu re-plan). **STOP**: Goal 1 câu đo được + mỗi done-criteria có cách kiểm khách quan + Steps là **WHAT không HOW** + markdown KHÔNG JSON.
- **architect** — plan WHAT (paste) + research. **STOP**: 5 mục A–E (breakdown / API contract / data flow / file structure / rủi ro) đủ để implementer **không phải đoán** + ≥1 cảnh báo rủi ro kỹ thuật cụ thể.
- **design** — `input`: brief planner + slug màn cần thiết kế + context app (docs/design.md / docs/sidebar-design.md nếu liên quan). **STOP**: `docs/design-artifacts/<slug>.html` tồn tại + link tokens.css + 0 hex rời + data-i18n key + min-width 1024px + link CSS component thật + i18n key list en/vi + motion-intent spec (nếu có animation); gate 8 DC (xem `.claude/skills/design/SKILL.md` §2); nộp Bash evidence.
- **editor-frontend** — plan + thiết kế architect (paste). **STOP**: file ghi đúng path + self-verify `npm run build` exit 0 + `tsc --noEmit` 0 error + ≥1 MathLive block render `x^2` (console 0 error); nộp evidence.
- **backend-cas** — plan + thiết kế (paste) + danh sách fixture cần pass. **STOP**: `pytest` pass + `POST /eval` trả LaTeX **chính xác** cho ≥3 fixture + timeout config có trong code; nộp evidence.
- **handwriting** — **TRƯỚC tiên** xác nhận §11.2 (license MyScript) đã chốt (xem §10 human gate). Sau đó: thiết kế bút→LaTeX. **STOP**: bút→LaTeX nhận diện ≥1 ký hiệu + `npm run build` exit 0; nộp evidence.
- **glue-packaging** — thiết kế IPC + tên sidecar. **STOP**: `cargo build` trong `src-tauri/` pass + app launch + ≥1 IPC call frontend→sidecar trả về (console 0 error); nộp evidence.
- **team-ops** — code+triệu chứng issue (từ `.claude/teams/issues.md`) + target sửa. **STOP**: diff file `.claude/` báo lead; thay đổi high-impact (`master.md`/`playbook.md`/`settings.json`) chờ user duyệt; KHÔNG đụng `src/`/`backend/`/`src-tauri/`.
- **tester** — feature slug + trigger (khi nào chạy) + tiền điều kiện (dev server :1420, login state...). **STOP pha plan**: `tests/flows/<slug>.flow.md` tồn tại + `status: ready` + đủ 6 nhóm case (N/A có lý do) + 3 req nền [LOCKED] (i18n/theme/thiết bị) + mỗi case có expected đo được + Catalog README.md cập nhật. **Execute (CHỈ foreground ISSUE-8)**: verdict PASS/FAIL per-case + evidence screenshot/GIF + console 0 error. Nếu background → nộp flow + click-through checklist cho user.

---

## 4. Lifecycle teammate + SendMessage protocol

### Vòng giao việc chuẩn

```
TaskUpdate(owner=<role>) + SendMessage wake ("Task #N — TaskGet(N) rồi bắt đầu")
  └── chờ teammate SendMessage report (output ĐẦY ĐỦ trong message, KHÔNG "xem task")
        ├── PASS gate → ghi memory → handoff kế / task kế
        └── FAIL gate → feedback diff-style + re-spawn cùng task (tối đa 2 lần, lần 3 escalate user)
```

### SendMessage protocol

- **Lead ↔ teammate**: path chính. Lead wake; teammate report về `team-lead`.
- **KHÔNG peer-DM**: teammate không tự DM teammate khác trừ khi lead chỉ định trong brief.
- **Format wake**: luôn include `Task #N` để teammate `TaskGet(N)` ngay. KHÔNG paste full brief vào message — brief nằm trong Task.

### Idle state là bình thường

Teammate idle sau mỗi turn = đang chờ tín hiệu kế, **KHÔNG phải bug**. Wake lại bằng SendMessage.

### Feedback khi FAIL (diff-style — KHÔNG mơ hồ)

```
FAIL — re-do với fix:
[FAIL] <criteria>
Hiện tại: <quote dòng/section output thực tế>
Expected: <kết quả mong muốn>
Action: <bullet cụ thể teammate cần làm>
```

KHÔNG feedback kiểu "làm tốt hơn" / "thiếu chi tiết" — point đến **output cụ thể + expected fix**.

### Stale-context — tránh

Khi re-spawn vòng mới (sau re-plan), **gửi lại brief đầy đủ** — teammate KHÔNG kế thừa history lượt trước. Mọi context cần thiết nằm trong brief.

---

## 5. Done-criteria implementer — gate idiom Nib

Done-criteria implementer = **"build pass + evidence đo được"**. Lead gate bằng output lệnh thật,
KHÔNG accept "trông ổn". (Chi tiết & cách đọc lỗi: `.claude/skills/build-verify/SKILL.md`.)

| Stack | Gate idiom (done-criteria đo được) |
|---|---|
| **Frontend (React/TS/Vite)** | `npm run build` exit 0 · `tsc --noEmit` 0 error · `npx vitest run` pass · block mount render đúng (console 0 error) |
| **Tauri** | `cargo build` trong `src-tauri/` pass · app launch render được block · IPC `invoke` trả về |
| **Backend (FastAPI+SymPy)** | `pytest` pass · `POST /eval` trả LaTeX **chính xác** (vd `\frac{d}{dx}x^2`→`2x`, `\int x\,dx`→`\frac{x^2}{2}` — KHÔNG số gần đúng) · timeout + numeric fallback có trong code (§8.3) |
| **Pipeline LaTeX→SymPy** | N fixture parse pass (đếm được) · round-trip không lossy ở tập mẫu (§8.2 — điểm dễ vỡ) |
| **Vòng lõi / đường găng** | **"gõ 1 block → kết quả symbolic inline, live"** — gate vàng cho mọi task chạm editor↔CAS |

> Done-criteria cảm tính ("render đẹp", "hoạt động tốt") → **KHÔNG hợp lệ**, lead bật lại
> (issue code `GATE`). Mọi gate phải có cách kiểm khách quan.

---

## 6. Khi teammate không phản hồi (failure modes) → issue-queue

Debug theo thứ tự — đây là gotcha thường gặp nhất:

1. **Check task status**: `TaskGet(N)`. `pending` → chưa pickup; `in_progress` → đang làm/kẹt; `completed` nhưng silent → quên SendMessage report.
2. **Resend với action steps cụ thể**: `SendMessage(to="<role>", message="Task #N — chạy: 1) TaskGet(N) 2) TaskUpdate in_progress 3) work 4) TaskUpdate completed + SendMessage report. Bắt đầu ngay.")`. Tránh message mơ hồ ("ổn không?", "tiến độ?").
3. **First-spawn delay**: teammate đọc "Đọc đầu phiên" (master+playbook+memory+skill) trước khi ack — nếu mới spawn <45s, đợi thêm rồi mới resend (gửi sớm → queue đè → silent).
4. **Verify-already-done**: brief kiểu "deliverable đã có sẵn" → teammate có thể silent vì không biết làm gì. Brief phải dặn "nếu verify pass từ trước → vẫn TaskUpdate completed + SendMessage 'verified done, no changes' kèm evidence". (Agent body đã có bullet này.)
5. **Escalate**: 2 lần resend không lay → `SendMessage({type: "shutdown_request"})` + re-spawn fresh, hoặc lead tự làm inline cho task ngắn (ghi `LEAD-DIY` vào queue).

### Khi lead phát hiện lỗi PHỐI HỢP team (teammate câm / làm sai scope / phán cảm tính / playbook lỗi)

Đây KHÁC bug code sản phẩm — là lỗi **bộ máy team**. Quy trình:

- **(a) Ghi issue-queue** `.claude/teams/issues.md`: code + triệu chứng (output/hành vi sai) + teammate + target sửa. Format & danh sách code: `.claude/skills/team-fix/SKILL.md` (`SILENT` / `SLOW-PICKUP` / `FORGOT-TASKUPDATE` / `SCOPE` / `STALE` / `FORM` / `GATE` / `NO-SHUTDOWN-RESP` / `OTHER`).
- **(b) Quyết định khi nào fix**: lỗi nhỏ không chặn task hiện tại → vá brief tại chỗ, để **cuối task** gọi `team-ops` fix bộ máy. Lỗi chặn / lặp lại → gọi `team-ops` **ngay** (`TeamDelete` team hiện tại trước nếu cần — 1 team tại 1 lúc).
- **`team-ops` sửa bộ máy team** (agent body / playbook / master / skill / settings.json / issues.md), **KHÔNG đụng code sản phẩm** (`src/`/`backend/`/`src-tauri/`). Thay đổi high-impact → lead trình **user duyệt** trước khi coi là done.

Mapping triệu chứng → code: không ack/báo xong = `SILENT`; cần resend = `SLOW-PICKUP`; quên TaskUpdate = `FORGOT-TASKUPDATE`; làm ngoài brief = `SCOPE`; context cũ = `STALE`; JSON thay vì prose = `FORM`; phán cảm tính = `GATE`.

---

## 7. Bảng PASS-criteria per-vai (lead gate mỗi handoff — đo được, không cảm tính)

| Vai | PASS khi |
|---|---|
| `researcher` | 4 mục đầy đủ (Đã biết / Rủi ro / Câu hỏi còn chặn / Nguồn); "Đã biết" nêu mục tiêu cụ thể; rủi ro có bằng chứng; câu-hỏi-còn-chặn chỉ câu **thực sự chặn** (không "nice to know") |
| `planner` | Goal 1 câu **đo được**; Steps là **WHAT không HOW**; mỗi done-criteria có cách kiểm khách quan; output là markdown **KHÔNG JSON** |
| `architect` | pipeline/component tree + API contract + file structure đủ để implementer **không phải đoán**; có **≥1 cảnh báo rủi ro kỹ thuật cụ thể** |
| `design` | `docs/design-artifacts/<slug>.html` tồn tại + link tokens.css + 0 hex rời + data-i18n ≥ số chuỗi + min-width 1024px + link CSS component thật (DC-7) + 0 class bịa (DC-8) + i18n key list en/vi kèm theo + motion-intent spec nếu có animation (`.claude/skills/design/SKILL.md` §2 8 DC PASS) |
| `editor-frontend` | `npm run build` exit 0 + `tsc --noEmit` 0 error + ≥1 MathLive block render `x^2` không lỗi console |
| `backend-cas` | `pytest` pass + `POST /eval` trả LaTeX **chính xác** cho ≥3 fixture + **timeout config có trong code** |
| `handwriting` | **chỉ PASS sau khi §11.2 (license) đã chốt**; sau đó: bút→LaTeX nhận diện ≥1 ký hiệu + `npm run build` exit 0 |
| `glue-packaging` | `cargo build` trong `src-tauri/` pass + app launch + ≥1 IPC call frontend→sidecar trả về (console 0 error) |
| `team-ops` | issue-queue được đọc; diff thay đổi báo lead; thay đổi high-impact (`master.md`/`playbook.md`/`settings.json`) **chờ user duyệt** trước khi coi là done; **KHÔNG sửa file ngoài `.claude/`** |
| `tester` | **Pha plan**: `tests/flows/<slug>.flow.md` tồn tại + `status: ready` + đủ 6 nhóm case (N/A có lý do cụ thể) + 3 req nền [LOCKED] + mỗi case có expected đo được + Catalog README.md cập nhật. **Pha execute (foreground)**: verdict PASS/FAIL per-case + evidence screenshot/GIF + console 0 error. **Nếu background**: nộp flow `ready` + click-through checklist đầy đủ cho user. |

FAIL bất kỳ → feedback diff-style (§4) + re-spawn. Tối đa 2 vòng, lần 3 → escalate user.

---

## 8. Terminal Layout — 2 display mode

> ↩ Gọi từ recipe §2 (sau bước spawn N teammate). Guard = **`$TMUX` runtime** (`[ -n "$TMUX" ]`), KHÔNG phải
> `teammateMode` setting: tmux đang chạy → teammate có pane riêng (Claude Code auto-detect) → PHẢI áp layout;
> `$TMUX` rỗng → in-process, không pane → bỏ qua. (Đính chính ISSUE-2: kết luận "settings không set teammateMode
> ⇒ luôn no-op" là SAI — pane xuất hiện theo tmux-có-chạy-hay-không.)

Agent Teams hiển thị teammate theo 2 mode tùy môi trường terminal:

### Mode `in-process` (mặc định Linux khi KHÔNG có tmux/iTerm2)

Teammate chạy trong **cùng process** với lead. Điều hướng:
- **Shift+Down** — cycle qua từng teammate xem output.
- **Ctrl+T** — toggle task list.

Config: `"teammateMode": "in-process"` trong **project** `.claude/settings.json` (Nib), hoặc flag `claude --teammate-mode in-process`.

> ⚠️ in-process teammate **KHÔNG resume** qua `/resume` hoặc `/rewind` — nếu session gián đoạn phải spawn lại từ đầu (xem §9).

### Mode `split-pane` (cần tmux hoặc iTerm2)

Mỗi teammate = 1 **pane riêng**, dễ quan sát song song. Config: `"teammateMode": "tmux"` hoặc `"auto"`.

> ⚠️ **KHÔNG hỗ trợ** trong VS Code terminal / Windows Terminal / Ghostty → tự fallback `in-process`.

### tmux pane layout cho N teammate (Nib realistic, N=2..5)

Sau `TeamCreate` + spawn N teammate, chạy lệnh tmux từ **pane lead (pane 1)** để sắp pane.
**Spawn order = pane index** (spawn theo thứ tự vai trong chain để pane `2..N+1` khớp vai; lead = pane `1` luôn).
Block 1 = setup mới; Block 2 = sau khi kill 1 pane (renumber + re-layout).

> **⚠️ ISSUE-11/18 (lặp ≥3 lần: ISSUE-2/6/11; zombie-pane ISSUE-18) — 4 quy tắc bắt buộc:**
> 1. **`main-pane-width 60%` TRƯỚC `select-layout`** — set ngay đầu mỗi block lệnh để lead pane luôn là main rộng (~60% màn), teammate xếp vào phần còn lại. Không set → tmux dùng 50% default → lead pane hẹp hơn teammate.
> 2. **Re-apply sau MỖI lần đổi N** — không chỉ sau spawn mà cả sau shutdown/TeamDelete. Khi teammate thoát, pane biến mất nhưng layout không tự cân → lead phải chủ động re-apply. Dùng Re-apply helper (gồm kill zombie TRƯỚC khi đếm N).
> 3. **Guard `$TMUX` luôn áp** (đã có ở §2) — nếu không có tmux → skip toàn bộ, no-op.
> 4. **Dọn zombie pane TRƯỚC khi đếm N** (ISSUE-18): pane cũ còn hiển thị dù process đã thoát (pane_dead=1) làm lệch N + chiếm không gian. Re-apply helper đã tích hợp bước kill-zombie; chạy nó thay vì chỉ `select-layout`. Giới hạn khuyến nghị: **≤4 teammate đồng thời** (N=5 tổng pane → main-vertical vừa đẹp). N≥6 tiled → chật; cân nhắc sequential thay parallel.

**N=2** — main + 2 pane dọc phải (vd planner-light → editor-frontend):
```
┌──────────────┬────────────┐
│              │ tm1 (p2)   │
│  main (p1)   ├────────────┤
│              │ tm2 (p3)   │
└──────────────┴────────────┘
```
```bash
tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical                                   # Block 1
tmux move-window -r -s 1:1 && tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical     # Block 2 (sau kill 1 pane)
```

**N=3** — main + 3 pane dọc phải (vd researcher → planner → architect):
```
┌──────────────┬────────────┐
│              │ tm1 (p2)   │
│  main (p1)   ├────────────┤
│              │ tm2 (p3)   │
│              ├────────────┤
│              │ tm3 (p4)   │
└──────────────┴────────────┘
```
```bash
tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical                                   # Block 1
tmux move-window -r -s 1:1 && tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical     # Block 2
```

**N=4** — main + 2×2 grid (vd researcher → planner → architect → editor-frontend):
```
┌──────────────┬──────────┬──────────┐
│              │ tm1 (p2) │ tm2 (p3) │
│  main (p1)   ├──────────┼──────────┤
│              │ tm3 (p4) │ tm4 (p5) │
└──────────────┴──────────┴──────────┘
```
```bash
# Block 1
tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical && tmux join-pane -h -s :.3 -t :.2 && tmux join-pane -h -s :.5 -t :.4
# Block 2
tmux move-window -r -s 1:1 && tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical && tmux join-pane -h -s :.3 -t :.2 && tmux join-pane -h -s :.5 -t :.4
```

**N=5** — full chain Nib (researcher → planner → architect → editor-frontend → backend-cas), main + 2+2+1:
```
┌──────────────┬──────────┬──────────┐
│              │ tm1 (p2) │ tm2 (p3) │
│  main (p1)   ├──────────┼──────────┤
│              │ tm3 (p4) │ tm4 (p5) │
│              ├──────────┴──────────┤
│              │      tm5 (p6)       │
└──────────────┴─────────────────────┘
```
```bash
# Block 1 — resize-pane cuối nâng chiều cao tm5 (mặc định bị lùn)
tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical && tmux join-pane -h -s :.3 -t :.2 && tmux join-pane -h -s :.5 -t :.4 && tmux resize-pane -t :.6 -y 18
# Block 2
tmux move-window -r -s 1:1 && tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical && tmux join-pane -h -s :.3 -t :.2 && tmux join-pane -h -s :.5 -t :.4 && tmux resize-pane -t :.6 -y 18
```

**Re-apply helper (dùng sau shutdown/TeamDelete — tích hợp kill zombie):**
```bash
# Bước 1 — Dọn zombie pane (pane_dead=1): process thoát nhưng pane còn → kill trước khi đếm N
[ -n "$TMUX" ] && tmux list-panes -F "#{pane_id} #{pane_dead}" | awk '$2==1{print $1}' | xargs -r -I{} tmux kill-pane -t {}
# Bước 2 — Re-apply layout: N≤5 pane → main-vertical (lead 60%); N≥6 → tiled (hiếm, tránh)
[ -n "$TMUX" ] && N=$(tmux list-panes | wc -l) && \
  { [ "$N" -le 5 ] && tmux set-window-option main-pane-width 60% && tmux select-layout main-vertical || tmux select-layout tiled; }
```

> Tested Ubuntu + tmux 3.x pattern. Nếu index lệch sau renumber → fallback `tmux select-layout tiled`.
> Zellij/Windows: adapt thủ công (hoặc dùng `in-process`).
>
> **N=6** (full chain với design): researcher → planner → architect → design → editor-frontend → backend-cas. Layout: fallback `tmux select-layout tiled` (6 pane khó chia đẹp hơn N=5 — tiled đảm bảo tất cả thấy được). Hoặc dùng in-process.

---

## 9. Giới hạn Agent Teams (lead đọc TRƯỚC spawn)

- **1 team tại 1 thời điểm** — `TeamDelete` team cũ TRƯỚC khi `TeamCreate` mới. Không chạy 2 team song song.
- **KHÔNG nested team** — teammate KHÔNG được spawn team con. Chỉ lead spawn teammate.
- **in-process teammate KHÔNG resume** qua `/resume` hoặc `/rewind` — session gián đoạn → spawn lại từ đầu.
- **Permissions teammate = kế thừa mode của lead** lúc spawn — không set permission riêng từng teammate (mode lấy từ `.claude/settings.json` `defaultMode: acceptEdits`).
- **Yêu cầu**: Claude Code **≥ v2.1.32** + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (đã set trong `.claude/settings.json`).
- **Browser/click-through smoke = gate do USER, KHÔNG phải teammate (ISSUE-8):** Chrome extension bind vào 1 foreground session → background teammate KHÔNG reach được extension (xác nhận ≥4 session xuyên nhiều phiên, kể cả lead context). Config gap (tools `mcp__claude-in-chrome__*` trong frontmatter + allow list `settings.json`) đã fix → tool khả dụng cho **lead foreground** tự smoke. NHƯNG ngay cả sau fix, background teammate vẫn không connect → implementer **KHÔNG block chờ browser smoke**; nộp build-verify evidence + **click-through checklist** cho user thay thế. Khác Figma MCP (API-based → teammate dùng bình thường). Template checklist: `build-verify/SKILL.md §5`. *(Playwright headless là hướng giải ISSUE-8 — xem ISSUE-19, chờ user duyệt.)*
- **Tester-execute ↔ code-fix không đồng thời (ISSUE-18)**: khi `tester` đang Pha 2 EXECUTE flow (lái Chrome/Playwright), `editor-frontend` và `backend-cas` KHÔNG nhận task sửa code — HMR reload / server restart làm hỏng test đang chạy. Lead **serializes**: chờ EXECUTE xong + verdict PASS/FAIL → mới giao task code-fix (hoặc ngược lại). Rule cũng được enforce trong agent body của 3 vai: tester / editor-frontend / backend-cas.

---

## 10. Plan-approval mode (cho task rủi ro cao)

Với task **đường găng / rủi ro cao** (§8.1 editor, §8.2–8.3 CAS), lead spawn teammate ở **plan-approval mode**:
teammate chạy **read-only**, soạn plan và **dừng chờ lead duyệt** trước khi implement.

- **Khuyến nghị dùng cho**: `editor-frontend` (nhúng MathLive vào TipTap block — đường găng §8.1) và `backend-cas` (pipeline LaTeX→SymPy lossy — điểm dễ vỡ §8.2) trên task đường găng.
- **Lead đặt tiêu chí duyệt trong brief**, vd: *"chỉ duyệt plan có test coverage cho ≥3 fixture"* hoặc *"phải có timeout + numeric fallback config trước khi implement"* hoặc *"plan phải nêu cách đồng bộ live MathLive↔SymPy không block UI"*.
- Lead duyệt (kèm feedback diff-style nếu từ chối — §4) → teammate mới implement. Từ chối ≥2 vòng → re-brief hoặc escalate user.

> ⚠️ **ISSUE-7 — Không dùng `mode:"plan"` cho session ghi nhiều file:** ExitPlanMode có thể không khôi phục `acceptEdits` → prompt storm mỗi Write/Edit (xác nhận nav-dock-redesign S1.1). **Khuyến nghị thay thế (workaround)**: spawn **default mode** (không `mode:"plan"`) + ghi rõ trong brief: *"STOP SAU KHI SOẠN PLAN — soạn component tree + file list + risk analysis, DỪNG tại 'Plan xong, chờ lead duyệt.' KHÔNG ghi bất kỳ file `src/` nào trước khi được ack."* Teammate dừng bằng instruction, không phải mode-level lock → không prompt storm. Áp `mode:"plan"` CHỈ khi session thuần read-only (researcher đọc code, architect soạn HOW) — KHÔNG cho session có Write/Edit. Chi tiết: `plan/maintenance/phase-c-workflow/findings-issue7.md`.

### Human gate §11.2 (license MyScript) — riêng `handwriting`

Vai `handwriting` có **human gate cứng**: TRƯỚC khi implement bất kỳ task nào, xác nhận user đã chốt
§11.2 (ngân sách license MyScript) + §11.1 (thiết bị: iPad Pro / Surface / Windows 2-in-1). Chưa chốt
→ teammate SendMessage lead hỏi lại, **KHÔNG tiến hành**. Đây KHÔNG phải plan-approval (gate kỹ thuật) —
mà là **gate con người về ngân sách/thiết bị**, nằm ngoài quyền quyết của team. Agent body `handwriting.md`
có section "Human gate §11.2" enforce điều này.

---

## 11. Anti-patterns

**Lead:**
1. **Chạy 1 lượt linear rồi quên** — đúng phải drive TaskList loop, gate sau mỗi handoff, lặp tới khi TaskList rỗng (master §3).
2. **Spawn thừa teammate** — bug fix nhỏ không cần full chain 5 vai. Áp rubric §1 trước spawn.
3. **Brief thiếu done-criteria đo được** — teammate không biết kiểm gì → phán cảm tính. Luôn ghi done_criteria khách quan (§3 + §5).
4. **Không chờ ack / không gate** — tiếp bước kế khi chưa có report → mất sync.
5. **Tự accept "trông ổn"** — luôn để implementer chạy gate idiom + nộp evidence (§5, §7).
6. **Lead-DIY vượt ngưỡng** — tự code/build task phức tạp thay vì spawn. Exception: trivial ≤3 file + ≤15 dòng + scope rõ (ghi `LEAD-DIY` queue).
7. **Spawn parallel khi có dependency** — architect không chạy khi planner chưa report (thiết kế sai version). Sequential khi output bước trước là input bước sau.
8. **Quên TeamDelete team cũ** trước khi TeamCreate mới — vi phạm "1 team tại 1 lúc" (§9).
9. **Lead tự soạn/soát plan artifact thay planner** (ISSUE-12) — viết ROADMAP/PLAN.md/CHECKPOINT.md là việc của `planner`; lead chỉ phân loại scope + gate. Lead tự soạn = bỏ chuyên môn + bỏ gate → lặp ISSUE-3/5/12. Mọi plan artifact phải qua `planner` soạn + lead gate TRƯỚC khi giao architect/implementer (PLAN-GATE §3).
10. **Lead tự dựng layout/mockup ép user chọn thay vì giao `design`** (ISSUE-10) — visual/layout/spacing/mockup là việc `design` dựng bản thật present; lead CHỈ hỏi user quyết WHAT (scope, container type). Lead hỏi "bố cục nào đẹp hơn?" bằng ASCII sketch = lấn vai design → user không chọn được vì không thấy bản thật. Giao `design`, xem memory [[lead-no-diy-design]].

**Teammate:**
11. **Silent-complete** — xong không SendMessage report → team treo (issue `SILENT`).
12. **Peer-DM teammate khác** — không qua lead trừ khi brief chỉ định (issue `SCOPE`).
13. **Làm ngoài scope brief** — tự lấy task khác từ TaskList / mở rộng phạm vi (issue `SCOPE`).
14. **Tự thoát không chờ shutdown_request** — mất kết quả cuối (issue `NO-SHUTDOWN-RESP`).
15. **Phán "có vẻ pass" / "render đẹp"** — gate phải từ exit-code/output thật (issue `GATE`).
16. **Trao đổi plan-as-data JSON giữa teammate** — giao tiếp prose markdown (issue `FORM`). (File code `src/`/`backend/` là artifact — KHÁC, hợp lệ.)
17. **Quên TaskUpdate(in_progress/completed)** — lead không track được trạng thái (issue `FORGOT-TASKUPDATE`).
18. **implementer đụng vùng vai khác** — `editor-frontend` sửa `backend/`, `team-ops` sửa `src/`... SAI vai. Mỗi vai giữ ranh giới file của mình (master §2).

---

## Tham chiếu nhanh

- Agent Teams cần `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (đã set `.claude/settings.json`) + Claude Code v2.1.32+.
- 3 bất biến + roster 10 vai + vòng lặp TaskList loop + subagent-vs-teammate: `.claude/master.md`.
- Spec sản phẩm — yêu cầu nền [LOCKED] (song ngữ en/vi · thiết bị desktop-class + 3 input · theme light/dark/system + root màu/tokens): `docs/requirements.md`. Đường nhập cốt lõi: `docs/feature.md`. Mọi task chạm UI bám 2 file này.
- Agent body (self-contained, lead không cần repeat protocol): `.claude/agents/*.md`.
- Skill gate implementer: `.claude/skills/build-verify/SKILL.md` · memory: `.claude/skills/memory/SKILL.md` · team-fix: `.claude/skills/team-fix/SKILL.md`.
- **4 nhóm MCP tool (gitnexus / gsap / figma / chrome)** → checklist 2 chiều `team-fix/SKILL.md §7`: **§7.A create-time** (gắn tool khi tạo/sửa agent/skill mới, tránh lặp ISSUE-8/9) + **§7.B use-time** (với tay tới đúng skill/tool khi làm việc: đọc/sửa code→gitnexus impact, animation→gsap, Figma→figma MCP, browser verify→chrome foreground-only). Nguồn sự thật duy nhất = team-fix §7.
- Issue-queue (sự cố phối hợp — `team-ops` sở hữu): `.claude/teams/issues.md`.
- Tool: `TeamCreate` / `TeamDelete` / `Agent` / `SendMessage` / `TaskCreate` / `TaskUpdate` / `TaskGet` / `TaskList` / `TaskOutput` / `TaskStop`.
```
