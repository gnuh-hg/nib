---
name: plan-short
description: "Use when scoping a task that can be completed with quality in a single chat session (≤10 file touches, no cross-session resume, no human gate mid-way). Produces an inline phased plan — no file artifact."
---

# Plan-Short — Nib (notepad toán học sống)

> Form chuẩn cho kế hoạch ngắn hạn: đủ chi tiết để thực thi ngay trong chat hiện tại, không cần checkpoint, không sinh file.

## Khi nào dùng

Short-term khi **TẤT CẢ** đúng:

- Ước lượng ≤ 1 chat hoàn thành chất lượng.
- ≤ ~10 file touches.
- Không có gate human verify giữa các phase (vd không cần user thuê license MyScript / chạy script ngoài rồi mới đi tiếp).
- Không có bulk lặp ≥ 100 unit.

Nếu **bất kỳ** điều trên sai → dùng `plan-long`. Nếu task là một cả-một-workstream (Editor / CAS / Handwriting / Glue ở CLAUDE.md §12) → gần như chắc chắn là long-term hoặc thuộc một phase của `roadmap`.

## Form chuẩn

Output **inline trong response** — KHÔNG tạo file `.md`:

```markdown
# Plan: <tên task ngắn>
> [outcome 1 câu — sau khi xong người dùng được gì]

## Context
- Vì sao bây giờ
- Scope (in scope / out of scope)
- Ràng buộc (vd "Phase 1 only", "MathLive đường gõ only — chưa đụng bút", "không sửa contract LaTeX↔SymPy")

## Phases
### Phase 1 — <tên ngắn>
- [ ] Step cụ thể (động từ + đối tượng + path, vd "Tạo `src/blocks/MathBlock.tsx` render `<math-field>`")
- [ ] Step cụ thể
- **Gate**: <điều kiện verify được trước khi sang Phase 2>

### Phase 2 — <tên ngắn>
- [ ] ...
- **Gate**: <điều kiện verify>

## Verification
- Test end-to-end: <cách run thật trong Nib — xem "Gate idiom" bên dưới>
- Files dự kiến tạo/sửa: liệt kê path cụ thể (vd `src/blocks/MathBlock.tsx`, `backend/app/cas.py`)
```

## Gate idiom (Nib) — gate phải đo được bằng stack thật

Gate tốt cho dự án này, theo tầng:

- **Frontend (React/TS/Vite):** `npm run build` exit 0; `tsc --noEmit` 0 error; `npm run test` (vitest) pass; component mount không lỗi console.
- **Tauri shell:** `cargo build` trong `src-tauri/` pass; app khởi động + render được 1 block.
- **Backend (FastAPI + SymPy):** `pytest` pass; endpoint trả đúng — vd `POST /eval` với `\frac{d}{dx} x^2` trả LaTeX `2x` (không phải số gần đúng).
- **Vòng lõi (đường găng):** "gõ 1 block `x^2` → backend trả → render kết quả symbolic inline cạnh block". Đây là gate vàng — nếu task chạm editor↔CAS, gate cuối phải là vòng này chạy live.

Gate dạng "code đẹp hơn" / "ổn rồi" KHÔNG hợp lệ — phải là thứ chạy/đo được.

## Rules

1. **Mỗi phase phải có gate kiểm chứng được.** Không gate = không phase.
2. **Steps là động từ + đối tượng cụ thể + path.** Tốt: "Thêm endpoint `POST /eval` parse LaTeX→SymPy, trả `EvalOut`". Xấu: "Improve CAS module".
3. **2-5 phase là đủ.** Nhiều hơn → có thể là long-term ẩn, kiểm lại rubric.
4. **Không cần per-session log** vì làm trong 1 chat liền mạch.
5. **Liệt kê file path cụ thể** trong Verification — sau khi xong dễ verify đúng scope.
6. **Không tạo file artifact** — plan-short sống trong message. Cần file = đã sang lãnh địa `plan-long`.

## Anti-pattern

| Sai | Sửa |
| --- | --- |
| Phase chỉ có 1 step | Gom vào phase khác hoặc mở rộng |
| Gate là "ok" / "done" | Viết điều kiện cụ thể: "`npm run build` 0 error", "`/eval` trả LaTeX `2x`" |
| 8+ phase với 1-2 step mỗi cái | Gom thành 3-4 phase ý nghĩa |
| Step "Refactor editor" không nói cái gì | Chia thành step nhỏ với đối tượng + path cụ thể |
| Gate cảm tính ("render đẹp") | Gate đo được ("block render `x²` đúng superscript, console 0 error") |

## Sau khi viết plan

- Hỏi user approve (1 câu, ngắn).
- Nếu OK → execute luôn trong chat. Tick checkbox khi xong từng step.
- Nếu giữa chừng phát hiện scope thực ra long-term (vd phải đụng cả pipeline LaTeX→SymPy + cần human gate license) → **dừng, báo user, chuyển `plan-long`** (sinh `plan/<slug>/`). Đừng cố nhồi vào 1 chat.

## Liên quan

- Vượt rubric → `plan-long` (sinh artifact `plan/<slug>/`).
- Task là 1 phase của lộ trình tổng → xem `roadmap`, dựng long-plan cho đúng phase.
