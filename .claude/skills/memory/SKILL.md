---
name: memory
description: "Đọc `.claude/memory/` đầu task + append bài học cuối task (date-stamped, luôn append, cap 10 entry mới nhất). Store dùng chung cho mọi agent trong team Nib."
---

# Memory — đọc/ghi store chung của team Nib

> Skill dùng chung cho **mọi vai** (lead + teammate): đọc bối cảnh đầu task, append bài học/quyết định/trạng thái cuối task.
> Store **duy nhất**: `.claude/memory/` (project-scope). Không có store thứ hai — không nhầm với bất kỳ engine/branch store nào.

---

## 1. Bốn file và mục đích

| File | Đọc khi | Nội dung |
|---|---|---|
| `context.md` | Mọi task mới | Trạng thái hiện tại: phase/workstream đang chạy, quyết định gần đây, việc tiếp theo, kết quả smoke-test |
| `mistakes.md` | Trước khi plan / trước khi build | Lỗi thực tế trước đây — không tái phạm (lỗi cụ thể + nguyên nhân + cách confirm fix) |
| `patterns.md` | Trước khi thiết kế / chọn cách làm | Pattern đã thành công: stack/cấu trúc + done-criteria đã pass |
| `global.md` | Khi có quyết định kiến trúc / cross-cutting | Quyết định lâu dài, con người, thay đổi scope, chốt câu hỏi mở §11 (license MyScript, thiết bị, lớp AI, tên dự án) |

Nếu file chỉ có header (rỗng entry) → chưa có memory, tiếp tục bình thường.

---

## 2. Đọc memory — đầu mỗi task

### Ai đọc gì

- **Lead**: `context.md` + `mistakes.md` trước khi spawn team hoặc tự làm task mới.
- **researcher / architect**: `context.md` + `mistakes.md` trước khi gom context / thiết kế.
- **implementer** (editor-frontend / backend-cas / handwriting / glue-packaging): `context.md` + `mistakes.md` trước khi build (tránh lặp lỗi cũ).
- **team-ops**: `context.md` + `mistakes.md` trước khi fix bộ máy team.

### Cap N = 10 entry mới nhất

Đọc toàn bộ file, nhưng **chỉ dùng 10 entry mới nhất** (đếm từ delimiter `## ` cuối cùng ngược lên). Entry cũ hơn vẫn nằm trong file nhưng KHÔNG load vào context làm việc — tránh phình context.

```bash
# Read tool hoặc cat
cat .claude/memory/context.md
cat .claude/memory/mistakes.md
# patterns.md / global.md đọc khi có quyết định thiết kế/kiến trúc liên quan
```

⚠️ Memory là **bối cảnh phụ**. Brief task (TaskGet) là nguồn sự thật chính — không đọc memory thay cho đọc brief.

---

## 3. Ghi memory — cuối mỗi task

### Nguyên tắc

- Append **1 entry** vào đúng file theo loại. **LUÔN append — KHÔNG overwrite, KHÔNG sửa entry cũ.**
- Format **bắt buộc**: dòng `## <YYYY-MM-DD HH:MM> — <slug-ngắn>` riêng 1 dòng, nội dung phía dưới.
- Slug kebab-case, mô tả bài học/sự kiện (vd `mathlive-block-mount-fail`, `latex-sympy-int-pattern`).
- Nội dung **đo được, cụ thể** — không "trông ổn". 2–5 dòng là đủ.

### Ai ghi gì

| Vai | File ghi | Khi nào |
|---|---|---|
| Bất kỳ teammate (gate FAIL) | `mistakes.md` | Lỗi: loại + file/lệnh + nguyên nhân + cách confirm fix |
| Bất kỳ teammate (gate PASS) | `patterns.md` | Stack/cấu trúc đã thành công + done-criteria pass |
| Lead | `context.md` | Trạng thái phase, quyết định, hướng mới, kết quả smoke-test |
| Lead | `global.md` | Quyết định kiến trúc lâu dài, chốt câu hỏi mở §11 |

### Template entry

```markdown
## 2026-06-11 14:30 — mathlive-block-mount-fail

Build: `src/blocks/MathBlock.tsx` — render fail vì `<math-field>` chưa register web component trước mount.
Fix: `import 'mathlive'` ở entry trước khi React render.
Confirm: `npm run build` exit 0 + block render `x^2` đúng superscript, console 0 error.
```

```markdown
## 2026-06-11 16:00 — latex-sympy-derivative-pattern

Stack: FastAPI + SymPy + latex2sympy2. `POST /eval` parse `\frac{d}{dx}x^2` → `diff(x**2, x)` → `2*x`.
Pattern: timeout 5s + numeric fallback khi `integrate()` treo (§8.3).
Done-criteria: `pytest` 5/5 fixture pass; trả LaTeX `2x` (exact, không số gần đúng).
```

### Lệnh ghi (append vào cuối file)

```bash
# Dùng Bash append — KHÔNG dùng Write (sẽ ghi đè toàn bộ file)
cat >> .claude/memory/mistakes.md << 'EOF'

## 2026-06-11 14:30 — mathlive-block-mount-fail

<nội dung>
EOF
```

⚠️ Dùng **`>>`** (append), không bao giờ **`>`** (overwrite). File chứa lịch sử — ghi đè = mất data.

---

## 4. Quick reference

```
ĐỌC (đầu task, cap 10 entry mới nhất):
  Lead / researcher / architect / implementer / team-ops
    → cat .claude/memory/context.md + mistakes.md
  Trước thiết kế → thêm patterns.md
  Quyết định kiến trúc → thêm global.md

GHI (cuối task):
  Gate FAIL  → mistakes.md   (lỗi cụ thể + nguyên nhân + confirm)
  Gate PASS  → patterns.md   (stack + cấu trúc thành công)
  Lead       → context.md / global.md

FORMAT:  ## YYYY-MM-DD HH:MM — slug-ngắn
APPEND:  cat >> file.md   (không bao giờ >)
CAP:     10 entry mới nhất khi đọc
STORE:   .claude/memory/   (duy nhất — không trộn store khác)
```

---

## 5. Ranh giới — điều KHÔNG làm

| Không làm | Lý do |
|---|---|
| Dùng Write tool (overwrite) để ghi entry mới | Mất toàn bộ lịch sử entry cũ — luôn `>>` |
| Ghi entry không có delimiter `## ` | Cap-N không nhận ra → entry bị bỏ qua khi đọc |
| Ghi memory thay cho TaskUpdate/SendMessage report | Memory là phụ; report task qua TaskUpdate + SendMessage |
| Đọc memory thay cho đọc brief (TaskGet) | Brief là nguồn sự thật chính; memory là bối cảnh phụ |
| Nhồi >5 dòng/entry hoặc dán cả file code | Memory để học nhanh — đo được, ngắn gọn |
