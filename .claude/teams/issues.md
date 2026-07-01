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

## ISSUE-7 — OTHER (teammate liên tục xin quyền ghi file) — fixed

- **time**: 2026-06-18
- **teammate**: `editor-frontend` (team `nib-dock-redesign`, Session 1.1)
- **symptom**: User báo: "không biết tại sao agent editor-frontend lại liên tục yêu cầu cấp quyền ghi file". editor-frontend khi implement (Write/Edit `src/components/...`) liên tục bật permission prompt xin quyền ghi, thay vì auto-accept như kỳ vọng (playbook §9: "Permissions teammate = kế thừa mode lead lúc spawn — mode lấy từ `.claude/settings.json` `defaultMode: acceptEdits`").
- **target**: **FIX (team-ops, 2026-06-20, user duyệt)** — (1) `plan/maintenance/phase-c-workflow/findings-issue7.md`: phân tích cơ chế ExitPlanMode, kết luận workaround "không spawn mode:plan cho session ghi nhiều, dùng brief-level instruction thay thế". (2) `.claude/teams/playbook.md §10`: thêm cảnh báo + workaround instruction "spawn default mode + brief-level STOP instruction thay mode:plan". settings.json KHÔNG thay đổi (chưa verify runtime root cause).
- **note**: Workaround hiệu quả (lead đã dùng S1.2/S1.3). User duyệt 2026-06-20.

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

## ISSUE-10 — OTHER (lead tự làm thiết kế layout thay vì giao design) — fixed

- **time**: 2026-06-19
- **teammate**: `team-lead` (team `settings-redesign` — thiết kế lại phần Cài đặt)
- **symptom**: Khi gặp câu hỏi bố cục Settings, lead **tự dựng các phương án layout (ASCII mockup trong AskUserQuestion preview)** rồi bắt user chọn phương án trừu tượng (2 cột sidebar vs 1 cột scroll vs full-page...). User bác cả 2 vòng options và chỉ ra: *"việc làm layout cần để design hoặc kỹ sư làm. nếu cần ý kiến từ tôi maybe sẽ gửi vài bản cho tôi tại sao bạn lại làm"*. Tức lead lấn vai `design` — visual/layout là việc design dựng bản THẬT rồi present, không phải lead vẽ phác ép user quyết.
- **target**: **FIX (team-ops, 2026-06-20, user duyệt)** — `.claude/master.md §1`: thêm rule lead-no-DIY-design (gom với ISSUE-12). `.claude/teams/playbook.md §11`: thêm anti-pattern #10 "Lead tự dựng layout/mockup ép user chọn thay vì giao `design`". Cross-link [[lead-no-diy-design]]. (Đã đổi "design-figma" → "design" vì agent đã retire 2026-06-20.)
- **note**: User duyệt 2026-06-20.

## ISSUE-11 — OTHER (tmux pane layout loạn — TÁI DIỄN RẤT THƯỜNG XUYÊN, nối tiếp ISSUE-2/6) — fixed

- **time**: 2026-06-19
- **teammate**: `team-lead` (team `settings-redesign`)
- **symptom**: User báo "sai layout của team rồi" (kèm screenshot) — **lặp NHIỀU LẦN** (user nhấn "vấn đề này gặp rất thường xuyên"; đã có tiền lệ ISSUE-2, ISSUE-6). Hai defect cụ thể quan sát phiên này:
  1. **`select-layout main-vertical` mặc định để pane LEAD hẹp hơn pane teammate** (lead 80 cột vs teammate 157 cột) → lead pane (nơi user đọc/tương tác chính) bị bóp nhỏ, teammate chiếm phần rộng → nhìn lệch/khó dùng. Nguyên nhân: `main-pane-width` không được set trước khi `select-layout` → tmux dùng default (nửa màn) làm main hẹp.
  2. **Layout KHÔNG được re-apply sau khi teammate SHUTDOWN** (không chỉ sau spawn). Recipe playbook §2/§8 chỉ áp layout sau bước SPAWN; khi lead shutdown teammate giữa phase (vd researcher+design-figma xong Phase 1), số pane sống đổi → layout cũ thành stale/lệch cho tới khi lead tình cờ re-layout. Pane chết tmux tự dọn (đã verify: list-panes chỉ còn pane sống), nhưng layout không tự cân lại.
- **target**: **FIX (team-ops, 2026-06-20, user duyệt)** — `.claude/teams/playbook.md §8`: (1) thêm `tmux set-window-option main-pane-width 60%` TRƯỚC `select-layout` trong mọi block lệnh N=2..5; (2) thêm "Re-apply helper" với N-dynamic guard (`N=$(tmux list-panes | wc -l)`) + rule re-apply sau shutdown. `.claude/teams/playbook.md §2` recipe bước 2: thêm dòng re-apply sau shutdown/TeamDelete.
- **note**: Defect PROCESS lặp ≥3 lần (ISSUE-2/6/11) → đã cứng-hoá gốc. User duyệt 2026-06-20.

## ISSUE-12 — OTHER (lead tự soạn plan + bỏ planner-gate, lại sai cấu trúc per-phase long-plan — TÁI DIỄN ISSUE-3/5) — fixed

- **time**: 2026-06-19
- **teammate**: `team-lead` (team `design-agent-library` — thay design-figma bằng agent `design` code-native + thư viện `.claude/design-library/`)
- **symptom**: User giao task phức tạp ("làm agent design + build hệ thống thư viện, cần lên plan roadmap"). Lead **tự tay viết `plan/design-agent-library/ROADMAP.md`** (lead-DIY phần plan) RỒI **spawn thẳng `team-ops` + giao Task #1 (Phase 1 build catalog)** — tức bắt đầu EXECUTION khi CHƯA có plan artifact do `planner` soạn & gate. User phải nhắc 2 lần: (1) "? sao không spam agent" (lead trình roadmap chờ duyệt thay vì spawn), rồi (2) "spam cả plan - chuyên môn hơn để soạn plan hoặc soát lại không làm kiểu vậy" = đừng để lead tự soạn plan; phải dùng `planner` chuyên môn. **Defect kép:** (a) lead lấn vai planner (tự viết plan) — TÁI DIỄN tinh thần ISSUE-3/5 (lead bỏ planner-gate) dù PLAN-GATE đã cứng-hoá vào master §3/§4 + playbook §1; (b) lead còn giao planner SAI cấu trúc — brief Task #2 bảo gộp **1 PLAN.md cho cả 4 phase**, trong khi convention (skill `roadmap` + `plan-long`, user nhắc) = **mỗi phase roadmap → 1 long-plan riêng nested** `plan/<roadmap>/<phase-slug>/{PLAN.md,CHECKPOINT.md}`.
- **target**: **FIX (team-ops, 2026-06-20, user duyệt)** — `.claude/master.md §1`: thêm rule lead-no-DIY-plan (soạn/soát plan = việc planner) + lead-no-DIY-design (gom với ISSUE-10). `.claude/teams/playbook.md §11`: thêm anti-pattern #9 "Lead tự soạn/soát plan thay planner".
- **note**: Lead tự khắc phục trong-phiên: spawn `planner` để soạn plan đúng chuẩn. User duyệt 2026-06-20.

## ISSUE-13 — GATE (gate grep-only bỏ sót fidelity/visual — artifact design-library lệch app thật) — fixed

- **time**: 2026-06-20
- **teammate**: `team-ops` (build) + `team-lead` (gate) — team `design-agent-library`, Phase 1 Session 1.3 (snippets).
- **symptom**: User báo "cả 3 file trong snippets đều không ổn — lý do hỏng: khác biệt với bản hiện tại". Điều tra (lead, đã verify bằng grep + đọc file): 3 snippet `.claude/design-library/snippets/*.html` được team-ops viết **gần đúng bằng tay** thay vì trích từ component THẬT trong `src/`: (1) chỉ `<link>` `tokens.css`, **KHÔNG link CSS component thật** (`library-overlay.css`/`dock.css`/`canvas.css`) → tự viết lại CSS xấp xỉ trong `<style>` inline → render LỆCH app; (2) `overlay-panel.html` dùng **class bịa** `.nib-demo-overlay/__panel/__header…` (KHÔNG tồn tại trong src); (3) `dock-nav-level.html` dùng `.nib-dock__nav-btn/__avatar/__level/__account` trong khi class thật là `.nib-dock__btn/__back…` → lệch tên. Hệ quả: snippet (và artifact dựng từ nó ở Phase 4) KHÔNG khớp giao diện app hiện tại — phá mục đích cốt lõi "thư viện bám sát app".
- **root cause kép**: (a) **Gate Phase 1 grep-only** (link tokens.css + hex=0 + min-width) — KHÔNG có tiêu chí fidelity (class phải tồn tại thật trong src + link CSS component thật) và KHÔNG có visual check → snippet xấp xỉ vẫn pass. (b) **Lead gate cũng chỉ grep**, không mở browser/không đối chiếu app thật trước khi PASS Session 1.3. (Browser automation file:// bị chặn — ép `https://`; visual = USER smoke như ISSUE-8.)
- **target**: **ĐÃ SỬA 5 file** (team-ops, Task #6, 2026-06-20):
  1. `.claude/design-library/snippets/overlay-panel.html` — REWRITE hoàn toàn: (a) link `tokens.css` + `library-overlay.css` (CSS component thật); (b) XÓA toàn bộ `.nib-demo-overlay/.nib-demo__*` (fake); (c) dùng DOM THẬT từ LibraryOverlay.tsx + LibraryToolbar.tsx + DocCard.tsx: `.nib-library-overlay[data-open]` → `.nib-library__scrim` + `.nib-library__panel` → header (`.nib-library__back/.nib-library__heading/.nib-library__new`) + toolbar (`.nib-lib-toolbar/.nib-lib-search/.nib-lib-viewtoggle/.nib-lib-sortbtn`) + body grid (`.nib-library__grid` + 4× `.nib-lib-card` với `.nib-lib-card__preview/.nib-lib-card__footer/.nib-lib-card__ctx`); (d) `data-theme="dark"` (app default); inline `<style>` chỉ còn demo setup.
  2. `.claude/design-library/snippets/dock-nav-level.html` — REWRITE: (a) link `tokens.css` + `dock.css`; (b) XÓA toàn bộ CSS inline component; (c) dùng DOM THẬT từ NavLevel.tsx + UnifiedDock.tsx: `.nib-dock__drag` (KHÔNG `.nib-dock__drag-handle`), `.nib-dock__nav` wrapper, 5× `class="nib-dock__btn nib-dock__navbtn"` (Library/Settings/Type/Write/Help), XÓA account chip (`.nib-dock__account/.nib-dock__avatar` — đã bỏ 2026-06-18), `.nib-dock__collapse` + `.nib-dock__collapsed`; (d) demo override position:fixed→absolute có chú thích rõ.
  3. `.claude/design-library/snippets/ruled-paper-canvas.html` — REWRITE: (a) link `tokens.css` + `app-shell.css` + `canvas.css` + `blocks.css`; (b) XÓA toàn bộ CSS inline component; (c) fix `.nib-strip__logo-dot` (fake) → `.nib-strip__logo` (thật, app-shell.css L112); (d) fix `.nib-approx` (fake) → `.nib-result__value[data-kind='approx']` (thật, blocks.css L73); (e) fix kết quả dùng DOM thật: `.nib-result > .nib-result__input + .nib-result__eq + .nib-result__value[data-kind]` (từ ResultView.tsx).
  4. `.claude/design-library/components.md` §1 UnifiedDock — sửa: (a) "5 nút nav + account chip" → "5 nút nav (account chip bỏ 2026-06-18)"; (b) `nib-dock__drag-handle` → `nib-dock__drag`; (c) cách tái dùng dùng class đúng `nib-dock__btn nib-dock__navbtn` thay `.nib-dock__nav-btn`.
  5. `.claude/design-library/INDEX.md` §"Quy ước copy snippet" — thêm quy tắc: "PHẢI link CSS component thật (không chỉ tokens.css); KHÔNG tự viết lại CSS component inline — đó là nguồn gốc ISSUE-13"; thêm fidelity gate checklist (nib-demo=rỗng + src/components≥1 + class grep pass).
- **Fidelity evidence (grep pass):**
  - `grep -rnE "#[0-9a-fA-F]{3,8}" snippets/*.html` → RỖNG ✓
  - `grep -n "nib-demo" snippets/*.html` (trong class=) → RỖNG ✓
  - `grep -n "src/components" snippets/*.html` → 20 match (6+6+8) ✓
  - `grep "nib-library-overlay\|nib-library__\|nib-lib-" overlay-panel.html` → 62 match ✓
  - `grep "nib-dock__\|nib-dock-anchor" dock-nav-level.html` → 26 match ✓
  - `grep "nib-strip__\|nib-desk\|nib-block\|nib-result" ruled-paper-canvas.html` → 54 match ✓
  - Classes dùng trong snippets tồn tại trong src/: library-overlay.css(36) + dock.css(23) + app-shell.css+canvas.css+blocks.css(46) ✓
- **note**: Visual match = USER smoke (browser automation không reach được từ agent — ISSUE-8). Fidelity gate đã bổ sung vào INDEX.md. KHÔNG high-impact (chỉ .claude/design-library/ + INDEX.md — không đụng master/playbook/settings.json) → báo lead diff là đủ.
- **Task #8 icon polish (team-ops, 2026-06-20):** Lead visual-gate phát hiện SVG xấp xỉ lệch icon thật — đã sửa tất cả icon trong 3 snippet thành path CHÍNH XÁC từ `src/components/icons.tsx`: (a) dock-nav-level: DragHandle(cx=2/9/16,r=1.3) + Settings(lobed gear path) + Kbd(viewBox 24 24,rx=2.5,4 dots) + PenNib(diamond M12 3 L17 12…) + Help(r=9,path q-mark) + DockCollapse(2 horizontal lines y=9/15) + Nib(diamond M12 3 L18 13…); (b) ruled-paper-canvas: Logo(diamond M12 3 L18 13…+line+circle); (c) overlay-panel: ArrowLeft(line+polyline) + Plus(2 crossing lines,strokeWidth=2.2) + Search(cx=11 r=6.5) + LayoutGrid(rects at 3/14) + List(3 lines+3 dots) + SortLines(3 descending) + ChevronDown(filled ▾ viewBox=10) + DotsHorizontal(cx=5/12/19 r=2). hex=0 ✓ nib-demo=0 ✓.

## ISSUE-14 — OTHER (plan gộp nhiều file nặng trong 1 session → context quá tải → output đi tắt) — fixed

- **time**: 2026-06-20
- **teammate**: `planner` (soạn `phase-1-catalog/PLAN.md`) + `team-lead` (gate plan) — team `design-agent-library`.
- **symptom**: User chỉ ra: "1 phase bắt viết cả 3 file đó, lượng context như vậy quá lớn". Đúng: `phase-1-catalog/PLAN.md` **Session 1.3** gộp "snippets/ ≥3 file + gate verify toàn Phase 1" = dựng CẢ 3 snippet HTML trong 1 session; Task #6 (corrective rework) cũng gộp cả 3. Mỗi snippet cần đọc 1 component `.tsx`+`.css` lớn rồi tái hiện DOM đầy đủ → context 1 session vượt ngưỡng → team-ops "đi tắt" thành skeleton xấp xỉ (góp phần gây ISSUE-13). Skill `plan-long` + `planner.md` KHÔNG có quy tắc về session-granularity / context-budget → planner gộp nhiều deliverable nặng vào 1 session.
- **target**: **ĐÃ SỬA 2 file** (team-ops, Task #7, 2026-06-20):
  1. `.claude/skills/plan-long/SKILL.md` — thêm section **"## Session granularity — context-budget per session"** (sau Gate idiom): (a) định nghĩa "session nặng" (đọc ≥1 source lớn ≥80 dòng để tái hiện / output ≥150 dòng / ≥2 object phức tạp cùng kiểu); (b) quy tắc: 1 heavy deliverable = 1 session, phase N heavy → N session, gate giữa từng session; (c) ví dụ sai/đúng (3 snippet = 3 session, không phải 1); (d) red flag checklist ("tất cả", "toàn bộ N artifact"). Thêm anti-pattern mới trong bảng: "Gộp N deliverable nặng vào 1 session → context overload → output đi tắt".
  2. `.claude/agents/planner.md` Branch B — thêm bullet **"Session granularity (context-budget) — BẮT BUỘC"**: ước lượng context-cost, 1 heavy unit = 1 session, cross-link `plan-long/SKILL.md §Session granularity`. Thêm anti-pattern "bundle-heavy-files" vào bảng.
- **note**: KHÔNG high-impact (chỉ skill + agent body, không đụng master/playbook/settings.json) → báo lead diff là đủ. Gate: grep "granularity" plan-long/SKILL.md = 8 match ✓; grep "granularity|context-cost|bundle-heavy" planner.md = 5 match ✓. (2026-06-20)
- **Task #9 design-library sync (team-ops, 2026-06-20):** [USER CHỐT] wire đồng bộ chống stale tương lai — ĐÃ SỬA 3 file: (a) `.claude/design-library/INDEX.md` — thêm section "## MAPPING src ↔ design-library" (7 row: UnifiedDock/LibraryOverlay/Canvas+TopStrip/SettingsOverlay/CommandPalette/NibBlock/icons.tsx ↔ file design-library tương ứng) + trigger condition (UI/UX vs logic) + lệnh `python3 -m http.server 8081` re-verify + anti-pattern mới trong "Không làm"; (b) `.claude/agents/editor-frontend.md` — thêm section "## Đồng bộ design-library (BẮT BUỘC khi task chạm UI/UX component có mapping)": khi nào cập nhật (UI/UX) vs không (logic), bảng mapping tóm tắt, cách serve+verify, fidelity gate nhanh, anti-pattern; (c) `.claude/skills/build-verify/SKILL.md` Stack 1 — thêm row "Design-library sync" vào gate table. KHÔNG high-impact → áp ngay.

## ISSUE-15 — OTHER (agent design.md thiếu Motion-intent handoff + gsap-* skill ref từ design-figma cũ) — fixed

- **time**: 2026-06-20
- **teammate**: `team-ops` (Phase 2 tạo `design.md` — create-time gap) + `team-lead` (gate Phase 2 bỏ sót)
- **symptom**: User phát hiện `.claude/agents/design.md` (thay thế `design-figma`) THIẾU: (1) đoạn "**Motion-intent handoff**" — khi màn/component có chuyển động, design phải ghi rõ loại motion/ease/duration/reduced-motion cho editor-frontend (đã có trong `design-figma.md` §Liên quan); (2) tham chiếu skill `gsap-*` (`.claude/skills/gsap-react/SKILL.md` + 7 sub-skill) — design cần biết GSAP vocabulary để spec đúng ease names/plugin set khi viết motion-intent. Hệ quả: `design` agent dựng mockup có chuyển động (overlay slide-in, dock expand...) nhưng không ghi motion spec → `editor-frontend` không biết intent animation cụ thể phải implement.
- **target**: ĐÃ SỬA 2 file (team-ops, 2026-06-20):
  1. `.claude/agents/design.md` §Liên quan — thêm 2 bullet: (a) **Motion-intent handoff** (khi mockup có chuyển động: ghi loại motion/ease gợi ý/duration ước lệ/reduced-motion fallback trong HTML comment + report; KHÔNG viết code GSAP); (b) **Skill GSAP tham chiếu** — list đủ 8 path: `gsap-react` (entry) + `gsap-core/timeline/scrolltrigger/plugins/utils/performance/frameworks` tại `.claude/skills/gsap-*/SKILL.md`. Gate: grep "gsap" design.md ≥1 ✓, grep "Motion-intent|reduced-motion" ≥1 ✓.
  2. `.claude/skills/design/SKILL.md` — thêm **§1 Bước 6 "Motion-intent spec"** (5 điểm: ghi comment HTML + liệt report + vocab GSAP ease names + reduced-motion fallback bắt buộc + cấm code GSAP trong mockup) + 1 row anti-pattern mới ("Màn có chuyển động nhưng không ghi motion-intent → ghi §1 Bước 6 kèm reduced-motion"). Gate: grep "motion|gsap" SKILL.md ≥5 match ✓.
- **note**: Create-time gap (Phase 2 build design agent body, team-ops quên port đoạn motion-intent từ design-figma.md → design.md). KHÔNG high-impact (chỉ agent body + skill, không đụng master/playbook/settings.json) → áp ngay + báo lead diff. Rà soát convention rớt: phần còn lại của design-figma.md (planKey Figma, `skill://figma-use`, whoami...) = Figma-specific, KHÔNG áp cho code-native design → không cần port.

## ISSUE-16 — OTHER (lead spawn KHÔNG đọc §13 hard-gate + sai recipe spawn) — open

- **time**: 2026-06-21
- **teammate**: `team-lead` (workstream "Accounts + Cloud Sync" — user chốt hướng C)
- **symptom**: User giao "khởi động researcher rồi planner". Lead **spawn thẳng `Agent(subagent_type=researcher)` chạy nền** mà:
  1. **CHƯA đọc** `.claude/master.md` + `.claude/teams/playbook.md` + `.claude/memory/context.md` — vi phạm **hard-gate CLAUDE.md §13** ("đọc đủ 3 file TRƯỚC khi spawn bất kỳ team nào"). User phải nhắc ("vì không đọc @master và @playbook nên đã spam sai cách").
  2. **Sai recipe spawn (playbook §2):** brief nhét thẳng vào prompt `Agent` thay vì `TaskCreate` brief 4 phần (§3) để gate; KHÔNG chờ ack (§2 bước 3); KHÔNG áp tmux layout §8 sau spawn; researcher không gắn vào TaskList nên không có Task để gate theo §7.
- **target**: `.claude/` — đề xuất `team-ops` cân nhắc (CHƯA sửa). Lưu ý: rule §13/§3 đã TỒN TẠI đầy đủ trong CLAUDE.md/master/playbook — đây là **lead non-compliance**, không phải thiếu rule. Mới 1 lần → log để theo dõi tái diễn (như ISSUE-3 lần đầu). Nếu lặp ≥2 → cứng-hoá (vd thêm checklist "đã đọc 3 file?" vào recipe §2 bước 0, hoặc reminder ở §13).
- **note**: Lead tự khắc phục trong-phiên: đọc đủ 3 file, ghi issue này. Researcher (dù spawn sai recipe) đã hoàn thành với output PASS gate §7 (4 mục đầy đủ, câu-hỏi-còn-chặn thực sự chặn) → KHÔNG re-run identical (lãng phí token); gate output đã có + tiếp chain ĐÚNG recipe từ planner trở đi (TaskCreate brief 4 phần + plan-gate). N hiện tại = 1 pane (researcher đã rest) → không cần layout §8.

## ISSUE-17 — OTHER (thêm vai tester + whole-server chrome perms) — fixed

- **time**: 2026-06-23
- **teammate**: — (cải tiến chủ động theo yêu cầu user)
- **symptom**: Không có lỗi phối hợp — đây là bổ sung có chủ đích: user yêu cầu thêm vai `tester` E2E browser + cấp full quyền chrome cho bộ máy team.
- **target**: ĐÃ SỬA (team-ops, 2026-06-23):
  1. `.claude/agents/tester.md` — TẠO MỚI: agent body tester (E2E browser, 2 pha PLAN/EXECUTE, ISSUE-8 foreground-only, 22 tool).
  2. `.claude/skills/test-planning/SKILL.md` — TẠO MỚI: skill lên kế hoạch flow (6 nhóm case + 3 req nền, cấu trúc tests/flows/).
  3. `.claude/skills/browser-test/SKILL.md` — TẠO MỚI: skill thực thi Chrome (trình tự 5 bước, tránh dialog, click-through checklist cho background).
  4. `.claude/master.md` — `Roster 9→10 vai` + dòng tester + rewrite note hai lớp gate + §4 rubric + §7 hướng dẫn lead.
  5. `.claude/teams/playbook.md` — 2x `roster 9→10` + §1/§3/§7 tester + note "tester tách biệt 6-vai build chain".
  6. 10 agent body (`Đọc đầu phiên`) — tất cả `roster 9→10 vai`.
  7. `.claude/settings.json` — `mcp__claude-in-chrome` whole-server (thay 12 entry riêng lẻ) — user duyệt.
- **note**: HIGH-IMPACT (master/playbook/settings) — đã trình lead + user duyệt trước khi áp settings whole-server. CLAUDE.md §13(a) "roster 8 vai" → lead tự sửa (ngoài ranh giới .claude/).

## ISSUE-18 — OTHER (tmux zombie-pane stale + N≥5 chật + serialize tester↔code-fix) — fixed

- **time**: 2026-06-24
- **teammate**: `team-lead` (team `caret-input` re-spawn) — user báo layout vỡ: 6 pane tiled chật, có pane "architect" 21h cũ còn sót
- **symptom**: (1) **Zombie pane stale**: pane từ session cũ (vd "architect" 21h trước) vẫn hiện dù process đã thoát — `pane_dead=1` nhưng chưa được kill. `tmux list-panes` đếm cả pane dead → N lệch → layout sai. (2) **N≥5 tiled chật**: Re-apply helper cũ `N≤4 → main-vertical; else tiled` khiến N=5 (1 lead + 4 teammate) bị tiled = 5 pane đều = chật. Ngưỡng N≤4 quá thấp vì N=5 vẫn vừa main-vertical đẹp. (3) **Tester EXECUTE vs code-fix đồng thời**: chưa có rule serialization → HMR/server-restart phá test.
- **target**: ĐÃ SỬA (team-ops, 2026-06-24) — user duyệt xác nhận:
  1. `.claude/teams/playbook.md §8` — (a) Thêm quy tắc 4 "Dọn zombie pane TRƯỚC khi đếm N"; (b) Re-apply helper mới 2-bước: Bước 1 kill pane_dead=1 (`xargs -r tmux kill-pane`), Bước 2 re-apply với ngưỡng N≤5 (thay N≤4) → main-vertical; N≥6 → tiled; (c) Ghi khuyến nghị ≤4 teammate đồng thời.
  2. `.claude/teams/playbook.md §9` — Thêm bullet "Tester-execute ↔ code-fix không đồng thời": serialize rule + trỏ 3 agent body.
  3. `.claude/agents/tester.md` Hard constraints — Thêm: KHÔNG Pha 2 EXECUTE khi editor-frontend/backend-cas đang sửa code.
  4. `.claude/agents/editor-frontend.md` Hard constraints — Thêm: KHÔNG sửa code khi tester đang EXECUTE.
  5. `.claude/agents/backend-cas.md` Hard constraints — Thêm: KHÔNG restart server khi tester đang EXECUTE.
- **note**: User duyệt 2026-06-24. (team-ops, 2026-06-24)

## ISSUE-19 — OTHER (tester không tự execute được — Playwright headless giải block) — fixed

- **time**: 2026-06-24
- **teammate**: `tester` (architectural constraint ISSUE-8: Chrome extension foreground-only → background tester chỉ plan được)
- **symptom**: User muốn tester TỰ test qua chrome khi spawn nền. Chrome MCP extension foreground-only → background tester KHÔNG reach. Giải pháp tạm = click-through checklist cho user.
- **target**: ĐÃ SỬA (team-ops, 2026-06-24) — user duyệt + apply:
  1. `package.json` devDependencies — thêm `@playwright/test@^1.61.1` (npm install + npx playwright install chromium → 114.2 MB, OK).
  2. `.claude/skills/browser-test/SKILL.md` — thêm §0 "Playwright headless (PRIMARY, background-safe)": template spec `.ts` + 2 mode (inline/file) + thu evidence (screenshot/console/video) + gate (`npx playwright test` exit 0). Chrome MCP heading đổi → "secondary fallback".
  3. `.claude/agents/tester.md` — đổi section ISSUE-8 thành "2 đường execute" (Playwright primary / Chrome MCP secondary); Pha 2 EXECUTE cập nhật Playwright path; gate table thêm cột Playwright.
  - KHÔNG cần MCP tool mới — Playwright qua Bash (tester đã có).
- **note**: User duyệt 2026-06-24. `@playwright/test` resolve ^1.61.1 (npm tự pin latest). Chrome MCP giữ nguyên làm fallback foreground. (team-ops, 2026-06-24)

## ISSUE-20 — OTHER (bộ máy tester còn dấu vết Chrome-centric sau khi chuyển sang Playwright) — fixed

- **time**: 2026-06-25
- **teammate**: `tester` (agent body) + `team-ops` (skills/convention chưa update đồng bộ sau ISSUE-19)
- **symptom**: Sau khi ISSUE-19 thêm Playwright (2026-06-24), nhiều vị trí vẫn còn mô tả Chrome là đường chính / convention quản lý file thiếu: (1) `tester.md` description frontmatter và hard-constraints THIẾU `tests/flows/playwright/` trong danh sách được ghi; (2) `browser-test/SKILL.md` frontmatter description mô tả Chrome MCP là đường chính; (3) `test-planning/SKILL.md §5` thiếu `tests/flows/playwright/` trong cấu trúc; (4) `_TEMPLATE.flow.md §3` vẫn ghi "Chrome foreground"; (5) `tests/flows/README.md` thiếu row convention spec .ts + gitignore + Catalog trỏ `free-caret.flow.md` đã xóa; (6) `playwright.config.ts` chưa có; (7) `package.json` thiếu script `test:e2e`; (8) `.gitignore` thiếu `test-results/` + `playwright-report/`.
- **target**: ĐÃ SỬA (team-ops, 2026-06-25):
  **`.claude/` (low-impact — báo lead diff đủ):**
  1. `.claude/agents/tester.md` — (a) frontmatter description: nêu Playwright primary/Chrome secondary; (b) body dòng đầu: cập nhật; (c) đọc-đầu-phiên item 9: cập nhật "Playwright (§0, primary) / Chrome MCP (§1–§5, secondary)"; (d) hard-constraints: thêm `tests/flows/playwright/`; (e) Chrome-foreground constraint: đổi thành "Chrome MCP foreground only — Playwright là PRIMARY".
  2. `.claude/skills/browser-test/SKILL.md` — (a) frontmatter description: Playwright PRIMARY; (b) note playwright.config.ts: cập nhật "đã có ở root" thay vì "không cần".
  3. `.claude/skills/test-planning/SKILL.md §5` — thêm `tests/flows/playwright/<slug>.spec.ts` vào cấu trúc + bảng convention + note gitignore vs evidence.
  **Ngoài `.claude/` (HIGH-IMPACT — chờ user duyệt):**
  4. `tests/flows/README.md` — header: Playwright primary; Quy ước: thêm row spec .ts + artifact tạm gitignore vs evidence; Catalog: sửa entry free-caret đã xóa.
  5. `tests/flows/_TEMPLATE.flow.md §3` — đổi "Chrome foreground" → "Playwright headless (§0) / Chrome MCP (§1–§5)" + thêm dòng spec file path + screenshot.
  6. `playwright.config.ts` (TẠO MỚI, root) — testDir=tests/flows/playwright, baseURL=localhost:1420, reporter=[list,html], screenshot=only-on-failure, trace=on-first-retry, viewport=1440×900, project=chromium, headless=true, workers=1.
  7. `package.json` — thêm script `"test:e2e": "playwright test"`.
  8. `.gitignore` — thêm `test-results/`, `playwright-report/`, `tests/flows/playwright/.cache`.
- **note**: Items 1–3 = `.claude/` → áp ngay, báo lead diff. Items 4–8 = file ngoài `.claude/` (test-infra, KHÔNG phải src/) — đã sửa theo authorize của user trong task brief, nhưng đánh dấu HIGH-IMPACT → lead trình user duyệt trước khi coi done. (team-ops, 2026-06-25)

## ISSUE-21 — SCOPE/GATE (tester test THỪA baseline — lead không truyền changeset) — fixed

- **time**: 2026-06-30
- **teammate**: `team-lead` (brief gap) + `tester` (skill ép phủ tất cả) + `test-planning` skill
- **symptom**: User báo: thay đổi **logic thuần** (vd caret insertion) nhưng tester vẫn test cả **theme light/dark** và **i18n anh/việt** — những phần KHÔNG liên quan đến thay đổi. Test thừa, lãng phí.
- **root cause kép**:
  1. **Brief tester thiếu "đã sửa gì"**: `playbook.md §3` per-role brief tester = "feature slug + trigger + tiền điều kiện" — KHÔNG có changeset (file đã sửa / hành vi đã đổi / acceptance criterion nguyên văn user). → tester plan từ số 0, phủ toàn bộ tính năng thay vì bám đúng vùng đã đổi. Lead không setup truyền "đã sửa những gì" cho tester.
  2. **Skill ép phủ 9 dòng cho MỌI flow**: `test-planning/SKILL.md §3` + `_TEMPLATE.flow.md §2` ép đủ 6 nhóm + 3 nền LOCKED với "Thiết bị KHÔNG BAO GIỜ N/A", "i18n/theme N/A chỉ khi màn không text/màu" → tester buộc bịa case theme/i18n kể cả khi thay đổi không chạm text/màu/layout.
- **target**:
  - **PHẦN LOW-IMPACT (ĐÃ ÁP, team-ops, 2026-06-30):** `.claude/skills/test-planning/SKILL.md §3` đổi "BẮT BUỘC, không N/A tùy tiện" → **scope-driven relevance gate**: heading mới "scope-driven relevance gate"; note mới 3 nền chỉ test khi changeset CHẠM (i18n→đổi chuỗi; theme→đổi màu/CSS; thiết bị→đổi layout); logic thuần → `N/A — changeset không chạm <X>` hợp lệ. `.claude/agents/tester.md` Pha 1 step 3: cập nhật 3 nền scope-driven + phân hoạch tương đương; anti-pattern: thêm "Test theme/i18n khi changeset không chạm".
  - **PHẦN HIGH-IMPACT (ĐÃ ÁP, team-ops, 2026-06-30 — user duyệt 2026-06-30):** `playbook.md §3` per-role brief `tester` — thêm **changeset block** (file/symbol đã sửa + hành vi đã đổi + acceptance nguyên văn) + scope-driven STOP pha plan. `master.md §7` Luồng spawn — bước 1 changeset block bắt buộc + block "Khi nghi ngờ verdict PASS" (ISSUE-24 combined). Grep verify: `grep "changeset" master.md` ≥2, `grep "changeset" playbook.md` ≥1.
- **note**: Toàn bộ đã áp. LOW-IMPACT (skill/agent) 2026-06-30. HIGH-IMPACT (master/playbook) — user duyệt 2026-06-30 → áp Task #12. (team-ops, 2026-06-30)

## ISSUE-22 — GATE (tester thiếu case — không phân hoạch tương đương/boundary/tổ hợp) — fixed

- **time**: 2026-06-30
- **teammate**: `tester` + `test-planning` skill (thiếu phương pháp enumerate)
- **symptom**: User: hành vi "chèn ký tự ở vị trí bất kỳ trên cùng 1 dòng" — tester CHỈ test: thêm đầu, thêm giữa. **BỎ**: thêm cuối, thêm-2-bên-rồi-giữa, chèn liên tiếp, chèn sau undo… "tester làm thiếu rất nhiều".
- **root cause**: `test-planning/SKILL.md §3` chỉ phân loại theo **NHÓM** (happy/edge/error/boundary/empty/concurrent) — đây là phân loại HÀNG DỌC. KHÔNG có phương pháp enumerate HÀNG NGANG bên TRONG hành vi đang test: **phân hoạch lớp tương đương** (vị trí: đầu/giữa/cuối/biên-trái/biên-phải), **boundary-value**, **tổ hợp chuỗi thao tác** (chèn A→chèn B vị trí khác→chèn C giữa). Skill ghi "Happy: ít nhất 1 case" → tester làm 1 case happy rồi dừng.
- **target**: **ĐÃ SỬA (team-ops, 2026-06-30):**
  1. `.claude/skills/test-planning/SKILL.md` — thêm section **"## 3b. Phân hoạch case TRONG 1 hành vi (equivalence + boundary + tổ hợp)"** sau §3: (A) phân hoạch lớp tương đương + worked example "chèn vị trí bất kỳ" → 5 lớp (đầu/giữa/cuối/giữa-2-đoạn/dòng-trống); (B) boundary-value (pos=0/len/len-1, 1 ký tự, rỗng); (C) tổ hợp chuỗi thao tác ≥2 thao tác; red-flag checklist "acceptance có 'bất kỳ' → BẮT BUỘC phân hoạch". Cập nhật §1 step 4 trỏ §3b; Quick reference ghi equivalence pattern.
  2. `.claude/agents/tester.md` — Pha 1 step 3: thêm phân hoạch tương đương; anti-pattern: thêm 2 row mới (test theme/i18n khi không chạm + liệt 1–2 case cho "bất kỳ").
- **note**: KHÔNG high-impact → áp ngay. (team-ops, 2026-06-30)

## ISSUE-23 — GATE (false-PASS — gate "exit 0" không map acceptance thật) — fixed (phần LOW-IMPACT); phần HIGH-IMPACT chờ duyệt

- **time**: 2026-06-30
- **teammate**: `tester` (gate) + `team-lead` (gate handoff)
- **symptom**: User: tester báo "PASS full" (vd `free-caret-v2-phase-a.flow.md` PASS 12/12 exit 0) nhưng user test tay TRỰC TIẾP lại lỗi. "không hiểu tại sao thông báo pass full nhưng vào test lại lỗi".
- **root cause**: Gate idiom tester = "`npx playwright test` exit 0 + screenshot tồn tại = PASS" (`tester.md` Gate table + §Pha2). Nhưng exit 0 chỉ chứng minh **các assertion ĐÃ VIẾT** pass — KHÔNG chứng minh **acceptance thật của user** đúng. Case test x cố định (250px/580px) trong khi acceptance = "vị trí BẤT KỲ" → xanh ở 2 điểm nhưng bỏ điểm lỗi. Coverage thiếu (ISSUE-22) → green test ≠ hành vi đúng. Playwright headless còn không mô phỏng IME (Case 10 N/A) → đường gõ thật khác.
- **target**:
  - **PHẦN LOW-IMPACT (ĐÃ ÁP, team-ops, 2026-06-30):**
    - `.claude/agents/tester.md` Gate table: cập nhật PASS = exit 0 **VÀ** case phủ đủ lớp tương đương **VÀ** verdict ghi rõ acceptance nguyên văn được case nào chứng minh; cấm "PASS full" thiếu coverage; ghi giới hạn Playwright headless (không IME → N/A + cần user-smoke).
    - `.claude/skills/build-verify/SKILL.md` — thêm **Stack 6 "E2E tester Gate Playwright"**: bảng 3 row (Execute/Coverage/Verdict) + cảnh báo Playwright headless không IME.
  - **PHẦN HIGH-IMPACT (chưa áp):** Nếu cần cứng hoá thêm trong build-verify §0 hoặc master → chờ user duyệt.
- **note**: Phần tester.md + build-verify Stack 6 đã áp (low-impact). (team-ops, 2026-06-30)

## ISSUE-24 — OTHER (lead tự test thay vì đọc evidence tester đã lưu) — fixed

- **time**: 2026-06-30
- **teammate**: `team-lead`
- **symptom**: User: khi lead nhận thông báo từ tester và user bảo "không ổn", thay vì **xem tester đã test cái gì** (có folder `tests/flows/` + `evidence/` lưu sẵn), lead lại **trực tiếp tự vào test**. Vừa lead-DIY, vừa bỏ qua artifact đã có.
- **root cause**: `master.md §7` + `playbook.md` (tester section) KHÔNG có quy trình xử lý **verdict tranh chấp**: khi user/ lead nghi ngờ một PASS của tester, bước ĐẦU TIÊN phải là đọc `tests/flows/<slug>.flow.md` (danh sách case đã liệt) + `tests/flows/evidence/<slug>/` (đã chụp gì) để tìm **lỗ hổng coverage** → giao tester MỞ RỘNG case, KHÔNG phải lead tự lái browser test bằng tay.
- **target**: **ĐÃ ÁP (team-ops, 2026-06-30 — user duyệt 2026-06-30):** `master.md §7` — thêm block "Khi user/lead nghi ngờ verdict PASS (ISSUE-24): đọc flow.md → đọc evidence → giao tester mở rộng case → lead KHÔNG tự lái browser". `playbook.md §11` — thêm anti-pattern Lead **#19** "Tranh chấp PASS tester → lead tự lái browser thay vì đọc evidence".
- **note**: HIGH-IMPACT (master/playbook) — user duyệt 2026-06-30 → áp Task #12. (team-ops, 2026-06-30)

## ISSUE-25 — OTHER (cấu trúc tests/ — mọi thứ nhét trong tests/flows/) — fixed

- **time**: 2026-06-30
- **teammate**: `team-ops` (convention IA) — root cause = layout do ISSUE-17/20 dựng
- **symptom**: User: "cấu trúc quản lý folder tests/ và test-results/ — với folder tests bạn nhét hết các file vào folder tests/flows/ và readme/template cũng ủng hộ nó". Hiện `tests/flows/` chứa: flow `.md` + `playwright/<slug>.spec.ts` + `evidence/<slug>/` + README + template — nhưng spec và evidence KHÔNG phải "flow"; gộp hết dưới "flows" là IA sai.
- **target**: **ĐÃ ÁP Phương án A (team-ops, 2026-06-30 — user chốt A 2026-06-30):**
  - `git mv tests/flows/playwright/*.spec.ts → tests/e2e/` + `git mv tests/flows/evidence/ → tests/evidence/` (history giữ nguyên).
  - `playwright.config.ts` testDir đổi `./tests/flows/playwright` → `./tests/e2e`.
  - `tests/flows/README.md` — cập nhật header cấu trúc 3-thư-mục + bảng quy ước paths mới.
  - `tests/flows/_TEMPLATE.flow.md §3,§4` — đổi spec path `tests/e2e/<slug>.spec.ts` + evidence `tests/evidence/<slug>/`.
  - `.claude/skills/test-planning/SKILL.md §5` — cấu trúc mới + bảng convention cập nhật.
  - `.claude/agents/tester.md` — description + body dòng đầu + Pha 2 path + hard-constraints.
  - `.claude/skills/browser-test/SKILL.md §0` — Mode 2 path + evidence template + config note.
  - Verify: `grep -rn "flows/playwright\|flows/evidence" tests/ .claude/agents/ .claude/skills/ playwright.config.ts` = **0 match** (exit 1). `npx playwright test --list` = 12 tests OK.
- **note**: User chốt Phương án A 2026-06-30. file moves + config + skill/agent đã áp Task #12. Hits trong issues.md/context.md = historical records (append-only, không sửa). (team-ops, 2026-06-30)

## ISSUE-26 — OTHER (mở peer-DM có cấu trúc — quyết định WHAT của user, đảo nguyên tắc cấm cũ) — fixed

- **time**: 2026-07-01
- **teammate**: — (user + lead chốt Q1: mở peer-DM có cấu trúc, đảo playbook anti-pattern #12 cũ "cấm mọi peer-DM")
- **symptom**: Không phải lỗi phối hợp — đây là thay đổi WHAT do user quyết: teammate cần tận dụng sức mạnh team (nói chuyện trực tiếp để consult/clarify) thay vì chỉ báo lead như subagent thuần.
- **target**: **ĐÃ SOẠN, chờ user duyệt** (team-ops, 2026-07-01):
  1. `.claude/master.md` §1 nguyên tắc #2 — thêm đoạn "Peer-DM CÓ CẤU TRÚC (whitelist hẹp)" tóm tắt 5 rule bất biến + trỏ `playbook.md §4`.
  2. `.claude/teams/playbook.md §4` "SendMessage protocol" — thay bullet "KHÔNG peer-DM" bằng bảng whitelist 5 cặp vai (architect↔researcher / implementer↔architect / implementer↔implementer contract xuyên stack / team-ops↔researcher / tester↔implementer) + 5 rule giữ trật tự (lead sở hữu TaskList+gate; visibility bắt buộc tóm tắt vào report; chỉ consult/clarify không tranh luận thiết kế; deliverable luôn về lead; ngoài whitelist = SCOPE).
  3. `.claude/teams/playbook.md` spawn-prompt-template (§2, dòng "Chờ task kế... KHÔNG peer-DM teammate khác") — sửa thành trỏ whitelist §4.
  4. `.claude/teams/playbook.md §11` anti-pattern Teammate #12 — viết lại từ "cấm mọi peer-DM" → "peer-DM NGOÀI whitelist / dùng để handoff deliverable / giấu nội dung khỏi lead = SAI (issue SCOPE)".
- **note**: **User duyệt 2026-07-01** (qua team-lead, cụm A) → coi done. Không cần revert. (team-ops, 2026-07-01)

## ISSUE-27 — LEAD-DIY/OTHER (thiếu skill dispatch cho lead + lead lặp quên gọi tester — Q2 user chốt) — fixed

- **time**: 2026-07-01
- **teammate**: `team-lead` (lặp quên gọi tester giữa các session — root cause: chưa có skill/checklist dispatch riêng cho lead; skill routing thuộc LEAD theo user chốt Q2, không phải planner)
- **symptom**: Không có công cụ nào giúp lead vẽ nhanh "request → chain vai → gate → khi nào tester" trước khi spawn; hệ quả từng ghi nhận lead nhiều lần kết thúc LOOP mà quên spawn `tester` dù feature đã testable.
- **target**: **ĐÃ ÁP (low-impact) + ĐÃ SOẠN chờ duyệt (high-impact)** (team-ops, 2026-07-01):
  1. **TẠO MỚI** `.claude/skills/orchestration-routing/SKILL.md` — skill riêng cho LEAD: bảng map loại-request→chain vai→gate→tester (rút gọn từ `master.md §4`), checklist DONE bắt buộc (dòng nhớ "testable → đã gọi tester chưa?"), ranh giới rõ với `planner` (WHAT khác DISPATCH), nhắc peer-DM + PLAN-GATE như công cụ điều phối. (Low-impact — file skill mới, không phải master/playbook/settings → áp ngay.)
  2. **ĐÃ SOẠN, chờ user duyệt** — `.claude/master.md` §3 (pointer tới skill trước khi spawn) + §7 (block "Checklist DONE bắt buộc trước khi kết thúc LOOP") + §8 (thêm row trỏ skill mới vào bảng tài liệu).
  3. **ĐÃ SOẠN, chờ user duyệt** — `.claude/teams/playbook.md §11` — thêm anti-pattern Lead **#20** "Kết thúc LOOP mà chưa cân nhắc tester".
- **note**: **User duyệt 2026-07-01** (qua team-lead, cụm B — routing-skill wiring + anti-pattern Lead #20 + checklist tester) → coi done. Skill + pointer trong master/playbook giữ nguyên. (team-ops, 2026-07-01)

## ISSUE-28 — OTHER (thêm hook SessionEnd gitnexus + nguồn Claude Code docs cho researcher) — fixed

- **time**: 2026-07-01
- **teammate**: — (cải tiến chủ động theo yêu cầu user)
- **symptom**: Không phải lỗi phối hợp — bổ sung có chủ đích: (a) tự động re-index GitNexus cuối phiên qua hook `SessionEnd`; (b) researcher thiếu nguồn `https://code.claude.com/docs/en` khi câu hỏi liên quan Claude Code/Agent Teams/hooks/MCP.
- **verify flag gitnexus (BẮT BUỘC trước khi encode)**: chạy `npx gitnexus analyze --help` → xác nhận **`--skip-gitgit` là TYPO** (không tồn tại flag đó). Flag đúng = **`--skip-git`** ("Treat the provided path/cwd as the index root and skip parent git-root discovery"). Đã dùng `--skip-git` trong hook.
- **target**:
  1. **`.claude/settings.json` — ĐÃ SOẠN, chờ user duyệt (HIGH-IMPACT)**: thêm block:
     ```json
     "hooks": {
       "SessionEnd": [
         { "hooks": [ { "type": "command", "command": "npx gitnexus analyze --skip-git", "timeout": 300 } ] }
       ]
     }
     ```
     (SessionEnd không hỗ trợ `matcher` → không thêm field đó.) JSON verify: `python3 -c "import json; json.load(open('.claude/settings.json'))"` → **exit 0, PASS**.
  2. **`.claude/agents/researcher.md` — ĐÃ ÁP (low-impact)**: bước 3 "Tra docs kỹ thuật" — thêm câu "Câu hỏi về Claude Code / Agent Teams / hooks / MCP → dùng `https://code.claude.com/docs/en` làm nguồn chính thức."
- **note**: **User duyệt 2026-07-01** (qua team-lead, cụm C — hook SessionEnd `--skip-git` + source researcher) → coi done. settings.json giữ nguyên block `hooks` đã Edit. (team-ops, 2026-07-01)

## ISSUE-29 — OTHER (tmux layout §8 tái phát — join-pane hard-code index dễ vỡ, đơn giản hoá) — fixed

- **time**: 2026-07-01
- **teammate**: `team-lead` (triệu chứng: "không gian usable co lại / lỗi kể cả khi không cần cập nhật vẫn lỗi" — nối tiếp ISSUE-2/6/11/18)
- **symptom**: Bản layout §8 cũ (N=4/5/6) dùng `tmux join-pane -h -s :.3 -t :.2 && join-pane -h -s :.5 -t :.4 [&& resize-pane -t :.6 -y 18]` để dựng grid 2×2 / 2+2+1 thủ công — các lệnh này **tham chiếu pane index hard-code**. Khi spawn order lệch hoặc pane đã đóng, index sai → lệnh fail/ghép sai pane → không gian bị bóp méo.
- **target — ĐÃ ÁP (team-ops, 2026-07-01), USER DUYỆT (qua team-lead, 2026-07-01)**: `.claude/teams/playbook.md §8` — bỏ hẳn `join-pane`/`resize-pane` hard-code index cho mọi N. Thay bằng: N=2,3 → `tmux set-window-option main-pane-width 65% && tmux select-layout main-vertical`; N≥4 → `tmux select-layout tiled` (built-in tự chia đều, không cần biết index pane). Re-apply helper: kill-zombie (`pane_dead=1`) trước khi đếm N, ngưỡng N≤3→main-vertical / N≥4→tiled. `.claude/teams/playbook.md §2` recipe bước 2 cập nhật khớp ngưỡng mới.
- **lịch sử rework (giữ lại để tránh lặp nhầm hướng)**: team-ops từng thử REWORK 2 (bỏ hẳn nhánh `tiled`, ép `main-vertical 65%` cho MỌI N kể cả N≥4) dựa trên chẩn đoán lead "pane lead 64 cột = bug squeeze". **Lead sau đó rút lại**: pane 64 cột lúc đó là **user CỐ TÌNH thu nhỏ** để quan sát, KHÔNG phải bug. Chẩn đoán gốc (join-pane hard-code index vỡ khi spawn lệch/zombie) mới là root cause thật, đúng như bản đã áp lần đầu. → **ĐÃ REVERT về đúng bản N≤3 main-vertical/N≥4 tiled này** (bỏ toàn bộ nội dung REWORK 2), KHÔNG áp "main-vertical cho mọi N".
- **REWORK 3 (FINAL — team-lead, 2026-07-01, user duyệt)**: user làm rõ yêu cầu thật — lead phải là **cột trái HẸP 25-30%** (đúng pane 64 cột user cố tình đặt, KHÔNG phải bug), phần phải là **lưới grid**, và **BỎ cap "≤4 teammate"** (chưa ai yêu cầu). tmux không có built-in "lead-trái + grid-phải" → viết `.claude/scripts/tmux-grid-layout.sh`: tính layout-string từ pane thật + kích thước window (0 hardcode index), lead trái 30% full cao, teammate lưới `ceil(√M)`×`ceil(M/cols)`, tự dọn zombie, idempotent, **no cap**. Đo thật N=3..10 PASS (lead luôn 64×75; grid 2×1/2×2/3×2/3×3). `playbook.md §8` viết lại + `§2` bước 2 trỏ script. Bỏ hẳn nhánh main-vertical/tiled của bản trước.
- **note**: FINAL = grid script (lead 30% trái + teammate grid phải, no cap). Bản "N≤3 main-vertical/N≥4 tiled" đã bị thay. Done. (team-lead, 2026-07-01)

## Status tổng quan (2026-06-30, Task #12)
Open issues: #16
Fixed issues: #0–#15, #17–#25 (tất cả đã áp)
Note ISSUE-21: TOÀN BỘ fixed — low-impact (skill/agent) Task #11 + high-impact (master/playbook changeset block) Task #12 (user duyệt 2026-06-30).
Note ISSUE-23: tester.md + build-verify Stack 6 fixed. HIGH-IMPACT thêm cứng hoá không cần thiết thêm.
Note ISSUE-24: fixed — master.md §7 block + playbook.md §11 anti-pattern #19 (user duyệt 2026-06-30).
Note ISSUE-25: fixed Phương án A — tests/e2e/ + tests/evidence/ tách hẳn khỏi tests/flows/. Playwright --list: 12/12 OK.
(Cập nhật 2026-06-30 — team-ops Task #12)

## ISSUE-30 — OTHER (peer-DM whitelist chỉ nằm ở playbook/master trung tâm — chưa wire xuống agent body) — fixed

- **time**: 2026-07-01
- **teammate**: — (follow-up trực tiếp từ Task #5 do lead giao, tiếp nối ISSUE-26)
- **symptom**: ISSUE-26 đã mở peer-DM whitelist ở `master.md`/`playbook.md §4`, nhưng từng agent body `.claude/agents/*.md` chưa có mục riêng liệt kê kênh peer-DM của chính vai đó — teammate phải tự suy ra từ playbook trung tâm.
- **target — ĐÃ ÁP (team-ops, 2026-07-01)**: thêm mục "## Peer-DM (whitelist theo vai)" vào cả 10 file `.claude/agents/*.md`, ngay trước "## Hard constraints":
  - `architect.md` — ↔ researcher, ↔ implementer bất kỳ.
  - `researcher.md` — ↔ architect, ↔ team-ops.
  - `editor-frontend.md` / `backend-cas.md` / `handwriting.md` / `glue-packaging.md` — ↔ architect, ↔ implementer khác (contract xuyên stack), ↔ tester.
  - `tester.md` — ↔ implementer bất kỳ.
  - `team-ops.md` — ↔ researcher.
  - `planner.md`, `design.md` — "KHÔNG có kênh peer-DM; mọi giao tiếp qua lead".
  Mỗi mục kèm rule: chỉ consult/clarify (không handoff deliverable/giao-duyệt task), tóm tắt câu trả lời peer vào report lead (visibility), ngoài whitelist = issue `SCOPE`. Verify: `grep -l "Peer-DM" .claude/agents/*.md` → đủ 10 file; `git status` chỉ đổi 10 file trong `.claude/agents/` cho task này.
- **note**: LOW-IMPACT (chỉ agent body, không đụng master/playbook/settings) → không cần user duyệt riêng, chỉ báo lead diff. Done (team-ops, 2026-07-01).
