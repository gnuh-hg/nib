---
name: orchestration-routing
description: "Phục vụ riêng LEAD (Nib): vẽ bản đồ dispatch thô khi nhận 1 request — request → giai đoạn → vai nào (roster 10 vai) → gate gì → khi nào gọi tester → khi nào done. KHÔNG quyết WHAT/scope (đó là planner). Dùng đầu mỗi request non-trivial, trước khi spawn."
---

# orchestration-routing — bản đồ dispatch cho lead (Nib)

> Skill phục vụ **riêng lead**. Mục đích: khi nhận 1 request, lead dùng skill này để vẽ nhanh
> **dispatch map** — request thuộc loại gì → chain vai nào (bám rubric `master.md §4`) → gate gì giữa
> mỗi bước → **khi nào bắt buộc gọi `tester`** → checklist DONE trước khi thoát LOOP.
>
> **Ranh giới với `planner` (tránh xung đột vai):**
> - `planner` = **WHAT** — scope, done-criteria, plan artifact (ROADMAP/PLAN.md/CHECKPOINT.md) của
>   **công việc thực** (nội dung feature/fix).
> - `orchestration-routing` = **DISPATCH/điều phối** — vai nào chạy, thứ tự nào, gate nào, tester lúc
>   nào. **KHÔNG quyết nội dung công việc.**
> - Routing skill **KHÔNG thay `planner`**. Với phase multi-session (PLAN-GATE, `master.md §3`), lead
>   VẪN phải spawn `planner` sinh plan artifact — routing chỉ giúp lead xác định trước "sau planner thì
>   đi vai nào, gate gì, tester lúc nào".

---

## 1. Khi nào dùng skill này

- Đầu **mỗi request non-trivial** (không phải trivial ≤3 file/≤15 dòng, không phải câu hỏi đọc file) —
  **trước khi spawn** teammate nào.
- Khi lead phân vân "request này cần vai nào, theo thứ tự nào, có cần tester không".
- Khi lead sắp kết thúc LOOP (TaskList rỗng) — dùng checklist DONE §4 trước khi shutdown team.

---

## 2. Bảng map loại-request → chain vai (bám rubric `master.md §4`)

| Loại request | Chain vai (thứ tự) | Gate giữa mỗi bước | Tester? |
|---|---|---|---|
| Xây tính năng mới multi-file/domain (MathLive block, pipeline LaTeX→SymPy...) | researcher → **planner (PLAN-GATE)** → architect → implementer | mỗi mũi tên = 1 gate lead (câu hỏi chặn / Goal đo được / API contract đủ / build-verify evidence) | **CÓ** — sau implementer báo done + evidence pass (changeset block bắt buộc) |
| Sửa có yêu cầu user mới trên code đã có | planner (light) → implementer | done-criteria đo được → build-verify evidence | Cân nhắc — nếu đổi hành vi user-facing quan sát được → CÓ; nếu chỉ refactor nội bộ không đổi hành vi → có thể bỏ, ghi rõ lý do |
| Chỉ thiết kế UI/visual (mockup HTML/CSS) | researcher → planner → design | 8 DC gate (`design/SKILL.md`) | KHÔNG (chưa có code chạy được — chỉ mockup) |
| Chỉ thiết kế (chưa build) | researcher → planner → architect | 5 mục A–E đủ để implementer không đoán | KHÔNG |
| FIX sự cố phối hợp team | team-ops | issue-queue đọc + diff báo lead; high-impact chờ user duyệt | KHÔNG (team-ops không đụng code sản phẩm) |
| Test/QA E2E chủ động (không theo sau 1 implementer task cụ thể) | tester (trực tiếp) | flow.md `ready` + đủ case → execute → verdict | Đây CHÍNH LÀ bước tester |
| Trivial / hỏi-đọc-file | lead tự làm | — | KHÔNG |

> Bảng này là **rút gọn thao tác** của `master.md §4` — khi có mâu thuẫn, `master.md §4` là nguồn sự
> thật. Routing skill không tự thêm loại request mới ngoài rubric.

---

## 3. Checklist DONE bắt buộc (chống quên tester — fix ISSUE lặp "lead xong không gọi tester")

Trước khi lead coi 1 workstream là **xong** (TaskList rỗng, chuẩn bị shutdown team), chạy checklist:

```
[ ] Mọi task implementer đã có build-verify evidence PASS (không "trông ổn")?
[ ] Feature/fix vừa xong có ĐẠT trạng thái TESTABLE không (chạy được, quan sát được hành vi)?
      → CÓ  → đã spawn `tester` với changeset block (file/hành vi đổi + acceptance nguyên văn) CHƯA?
              CHƯA → KHÔNG được kết thúc LOOP. Spawn tester trước.
      → KHÔNG (vd chỉ design/chỉ architect, chưa có code chạy) → tester N/A, ghi rõ lý do trong report.
[ ] Nếu đã spawn tester: verdict PASS/FAIL per-case đã nhận về CHƯA? Chưa nhận → LOOP chưa xong.
[ ] Memory (context.md/patterns.md) đã ghi trạng thái/bài học CHƯA?
[ ] shutdown_request đã gửi mọi teammate + chờ ack CHƯA?
```

> **Dòng bắt buộc nhớ**: *"Feature đạt testable → đã spawn tester chưa? Chưa → chưa được kết thúc LOOP."*
> Đây là fix trực tiếp cho lỗi lặp "lead nhiều lần xong task mà không gọi tester" — xem
> `master.md §7` (gate implementer + tester E2E) và `master.md §3` (vòng lặp điều phối).

---

## 4. Peer-DM + PLAN-GATE như công cụ điều phối

- **Peer-DM có cấu trúc** (whitelist — `playbook.md §4`): khi routing map cho thấy 2 vai kế nhau cần
  clarify nhanh (vd architect ↔ researcher, implementer ↔ architect) — lead có thể để họ tự hỏi-đáp
  NGẮN thay vì lead làm trung gian mọi câu hỏi nhỏ. Nhắc: câu trả lời quan trọng vẫn phải vào report
  gửi lead; deliverable luôn về lead gate.
- **PLAN-GATE** (`master.md §3`): routing map KHÔNG bỏ qua bước này — mọi request "xây phase/feature
  mới multi-session" trong bảng §2 vẫn bắt buộc `planner` sinh plan artifact PASS trước khi giao
  architect/implementer.

---

## 5. Anti-pattern

| Sai | Đúng |
|---|---|
| Dùng routing skill để tự quyết WHAT/scope/done-criteria của feature | Đó là việc `planner` — routing chỉ quyết dispatch (vai/thứ tự/gate) |
| Bỏ qua `planner` vì "đã có routing map rồi" | Routing map KHÔNG thay PLAN-GATE — plan artifact vẫn bắt buộc cho phase multi-session |
| Implementer báo done + evidence pass → lead shutdown team ngay, quên tester | Chạy checklist §3 TRƯỚC khi coi done — testable mà chưa gọi tester = chưa xong LOOP |
| Dùng peer-DM để giao task/duyệt kết quả giữa 2 vai | Peer-DM chỉ consult/clarify; giao task + gate vẫn qua lead (`playbook.md §4`) |

---

## 6. Liên quan

- `master.md §3` (vòng lặp TaskList loop) + `§4` (rubric loại request) + `§7` (gate implementer + tester E2E).
- `.claude/teams/playbook.md §1` (khi nào TeamCreate) + `§4` (peer-DM whitelist + SendMessage protocol) + `§7` (PASS-criteria per-vai).
- `.claude/agents/planner.md` — vai WHAT, KHÔNG bị routing skill thay thế.
- `.claude/skills/build-verify/SKILL.md` — gate implementer. `.claude/skills/test-planning/SKILL.md` + `.claude/skills/browser-test/SKILL.md` — 2 pha tester.
