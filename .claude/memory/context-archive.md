# Memory — context-archive (entries cũ, archived 2026-06-20)

> Archived từ context.md 2026-06-20 — 12 entry cũ nhất (trước 2026-06-15).
> Lưu để tra lịch sử. KHÔNG dùng để load vào context làm việc.

---

## 2026-06-11 12:30 — agent-team-setup-bootstrap

- Trạng thái: **agent-team-setup in progress** — Phase 4 (Smoke-test & Bootstrap), Session 4.1.
- Đã xong: Phase 1 (settings.json), Phase 2 (master.md + playbook.md), Phase 3 (7 agent body + 6 skill).
- Roster 8 vai: `planner` (tái dùng) + `researcher` / `architect` / `editor-frontend` / `backend-cas` / `handwriting` / `glue-packaging` / `team-ops`.
- Việc tiếp theo: Session 4.2 — smoke-test spawn 1 teammate thật (TeamCreate → ack → TaskUpdate in_progress → shutdown), append kết quả pass/fail vào file này.
- Smoke-test: **chưa chạy.**

## 2026-06-11 12:24 — smoke-test-PASS (Session 4.2 — Phase 4 HOÀN THÀNH)

- **Kết quả: PASS** — toàn bộ STOP gate Session 4.2 đạt. Plan agent-team-setup HOÀN THÀNH (10/10 session).
- Môi trường: Claude Code **v2.1.172** (≥ v2.1.32 ✓) · `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` active ✓.
- Luồng smoke chạy thật: `TeamCreate("smoke-test")` không lỗi → spawn `researcher` (run_in_background) → teammate **tự ack ≤2 phút** ("researcher: sẵn sàng. Chờ task.") → `TaskCreate(#1)` brief self-contained + `TaskUpdate(owner=researcher)` → `SendMessage("Task #1 — TaskGet(1)…")` → teammate **TaskGet + TaskUpdate(in_progress→completed) cùng turn** (verify `TaskGet(1)` = completed) → report đầy đủ → `shutdown_request` → `TeamDelete` không lỗi (xác nhận teammate shutdown sạch, không còn member active).
- **Bằng chứng cơ chế agent body OK:** researcher report Read thành công đủ 4 file "Đọc đầu phiên": `.claude/master.md`, `.claude/teams/playbook.md`, `.claude/memory/context.md`, `.claude/skills/memory/SKILL.md` → caveat "skill không auto-load → trỏ path trong agent body để teammate tự Read" hoạt động đúng thực tế.
- Lưu ý nhỏ (không phải lỗi): teammate hoàn thành Task #1 nhanh (in_progress→completed trong cùng turn) nên khi lead `TaskGet(1)` lần đầu đã thấy `completed` thay vì `in_progress` — bằng chứng mạnh hơn, không phải FAIL.
- Việc tiếp theo: agent-team setup xong — sẵn sàng chạy các workstream xây app (long-plan riêng cho Editor/CAS/Handwriting/Glue). Bộ máy team (lead điều phối + 8 vai + memory + issue-queue) đã verify end-to-end.

## 2026-06-11 17:05 — app-wide-requirements + root màu chốt

- Tạo `docs/requirements.md` — 3 yêu cầu nền [LOCKED] cho mọi feature:
  1. **Song ngữ en/vi** — i18n runtime, cấm hardcode text, locale `src/locales/{en,vi}.json`, mặc định theo `navigator.language` fallback `en`. Không dịch nội dung toán/LaTeX.
  2. **Giao diện theo thiết bị đích** — desktop-class, min-width 1024px, breakpoints compact(1024–1279)/regular(1280–1679)/wide(≥1680); 3 input chuột+phím/cảm ứng/bút đều mượt; hit target ≥44px; bút chỉ bật khi pointer:coarse/pen.
  3. **Theme light/dark/system** (mặc định system), không reload/không nháy, WCAG AA.
- **Root màu chính thức** đặt trong requirements.md → sẽ implement ở `src/styles/tokens.css`: token semantic (cấm hex rời), accent indigo `--accent`, kết quả symbolic teal `--result`, mực bút `--ink`; đủ light + dark.
- Việc tiếp theo (chat sau): typography/spacing tokens, cơ chế lưu preference, key i18n từng màn. Editor/frontend workstream khi scaffold phải tạo `tokens.css` + lớp i18n trước.

## 2026-06-11 17:20 — wire docs/requirements.md vào discovery path

- Bài học: tạo `docs/requirements.md` thôi KHÔNG đủ — agent không tự biết đọc. Đã trỏ từ mọi entry-point agent thực sự đọc đầu phiên:
  - `CLAUDE.md`: thêm note spec sau §3 + bullet (d) trong §13 hard-gate.
  - `.claude/master.md` §8: thêm 2 row bảng "Trỏ tài liệu" (requirements.md + feature.md).
  - `.claude/agents/editor-frontend.md`: thêm file #6 "Đọc đầu phiên" + hard constraint + row self-verify gate (i18n/theme/tokens/thiết bị).
  - `.claude/agents/handwriting.md`: thêm file #7 "Đọc đầu phiên" (bút: pointer:coarse, token --ink).
  - `.claude/skills/build-verify/SKILL.md` Stack 1: thêm row gate yêu cầu nền + lệnh `grep` hex rời (kỳ vọng rỗng).
  - `.claude/teams/playbook.md` Tham chiếu nhanh: thêm dòng spec sản phẩm.
- Pattern chung: file spec mới phải được wire vào master.md (mọi agent đọc) + agent body liên quan + gate skill, nếu không = dead doc.

## 2026-06-11 18:30 — feature-clarify task #5: docs/feature.md bản đầy đủ (A–J)

- docs/feature.md viết lại hoàn chỉnh theo spec A–J từ lead (tổng hợp type-research + ink-research).
- Sections thêm: nền giấy kẻ ngang · free-placement model (lineIndex+xOffset, NodeView) · block bounding-box + inkStrokes song song · state machine (EMPTY→EDITING/INK-CAPTURE→…→RESULT) · timing (gõ ~400ms, bút ~1.5s+INK-PREVIEW, confidence-gated) · render-dưới đồng nhất [LEAD-CHỐT] · UX 4 lớp (slash/toolbar/palette/tips) + parity bút (radial menu/⋮) · bảng parity 3 nhóm · rủi ro đầy đủ (cloud-vs-native iink HUMAN GATE, MathLive+ProseMirror spike, collision).
- 3 điểm user cần quyết: (1) §11 cloud iink vs native + ngân sách (blocker đường bút) · (2) thiết bị cụ thể iPad/Surface · (3) lớp AI fallback parse ngay MVP hay sau.
- Việc tiếp theo: user review feature.md, chốt §11 HUMAN GATE → sau đó architect thiết kế free-placement + spike MathLive+ProseMirror → editor-frontend + backend-cas bắt đầu được.

## 2026-06-11 18:10 — feature-clarify: docs/feature.md làm rõ 2 đường nhập

- Team feature-clarify (type-research + ink-research + synth-planner) hoàn thành.
- `docs/feature.md` đã được viết lại đầy đủ (từ stub 23 dòng → spec hoàn chỉnh).
- Nội dung cover: §1 Đường gõ (MathLive, shortcuts, virtual keyboard, output LaTeX), §2 Đường bút (MyScript, palm rejection, gesture, human gate §11.2), §3 Document block model (states, live eval, toggle exact/decimal), §4 Output contract (exact_latex / approx_latex / is_approx / error JSON), §5 Phạm vi toán MVP, §6 Câu hỏi còn mở (§11.1/11.2/11.3), §7 Điều hướng team.
- Bài học: LaTeX output contract (exact/approx phân biệt, is_approx flag bắt buộc dùng --approx token) phải rõ sớm để backend-cas và editor-frontend không cần đoán.
- Việc tiếp theo: user review feature.md, chốt §11.2 (license MyScript) để quyết định scope MVP; sau đó trỏ long-plan cho Editor/CAS workstream.

## 2026-06-11 — làm rõ 2 đường nhập (team feature-clarify) → docs/feature.md bản đầy đủ

- Team `feature-clarify`: 2 researcher (type-research=gõ, ink-research=bút) chạy 2 vòng (R1 research app thật + R2 thảo luận chéo hội tụ) → synth-planner tổng hợp vào `docs/feature.md` (mở rộng từ stub thành bản đầy đủ §1–§12). Lead phân xử các điểm bất đồng.
- **Quyết định thiết kế đã chốt (đưa vào feature.md, là input cho architect/editor-frontend sau):**
  - **Nền giấy kẻ ngang** là canvas chung; đường kẻ = baseline/writing-guide (không snap cứng); line-height ~60–80px cho math.
  - **Free-placement model** (giải quyết yêu cầu "con trỏ đặt bất kỳ đâu" của user): block toán = object absolute-positioned theo `(lineIndex, xOffset)` — mô hình OneNote note-container map sang ProseMirror NodeView (lưu attrs, CSS absolute; ProseMirror vẫn quản nội dung+undo). Gõ click / bút pen-down = MỘT ý niệm "đặt nội dung tự do". Canvas thuần (Excalidraw) bị loại (mất document semantics).
  - **Block = bounding-box claim N dòng kẻ** (input zone + result zone), giãn theo nội dung; node lưu SONG SONG `inkStrokes[]` + `latexContent`. Nhiều block/dòng được phép, collision→snap.
  - **[LEAD-CHỐT, user-refine] Kết quả render LIỀN MẠCH, KHÔNG khung**: cùng dòng `=` nếu ngắn, tự xuống dòng kẻ kế nếu dài; phân biệt input↔result CHỈ bằng màu (`--result` indigo), không viền/không đường ngăn. "block" = đơn vị VÔ HÌNH (chỉ logic/layout/collision), highlight nhẹ khi hover/select. (Bỏ mô hình "input/result zone có khung" và "luôn dưới" của bản nháp — user thấy đóng khung phá cảm giác giấy.)
  - **[LEAD-CHỐT, user-refine] Phím lệnh = `\` (backslash), KHÔNG dùng `/`**: `/` = phép chia dễ lẫn; `\` đã là tiền tố LaTeX → "backslash = lệnh" thống nhất (trong MathLive: autocomplete LaTeX; ngoài: menu tạo block). `/` luôn giữ nghĩa chia.
  - **[LEAD-CHỐT, user-refine] §7.5 định dạng cơ bản + 3 loại nội dung**: Nib chứa 3 loại — **math** (cỡ+màu nhấn, KHÔNG B/I/U vì phá nghĩa LaTeX; màu kết quả khoá theo token --result/--approx), **text/prose** (nhãn/tiêu đề/ghi chú — B/I/U/S/cỡ-bậc/màu/highlight, Docs-like không như Word), **ink tự do** (vẽ không convert — pen palette size/màu/highlighter/tẩy). Định dạng đặt ở floating toolbar ngữ-cảnh-hoá theo loại + pen palette. Swatch màu preset thích ứng light/dark.
  - **[LOCKED — user chốt] Cỡ chữ/bút KHÔNG đổi khoảng cách dòng kẻ**: lưới giấy cố định; nội dung to hơn → block claim thêm dòng (bounding-box §2.4). Chỉnh line-spacing/mật độ giấy = tính năng riêng, ĐỂ SAU (ngoài phạm vi hiện tại).
  - **Timing**: gõ debounce ~400ms auto-eval; bút idle ~1.5s → nhận diện → INK-PREVIEW (mực 50% + LaTeX, auto-advance, re-write, confidence-gated) → eval. Cả 2 AUTO, không nút "=", không modal confirm bắt buộc. Asymmetry hợp lý.
  - **State machine chung**: EVALUATING→RESULT-RENDERED giống 100%; bút thêm INK-RECOGNIZING/INK-PREVIEW. RESULT-RENDERED kiểu Typora focus/blur; sửa lại bằng cả 2 modality (pointerType quyết).
  - **UX nhập lệnh 4 lớp**: slash `/` (người mới) · floating toolbar (selection) · Ctrl+K palette (người cũ) · contextual tips (theo hành động lần đầu, max 1/session, KHÔNG random thuần). Mirror sang bút: long-press radial ≈ slash, nút ⋮ ≈ palette → command access là parity.
  - **Parity gõ↔bút**: ~12 parity / chỉ-bút 5 (palm rejection, zoom-box, scratch-out, ink/pressure render, INK-PREVIEW) / chỉ-gõ 2 (virtual math keyboard, ASCII shortcut+LaTeX-direct+phím tắt).
- **[HUMAN GATE] chờ USER quyết (blocker đường bút, chưa chốt):**
  1. **Cloud iink (online-only) vs native iink SDK (offline nhưng Linux/macOS chưa confirmed) + ngân sách license §11.2.** Hệ quả: gõ luôn offline (SymPy sidecar), bút mất hoàn toàn khi offline nếu cloud → bất đối xứng availability. Quyết trước khi architect/handwriting commit.
  2. Thiết bị mục tiêu §11.1 (iPad Pro / Surface / cả hai).
  3. Có làm lớp AI (parse input bừa + giải thích bước) ngay MVP hay để sau.
- **Rủi ro kỹ thuật ghi trong doc**: spike ≤1 ngày bug MathLive+ProseMirror "draggable property conflict" trước khi commit stack editor-frontend; ink-canvas overlay làm event propagation phức tạp hơn — test chung.
- Việc tiếp theo: khi user chốt HUMAN GATE → architect thiết kế HOW cho free-placement + collision + state machine; editor-frontend dựng vòng "gõ 1 block → kết quả symbolic inline" trước (MathLive only), bút ghép sau.

## 2026-06-12 — [USER-CHỐT] Mô hình "bấm nút để tính" — LẬT auto-eval (team editor-features)

- Team editor-features (type/ink researcher 2 vòng + synth-planner) viết lại docs/feature.md. User chốt mô hình tương tác MỚI, **lật quyết định [LOCKED] auto-eval** trước đó.
- **Nút "Tính" [=]** thay auto-eval: bấm chủ động, 1 lần làm CẢ HAI — (a) nếu mực bút: HTR nhận diện ink→LaTeX (ngầm, không nút riêng), (b) gửi CAS ra kết quả. Gõ dùng CÙNG nút (bỏ qua bước HTR). Gõ↔bút CÙNG UX, chỉ khác logic nội bộ. Bỏ debounce 400ms / idle 1.5s / INK-PREVIEW auto-advance.
- **Phạm vi Tính**: target = vùng BÔI ĐEN (không chọn → biểu thức gần con trỏ, architect chốt); NGỮ CẢNH biến = CẢ TRANG (x=5 ở block khác vẫn có hiệu lực).
- **Nút "Convert"** = toggle loại block TOÁN↔CHỮ (hành xử như B/I/U: bôi đen→đổi đoạn; không bôi đen→ký tự gõ tiếp theo theo loại mới). Toán→chữ = ký tự thành text thường; chữ→toán = parse công thức. KHÔNG liên quan nhận diện mực.
- **Bút giữ nguyên mực khi Tính**: nét viết tay KHÔNG bị thay bằng typeset; HTR chỉ ghi ngầm vào latexContent; kết quả hiện riêng (--result). Tùy chọn "Xem LaTeX nhận diện" on-demand. (Bỏ INK-PREVIEW kiểu mờ-mực-thay-bằng-LaTeX.)
- **Bút đổi loại** = lasso → "Use as Math / Use as Sketch" (parity của nút Convert bên gõ).
- **`\`** = chỉ mở bảng ký hiệu/lệnh LaTeX (chèn), KHÔNG đổi loại block. `/` luôn là phép chia. Live render WYSIWYG khi gõ vẫn có (chỉ CAS không chạy tới khi Tính).
- **§7.5 viết lại**: 3 loại nội dung (toán/chữ/ink-tự-do) + định dạng theo loại (toán: cỡ+màu nhấn, không B/I/U; chữ: B/I/U/S+3 bậc cỡ+swatch; ink: pen palette) + swatch 8 màu thích ứng theme + [LOCKED] cỡ-chữ-không-đổi-line-spacing + surface (pen palette dọc + floating toolbar ngữ-cảnh) + MVP-vs-sau + paste mặc định chữ thuần.
- **Mới chốt thêm**: Find chỉ trong text; paste plain (Ctrl+V & Ctrl+Shift+V đều plain, giữ-format để sau).
- **Architect phải chốt (§11.5) trước khi build**: unified undo manager (MathLive stack ↔ ProseMirror history), target-của-Tính-khi-không-bôi-đen, Convert ca biên, gesture long-press vs shape-snap.
- **HUMAN GATE còn treo (chưa hỏi xong)**: cloud-vs-native iink + license §11.2 (bất đối xứng offline: gõ tính offline OK, bút cần iink) · thiết bị §11.1 · lớp AI MVP hay sau. Lead đã đề xuất: gõ offline-complete làm lõi, bút cloud free-tier trên Windows trước, AI Phase 2.
- (Sự cố phối hợp planner quên report → ghi ở `.claude/teams/issues.md` ISSUE-1, không phải ở đây.)

## 2026-06-12 — design-plan: docs/design.md (team 3 researcher + synth-planner, 2 vòng)

- Team `design-plan`: 3 researcher (rs-layout=responsive/canvas · rs-interaction=UX flow · rs-visual=design system) chạy R1 (độc lập) + R2 (hội tụ chéo, mỗi người chủ trì 1 theme) → synth-planner tổng hợp `docs/design.md` (12 mục). Lead gate PASS từng bước. Quy trình giống feature-clarify trước.
- **Sản phẩm**: `docs/design.md` — tầng thiết kế UI/UX (WHAT), input cho architect+editor-frontend. Quan hệ: requirements.md (nền) → feature.md (tính năng) → design.md (UI/UX).
- **Quyết định design đã chốt (đưa vào doc)**:
  - **Always-explicit active block** [giải ambiguity lớn nhất: block vô hình + nhiều block/dòng → target nút Tính mơ hồ]: luôn đúng 1 block active highlight `--accent-subtle` = preview "Tính sẽ tính block này"; không active → Tính+toolbar ẩn. Left-edge line **2px --accent** (chỉ EDITING, không INK-CAPTURE) = tín hiệu "đang trong block" (cũng phân biệt context `\`).
  - **Canvas spatial model**: xOffset = px tuyệt đối (authoring intent) + **clamp render-time** (không persist) → block không mất khi xoay/đổi máy; canvas **max-width 1440px** centered; **--ruled-line-height 64px [LEAD CHỐT]** + partial-gap tự nhiên (bg phủ contentHeight+8px, phần dư hiện ruling).
  - **Responsive**: thêm breakpoint **sub-compact 820–1023** (iPad Pro 11" portrait). 4 breakpoint: sub-compact/compact/regular/wide. Pen palette ẩn khi chỉ chuột; detect pointerType runtime.
  - **Result visual**: MathLive static `<math-span>`; redundant signals (=/≈ prefix → spatial → luminance → hue → badge); **inline toggle exact↔decimal** (không ẩn trong toolbar); badge ≈ (20px visual + 44px hit area).
  - **Design system**: font Inter (UI+prose) + Computer Modern (math); type scale 3 tầng + spacing 8-step + ruling token — tất cả token MỚI là ĐỀ XUẤT chờ implement vào tokens.css. Swatch 8 màu. Iconography outline Phosphor/Lucide, pen-tool = ngòi bút (brand Nib), KHÔNG emoji.
- **[USER CHỐT] (qua AskUserQuestion, lead phân xử)**:
  1. **iPad Pro 11" portrait 834px ĐƯỢC HỖ TRỢ** → nới min-width 1024→**820px** + breakpoint sub-compact. (requirements.md §2 cần sửa.)
  2. **--approx light #9A6A11 → #7A5200** (fail WCAG AA 4.16:1 → 6.63:1 ✓; --warning light đổi theo; dark giữ #D6A53E). (requirements.md §3 cần sửa.)
- **[LEAD CHỐT]**: first-run session ngoại lệ cho contextual tips (starter content + ghost text không tính quota max-1-tip). (feature.md §7 Lớp 4 cần sửa.)
- **Spec changes design phát hiện (mục 10 design.md — CHƯA áp dụng, chờ task sửa riêng)**: 10.1 min-width 820+sub-compact (requirements §2) · 10.2 --approx #7A5200 (requirements §3) · 10.3 first-run tips (feature §7) · 10.4 token typography/spacing/ruling (tokens.css) · 10.5 swatch 8 màu (tokens.css).
- **Câu hỏi mở cho architect (mục 11, 9 câu)**: target Tính không-bôi-đen + multi-block selection (§11.5 feature) · focus persistence ProseMirror · xOffset origin/edge · ruling CSS vs SVG · MathLive --math-ink-color spike ≤2h · NodeView structure {badge+math-span+toggle} · canvas max-width constant vs configurable · unified undo manager (§11.5).
- **Sự cố phối hợp**: ISSUE-2 (OTHER, open) — lead spawn 4 teammate nhưng quên áp tmux pane layout §8; đã fix tạm thời (re-layout N=4 2×2 grid) cho team này; fix bền (thêm bước layout vào recipe §2 playbook) chờ user duyệt (high-impact).
- **Việc tiếp theo**: (a) user duyệt → giao task sửa requirements.md §2/§3 + feature.md §7 theo mục 10; (b) implement tokens.css (typography/spacing/ruling/swatch) khi scaffold; (c) architect xử 9 câu mục 11 TRƯỚC khi editor-frontend implement nút Tính + undo + NodeView.

## 2026-06-11 17:40 — chốt màu chủ đạo: Teal Ink (sửa lại root màu)

- User phản hồi: bản root màu đầu (indigo/teal generic) làm qua loa, chưa suy từ "app cần gì / màu chủ đạo là gì". Đã làm lại có lập luận trong `docs/requirements.md` §3.
- **Quyết định màu (user chốt qua AskUserQuestion):** màu chủ đạo = **Teal Ink `#0E7C86`** (xanh ngọc — họ mực bút máy, khớp tên Nib=ngòi bút, kỹ thuật hơn xanh dương).
- Hệ hue (mỗi hue 1 việc): **Teal** = brand/nút/caret/nét bút/info · **Indigo-violet `#4B3FBF`** = kết quả symbolic exact (tách hẳn teal để input↔output không lẫn) · **Green `#137A52`** = success · **Amber `#9A6A11`** = kết quả số gần đúng (§8.3 numeric fallback) + warning · **Red `#B42318`** = lỗi. Nền giấy ấm (không #FFF), dark = graphite ấm (không đen tuyền).
- Token mới so với bản đầu: thêm `--caret`, `--approx`/`--approx-subtle` (đánh dấu kết quả làm tròn — nhu cầu đặc thù app). Đủ light + dark trong `src/styles/tokens.css`.
- Bài học: "root màu" không phải chọn palette đẹp — phải suy từ brand (tên/metaphor) + nhu cầu chức năng (input≠result, exact≠approx) rồi mới gán hue.

## 2026-06-13 — toolbar-redesign: gộp toàn bộ tùy chọn vào 1 vertical tool dock luôn-hiện

- User yêu cầu THIẾT KẾ LẠI thanh tùy chọn: từ FloatingToolbar ngữ-cảnh (ẩn khi không active) + PenPalette riêng → MỘT box dọc nổi bo góc, HIỆN MẶC ĐỊNH, gộp hết, KHÔNG phân biệt block văn bản/toán, click bung popover. Gửi 2 ảnh tham chiếu (ảnh 1 phác thảo sơ, ảnh 2 = bản Claude dựng "giải phẫu palette" 5 nhóm: drag-handle ⋮⋮ / Chọn·Bút·Dạ quang·Tẩy / Cỡ-nét·Màu-mực popover / nút Tính teal có badge đếm block / thu gọn⇌). User chốt: "hình dáng ổn nhưng CÁC OPTION chưa làm rõ nên sai".
- Team `toolbar-redesign` (researcher → planner). Researcher Task #1 PASS: bảng làm-rõ-option đối chiếu ảnh2-vs-code-vs-nhu-cầu. Phát hiện: 🔴 chưa có code = drag-handle, block-select tool, Duplicate; 🔴 ảnh2 bỏ sót = B/I/U/S, H1-3, cỡ toán, Copy LaTeX, toggle exact↔decimal (đều cần selection); lẫn "Màu mực"(ink stroke) vs "Màu"(block color). Pattern tldraw/GoodNotes/Notion: tool-selection luôn-hiện, format luôn contextual — KHÔNG nhồi hết 1 container.
- **[USER CHỐT qua AskUserQuestion]** 4 quyết định cho planner:
  1. **Thay thế hẳn** FloatingToolbar — dock là nơi duy nhất; nhóm "Khi chọn block" (Convert/Màu/Nhân đôi/Xoá + format) MỌC THÊM vào chính dock. Xóa FloatingToolbar cũ.
  2. **Format-cần-selection vào nhóm ngữ-cảnh + popover** — B/I/U/S + cỡ gom popover "Định dạng"; toggle exact↔decimal GIỮ inline cạnh kết quả (design.md §7.4).
  3. **Nút chuyển chế độ Gõ ⇄ Bút** trên dock (KHÔNG ẩn theo thiết bị) — toggle đổi giữa bộ option-cho-gõ và bộ option-cho-bút.
  4. **Bộ công cụ vẽ = Chọn · Bút · Dạ quang · Tẩy** (Lasso gộp trong flyout "Chọn"; không có bút chì).
- ⚠️ Lật design.md §4.1/§4.3/§5.1 (always-explicit-active-block + toolbar-ẩn-khi-không-active). Planner/sau này phải cập nhật design.md cho khớp.
- Planner Task #2 PASS (user DUYỆT): spec unified dock 6 nhóm (A drag+mode-toggle / B công cụ bút chỉ-mode-Bút / C ngữ-cảnh mọc-khi-chọn-block / D Tính luôn-hiện disabled-khi-không-block / E collapse). Giải các option "trước đây sai": Recalc=cùng-nút-Tính-đổi-label; B/I/U/S+cỡ→popover "Định dạng"; tách "Màu mực"(nét bút) vs "Màu khối"(màu chữ/nhấn); toggle exact↔decimal giữ inline; H1/H2/H3→Lớn/Thường/Nhỏ; mới phải làm = drag-handle/block-Select/Duplicate. ~20 i18n key dock.* (en+vi), token tái dùng không hex rời, xóa FloatingToolbar+PenPalette+css → tạo UnifiedDock.tsx+dock.css.
- **[USER CHỐT]**: (a) duyệt spec → sang architect HOW; (b) giữ **8 màu mực** (cả bộ SwatchPicker, KHÔNG rút 5 như ảnh 2).
- Mode mặc định: pen/coarse→Bút, fine→Gõ (runtime pointerType, không media-query đơn). Tính disabled-but-visible khi không active block. Badge đếm block khi multi-select N≥2.
- Architect Task #3 PASS: HOW 5 mục A–E. Component tree UnifiedDock + thư mục con (DockPopover/FormatPanel/BlockColorPanel/StrokeSizePanel/InkColorPanel/SelectToolFlyout/ModeToggle) + hook useDockPrefs (localStorage nib-dock-mode/-collapsed/-position) + mở rộng EditorContext (activePenTool) + command mới duplicateBlock. 5 rủi ro: dock-overlay-che-canvas-iPad / popover-lật-hướng+touch-close+flyout-chevron-không-long-press / activePenTool-breaking-type / drag-setPointerCapture+touch-action / undo-MathLive-vs-PM-sau-duplicate.
- **GÓI HANDOFF**: lead tổng hợp WHAT(planner)+HOW(architect)+4-quyết-định-user → `docs/dock-handoff.md` (tự-chứa, để user gửi cho "claude design" dựng UI). Owner xác nhận mục tiêu = handoff cho bên design ngoài, KHÔNG dùng editor-frontend của team.
- Chain design toolbar-redesign HOÀN TẤT (researcher→planner→architect, mọi gate PASS). Team shutdown + TeamDelete.
- Việc còn lại (chưa làm, khi nào owner muốn): (a) cập nhật docs/design.md §4.1/§4.3/§4.4/§2.3 cho khớp dock mới (lật always-explicit-active-block); (b) nếu owner muốn team tự implement thay vì claude design → editor-frontend dựng UnifiedDock theo docs/dock-handoff.md.

## 2026-06-14 — dock-v2: build v2 Tool Dock (UnifiedDock) vào APP THẬT (team dock-v2)
- User yêu cầu dựng "thanh tùy chọn" giống reference `docs/Nib-Dock-v2-ref.html` (= "Nib · Tool Dock v2"), **build vào src/ app thật** (KHÔNG mock web rời — user: "dần dần từ mock chuyển thành app nên làm app luôn"). Lệnh cứng: **HTML thắng tuyệt đối khi xung đột** với docs cũ (dock-handoff.md/design.md/feature.md). User cũng yêu cầu quy trình **long-plan rồi mới thực hiện**.
- Team `dock-v2` (planner + editor-frontend). Long-plan: `plan/dock-v2/PLAN.md` + `CHECKPOINT.md` (3 session / 2 phase). Mọi gate PASS, lead verify độc lập (tsc 0 / build ✓ / vitest 42/42 / grep refs cũ rỗng / 0 hex rời).
- **Kết quả:** `src/components/UnifiedDock/` (16 file: UnifiedDock + DragHandle/ModeToggle/DockBtn/CalcBtn/FlyoutPanel + 6 Flyout + dockState.ts(+test) + dock.css + index.ts). +13 icon HTML-exact vào icons.tsx. 31 key `dock.*` en+vi. Token map (--sw-*→--swatch-*, --sh1/2→--shadow-1/2, --desk→--bg-app; pulse=color-mix). State local + persist localStorage `nib-dock-mode`/`nib-dock-collapsed`. Wire: Tính→evalBlock, Convert→convertNibBlock, Format B/I/U/S→toggleMark. Mount `<UnifiedDock editor={editor}/>` trong Canvas.tsx = tool surface DUY NHẤT.
- **XÓA** FloatingToolbar.tsx + PenPalette.tsx + toolbar.css + pen.css (user chốt phương án (a): dock là duy nhất).
- **[USER CHỐT] 6 chức năng DROP → để Phase context-menu/chuột-phải sau:** Xoá block non-empty · Copy LaTeX · Copy kết quả · Toggle cỡ math display↔normal · Text scale H1/H2/H3 · Màu khối. (KHÔNG mất: auto-delete block rỗng, toggle exact↔decimal inline ở ResultView, Ctrl+K palette, `\` symbol menu, Ctrl+Shift+M convert.)
- **Xung đột HTML thắng (ghi PLAN.md):** Pointer/Select luôn hiện cả 2 mode (cũ: chỉ Bút) · mode toggle = 1 nút cycle+▾ (cũ: segmented) · collapsed = 56×56 vuông chỉ penIcon · Format hiện theo mode=Gõ (cũ: theo block chọn) · bỏ hẳn Copy/Nhân-đôi/Xoá khỏi dock · Tính không disabled/badge.
- **Còn treo:** browser click-through smoke CHƯA chạy (Chrome extension không connect ở cả editor lẫn lead context) — cần user tự `npm run dev` (:1420) click thử vòng lõi (gõ block → Tính → result inline; Convert; B/I/U/S). Hit-target: nút dock cao 30–40px < 44px [LOCKED] nhưng giữ theo HTML (user lệnh HTML thắng); CalcBtn 44×44.

