# Memory — context (trạng thái hiện tại)

> Trạng thái phase/workstream đang chạy, quyết định gần đây, việc tiếp theo, kết quả smoke-test.
> Mọi vai đọc file này đầu task. LUÔN append (`## YYYY-MM-DD HH:MM — slug`), không overwrite. Dùng 10 entry mới nhất.

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

## 2026-06-15 — dock-v2 Phase 3 DONE: drag-reposition + overflow-aware expand/flyout
- User thêm 2 yêu cầu sau Phase 1–2: (1) dock KÉO THẢ đổi vị trí (cả mở rộng lẫn thu gọn); (2) khi dock ở thấp, expand/flyout overflow đáy → phải lật LÊN. Planner thêm Phase 3 vào plan/dock-v2/PLAN.md (2 session); editor-frontend implement; lead verify độc lập (tsc 0 / build ✓ / vitest 50/50 / 0 hex rời / 0 top-hardcode).
- **Session 3.1 (drag):** UnifiedDock → createPortal(document.body) + .nib-dock-anchor position:fixed. State pos{x,y} persist localStorage `nib-dock-pos`; dockState.ts thêm DOCK_POS_KEY/defaultPos/clampPos/parsePos (+5 test). Drag qua setPointerCapture trên DragHandle (mở rộng) + ô collapsed 56×56; tap-vs-drag threshold <4px; window.resize re-clamp; [data-dragging] tắt transition. EditorContext KHÔNG vỡ (portal chỉ đổi DOM mount).
- **Session 3.2 (overflow flip):** doExpand() chọn expandDir up/down theo spaceBelow=innerHeight-pos.y vs DOCK_EXPANDED_H(460) TRƯỚC animation (data-expand-up → CSS bottom:0;top:auto). Flyout: xóa top hardcode CSS, tính JS tại tog(k) qua btnRefs+expandedRef getBoundingClientRect → flyoutTop() fit→xuống / else lật lên clamp≥0; style prop xuống 6 flyout. Pure helpers expandDirection/flyoutTop (+3 test). prefers-reduced-motion giữ.
- **Toàn bộ plan dock-v2 HOÀN THÀNH 5 session** (1.1 scaffold / 1.2 state machine / 2.1 wire+xóa cũ / 3.1 drag / 3.2 overflow). vitest 50/50.
- **CÒN TREO (chỉ user smoke được — Chrome extension không connect ở mọi context agent):** click-through thật. User cần `npm run dev` (:1420) kiểm: kéo dock 2 trạng thái + persist reload; dock đáy→expand mở lên; flyout nút thấp→lật lên; vòng lõi gõ→Tính→result inline; Convert; B/I/U/S.
- Team dock-v2 đã shutdown + TeamDelete sau entry này.

## 2026-06-15 — tauri-shell DONE: vỏ Tauri 2 (app desktop native) — team tauri-shell
- User yêu cầu dựng vỏ Tauri 2 để Nib chạy thành cửa sổ desktop native (không qua browser). Quy trình: long-plan trước → implement → gate evidence. Team `tauri-shell` (chỉ `glue-packaging`), lead drive TaskList loop.
- Môi trường (lead đo): Ubuntu 26.04 · rustc/cargo 1.96.0 · Node v24.15.0 · webkit2gtk-4.1 2.52.3 + javascriptcoregtk-4.1 + libsoup-3.0 + gtk+-3.0 ĐỀU CÓ (KHÔNG cần apt install) · display Wayland :0 GNOME.
- Long-plan: `plan/tauri-shell/PLAN.md` + `CHECKPOINT.md` (2 session). Mọi gate PASS, lead verify độc lập.
- **Kết quả:** `src-tauri/` (Cargo.toml + build.rs + src/lib.rs + src/main.rs + tauri.conf.json + icons/). `cargo build` exit 0 (lead re-run 2.6s cached). package.json: `@tauri-apps/api@^2` (dep) + `@tauri-apps/cli@^2` (devDep) + script `"tauri":"tauri"`. tauri.conf.json: identifier com.nib.app, devUrl :1420, beforeDevCommand `npm run dev`, beforeBuildCommand `npm run build`, frontendDist ../dist, csp:null (dev), minWidth 820, **externalBin:[] = slot chừa Python SymPy sidecar (CHƯA wire)** + TODO comment trong lib.rs/Cargo.toml.
- **Session 2 (`npm run tauri dev`):** PASS ở mức process — Vite ready :1420, no panic, 0 error, `target/debug/nib` + WebKitWebProcess RSS 415MB (render React+MathLive+KaTeX+TipTap thật) + ESTAB TCP→:1420, kill sạch không orphan. **Visual UI (canvas+dock pixels) = CÒN TREO user smoke** — KHÔNG có screenshot tool nào trên máy (gnome-screenshot/grim/scrot/import/ffmpeg đều absent; gdbus GNOME Shell screenshot AccessDenied) ở cả agent lẫn lead context.
- **Bài học (mistakes.md):** `tauri-icon-must-be-rgba` — PNG icon cho `generate_context!()` phải RGBA (color type 6), không phải RGB (type 2), validate tại compile time.
- **CÒN TREO (chỉ user smoke):** `cd /home/gnuh/Documents/project/Nib && npm run tauri dev` → xác nhận cửa sổ "Nib" mở với ruled-paper canvas + UnifiedDock teal, console 0 error. Nếu blank page → respawn glue (build đã cached, rẻ).
- Team tauri-shell shutdown + TeamDelete sau entry này.

## 2026-06-16 — sidebar-design: docs/sidebar-design.md (team 2 researcher hội tụ + synth-planner)
- User yêu cầu thiết kế lại **sidebar TRÁI** (chưa build — chỉ mock trong ảnh, không có markup trong repo). Team thiết kế (chưa build): `rs-patterns` (IA pattern Notion/OneNote/Obsidian/AppleNotes/GoodNotes/Craft) + `rs-critique` (phản biện UX) → cả 2 HỘI TỤ (không mâu thuẫn, bỏ vòng cross) → `synth` (planner) viết `docs/sidebar-design.md`. Lead gate PASS từng bước; 1 vòng FAIL→re-do (synth quên áp update bỏ-folder, lead grep phát hiện, gửi diff-fix → PASS).
- **Phát hiện research then chốt:** Nib document = canvas free-placement, KHÔNG phân trang → "page thumbnail" (ý tưởng user gửi, ảnh PDF-viewer mobile) VÔ NGHĨA — đó là lý do user thấy xấu. Không app nào outline canvas-tự-do bằng heading tuyến tính; ngành dùng minimap (GoodNotes/Figma) hoặc page/section thumbnail. "Tài liệu hiện tại" nếu chỉ là tên doc đang mở = trùng affordance với list all-docs → mode confusion.
- **[USER CHỐT qua AskUserQuestion] 3 quyết định LOCKED cho sidebar:**
  1. **BỎ section "tài liệu hiện tại"** — sidebar trái = CHỈ danh sách tài liệu; tên doc + switcher dời lên **top app bar** (kiểu Google Docs); không nav/outline/minimap trong-trang ở bản này.
  2. **"Toàn bộ tài liệu" mở rộng = bề mặt Library RIÊNG** (đề xuất OVERLAY làm mờ nền + Back, KHÔNG route thật vì Tauri single-window + giữ canvas mounted để Back khôi phục state) — KHÔNG phải trạng thái fullscreen-của-sidebar.
  3. **Library quản lý ĐẦY ĐỦ MVP.**
- **[USER CHỐT bổ sung] BỎ folder/nhóm hoàn toàn** — rail thu gọn phải là **flat title list**, folder không tối ưu cho trạng thái chỉ-title. Library management MVP còn 5: rename · xoá (có confirm modal `--error`) · duplicate · sort (modified/name/created) · search-theo-tên. **Tag = hướng tổ chức TƯƠNG LAI** thay folder (note ở §9 SAU MVP, chưa thiết kế).
- **IA 3 bề mặt** (sidebar-design.md): (a) top-bar doc switcher inline-rename + dropdown recent+"Xem tất cả" · (b) sidebar rail flat list (44px item, active = `--accent-subtle`+left-edge 2px, +New, "Mở thư viện", toggle persist `nib-sidebar-open`, responsive 4 breakpoint) · (c) Library overlay (List/Grid view, preview = text/LaTeX snippet KHÔNG canvas thumbnail). ~28 i18n key `sidebar.*`/`topbar.*`/`library.*` en+vi. Token-driven, 1 token mới đề xuất `--scrim` (derive color-mix, không hex rời).
- **4 câu hỏi mở cho architect** (chặn HOW, chưa làm): data model doc-list (localStorage/Tauri store/backend) · overlay-vs-route confirm · multi-doc state trong EditorContext (undo riêng từng doc? dock state scope theo doc hay global?) · preview snippet generation (cache lúc save vs runtime).
- **Việc tiếp theo (chưa làm):** khi user muốn build → architect xử 4 câu §10 TRƯỚC, rồi editor-frontend dựng rail + top-bar + Library overlay theo docs/sidebar-design.md. Team đã shutdown sau entry này.

## 2026-06-17 — nib-editor-rebuild DONE: re-code editor khớp design HTML (team chain đầy đủ)
- User giao: "spam agent + code lại `/home/gnuh/Downloads/Nib Editor.dc.html`" — file design do claude-design dựng + user chỉnh, là **NGUỒN CHÂN LÝ; xung đột → design HTML thắng tuyệt đối**. User báo: chỉ dock phải (UnifiedDock) đúng, còn lại sai.
- Team `nib-editor-rebuild` chain ĐẦY ĐỦ: researcher → planner → architect → editor-frontend (lead drive TaskList loop, gate evidence mỗi handoff). Plan: `plan/nib-editor-rebuild/PLAN.md` + CHECKPOINT.md (5 session).
- **[USER CHỐT 2026-06-17] chỉ hỗ trợ LANDSCAPE (ngang ≥1024px)** — SIẾT yêu cầu, BỎ portrait/sub-compact 820px (lật requirements.md §2 cũ — đã cập nhật §2). Rail đẩy layout, không cần collapse-khi-hẹp.
- **Kết quả (5 session + 1 restructure, mọi gate PASS, lead verify độc lập):**
  - S1.1 tokens.css: +3 token (`--desk`/`--sheet-shadow`/`--scrim`, giữ `--overlay` riêng) + sửa 7 token sai (`--shadow-2`/`--bg-subtle`/5 swatch) light+dark khớp design dòng 22–51.
  - S1.2 TopChrome: +nút rail-toggle (IconLayoutSidebar) + bỏ HẲN virtual-keyboard + railOpen state.
  - S1.3 Canvas/paper re-layout (rủi ro cao, gate vàng): desk wrapper (--desk) → paper 664px (--sheet-shadow + ruled) + margin-line + page-title + selection-overlay + hint-pill; geometry ref canvasRef→**paperRef** (xOffset từ PAPER-left); `.nib-editor-host` absolute→relative+min-height (RISK#1), `.nib-desk` position:static (RISK#2 offsetParent=nib-pm); STARTER xOffset 40→56. +canvasLayout.test.ts (3 risk-gate test).
  - **S1.4b RESTRUCTURE (divergence R1 editor phát hiện)**: design để HEADER full-width TRÊN, rail+canvas row dưới; code cũ TopChrome trong Canvas → sai. Architect revise → tạo **`Workspace.tsx`** (sở hữu useEditor + EditorContext.Provider + paperRef + railOpen + mọi handler); **Canvas thành presentational** 5 props; AppShell simplified; nib-body/nib-stage CSS. CRITICAL: UnifiedDock+CommandPalette giữ TRONG Provider.
  - S1.4 SidebarRail (`src/components/SidebarRail/`): width 256↔0 animate (.22s cubic-bezier), doc list 44px active edge, footer Mở thư viện. +`src/types/doc.ts` + `src/data/mockDocs.ts`.
  - S1.5 LibraryOverlay (`src/components/LibraryOverlay/` 10 file): scrim(--scrim z50)+panel(z60)+toolbar+DocCard+DocRow+DocContextMenu+DeleteModal(--error)+SortDropdown+RenameField; AppShell docs→useState + handlers mutate (new/rename/duplicate/delete/sort); nib-app position:relative+overflow:hidden. +util/relativeTime.ts. 17 key library.* en+vi.
- **Evidence cuối (lead verify):** tsc 0 · `npm run build` ✓ · vitest **53/53** · 0 hex rời ngoài tokens · i18n parity. UnifiedDock KHÔNG đụng (theo lệnh user).
- **CÒN TREO — chỉ USER smoke được** (Chrome ext không connect ở mọi agent context, như tauri-shell/dock-v2 trước): `npm run dev` :1420 (hoặc `npm run tauri dev`) kiểm: (a) header full-width trên cùng; (b) rail toggle trượt 256↔0 đẩy canvas + click doc đổi active+page-title; (c) **vòng lõi gõ block→Tính→result inline KHÔNG crash** (Provider bao Dock/Palette); (d) Library overlay: Mở thư viện→scrim+panel, grid/list, ⋯ context menu (rename inline/duplicate/delete), delete modal --error, Tài liệu mới, sort 3 option, back/scrim đóng; (e) paper 664 centered + ruled + block đặt đúng vị trí paper-relative.
- **Sự cố phối hợp ghi issues.md:** ISSUE-5 (lead skip planner — TÁI DIỄN ISSUE-3, lần 2 → ngưỡng cứng-hoá đạt) + ISSUE-6 (lead bỏ sót tmux layout §8 — đính chính ISSUE-2: `$TMUX` THẬT active 5 pane, KHÔNG phải in-process no-op; lead đã áp layout N=4 trong phiên). Cả 2 high-impact chờ user duyệt cho team-ops.
- Team shutdown + dọn sau entry này.

## 2026-06-18 13:00 — design-figma-added

- Vai mới `design-figma` thêm vào roster (9 vai): agent body `.claude/agents/design-figma.md` + skill `.claude/skills/figma-design/SKILL.md` (planKey `team::1618919057199763712`, 3 workflow, gate ≥5 điều kiện, 17 Figma MCP tool).
- Vị trí chain: song song architect khi task cần visual design Figma; handoff token spec + i18n key list → editor-frontend.
- 3 file high-impact đã soạn (`master.md` Roster 8→9 + HANDOFF CHAIN + §4 rubric + §8 trỏ skill; `playbook.md` §1 Cột A/C + 6 vai + §3 per-role + §5/§7 PASS + §8 N=6; `settings.json` +17 Figma MCP tool) — **CHỜ USER DUYỆT**.

## 2026-06-18 — nav-dock-redesign: thảo luận thiết kế + build 3 session (team chain đầy đủ)
- User yêu cầu "spam agent thảo luận" về việc **gom điều hướng vào dock + bỏ header/sidebar**. Team thiết kế (3 researcher nav-patterns/ia-reconcile/critique-risk, R1 độc lập + R2 hội tụ chéo qua lead relay) → lead tổng hợp `docs/nav-dock-design.md`. Sau đó user "làm luôn nếu được" → lead đánh giá buildable trực tiếp (không cần claude-design) → chain build: planner → editor-frontend (3 session), mọi gate PASS, lead verify độc lập.
- **[USER CHỐT qua 2 vòng AskUserQuestion] — đính chính hiểu nhầm "2 dock":**
  - Dock = **MỘT** (UnifiedDock chỉnh UI/UX), **nổi+kéo-thả như cũ**, dạng **drill-down 2 level**: NAV (Thư viện/Cài đặt/Gõ/Viết/Help + AccountChip) ↔ TOOLS (Back + tool theo mode). Gõ/Viết = **2 nút entry** thay ModeToggle (1 nguồn truth mode); Back = drill-up trong dock (KHÔNG browser history — Tauri 1 cửa sổ).
  - Bỏ header+sidebar → thay bằng **TopStrip mỏng** (tên doc + dropdown đổi doc + undo/redo + theme quick-toggle). Library overlay GIỮ.
  - Account = **avatar chip tròn đơn giản** trong dock (BỎ ý tưởng bo-góc-lõm: `corner-shape:scoop` chưa hỗ trợ trên WebKitGTK/WKWebView Tauri → SVG clip-path không đáng).
  - Lang+Theme → SettingsOverlay; **theme giữ thêm quick-toggle ở strip** (§7, default — user chưa veto).
- **Kết quả build (plan/nav-dock-redesign/, 3/3 session, vitest 56/56, tsc 0, 0 hex rời, 15 key §9 en+vi):**
  - S1.1: `dockState.ts` +DockLevel/navSelect/backToNav · `NavLevel.tsx` MỚI · UnifiedDock drill-down NAV↔TOOLS+Back · **XÓA ModeToggle.tsx** · +IconSettings/IconHelp · nút dock 40→**44px [LOCKED]**.
  - S1.2: `TopStrip.tsx` MỚI (doc-title+dropdown+inline-rename+undo/redo+theme toggle) · **XÓA TopChrome.tsx + SidebarRail/** · Workspace giữ EditorContext.Provider.
  - S1.3: `SettingsOverlay/` MỚI (lang+theme runtime+persist) · wire [Cài đặt]+[Thư viện]+AccountChip · AccountChip avatar-only (dock dọc hẹp, name qua title/aria).
- **Sự cố phối hợp: ISSUE-7 (open)** — editor-frontend spawn `mode:"plan"` (plan-approval cho S1.1 xóa ModeToggle) → sau ExitPlanMode KHÔNG về acceptEdits → prompt quyền ghi mỗi file. Lead fix tạm: S1.2/S1.3 spawn **default mode** (không plan) → hết prompt. team-ops điều tra tương tác plan-approval×permission-inherit (playbook §9/§10 + settings.json defaultMode=acceptEdits). HIGH-IMPACT → chờ user duyệt.
- **CÒN TREO — chỉ USER smoke** (Chrome ext không connect mọi agent context): `npm run dev` :1420 kiểm: NAV 5 nút+avatar → Gõ/Viết drill TOOLS+Back → NAV; strip doc-dropdown+rename+undo/redo+theme; [Cài đặt]/avatar → SettingsOverlay đổi lang/theme runtime; rail+header biến mất; vòng lõi gõ→Tính→result không crash.
- **Mục mở:** theme quick-toggle ở strip (default giữ — user xác nhận sau nếu muốn bỏ). Help nút còn placeholder (chưa có nội dung Help — session sau nếu cần).
