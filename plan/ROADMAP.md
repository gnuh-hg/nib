# Nib — Roadmap chia phase

> Bản đồ chia sản phẩm thành các phase độc lập; **mỗi phase = 1 long-plan** soạn riêng khi user yêu cầu. File này KHÔNG phải long-plan — chỉ mô tả *cần làm gì* + *cần làm rõ gì* để mỗi lần dựa vào đây dựng PLAN/CHECKPOINT (theo `plan-long`).

---

## Nền tảng đã chốt (không bàn lại)

- Quyết định **[LOCKED]** từ `CLAUDE.md` §3–§6: desktop-class (min 820px — nới từ 1024px per `docs/design.md` §2.2 [USER CHỐT]), document dạng block, hai input ngang hàng (gõ + bút), stack Tauri 2 + React/TS/Vite + TipTap/Lexical + MathLive + MyScript + FastAPI/SymPy.
- **[USER-CHỐT]** Mô hình tương tác: nút Tính 1 bấm = HTR (nếu mực bút) + CAS symbolic. Không auto-eval. Mực giữ nguyên sau Tính. Nút Convert = toggle toán↔chữ (không liên quan HTR).
- **[USER-CHỐT]** 3 loại nội dung: Toán (Math block) · Chữ (Text block) · Ink tự do. Lasso Use-as-Math/Sketch (bút) parity với Convert (gõ).
- **[USER-CHỐT/LEAD-CHỐT]** Kết quả liền mạch không khung; active-block `--accent-subtle` + left-edge 2px `--accent`; ruled paper 64px; canvas max-width 1440px; sub-compact 820–1023px.
- **[LOCKED]** Design tokens: `docs/requirements.md` §3 + `docs/design.md` §6 (typography/spacing/ruling/swatch 8 màu). Cấm hex rời. Cấm hardcode text (i18n). Đặt tại `src/styles/tokens.css`.
- Đường găng: **editor** (`CLAUDE.md` §8.1). Vòng "gõ 1 block → kết quả symbolic inline" là gate vàng xuyên suốt.
- Thứ tự xây: vòng gõ→symbolic trước (MathLive only), bút ghép sau khi CC-1/CC-2/CC-3 chốt (`CLAUDE.md` §12).
- Spec đầy đủ: `docs/requirements.md` + `docs/feature.md` + `docs/design.md`.

---

## Cross-cutting — cần chốt TRƯỚC khi vào phase liên quan

| ID | Câu hỏi | Trạng thái | Chặn phase |
|---|---|---|---|
| **CC-1** | Thiết bị cụ thể: iPad Pro / Surface / laptop cảm ứng / cả hai (§11.1 `feature.md`) | ⬜ | Phase 3 |
| **CC-2** | Ngân sách license MyScript — cloud iink free tier vs trả phí / native SDK (§11.2 `feature.md`) | ⬜ | Phase 3 |
| **CC-3** | Cloud iink vs native iink SDK — trade-off offline availability (§11.1 `feature.md`) | ⬜ | Phase 3 |
| **CC-4** | Lớp AI parse/giải thích (LLM fallback) — ngay MVP hay Phase 4 sau (§11.4 `feature.md`) | ⬜ | Phase 4 |
| **CC-5** | Tên dự án (§11 `CLAUDE.md`) — tạm dùng "Nib" | ⬜ (tạm Nib) | — |
| **CC-6** | Editor core: **TipTap hay Lexical** (`CLAUDE.md` §5) — phải chốt trước Phase 0 Session 1.2 (block model NodeView) | ⬜ | Phase 0 S1.2 |

---

## Các phase

### Phase 0 — Mock-UI shell (🔄 đang làm)

- **Cần làm gì**:
  - Scaffold Vite + React/TS Tauri-ready + `src/styles/tokens.css` đủ token (requirements §3 + design §6.2/6.3 typography/spacing/ruling/swatch 8 màu).
  - Theme light/dark/system (no-flash) + i18n en/vi provider runtime.
  - Ruled-paper canvas (64px, max-width 1440px, 4 breakpoints incl. sub-compact 820–1023px) + free-placement block model (NodeView `lineIndex+xOffset` attrs, CSS absolute) + active-block highlight (`--accent-subtle` + left-edge line 2px `--accent`).
  - Math block (MathLive WYSIWYG) + Text block (B/I/U/S + 3 bậc cỡ) + nút Convert toggle toán↔chữ.
  - Nút Tính → **MOCK CAS stub frontend** (không backend thật) → state machine §5 (EVALUATING → RESULT-EXACT / RESULT-APPROX / ERROR) → render kết quả §6 liền mạch (`--result`/`--approx`, badge ≈ spec, inline toggle exact↔decimal chip).
  - UX 4 lớp: floating toolbar ngữ-cảnh §7 Lớp 2 + `\` symbol panel Lớp 1 + `Ctrl+K` command palette Lớp 3 + contextual tips Lớp 4.
  - Pen palette UI-only (ẩn khi pointer:fine). Onboarding starter content + ghost text §4.5 `design.md`.
- **Cần làm rõ trước**: CC-6 (TipTap vs Lexical) phải chốt trước Session 1.2. Architect Task #1 output (HOW: component tree, mock CAS contract, file structure) là input cho tất cả session implement.
- **Done khi**: `npm run build` exit 0 + `tsc --noEmit` 0 error + vòng "gõ 1 block → Tính → kết quả mock symbolic inline" end-to-end trong browser (Vite dev), console 0 error + i18n switch en↔vi + theme light/dark/system.
- **Phụ thuộc**: không (phase đầu tiên). Cần architect HOW design (Task #1) xong trước khi implement.
- **Long-plan**: `plan/nib-mock-ui/` — 1 phase / 4 session.

---

### Phase 1 — Real CAS sidecar (FastAPI + SymPy pipeline)

- **Cần làm gì**:
  - FastAPI server + SymPy: endpoint `POST /eval` nhận LaTeX → trả `{exact_latex, approx_latex, is_approx, steps, error}` (contract chính xác từ mock Phase 0 sang thật — `docs/feature.md` §9).
  - Pipeline parse LaTeX → SymPy (`latex2sympy2` hoặc MathJSON→SymPy): số học exact, đạo hàm, tích phân, giải PT, Sum/Product, giới hạn, khai triển (`docs/feature.md` §10).
  - Timeout configurable (~5–10s) + numeric fallback khi SymPy không tích/giải được (`CLAUDE.md` §8.3).
  - Ngữ cảnh biến từ cả trang: `POST /eval` payload nhận context dict `{biến: LaTeX_giá_trị}`.
  - `pytest` fixture suite ≥10 ca đo được (vd `\int x\,dx` → `\frac{x^2}{2}+C`).
- **Cần làm rõ trước**: Spike `latex2sympy2` parse edge case (`\cdot`, `\,`, `\left\right`) trước khi commit pipeline — điểm dễ vỡ (`CLAUDE.md` §8.2). Không có blocker CC nào chặn.
- **Done khi**: `pytest` pass + `POST /eval` trả LaTeX chính xác ≥10 fixture (không làm tròn số) + timeout config + numeric fallback có trong code.
- **Phụ thuộc**: Phase 0 xong (lấy mock CAS contract làm real contract). Có thể song song nếu contract đã chốt từ architect.

---

### Phase 2 — Tauri shell + IPC frontend↔sidecar

- **Cần làm gì**:
  - Wrap Vite frontend vào Tauri 2 shell: `src-tauri/` config, `tauri.conf.json`, build desktop app.
  - Spawn Python sidecar (FastAPI server) từ Tauri: `tauri-plugin-shell` sidecar config.
  - IPC frontend → sidecar: thay mock CAS service bằng Tauri `invoke` / sidecar HTTP call thật.
  - App cài được, launch offline (SymPy chạy cục bộ — không cần internet để tính).
- **Cần làm rõ trước**: Tauri 2 API sidecar spawn (verify docs phiên bản hiện tại). Cách bundle Python runtime vào Tauri package.
- **Done khi**: `cargo build` trong `src-tauri/` pass + app launch (không cần dev server) + ≥1 IPC call frontend→sidecar trả về (console 0 error) + vòng "gõ 1 block → Tính → kết quả symbolic thật inline" chạy live trên app đóng gói.
- **Phụ thuộc**: Phase 0 + Phase 1 hoàn thành.

---

### Phase 3 — Handwriting (MyScript iink) ⛔ HUMAN GATE

> **⛔ KHÔNG bắt đầu trước khi CC-1 + CC-2 + CC-3 tất cả ✅.**

- **Cần làm gì**:
  - Tích hợp MyScript iink SDK (cloud hoặc native, tùy CC-3): canvas ink capture → HTR nhận diện → LaTeX khi user nhấn Tính.
  - Palm rejection (`pointerType: pen` only) + scratch-out gesture + lasso Use-as-Math/Sketch.
  - INK-CAPTURE state trong state machine + pen palette active (pen/highlighter/stroke-eraser/lasso + cỡ + swatch).
  - Mực giữ màu `--ink` sau Tính; kết quả HTR ghi vào `latexContent` ngầm; kết quả CAS hiện riêng màu `--result`.
  - Zoom-box GoodNotes-style (tùy CC-1 thiết bị).
- **Cần làm rõ trước**: CC-1 (thiết bị: iPad Pro / Surface / cả hai), CC-2 (ngân sách license), CC-3 (cloud vs native + offline trade-off), platform support Linux/macOS native SDK (`feature.md` §11.1).
- **Done khi**: bút → LaTeX nhận diện ≥5 ký hiệu toán (∫, Σ, x², sin, π) + `npm run build` exit 0 + `tsc --noEmit` 0 error + palm rejection hoạt động (touch không tạo ink).
- **Phụ thuộc**: Phase 2 + CC-1 + CC-2 + CC-3.

---

### Phase 4 — AI layer (LLM parse/fallback) ⛔ HUMAN GATE

> **⛔ KHÔNG bắt đầu trước khi CC-4 ✅ (user chốt có làm ngay hay để sau).**

- **Cần làm gì**:
  - LLM service (API hoặc sidecar): parse input bừa/không chuẩn → LaTeX hợp lệ — fallback khi HTR miss hoặc input mơ hồ.
  - Optional: giải thích từng bước (step-by-step) điền `steps[]` field trong response contract `feature.md` §9.
  - Integration với pipeline Phase 1 `/eval`: field `steps[]` hiện trống → Phase 4 điền.
- **Cần làm rõ trước**: CC-4 (ngân sách API LLM / model / privacy policy dữ liệu user), thiết kế trigger (khi nào fallback vs luôn qua LLM).
- **Done khi**: LLM parse ≥5 fixture bừa (`sinx`, `intégraler x au carré`…) → LaTeX hợp lệ SymPy nhận được + `pytest` pass + vòng "input bừa → LLM → CAS → kết quả" chạy.
- **Phụ thuộc**: Phase 1 + Phase 2 + CC-4.

---

### Phase 5 — Polish + post-MVP features

- **Cần làm gì (ưu tiên user chọn)**:
  - Cross-block selection + multi-block Tính (`design.md` §11.2).
  - @blockID reference (block dùng kết quả block khác — `feature.md` §7.5.5 "SAU MVP").
  - Export PDF/PNG.
  - Find/replace + find trong công thức.
  - HTR-to-text (viết tay chữ — chưa có Phase 3).
  - Pixel-eraser, pencil/brush tool, shape-snap, ruler.
  - Distribution channel: App Store / Microsoft Store / direct download.
- **Cần làm rõ trước**: User prioritize thứ tự tính năng; export engine (PDF); distribution channel + signing cert.
- **Done khi**: Từng tính năng user chọn pass gate riêng đo được.
- **Phụ thuộc**: Phase 0–3 hoàn thành (Phase 4 tùy CC-4).

---

## Thứ tự phụ thuộc

```
CC-6 (TipTap/Lexical) ── chốt trước Phase 0 S1.2
   │
   ▼
Phase 0 (Mock-UI, browser) ──────────────────────────────────► browser demo chạy
   │                                                                │
   │ contract mock → real                                           │
   ▼                                                                │
Phase 1 (Real CAS, FastAPI+SymPy) ──────────────────────────► /eval chính xác
   │                                                                │
   └──────────────────────────────────────────────────────────────►│
Phase 2 (Tauri IPC + packaging) ──────────────────────────────► app desktop chạy offline
   │
   ├── (CC-1+CC-2+CC-3 ✅) ──► Phase 3 (Handwriting / MyScript)
   │
   └── (CC-4 ✅) ────────────► Phase 4 (AI layer)
                                        │
                                        ▼
Phase 5 (Polish + post-MVP) ──────────────────────────────────► MVP shipped
```

---

## Cách dùng file này

Mỗi lần build 1 phase: user trỏ vào phase → dùng `plan-long` dựng `plan/<phase-slug>/PLAN.md` + `CHECKPOINT.md`, chốt phần "cần làm rõ" trước rồi chia session. Cập nhật bảng dưới khi phase đổi trạng thái.

| Phase | Long-plan | Trạng thái |
|---|---|---|
| Cross-cutting CC-1..CC-6 | — | ⬜ (CC-6 cần chốt trước Phase 0 S1.2) |
| Phase 0 — Mock-UI shell | `plan/nib-mock-ui/` | ✅ (2026-06-13, 4/4 session, vitest 31/31, gate vàng pass) |
| Phase 1 — Real CAS (FastAPI+SymPy) | `plan/phase-1-real-cas/` | ⬜ |
| Phase 2 — Tauri shell + IPC | `plan/phase-2-tauri-ipc/` | ⬜ |
| Phase 3 — Handwriting (MyScript) | `plan/phase-3-handwriting/` | ⬜ (chặn CC-1+CC-2+CC-3) |
| Phase 4 — AI layer | `plan/phase-4-ai-layer/` | ⬜ (chặn CC-4) |
| Phase 5 — Polish + post-MVP | `plan/phase-5-polish/` | ⬜ |
