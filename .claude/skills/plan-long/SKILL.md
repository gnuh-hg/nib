---
name: plan-long
description: "Use when scoping multi-session work that can't finish with quality in one chat (whole workstream, bulk generation ≥100 unit, multi-phase pipeline with human gates, external manual steps like MyScript license setup). Produces PLAN.md + CHECKPOINT.md inside plan/<roadmap>/<slug>/ (nested under its roadmap folder)."
---

# Plan-Long — note-ch (notepad toán học sống)

> Form chuẩn cho kế hoạch dài hạn: sinh 2 file (`PLAN.md` + `CHECKPOINT.md`) trong `plan/<roadmap>/<slug>/`, ràng buộc "1 chat = 1 session". Cách quản lý file: xem `plan/README.md`.
>
> **Layout [user chốt — ISSUE-4]:** long-plan luôn nested DƯỚI thư mục roadmap của nó (`plan/<roadmap>/<slug>/`), KHÔNG đặt phẳng `plan/<slug>/` thành sibling của `ROADMAP.md`. `<roadmap>` = thư mục roadmap chứa `ROADMAP.md`; chưa có roadmap thì hỏi user tên roadmap container, đừng tự đặt phẳng.

## Khi nào dùng

Long-term khi **bất kỳ**:

- Tổng work vượt 1 chat capacity.
- Là cả một workstream ở CLAUDE.md §12 (Editor/Frontend, Backend/CAS, Handwriting, Glue/Packaging) hoặc một phase ROADMAP.
- Bulk lặp ≥ 100 unit (vd sinh fixture test parse LaTeX→SymPy hàng loạt).
- Có gate quality giữa các phase cần human/script verify.
- Có human-in-the-loop pause (vd cần user **quyết ngân sách / thuê license MyScript** trước khi đi tiếp — CLAUDE.md §8.4, §11.2; chạy script ngoài; setup máy có bút).
- User yêu cầu rõ "chia phase" / "checkpoint".

## Output: 2 file đồng bộ trong `plan/<roadmap>/<slug>/`

1. `plan/<roadmap>/<slug>/PLAN.md` — bản thiết kế, **immutable sau approve**.
2. `plan/<roadmap>/<slug>/CHECKPOINT.md` — sổ tay tiến độ, **mutable**, update sau mỗi session.

Slug: kebab-case từ tên task, không dấu, không space (vd `editor-mathlive-block`, `cas-latex-sympy-pipeline`, `handwriting-myscript`). Nếu là 1 phase ROADMAP, dùng slug `phase-<x>` (vd `phase-a-editor`). `<roadmap>` = thư mục roadmap chứa `ROADMAP.md` mà long-plan này thuộc về.

**Quản lý file (BẮT BUỘC):** đọc `plan/README.md` để biết quy ước thư mục. Các artifact phụ trợ của một plan (design note, benchmark, findings) đặt cùng thư mục `plan/<roadmap>/<slug>/<tên>.md`, KHÔNG rải ra ngoài.

## Form `PLAN.md`

```markdown
# PLAN — <tên task>

> [pipeline outcome 1 câu — sau khi xong toàn bộ pipeline ta được gì]

---

## Context

- Vì sao phải chia nhiều session (quy mô / gate / external).
- Ràng buộc external (vd "MyScript iink là SDK thương mại, cần user chốt ngân sách trước Phase bút").
- Workstream / phase ROADMAP liên quan (trỏ `plan/ROADMAP.md` nếu có).
- Scope ngoài plan này (out of scope).

---

## Pipeline N phase / M session

```
[Phase 1] <tên> ──────────────► <artifact 1>
                                    │
[Phase 2] <tên> ──────────────► <artifact 2>
                                    │
[Phase N] <tên> ──────────────► outcome
```

---

## Phase 1 — <tên>

**Mục tiêu**: <1-2 câu>.

### Session 1.1 — <scope ngắn>
- **Scope**: việc tối đa cho 1 chat (vd "scaffold Tauri+React+Vite + 1 MathLive block render được `x^2`").
- **STOP gate**: <điều kiện dừng cứng, đo được — xem "Gate idiom" bên dưới>.
- **Output artifact**: <file/section sẽ sinh ra>.

### Session 1.2 — ...
- Scope: ...
- STOP gate: ...
- Output artifact: ...

**Phase 1 gate** (sau Session 1.x cuối): <điều kiện sang Phase 2>.

## Phase 2 — <tên>
(tương tự)

## Outcome cuối

- <trạng thái cuối sau Phase N>
- <gate đo lường thành công — vd "vòng gõ→symbolic inline chạy live end-to-end trên app đóng gói">

---

## Revision log

| Date | Change | Lý do |
| --- | --- | --- |
| YYYY-MM-DD | Initial | — |
```

## Form `CHECKPOINT.md`

```markdown
# CHECKPOINT — <tên task>

> Sổ tay tiến độ dài hạn. Bất kỳ phiên Claude nào mới mở đều đọc file này TRƯỚC để biết đang ở đâu.

---

## ⚠️ Constraint reminder (ĐỌC ĐẦU MỖI CHAT)

- Mỗi chat **chỉ làm 1 session** (xem "Đang ở đâu" để biết session nào).
- **STOP NGAY** khi đạt STOP gate của session đó — không tham làm session kế dù còn quota.
- **TRƯỚC khi đóng chat**: cập nhật bảng tiến độ + "Đang ở đâu" + thêm 1 entry "Per-session log".

---

## Tiến độ tổng quan

| Hạng mục | Mục tiêu | Hiện tại | % |
| --- | --- | --- | --- |
| <vd Sessions hoàn thành> | <vd 6> | 0 | 0% |
| <vd Block types chạy được> | <vd 3> | 0 | 0% |
| <vd Gate pass> | <vd 6/6> | — | — |

---

## Đang ở đâu

- **Phase**: 1
- **Session kế tiếp**: 1.1 — <tóm tắt scope>
- **Blocker** (nếu có): —
- **Reference**: `PLAN.md` Phase 1 → Session 1.1

---

## Per-session log

### YYYY-MM-DD — Session A.B
- **Done**: <những gì đã làm>
- **Output**: <file / artifact đã sinh ra>
- **Gate**: pass / fail (kèm metric — vd "`npm run build` 0 error; `/eval x^2` trả `2x`")
- **Next**: Session A.(B+1) hoặc Phase tiếp theo
- **Notes**: <vấn đề phát sinh, ghi nhớ — vd "latex2sympy2 nuốt `\cdot`, cần dọn trước parse">

---

## Lịch sử revision

| Date | Action | By |
| --- | --- | --- |
| YYYY-MM-DD | Created from `PLAN.md` | @planner |
```

## Gate idiom (note-ch) — STOP gate phải đo được bằng stack thật

- **Frontend:** `npm run build` exit 0; `tsc --noEmit` 0 error; vitest pass; block mount + render đúng (console 0 error).
- **Tauri:** `cargo build` trong `src-tauri/` pass; app launch render được block.
- **Backend (FastAPI+SymPy):** `pytest` pass; `POST /eval` trả LaTeX chính xác (vd `\int x\,dx` → `\frac{x^2}{2}`, không phải số); có timeout + numeric fallback khi SymPy treo (CLAUDE.md §8.3).
- **Pipeline LaTeX→SymPy:** N fixture parse pass (đếm được); round-trip không lossy ở tập mẫu.
- **Vòng lõi (đường găng):** "gõ block → trả kết quả symbolic inline, live". Gate vàng cho mọi plan chạm editor↔CAS.
- **Bulk:** "đủ N dòng/fixture trong file X" — đếm được, không vague "khi nào thấy đủ".

## Rules

1. **PLAN immutable sau approve** — thay đổi qua "Revision log" ở cuối PLAN, không sửa session breakdown trừ khi user yêu cầu rõ.
2. **CHECKPOINT mutable** — update sau mỗi session.
3. **Mỗi session có STOP gate đo được.** Không vague. Cụ thể: `npm run build` 0 error, `pytest` pass, N fixture parse, file tồn tại, `/eval` trả đúng LaTeX.
4. **Mỗi session đủ nhỏ để 1 chat làm xong với chất lượng.** Phải gắng → chia 2 session.
5. **Slug kebab-case**, không dấu, không space.
6. **Trước khi ghi file** — verify `plan/<roadmap>/<slug>/PLAN.md` chưa tồn tại (Glob/ls). Có rồi → hỏi user (overwrite vs đổi slug).
7. **Sau khi tạo** — (a) thêm 1 hàng vào bảng index trong `plan/README.md`; (b) nếu là 1 phase trong ROADMAP → update bảng tiến độ cuối `plan/<roadmap>/ROADMAP.md` (cột Long-plan trỏ `plan/<roadmap>/<slug>/`).

## Anti-pattern

| Sai | Sửa |
| --- | --- |
| Session quá to ("nhúng cả MathLive + MyScript + sync SymPy 1 session") | Chia: 1.1 MathLive block, 1.2 IPC tới CAS, 1.3 render inline... |
| STOP gate là "khi nào thấy đủ" | Đo được: "N fixture parse pass", "`/eval` trả LaTeX X" |
| Chỉ có PLAN, không có CHECKPOINT | Bắt buộc cả 2 file |
| CHECKPOINT không có "Constraint reminder" ở đầu | Reminder phải là section đầu tiên — Claude đọc top-down |
| Update CHECKPOINT sau khi đóng chat | Phải update TRƯỚC khi đóng — nếu không session sau mất context |
| Quên update `plan/README.md` / `plan/ROADMAP.md` | Bước cuối bắt buộc trước khi return |
| Rải artifact phụ ra ngoài `plan/<roadmap>/<slug>/` | Mọi file của plan nằm gọn trong thư mục slug (nested dưới roadmap) |
| Đặt long-plan phẳng `plan/<slug>/` thành sibling của ROADMAP.md | Nested dưới roadmap: `plan/<roadmap>/<slug>/` (user chốt ISSUE-4) |

## Liên quan

- Dưới rubric (≤1 chat, ≤10 file, không gate) → `plan-short` (inline, không file).
- Lập lộ trình tổng nhiều phase trước khi bửa từng phase thành long-plan → `roadmap`.
