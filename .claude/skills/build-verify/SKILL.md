---
name: build-verify
description: "Gate idiom đo được cho mọi implementer team note-ch (frontend / Tauri / backend / pipeline LaTeX→SymPy / vòng-lõi gõ→inline). Chạy lệnh thật, đọc exit code, nộp evidence — cấm gate cảm tính 'trông ổn'."
---

# build-verify — gate idiom đo được cho implementer note-ch

> Skill dùng chung cho **mọi implementer** (`editor-frontend` / `backend-cas` / `handwriting` / `glue-packaging`).
> Mục đích: biến "done" thành **lệnh chạy được + exit code + output cụ thể**, không phải cảm tính. Lead gate bằng evidence bạn nộp — evidence yếu = task bị trả lại.

---

## 0. Nguyên tắc bất biến

1. **Gate = lệnh thật + exit code thật.** Mỗi tiêu chí done phải map tới 1 lệnh chạy được, có exit code hoặc output kiểm chứng khách quan.
2. **Cấm gate cảm tính.** "Trông ổn", "có vẻ chạy", "chắc là pass" → KHÔNG phải evidence. Nếu không chạy được lệnh, nói thẳng "chưa verify được" + lý do, đừng phán PASS.
3. **Chạy trước, nộp sau.** Tự chạy gate **trước** khi `SendMessage` done. Không đẩy việc verify sang lead.
4. **Evidence là exit code + dòng output mấu chốt**, không phải cả nghìn dòng log. Dán lệnh + exit code + 1–3 dòng quyết định (PASS/FAIL line).

---

## 1. Gate idiom theo stack (5 stack)

Chỉ chạy phần liên quan tới task của bạn. Mỗi lệnh tính từ thư mục đúng (ghi rõ `cwd`).

### Stack 1 — Frontend (React/TS/Vite) — `editor-frontend`

| Gate | Lệnh | PASS = |
|---|---|---|
| Build | `npm run build` | exit 0, không error TS/Vite |
| Type-check | `npx tsc --noEmit` | exit 0, **0 error** |
| Unit test (nếu có) | `npx vitest run` | exit 0, 0 fail |
| Lint (nếu cấu hình) | `npm run lint` | exit 0 |
| Render block | MathLive block render `x^2` → console **0 error**, ra `x²` đúng superscript | quan sát + console sạch |
| Yêu cầu nền (task chạm UI — `docs/requirements.md`) | i18n: chuỗi đi qua i18n + có cả `en.json`+`vi.json`; theme: màu từ token `tokens.css`, **0 hex rời** trong component, light+dark đúng; thiết bị: không vỡ ở 1024px | grep hex + quan sát light/dark |

```bash
npm run build            # cwd: root frontend (nơi có package.json)
# Yêu cầu nền (khi task chạm UI): grep hex rời trong component (kỳ vọng rỗng — màu phải qua token)
grep -rnE '#[0-9a-fA-F]{3,8}' src/ --include='*.tsx' --include='*.css' | grep -v 'tokens.css' || echo "OK: 0 hex rời"
npx tsc --noEmit
npx vitest run           # nếu đã có test
```

### Stack 2 — Tauri / packaging — `glue-packaging`

| Gate | Lệnh | PASS = |
|---|---|---|
| Rust build | `cargo build` (cwd `src-tauri/`) | exit 0 |
| Release build (khi đóng gói) | `cargo build --release` (cwd `src-tauri/`) | exit 0 |
| App launch | `npm run tauri dev` (hoặc artifact) khởi động không panic | cửa sổ mở, console 0 error |
| IPC call | ≥1 invoke frontend→sidecar trả về | console 0 error, response đúng shape |

```bash
cargo build            # cwd: src-tauri/
cargo build --release  # cwd: src-tauri/  (khi build artifact)
```

### Stack 3 — Backend (FastAPI + SymPy) — `backend-cas`

| Gate | Lệnh | PASS = |
|---|---|---|
| Test suite | `pytest` (cwd `backend/`) | exit 0, 0 fail |
| Server up | `uvicorn main:app` khởi động không traceback | log "Application startup complete" |
| Endpoint | `curl -X POST .../eval` trả LaTeX **chính xác** ≥3 fixture | response đúng LaTeX (exact, không số gần đúng) |
| Timeout config | grep thấy timeout + numeric fallback trong code | có trong source |

```bash
pytest                  # cwd: backend/
uvicorn main:app        # smoke khởi động (Ctrl+C sau khi thấy startup complete)
curl -s -X POST localhost:8000/eval -H 'Content-Type: application/json' \
  -d '{"latex":"\\frac{d}{dx} x^2"}'      # kỳ vọng LaTeX "2x"
```

### Stack 4 — Pipeline LaTeX→SymPy — `backend-cas` (chi tiết ở skill `latex-sympy-pipeline`)

| Gate | Cách | PASS = |
|---|---|---|
| Fixture parse | chạy ≥5 fixture mẫu qua parser | mỗi fixture ra SymPy/LaTeX kỳ vọng |
| Exact không làm tròn | `1/3` ra `1/3` không `0.333…` | đúng phân số/căn |
| Timeout + fallback | hàm tích phân khó → timeout → numeric fallback, không treo | trả kết quả (đánh dấu numeric) trong giới hạn thời gian |

Ví dụ fixture: `x^2`→`x**2`; `\int x\,dx`→`x**2/2`; `\frac{d}{dx}x^2`→`2*x`; `\sum_{i=1}^{n}i`→`n*(n+1)/2`; `x^2+x-2=0`→`[-2, 1]`.

### Stack 5 — Vòng-lõi gõ→inline (end-to-end MVP) — `editor-frontend` + `backend-cas` chung

| Gate | Cách | PASS = |
|---|---|---|
| Vòng cơ bản | gõ 1 block MathLive → emit LaTeX → IPC/HTTP → SymPy → render LaTeX kết quả inline cạnh block | kết quả đúng, cập nhật live, console 0 error |

Đây là gate "đường găng" của MVP (CLAUDE.md §12: dựng vòng "gõ 1 block → ra kết quả symbolic inline" trước). Khi task chạm vòng này, evidence phải chứng minh **toàn chuỗi** chứ không chỉ một đầu.

---

## 2. Format evidence (nộp kèm SendMessage done)

```markdown
### Gate evidence — Task #N

| Gate | Lệnh | Exit | Kết quả |
|---|---|---|---|
| build | `npm run build` | 0 | built dist/ trong 3.2s |
| type | `npx tsc --noEmit` | 0 | 0 error |
| render | MathLive block `x^2` | — | ra x², console 0 error |

PASS — vòng gõ→render đạt. (hoặc) FAIL tại <gate> — <triệu chứng> → đang fix.
```

- **Luôn có cột Exit (hoặc cách kiểm).** Không có exit code đo được → ghi rõ cách quan sát khách quan (console log, screenshot mô tả).
- Dán dòng output **quyết định** (PASS/FAIL line, dòng error đầu tiên) — không dán cả log.

---

## 3. Đọc lỗi thường gặp (rút ngắn vòng fix)

| Triệu chứng | Nguyên nhân hay gặp | Hướng xử |
|---|---|---|
| `tsc` 0 error nhưng `npm run build` fail | Vite/bundler lỗi import path hoặc env, không phải type | đọc dòng `[vite]` / `Rollup failed`, sửa import/path |
| MathLive block render trắng / lỗi web component | `<math-field>` chưa register trước mount | `import 'mathlive'` ở entry trước khi React render (xem `mistakes.md`) |
| `cargo build` fail "linker"/"sidecar" | thiếu toolchain Rust hoặc sidecar config sai `tauri.conf.json` | kiểm toolchain; xem skill `tauri-packaging` |
| `pytest` treo không kết thúc | tích phân SymPy không hội tụ, thiếu timeout | thêm timeout + numeric fallback (§8.3) |
| `POST /eval` trả số thập phân thay vì exact | parser ép float hoặc thiếu `Rational` | giữ symbolic; chỉ float khi user bật toggle decimal |
| IPC invoke "command not found" | tên command không khớp giữa JS `invoke()` và Rust `#[command]` | đồng bộ tên hai phía |

Lỗi mới chưa có trong bảng → sau khi fix, append `.claude/memory/mistakes.md` (theo skill `memory`) để vai sau không vấp lại.

---

## 4. Quick reference

```
GATE = lệnh thật + exit code thật. Cấm "trông ổn".
Frontend : npm run build (0) · npx tsc --noEmit (0 error) · npx vitest run · render x^2 console-0
Tauri    : cargo build (0) [cwd src-tauri/] · app launch · IPC invoke trả về
Backend  : pytest (0) · uvicorn startup · POST /eval ra LaTeX exact ≥3 fixture · timeout có
Pipeline : ≥5 fixture parse đúng · exact không làm tròn · timeout+numeric fallback
Vòng-lõi : gõ block → LaTeX → SymPy → render inline, live, console-0

NỘP: bảng evidence (Gate|Lệnh|Exit|Kết quả) + PASS/FAIL line. Chạy TRƯỚC khi SendMessage done.
KHÔNG verify được → nói thẳng "chưa verify" + lý do, đừng phán PASS.
```

---

## 5. Browser/click-through smoke — KHÔNG phải gate của teammate

**Bằng chứng (≥4 session nhất quán, ISSUE-8 2026-06-18):** Chrome extension bind vào 1 foreground session; background teammate chạy process riêng → extension không reach được — xác nhận ở dock-v2, tauri-shell, nib-editor-rebuild, nav-dock-redesign, và kể cả lead context. "CÒN TREO — chỉ USER smoke được" lặp nhất quán xuyên mọi session editor.

**Quy tắc:**
- **Browser/click-through smoke = gate do USER chạy** — KHÔNG phải teammate.
- Implementer **KHÔNG block chờ browser smoke**. Gate của implementer kết thúc ở lệnh đo được (build/tsc/vitest/cargo/pytest). Khi kết quả visual cần xác nhận (canvas render, dock interaction, vòng lõi gõ→Tính→result), implementer **liệt click-through checklist** kèm `SendMessage` done, lead paste cho user smoke.
- Vòng-lõi gate (Stack 5 §1): gõ 1 block → LaTeX → SymPy → render inline — phần **lệnh đo được** (build/tsc/vitest pass) là gate của implementer; phần **click-through thật** là USER gate.
- Tool `mcp__claude-in-chrome__*` trong frontmatter dành cho trường hợp **lead (foreground)** muốn tự browser-smoke sau build, không phải dùng trong background teammate context.

**Template click-through checklist (implementer nộp kèm bảng evidence):**

```
### Click-through checklist (USER smoke — `npm run dev` :1420):
- [ ] <bước 1 cụ thể: vd "gõ `x^2` vào block → bấm Tính → ra `x²` inline">
- [ ] <bước 2: vd "kéo dock sang trái, reload → dock giữ vị trí">
- [ ] <bước 3>
(chạy theo thứ tự; nếu crash ghi dòng console lỗi đầu tiên + bước đang làm)
```

---

## 6. Ranh giới — điều KHÔNG làm

| Không làm | Lý do |
|---|---|
| Phán PASS khi chưa chạy lệnh | Gate phải dựa exit code/output thật — đó là cả điểm của skill này |
| Nộp "đã build xong" không kèm exit code | Lead không gate được; evidence rỗng = trả task |
| Dán cả nghìn dòng log | Chỉ cần lệnh + exit + dòng quyết định |
| Chạy gate stack không liên quan task | Lãng phí; chỉ gate phần mình đụng |
| Bỏ qua console error vì "vẫn render" | console error = chưa PASS gate render |
| Block chờ browser smoke để báo done | Browser/click-through = USER gate (§5); implementer nộp build evidence + checklist cho user |
