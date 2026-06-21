---
name: handwriting-myscript
description: "Tích hợp MyScript iink (đường bút→LaTeX) cho agent handwriting (Nib): ink→recognition→LaTeX, palm rejection, gesture xóa/sửa, auto-convert mực→toán. PHỤ THUỘC human gate §11.2 (license) + §11.1 (thiết bị) — chưa chốt thì PAUSE."
---

# handwriting-myscript — đường bút → LaTeX

> ⚠️ **DEPENDENCY GATE — ĐỌC TRƯỚC TIÊN.**
> Skill này phụ thuộc **§11.2** (ngân sách license MyScript) và **§11.1** (thiết bị: iPad Pro/Pencil vs Surface vs Windows 2-in-1 vs laptop cảm ứng). **Cả hai đều CHƯA CHỐT** (CLAUDE.md §11 — câu hỏi mở, cần con người quyết).
> Agent `handwriting` **PAUSE tại human gate §11.2** nếu license chưa chốt — KHÔNG bắt đầu implement, KHÔNG tự chọn thiết bị/SDK bản nào. Hỏi lead → lead trình user.

> Skill riêng cho **`handwriting`** (Agent C, CLAUDE.md §12). Đường bút là **giá trị cộng thêm** cho máy có stylus — ghép vào **sau** khi vòng-lõi gõ→inline (A+B) đã chạy (§12 thứ tự khuyến nghị).

---

## 0. Vì sao có gate (đừng bỏ qua)

- **MyScript iink là SDK thương mại, tốn phí license** (CLAUDE.md §8.4). Không thể "cài thử free rồi tính sau" như npm package thường — cần **quyết ngân sách trước**.
- **App tiêu dùng MyScript chạy iOS/iPadOS/macOS/Android; Windows phải nhúng qua SDK/cloud** (§8.4). → bản SDK và cách tích hợp **phụ thuộc thiết bị §11.1**. Chọn sai thiết bị = tích hợp lại từ đầu.
- Vì vậy: **không có dòng code MyScript nào được viết** trước khi §11.2 (license) chốt. Skill này mô tả *sẽ làm gì khi đã chốt* — không phải lệnh chạy ngay.

---

## 1. Luồng bút→LaTeX (khi đã chốt license)

```
[Bút/Pencil trên canvas block]
   │  stroke (x,y,t,pressure)
   ▼  (1) capture ink — iink ink capture
ink strokes
   │
   ▼  (2) palm rejection — lọc chạm lòng bàn tay, chỉ giữ stylus
ink sạch
   │
   ▼  (3) iink Math recognizer → MathML/LaTeX (≈250 ký hiệu toán)
LaTeX
   │
   ▼  (4) hội tụ về cùng đường gõ: emit LaTeX/MathJSON
   │       → cùng pipeline latex-sympy-pipeline như MathLive
   ▼
[render kết quả inline cạnh block]  (giống hệt đường gõ)
```

- **Điểm chốt kiến trúc**: đường bút và đường gõ **hội tụ về cùng LaTeX/MathJSON** (CLAUDE.md §6 sơ đồ luồng). Sau bước (4), KHÔNG có nhánh riêng cho bút — dùng chung backend `latex-sympy-pipeline`. Đừng tạo pipeline tính toán thứ hai cho bút.

## 2. Các phần phải làm (khi unblocked)

| Phần | Nội dung | PASS sơ bộ |
|---|---|---|
| SDK setup | nhúng iink theo thiết bị §11.1 (Web/SDK/cloud), key license | SDK init không lỗi license |
| Ink capture | nhận stroke từ stylus trong block | vẽ thấy mực realtime |
| Palm rejection | chỉ nhận stylus, bỏ chạm tay | tì tay không tạo nét |
| Recognition | ink → LaTeX, ≥250 ký hiệu | viết `x^2` → ra LaTeX `x^{2}` |
| Gesture | xóa (gạch ngang), sửa (scratch-out), chèn | cử chỉ xóa hoạt động |
| Auto-convert | mực → toán render khi nhận diện xong | nét tay thành công thức sạch |

## 3. Tension thiết kế (đã giải — giữ đúng)

CLAUDE.md §8.5: bút muốn **canvas tự do**, eval-live muốn **cấu trúc block**. Đã giải bằng **document block** (§4.3): mỗi block nhận **cả bút lẫn gõ**; bút viết *trong* block, không phải canvas mực vô hạn. → **KHÔNG** trượt sang GoodNotes-style free-ink. Giữ block model do `editor-frontend` dựng (TipTap/Lexical) — bút là một input layer *trong* block.

## 4. Self-verify gate (khi đã unblocked)

Theo `build-verify/SKILL.md`:
- Recognition: viết tay 1 ký hiệu (vd `x^2`) → ra LaTeX đúng (≥1 ký hiệu nhận diện được).
- `npm run build` exit 0 (lớp bút nằm trong frontend).
- Console 0 error khi capture ink.
- Bút→LaTeX đẩy qua **cùng** vòng-lõi → kết quả inline đúng (chứng minh hội tụ §6).

**Trước gate này phải qua human gate §11.2.** Chưa chốt license → gate không áp dụng, agent PAUSE.

## 5. Quick reference

```
⚠️ GATE TRƯỚC TIÊN: §11.2 license + §11.1 thiết bị CHƯA CHỐT → PAUSE, hỏi lead. KHÔNG viết code MyScript.
LUỒNG: ink → palm-reject → iink Math recognizer → LaTeX → HỘI TỤ cùng đường gõ → latex-sympy-pipeline → inline.
KHÔNG tạo pipeline tính thứ 2 cho bút. KHÔNG canvas mực tự do (giữ block §4.3).
Bút = giá trị cộng thêm, ghép SAU vòng-lõi gõ→inline (§12).
SDK bản nào phụ thuộc thiết bị §11.1 → không tự chọn.
```

## 6. Ranh giới — KHÔNG làm

| Không làm | Lý do |
|---|---|
| Viết code MyScript khi §11.2 chưa chốt | License tốn phí — human gate bắt buộc (§8.4, §11.2) |
| Tự chọn thiết bị/bản SDK | §11.1 là câu hỏi mở cho user (§11) |
| Tạo pipeline tính riêng cho bút | Phải hội tụ cùng LaTeX→SymPy đường gõ (§6) |
| Trượt sang canvas mực tự do | Phá document block §4.3 (đã giải tension §8.5) |
| Dựng lại block model | Đó là việc `editor-frontend` (TipTap/Lexical) — bút là input layer trong block |
