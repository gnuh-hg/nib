---
name: roadmap
description: "Use when laying out the multi-phase route for a whole product/workstream BEFORE breaking each phase into its own long-plan. Produces or maintains plan/<roadmap>/ROADMAP.md — a map of phases (what + what-to-clarify), not an executable plan. Each phase later becomes one plan-long nested under the same roadmap folder."
---

# Roadmap — note-ch (notepad toán học sống)

> Form chuẩn cho **lộ trình tổng**: 1 file `plan/<roadmap>/ROADMAP.md` chia toàn bộ sản phẩm thành các phase độc lập. **Mỗi phase = 1 long-plan** soạn riêng (qua `plan-long`) khi user trỏ vào, **nested dưới chính thư mục roadmap đó** (`plan/<roadmap>/<phase-slug>/`). ROADMAP **KHÔNG phải** long-plan — nó chỉ mô tả *cần làm gì* + *cần làm rõ gì* để mỗi lần dựa vào đây mà dựng PLAN/CHECKPOINT. Cách quản lý file: xem `plan/README.md`.
>
> **Layout thư mục [user chốt — ISSUE-4]:** roadmap LÀ một thư mục; `ROADMAP.md` sống TRONG nó; mỗi long-plan là thư mục CON nested dưới roadmap đó. KHÔNG đặt `ROADMAP.md` phẳng ở gốc `plan/` và KHÔNG để long-plan thành sibling của ROADMAP.md.
> ```
> plan/
>   <roadmap>/
>     ROADMAP.md
>     <phase-slug-1>/{PLAN.md, CHECKPOINT.md}
>     <phase-slug-2>/{PLAN.md, CHECKPOINT.md}
> ```
> Cho phép nhiều roadmap song song (mỗi roadmap = 1 thư mục riêng dưới `plan/`).

## Khi nào dùng

- Cần vạch đường đi nhiều phase cho **cả sản phẩm** hoặc một mảng lớn (vd toàn bộ MVP, hoặc cả 4 workstream §12).
- Trước khi bửa từng phase thành long-plan, cần thống nhất **thứ tự phụ thuộc** + **những thứ cần chốt 1 lần** (cross-cutting).
- User nói "vạch lộ trình", "chia phase tổng", "roadmap", "đường đi từ giờ tới MVP".

Nếu chỉ là 1 task/1 workstream cần chia session → bỏ qua đây, dùng thẳng `plan-long`. ROADMAP là tầng **trên** plan-long.

## Output: 1 file `plan/<roadmap>/ROADMAP.md`

ROADMAP.md luôn nằm TRONG thư mục roadmap của nó (`plan/<roadmap>/ROADMAP.md`), KHÔNG phẳng ở gốc `plan/`. Long-plan từng phase nested dưới cùng thư mục đó (`plan/<roadmap>/<phase-slug>/`). Tên `<roadmap>` do user chốt (vd `plan/nib/`, `plan/main/`) — nếu chưa chốt thì hỏi user, đừng tự đặt. Cho phép nhiều roadmap song song khi có đợt tái thiết kế lớn tách bạch.

ROADMAP là **mutable**: cập nhật bảng tiến độ cuối file khi một phase xong, append phase mới khi scope mở rộng. KHÔNG ghi chi tiết session ở đây — đó là việc của `plan/<phase-slug>/CHECKPOINT.md`.

## Form `plan/ROADMAP.md`

```markdown
# note-ch — Roadmap chia phase

> Bản đồ chia sản phẩm thành các phase độc lập; **mỗi phase = 1 long-plan** soạn riêng khi user yêu cầu. File này KHÔNG phải long-plan — chỉ mô tả *cần làm gì* + *cần làm rõ gì* để mỗi lần dựa vào đây dựng PLAN/CHECKPOINT (theo `plan-long`).

---

## Nền tảng đã chốt (không bàn lại)

- Quyết định **[LOCKED]** từ `CLAUDE.md` §3–§6: desktop-class, document dạng block, hai input ngang hàng (gõ + bút), stack Tauri 2 + React/TS/Vite + TipTap/Lexical + MathLive + MyScript + FastAPI/SymPy.
- Đường găng: **editor** (§8.1). "Chọn framework là quyết định 1 ngày — dồn sức vào editor."
- Thứ tự khuyến nghị (§12): dựng vòng "gõ 1 block → kết quả symbolic inline" trước (MathLive only), bút ghép sau.

---

## Cross-cutting — cần chốt TRƯỚC khi vào phase (1 lần, áp mọi phase)

Quyết định không thuộc riêng phase nào nhưng định hình tất cả. Lấy từ "Câu hỏi còn mở" §11 — đây là nơi theo dõi trạng thái chốt:

- **CC-1. Thiết bị cụ thể** (iPad Pro / Surface / laptop cảm ứng) → ⬜/✅ — ảnh hưởng tích hợp MyScript + phân phối.
- **CC-2. Ngân sách license MyScript** (§8.4) → ⬜/✅ — chặn cứng workstream Handwriting.
- **CC-3. Lớp AI parse/giải thích từ MVP hay để sau** (§10) → ⬜/✅.
- **CC-4. Tên dự án** → ⬜/✅.
- **CC-5. Editor core: TipTap hay Lexical** (§5) → ⬜/✅ — chốt sớm, đừng tranh luận kéo dài.

---

## Các phase (mỗi phase = 1 long-plan)

### Phase A — <tên> (vd "Editor/Frontend scaffold + MathLive block")
- **Cần làm gì (WHAT)**: <2-4 gạch đầu dòng deliverable>.
- **Cần làm rõ trước**: <điểm phải chốt trước khi dựng long-plan cho phase này>.
- **Done khi**: <gate đo được — vd "vòng gõ→symbolic inline chạy với MathLive only">.
- **Phụ thuộc**: <phase nào phải xong trước>.

### Phase B — <tên> (vd "Backend/CAS: pipeline LaTeX→SymPy + timeout/numeric fallback")
- ...

(thêm phase theo workstream §12: Handwriting, Glue/Packaging, …)

---

## Thứ tự phụ thuộc (tóm tắt)

```
Cross-cutting (chốt CC-1..CC-5)
   │
   ▼
Phase A (editor + MathLive block) ─┐
Phase B (CAS pipeline)             ─┴─► vòng lõi: gõ→symbolic inline ─► Phase C (bút/MyScript) ─► Phase D (đóng gói Tauri)
```

---

## Cách dùng file này

Mỗi lần build 1 phase: user trỏ vào phase → dùng `plan-long` dựng `plan/<roadmap>/<phase-slug>/PLAN.md` + `CHECKPOINT.md` (nested dưới thư mục roadmap), **chốt phần "cần làm rõ" của phase đó trước** rồi mới chia session. Cập nhật bảng dưới khi phase xong.

| Phase | Long-plan | Trạng thái |
|---|---|---|
| Cross-cutting CC-1..CC-5 | — | ⬜ |
| A — Editor + MathLive block | `plan/<roadmap>/phase-a-editor/` | ⬜ |
| B — CAS pipeline | `plan/<roadmap>/phase-b-cas/` | ⬜ |
| C — Handwriting (MyScript) | `plan/<roadmap>/phase-c-handwriting/` | ⬜ (chặn bởi CC-2) |
| D — Glue/Packaging | `plan/<roadmap>/phase-d-packaging/` | ⬜ |
```

## Rules

1. **ROADMAP mô tả WHAT + cần-làm-rõ, KHÔNG chia session.** Session breakdown là việc của long-plan từng phase.
2. **Mỗi phase phải có "Done khi" đo được** (gate idiom note-ch: `npm run build` 0 error, `pytest` pass, vòng gõ→symbolic inline chạy…). Không có gate = chưa phải phase, là ý tưởng.
3. **Cross-cutting chốt 1 lần.** Mọi câu hỏi mở §11 của CLAUDE.md theo dõi trạng thái ở section Cross-cutting — đừng để câu hỏi chặn (vd license MyScript) rơi vào quên lãng.
4. **Tôn trọng [LOCKED]** — không đề xuất ngược các quyết định đã chốt ở CLAUDE.md §3–§6. Muốn đảo → ghi rõ ở đầu ROADMAP "ĐẢO CHIỀU quyết định cũ" + lý do + người chốt, không sửa lén.
5. **Phase slug kebab-case**, khớp với thư mục `plan/<roadmap>/<phase-slug>/` (nested dưới roadmap) mà long-plan sẽ sinh.
6. **Bảng tiến độ là nguồn sự thật về trạng thái** — cập nhật mỗi khi một phase xong (cột Long-plan trỏ thư mục, Trạng thái ✅/🔄/⬜ + 1 dòng evidence).
7. **Đồng bộ với `plan/README.md`** — khi tạo ROADMAP, thêm dòng index ở `plan/README.md`.

## Anti-pattern

| Sai | Sửa |
| --- | --- |
| Nhồi chi tiết session/checkbox vào ROADMAP | Để long-plan từng phase lo; ROADMAP chỉ WHAT + gate |
| Phase không có "Done khi" đo được | Thêm gate idiom note-ch cụ thể |
| Bỏ qua cross-cutting (license, thiết bị, tên) | Theo dõi ở section Cross-cutting tới khi ✅ |
| Sửa lén quyết định [LOCKED] trong ROADMAP | Ghi block "ĐẢO CHIỀU" + lý do + ai chốt |
| ROADMAP rồi nhảy thẳng code | Mỗi phase phải qua `plan-long` trước khi build |
| Bảng tiến độ mốc meo, không cập nhật | Update ngay khi phase đổi trạng thái |

## Liên quan

- Sau khi có ROADMAP → mỗi phase dựng `plan-long` (`plan/<roadmap>/<phase-slug>/`, nested dưới thư mục roadmap).
- Task lẻ trong 1 chat → `plan-short`.
- Quy ước thư mục/index → `plan/README.md`.
