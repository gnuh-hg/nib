# Issue-queue — sự cố phối hợp team Nib

> File do `team-ops` sở hữu. Lead append issue khi phát hiện lỗi phối hợp (teammate câm, sai scope, phán cảm tính...).
> `team-ops` đọc → fix bộ máy team (`.claude/` only) → đổi status `open` → `fixed`. KHÔNG đụng `src/` `backend/` `src-tauri/`.
> Format block append-only. Code lỗi + playbook sửa: xem `.claude/skills/team-fix/SKILL.md`.

---

## ISSUE-0 — OTHER — fixed

- **time**: 2026-06-11 12:30
- **teammate**: — (bootstrap)
- **symptom**: no issues yet — entry mẫu minh họa format, không phải sự cố thật.
- **target**: —
- **note**: File khởi tạo trong Session 4.1. Issue thật bắt đầu từ ISSUE-1.

## ISSUE-1 — FORGOT-TASKUPDATE / SILENT — fixed

- **time**: 2026-06-12
- **teammate**: `planner` (chạy dưới tên `synth-planner`, 2 team liên tiếp: feature-clarify + editor-features)
- **symptom**: Viết xong deliverable (docs/feature.md) NHƯNG không `TaskUpdate(completed)` và không `SendMessage` report về lead. Lặp ≥2 lần: team feature-clarify (task #5) và team editor-features (task #5) — cả hai lần lead phải tự `Read` doc để gate, task vẫn `pending`/không-report sau khi file đã sửa xong. Lần editor-features còn idle nhiều lượt im lặng sau khi lead giao + nhắc.
- **target**: `.claude/agents/planner.md` — ĐÃ SỬA (team-ops, 2026-06-12):
  1. **Root cause #1**: `tools:` frontmatter THIẾU `TaskGet, TaskUpdate, TaskList, SendMessage` → planner *không thể* report dù muốn (planner là agent "tái dùng", predates team setup). Đã thêm 4 tool.
  2. **Root cause #2**: planner KHÔNG có section "Trong TeamCreate mode" (mọi teammate khác đều có). Đã thêm: ack-on-spawn + TaskGet+TaskUpdate cùng turn + done=`TaskUpdate(completed)`+`SendMessage` cùng turn (kể cả deliverable là file) + checklist "đã ghi file ≠ đã xong" + shutdown handler.
  3. Thêm 1 row Anti-pattern: "ghi xong file rồi im → done = TaskUpdate+SendMessage".
- **note**: Ngưỡng §3 đã đạt (lặp ≥2 lần) → sửa gốc agent body hợp lệ. KHÔNG high-impact (chỉ 1 agent body, không đụng master/playbook/settings) → báo lead diff là đủ, không cần user duyệt. Gate nhẹ: frontmatter còn hợp lệ (name/model/tools). Gợi ý: re-spawn smoke 1 `planner` teammate (ack được + TaskUpdate đúng + report sau khi ghi file) để xác nhận frontmatter không hỏng.

## ISSUE-2 — OTHER — fixed

- **time**: 2026-06-12
- **teammate**: `team-lead` (team `design-plan` — spawn 4 teammate: rs-layout / rs-interaction / rs-visual + synth-planner)
- **symptom**: Lead spawn 4 teammate (3 researcher song song cho R1/R2 + 1 synth-planner) nhưng **KHÔNG áp tmux pane layout** theo playbook §8 (vd `tmux select-layout main-vertical` cho N=3, hoặc 2×2 grid cho N=4). Hệ quả: các pane teammate không được sắp xếp để quan sát song song — vi phạm quy trình terminal layout. Recipe spawn 7 bước ở playbook §2 KHÔNG có bước nào nhắc lead chạy lệnh layout §8 sau khi spawn → lead dễ bỏ sót (đã bỏ sót thật trong team này).
- **target**: `.claude/teams/playbook.md` — ĐÃ SỬA (team-ops, 2026-06-12): thêm bullet "Sau khi spawn N teammate → áp layout terminal (§8)" vào recipe §2 (guard điều kiện: tmux/split-pane → chạy layout §8; in-process → bỏ qua, no-op) + cross-link 2 chiều §2↔§8 (note ↩ ở đầu §8).
- **note**: **RESOLVED — KHÔNG re-fix.** Xác minh mode thực tế: `.claude/settings.json` **KHÔNG set `teammateMode`** → mặc định Linux không tmux = `in-process` → **không có pane để sắp** → §8 layout là **no-op, KHÔNG phải lỗi bỏ-sót của lead** trong env hiện tại. Triệu chứng "lead bỏ sót" là false-positive ở in-process. Defect thật & duy nhất = recipe §2 thiếu cross-link có-điều-kiện tới §8 (chỉ ảnh hưởng nếu sau này đổi sang tmux) → đã vá tối thiểu + guard điều kiện. HIGH-IMPACT (đụng playbook.md) → đã áp theo yêu cầu trực tiếp của user (lệnh "fix các vấn đề"); diff báo lead. Nếu env vẫn in-process, thay đổi này là vô hại (chỉ thêm guard "bỏ qua").

## ISSUE-3 — OTHER (lead bỏ qua bước plan) — fixed

- **time**: 2026-06-13
- **teammate**: `team-lead` (team `nib-mock-ui` — build bản mock-data UI)
- **symptom**: User giao "spam agent + tiến hành làm app (mock data)". Lead spawn `architect` + `editor` rồi **giao thẳng Task #1 (architect HOW design)** — **BỎ QUA kỷ luật workflow `roadmap → long-plan → thực hiện`**. Không sinh `plan/ROADMAP.md` + long-plan TRƯỚC khi vào chain thiết kế/implement. User phải nhắc giữa chừng ("workflow: roadmap → long-plan → thực hiện"). Lead sau đó mới spawn `planner` (Task #2) chèn bước plan vào trước execution. Vi phạm: vào chain HOW/implement khi chưa có plan artifact gate được.
- **target**: `.claude/` — đề xuất cho `team-ops` cân nhắc (CHƯA sửa): hiện `master.md §3` vòng lặp có chain `researcher → planner → architect → implementer` nhưng KHÔNG nêu BẮT BUỘC `roadmap → long-plan` đứng trước cho task "xây tính năng/phase mới multi-session". `playbook.md §1` rubric "Dấu hiệu BẮT BUỘC spawn team" cũng không có guard "task = cả phase/workstream → planner sinh roadmap+long-plan TRƯỚC khi architect/implementer chạy". Đề xuất thêm 1 dòng guard ở master §3 hoặc §4 rubric + playbook §1: *khi request = xây cả phase/app mới (không phải fix nhỏ) → plan artifact (roadmap nếu multi-phase + long-plan cho phase hiện tại) PHẢI tồn tại & gate PASS trước khi giao task cho architect/implementer.*
- **note**: Lead đã tự khắc phục trong-phiên (spawn planner Task #2, chặn editor execute tới khi plan+HOW PASS). Đây là lỗi PROCESS lặp-có-nguy-cơ (dễ tái diễn vì rubric không cứng hoá bước plan) → để `team-ops` quyết có cứng hoá vào master/playbook không. HIGH-IMPACT (đụng master.md/playbook.md) → cần **user duyệt** trước khi team-ops áp. Ngưỡng: mới 1 lần, nhưng user chủ động yêu cầu ghi → log để theo dõi tái diễn.
- **FIX (team-ops, 2026-06-17)**: Đã tái diễn (ISSUE-5) → ngưỡng §3 đạt → cứng hoá gốc. **ĐÃ SỬA** 2 file: (1) `master.md` — thêm block "⚠️ PLAN-GATE BẮT BUỘC" trong §3 (plan artifact phải tồn tại & PASS trước khi giao architect/implementer; spawn planner = mặc định full chain) + đánh dấu "planner (BẮT BUỘC, plan-gate)" trong rubric §4 row "xây tính năng mới". (2) `playbook.md §1` — thêm block "⚠️ PLAN-GATE" dưới "Dấu hiệu BẮT BUỘC spawn team" cùng nội dung. **HIGH-IMPACT** (master+playbook): áp theo lệnh trực tiếp "fix các vấn đề" của user (precedent ISSUE-2); nếu user không đồng ý → revert 2 block này.

## ISSUE-4 — OTHER (cấu trúc thư mục plan/ sai convention) — fixed (phần .claude/ skill; phần artifact migration chờ planner+user)

- **time**: 2026-06-13
- **teammate**: `planner` (team `nib-mock-ui`, Task #2) — nhưng root cause = convention trong skill `roadmap` + `plan-long` (không phải lỗi cá nhân planner; planner làm theo skill hiện hành).
- **symptom**: Cấu trúc `plan/` hiện tại đặt `ROADMAP.md` **phẳng ở gốc** `plan/` và các long-plan (`plan/nib-mock-ui/`, `plan/agent-team-setup/`) là **sibling** của ROADMAP.md. User chỉ ra đây là SAI: roadmap phải là 1 thư mục riêng, ROADMAP.md nằm TRONG nó, và mỗi long-plan là thư mục CON nested dưới roadmap đó.
  - **Hiện tại (sai)**:
    ```
    plan/
      ROADMAP.md
      nib-mock-ui/{PLAN.md, CHECKPOINT.md}
      agent-team-setup/{PLAN.md, CHECKPOINT.md}
      README.md
    ```
  - **Đúng (user chốt)**:
    ```
    plan/
      <tên-roadmap>/
        ROADMAP.md
        <tên-long-plan-1>/{PLAN.md, CHECKPOINT.md}
        <tên-long-plan-2>/{PLAN.md, CHECKPOINT.md}
        ...
    ```
    → Roadmap = thư mục cha; ROADMAP.md sống trong đó; long-plan = thư mục con group dưới roadmap cha. Cho phép nhiều roadmap song song (mỗi roadmap 1 thư mục).
- **target**: 2 phần:
  1. **`.claude/` (team-ops, HIGH-IMPACT cần user duyệt)**: sửa convention đường dẫn trong `.claude/skills/roadmap/SKILL.md` (ROADMAP.md → `plan/<roadmap>/ROADMAP.md`) + `.claude/skills/plan-long/SKILL.md` (long-plan → `plan/<roadmap>/<slug>/PLAN.md`+`CHECKPOINT.md`, nested dưới roadmap cha thay vì `plan/<slug>/`) + cross-check `.claude/agents/planner.md` nếu có hardcode path. Cân nhắc cập nhật `plan/README.md` mô tả layout.
  2. **plan/ artifact (planner, không phải team-ops — đây là artifact không nằm `.claude/`)**: di chuyển ROADMAP.md + 2 long-plan hiện có vào layout nested đúng, cập nhật reference path trong các file + README index.
- **note**: Đây là lỗi CONVENTION (skill định nghĩa sai layout) → tái diễn mỗi lần planner chạy nếu không sửa skill. Lead CHƯA tự di chuyển file (chờ quyết: tên thư mục roadmap là gì — vd `plan/nib/ROADMAP.md` hay `plan/main/`). Đề xuất: hỏi user tên roadmap container rồi giao planner restructure + team-ops sửa skill. KHÔNG chặn editor Session 1.1 đang chạy (editor đọc PLAN.md qua path tuyệt đối; nếu di chuyển phải cập nhật path trong các task brief còn lại).
- **FIX (team-ops, 2026-06-17)** — **phần 1 (.claude/ skill) ĐÃ SỬA** (không high-impact → diff báo lead đủ): (a) `.claude/skills/roadmap/SKILL.md` — đổi convention `plan/ROADMAP.md` (phẳng) → `plan/<roadmap>/ROADMAP.md` (nested); thêm block layout user-chốt + sửa description, Output section, bảng tiến độ ví dụ, rule 5, Liên quan. (b) `.claude/skills/plan-long/SKILL.md` — đổi `plan/<slug>/` → `plan/<roadmap>/<slug>/` (nested dưới roadmap); thêm block layout + sửa description, Output, rule 6/7, anti-pattern. **Phần 2 (di chuyển artifact `plan/` thật + chọn tên thư mục roadmap) NGOÀI vai team-ops** (artifact không nằm `.claude/`) → việc của `planner` + cần user chốt tên roadmap container. Để `open` ở phần này.

## ISSUE-5 — OTHER (lead bỏ qua bước plan — TÁI DIỄN của ISSUE-3) — fixed (gom cùng ISSUE-3)

- **time**: 2026-06-17
- **teammate**: `team-lead` (team `nib-editor-rebuild` — re-code editor khớp `/home/gnuh/Downloads/Nib Editor.dc.html`)
- **symptom**: User giao "spam agent + code lại file design". Lead spawn `researcher` + `architect` + `editor` rồi giao thẳng Task #1 cho researcher, **BỎ QUA bước `planner`/plan artifact** trong chain — định đi researcher → architect → implementer mà KHÔNG có planner sinh long-plan (PLAN.md + CHECKPOINT.md) cho build nhiều session (sidebar rail + library overlay + header + canvas rework). User phải nhắc ("khoan bạn có thiếu quy trình lên plan không đấy"). Lead sau đó spawn `planner` chèn vào chain trước architect. **Đây là TÁI DIỄN ISSUE-3** (đã log 2026-06-13, status open) — chứng minh defect process chưa được cứng hoá → lặp lần 2.
- **target**: `.claude/` — NÂNG ưu tiên ISSUE-3: vì đã lặp ≥2 lần (ngưỡng §3 team-fix đạt), đề xuất `team-ops` cứng hoá guard vào `master.md §3/§4` + `playbook.md §1`: *request = xây cả phase/app/feature mới multi-session (không phải fix nhỏ) → plan artifact (long-plan, +roadmap nếu multi-phase) PHẢI tồn tại & gate PASS TRƯỚC khi giao task cho architect/implementer; lead spawn planner là bước MẶC ĐỊNH của full chain, không phải tùy chọn.* HIGH-IMPACT (master/playbook) → cần **user duyệt**.
- **note**: Lead tự khắc phục trong-phiên (spawn planner, chặn architect/editor tới khi plan PASS). Ngưỡng tái diễn ĐẠT → nên fix gốc thay vì chỉ log. Gom xử cùng ISSUE-3.
- **FIX (team-ops, 2026-06-17)**: Cùng root cause ISSUE-3 → đã cứng hoá PLAN-GATE vào `master.md` (§3 + rubric §4) + `playbook.md §1`. Xem chi tiết diff ở FIX của ISSUE-3. HIGH-IMPACT, áp theo lệnh trực tiếp user.

## ISSUE-6 — OTHER (layout §8 bỏ sót — tmux THẬT active, đính chính ISSUE-2) — fixed

- **time**: 2026-06-17
- **teammate**: `team-lead` (team `nib-editor-rebuild` — spawn 4 teammate: researcher / architect / editor + planner)
- **symptom**: Lead spawn 4 teammate nhưng KHÔNG áp tmux pane layout §8 sau spawn (lặp lại đúng triệu chứng ISSUE-2). User chỉ ra: "bị lỗi sai layout khi spam 4 agent". Lead kiểm tra env → **`TMUX` env var ACTIVE + `tmux list-panes` cho 5 pane** (1 lead + 4 teammate đã có pane thật) → môi trường ĐANG ở split-pane, KHÔNG phải in-process.
- **target**: `.claude/teams/playbook.md` + `master.md` — đính chính kết luận sai của ISSUE-2:
  1. **ISSUE-2 note SAI**: kết luận "settings.json không set teammateMode → in-process → §8 là no-op" là **false-positive**. Thực tế Claude Code auto-detect tmux đang chạy → teammate VẪN nhận pane riêng dù `teammateMode` không set. → §8 layout KHÔNG phải no-op; lead PHẢI áp khi `$TMUX` set.
  2. Recipe §2 bước 2 hiện guard điều kiện theo `teammateMode` setting; cần đổi guard sang **kiểm tra `$TMUX` env var runtime** (`[ -n "$TMUX" ]`) thay vì chỉ đọc settings.json — vì pane xuất hiện theo tmux-có-chạy-hay-không, không theo setting.
- **note**: Lead đã **tự áp layout ngay trong phiên** sau khi user nhắc: `tmux select-layout main-vertical && tmux join-pane -h -s :.3 -t :.2 && tmux join-pane -h -s :.5 -t :.4` (N=4, main + 2×2 grid) → xác nhận 5 pane sắp đúng + `select-pane -t :.1` trả focus lead. Defect process = recipe §2 không nhắc lead detect `$TMUX` runtime. HIGH-IMPACT (playbook/master) → cần **user duyệt** trước khi team-ops sửa guard. Đây là defect THẬT (khác ISSUE-2 tưởng no-op) → ưu tiên fix guard.
- **FIX (team-ops, 2026-06-17)**: **ĐÃ SỬA** `playbook.md` 2 chỗ: (1) recipe §2 bước 2 — đổi guard từ "đọc `teammateMode` setting" → **kiểm `$TMUX` runtime** (`[ -n "$TMUX" ] && tmux list-panes`): `$TMUX` set → PHẢI áp layout §8; rỗng → no-op. (2) §8 note đầu — đính chính kết luận sai ISSUE-2 ("settings không set teammateMode ⇒ luôn no-op" là SAI vì Claude Code auto-detect tmux). Defect tmux-thật-active giờ buộc lead áp layout. HIGH-IMPACT (playbook): áp theo lệnh trực tiếp user. **Đính chính ISSUE-2 note** (đã đánh dấu false-positive trong FIX này; KHÔNG sửa text ISSUE-2 cũ — giữ lịch sử, đính chính tại ISSUE-6).

## ISSUE-7 — OTHER (teammate liên tục xin quyền ghi file) — open

- **time**: 2026-06-18
- **teammate**: `editor-frontend` (team `nib-dock-redesign`, Session 1.1)
- **symptom**: User báo: "không biết tại sao agent editor-frontend lại liên tục yêu cầu cấp quyền ghi file". editor-frontend khi implement (Write/Edit `src/components/...`) liên tục bật permission prompt xin quyền ghi, thay vì auto-accept như kỳ vọng (playbook §9: "Permissions teammate = kế thừa mode lead lúc spawn — mode lấy từ `.claude/settings.json` `defaultMode: acceptEdits`").
- **target**: `.claude/` — `team-ops` điều tra. **Giả thuyết root cause (lead):** lead spawn teammate này với **`mode: "plan"`** (plan-approval mode cho session rủi ro cao — xoá ModeToggle). Plan mode = read-only. Nghi vấn: sau khi teammate `ExitPlanMode`, permission mode KHÔNG tự về `acceptEdits` (không kế thừa `defaultMode`) → mỗi Write/Edit bật prompt. Tức **plan-approval spawn + ExitPlanMode có thể không khôi phục acceptEdits** cho teammate. Cần verify:
  1. `.claude/settings.json` `defaultMode` hiện là gì (kỳ vọng `acceptEdits`)?
  2. Khi spawn `Agent(mode:"plan")` rồi teammate ExitPlanMode → permission mode thực tế của teammate là gì (plan/default/acceptEdits)?
  3. Playbook §10 (plan-approval mode) + §9 (permission inherit) có mâu thuẫn không: §10 khuyến nghị dùng plan-approval cho editor-frontend/backend-cas trên đường găng, NHƯNG nếu plan-mode spawn làm mất acceptEdits sau exit → mọi session plan-approval đều bị prompt-storm. Nếu đúng → cần ghi chú cách xử (vd: lead re-grant mode sau approve, hoặc teammate tự set, hoặc tránh spawn mode:"plan" mà dùng cơ chế approval khác).
- **note**: KHÔNG chặn cứng — user vẫn cấp quyền được để editor-frontend tiếp tục, chỉ phiền (nhiều prompt). Lead KHÔNG tự sửa `settings.json` (permission/high-impact — chờ user duyệt qua team-ops). Đây là defect process/cấu hình (tương tác plan-approval × permission-inherit), không phải lỗi hành vi teammate. Ngưỡng: mới 1 lần nhưng user chủ động yêu cầu ghi → log theo dõi; nếu tái diễn mỗi session plan-approval → nâng ưu tiên fix gốc. HIGH-IMPACT nếu fix đụng `settings.json`/`playbook §9–§10` → cần **user duyệt**.

## ISSUE-9 — OTHER (agent body thiếu mcp__gitnexus__* tool sau khi repo được index) — fixed

- **time**: 2026-06-19
- **teammate**: mọi vai (researcher / architect / editor-frontend / backend-cas / glue-packaging / handwriting)
- **symptom**: Repo Nib đã được index vào GitNexus (127 files / 1226 nodes / 1893 edges / 45 flows, tên "Nib"), nhưng **KHÔNG agent body nào** có `mcp__gitnexus__*` trong `tools:` frontmatter → teammate spawn ra không gọi được tool GitNexus dù root `CLAUDE.md` đã có section "GitNexus — Code Intelligence" dặn dùng. Bài học từ ISSUE-8: frontmatter thiếu tool = tool bị chặn tại spawn, không phải runtime.
- **target**: **ĐÃ SỬA 6 file** (team-ops, 2026-06-19):
  1. `.claude/agents/researcher.md` — tools: thêm `mcp__gitnexus__query`, `mcp__gitnexus__context`, `mcp__gitnexus__list_repos`, `mcp__gitnexus__route_map`. Pointer prose: bước 2 "Gom context repo" thêm hướng dẫn dùng GitNexus tra flow/symbol thay Grep khi code đã index; repo name "Nib"; trỏ CLAUDE.md section GitNexus.
  2. `.claude/agents/architect.md` — tools: thêm `mcp__gitnexus__context`, `mcp__gitnexus__route_map`, `mcp__gitnexus__impact`, `mcp__gitnexus__query`. Pointer prose: bước 3 "Khảo sát code hiện có" thêm dùng GitNexus hiểu structure/flow + impact trước khi thiết kế thay đổi lớn.
  3. `.claude/agents/editor-frontend.md` — tools: thêm `mcp__gitnexus__impact`, `mcp__gitnexus__api_impact`, `mcp__gitnexus__context`, `mcp__gitnexus__detect_changes`, `mcp__gitnexus__rename`. Thêm section "GitNexus — Blast-radius check": 4 bước (impact → warn HIGH/CRIT → rename → detect_changes trước done).
  4. `.claude/agents/backend-cas.md` — tools: thêm 5 tool giống editor-frontend. Thêm section "GitNexus — Blast-radius check" tương tự.
  5. `.claude/agents/glue-packaging.md` — tools: thêm 5 tool giống editor-frontend. Thêm section "GitNexus — Blast-radius check".
  6. `.claude/agents/handwriting.md` — tools: thêm 5 tool giống editor-frontend. Thêm section "GitNexus — Blast-radius check".
- **note**: Không high-impact (chỉ sửa agent body, không đụng master/playbook/settings.json) → báo lead diff là đủ. Gợi ý: re-spawn smoke 1 researcher teammate (ack + `mcp__gitnexus__list_repos` không lỗi) để xác nhận frontmatter hợp lệ.

## ISSUE-8 — OTHER (teammate spawn ra không dùng được browser/--chrome) — fixed

- **time**: 2026-06-18
- **teammate**: mọi implementer (đặc biệt `editor-frontend`) — triệu chứng lặp xuyên nhiều session (xem `context.md` L149/156/193/215).
- **symptom**: User báo "các agent spam ra không dùng được `--chrome`". Teammate spawn ra KHÔNG thể chạy browser smoke (click-through `npm run dev :1420`: vòng lõi gõ block→Tính→result inline, dock, B/I/U/S...). Mọi vòng lõi UI đều phải đẩy về cho user tự smoke → "CÒN TREO — chỉ USER smoke được" tái diễn ở mọi session editor.
- **target**: `.claude/` — `team-ops` điều tra + fix bộ máy. **Diagnosis (lead, đã verify):**
  1. **Config gap #1 — agent body THIẾU tool:** KHÔNG agent body nào (`editor-frontend.md`, `glue-packaging.md`...) có `mcp__claude-in-chrome__*` trong `tools:` frontmatter. → teammate spawn ra *literally không có* browser tool để gọi (kể cả khi extension connect được). Verified: `editor-frontend.md` tools = `[Read, Write, Edit, Bash, TaskGet, TaskUpdate, TaskList, SendMessage]`.
  2. **Config gap #2 — settings.json THIẾU allow:** `.claude/settings.json permissions.allow` không có entry `mcp__claude-in-chrome__*` (chỉ có Figma MCP). → kể cả có tool cũng bị prompt/chặn.
  3. **Architectural blocker (nghi là gốc thật, KHÔNG fix bằng config):** `context.md` ghi lặp "Chrome extension KHÔNG connect ở MỌI context agent" (kể cả lead). Background teammate chạy process riêng; Chrome extension bind vào 1 session foreground → teammate không reach được. Nếu đúng → thêm tool + allow chỉ làm mất lỗi "tool unavailable" NHƯNG browser vẫn fail ở tầng connect.
- **note**: Cần team-ops quyết: (a) thêm `mcp__claude-in-chrome__*` vào tools frontmatter của implementer + allow list settings.json (làm tool khả dụng), VÀ (b) verify xem background teammate có connect được Chrome extension không — nếu KHÔNG, ghi rõ vào playbook (mục giới hạn §9 hoặc build-verify skill) rằng **browser/click-through smoke là gate do USER chạy, KHÔNG phải teammate** → để gate idiom implementer không kẹt chờ điều bất khả thi. HIGH-IMPACT (đụng `settings.json` + nhiều agent body + playbook) → **chờ user duyệt** trước khi áp.
- **FIX (team-ops, 2026-06-18)** — **HOÀN TẤT (user đã duyệt + lead áp high-impact):**
  - **Verify 3 root cause:** (1) ✅ CONFIRMED — `editor-frontend.md` L5 + `glue-packaging.md` L5 tools thiếu browser tools. (2) ✅ CONFIRMED — `settings.json` allow chỉ có Figma MCP. (3) ✅ CONFIRMED ARCHITECTURAL BLOCKER — `context.md` L149/L156/L164/L193/L215 đều nhất quán "Chrome extension không connect ở mọi context agent kể cả lead" (≥4 session: dock-v2 / tauri-shell / nib-editor-rebuild / nav-dock-redesign). Kết luận: config-fix (thêm tool + allow) KHÔNG ĐỦ làm browser hoạt động cho background teammate; connect block là architectural — cần ghi giới hạn + đổi gate idiom.
  - **Phần LOW-IMPACT (ĐÃ ÁP):** (a) `.claude/agents/editor-frontend.md` + `.claude/agents/glue-packaging.md` — thêm 6 tool `mcp__claude-in-chrome__*` vào `tools:` frontmatter (tabs_context_mcp / tabs_create_mcp / navigate / computer / read_page / read_console_messages). Lý do: làm tool khả dụng khi lead (foreground) muốn browser-smoke thủ công. (b) `.claude/skills/build-verify/SKILL.md` — thêm §5 "Browser/click-through smoke = USER gate, KHÔNG phải teammate" với bằng chứng + quy tắc + template click-through checklist (renumber cũ §5→§6).
  - **Phần HIGH-IMPACT (lead áp sau khi user duyệt, 2026-06-18):** (c) `settings.json` — thêm 6 entry `mcp__claude-in-chrome__*` vào `permissions.allow` (JSON validated PASS). (d) `playbook.md §9` — thêm bullet "Browser/click-through smoke = gate do USER, KHÔNG phải teammate" (giới hạn extension + trỏ build-verify §5).
  - **Kết luận gốc:** architectural blocker — background teammate KHÔNG connect được Chrome extension (foreground-only bind); config-fix (tool + allow) cần thiết nhưng không đủ giải quyết connect. Giải pháp đúng: browser smoke chuyển thành **user-gate**; implementer nộp build-verify evidence + click-through checklist, lead paste cho user smoke.
