# Findings — ISSUE-7: plan-approval × permission storm

> Điều tra tại sao spawn `mode:"plan"` rồi `ExitPlanMode` dẫn đến permission prompt storm.
> Ngày: 2026-06-20. Thực hiện: team-ops (Phase C). KHÔNG test runtime (không spawn teammate trong task này).

---

## 1. Triệu chứng quan sát

Từ ISSUE-7 (issues.md):
- `editor-frontend` spawn với `mode:"plan"` (plan-approval cho Session 1.1 xóa ModeToggle, task rủi ro cao).
- Sau khi lead duyệt plan → teammate `ExitPlanMode` để bắt đầu implement.
- Sau `ExitPlanMode`, **mỗi lần Write/Edit file đều bật permission prompt** xin quyền ghi, thay vì auto-accept như `defaultMode: acceptEdits` kỳ vọng.
- Lead fix tạm: Session 1.2/1.3 spawn **default mode** (không `mode:"plan"`) → không còn prompt storm.

---

## 2. Phân tích cơ chế (không test runtime)

### 2a. Cách `defaultMode: acceptEdits` hoạt động

Từ `settings.json` hiện tại:
```json
"defaultMode": "acceptEdits",
"allow": ["Bash", "Read", "Edit", "Write", ...]
```

Theo playbook §9: "Permissions teammate = kế thừa mode của lead lúc spawn — mode lấy từ `.claude/settings.json` `defaultMode: acceptEdits`".

### 2b. `mode:"plan"` = spawn với mode khác `defaultMode`

Khi lead spawn `Agent(..., mode="plan")`, teammate khởi động ở **plan mode** (read-only), KHÔNG phải `acceptEdits`. Đây là mode override tại spawn time.

### 2c. Giả thuyết về ExitPlanMode (không verify được runtime)

Có 2 khả năng:

**Khả năng A (likely):** `ExitPlanMode` chuyển teammate từ `plan` sang `default` — nhưng `default` ở đây là **Claude Code global default** (yêu cầu xác nhận từng tool call), KHÔNG phải `acceptEdits` từ `settings.json`. Tức `settings.json defaultMode` chỉ ảnh hưởng khi spawn mới, không retroactively áp sau ExitPlanMode.

**Khả năng B:** `ExitPlanMode` trả mode về `acceptEdits` nhưng có bug trong Agent Teams mode — mode state không được propagate đúng sang tool execution layer.

**Khả năng C:** `allow` list trong `settings.json` không được load lại sau ExitPlanMode → tool calls như `Write`/`Edit` bị re-prompt dù đã có trong allow list.

### 2d. Bằng chứng gián tiếp hỗ trợ Khả năng A

- Lead fix bằng spawn default mode (không plan) → không prompt → chứng tỏ `acceptEdits` hoạt động bình thường KHI SPAWN DEFAULT.
- Vấn đề CHỈ xảy ra sau `ExitPlanMode` → ExitPlanMode là trigger.
- Context.md note: "Lead fix tạm: S1.2/S1.3 spawn **default mode** (không plan) → hết prompt" — xác nhận bypass plan spawn = fix triệu chứng.

---

## 3. Kết luận

**Root cause (nghi vấn, không verify runtime):** `ExitPlanMode` không khôi phục `acceptEdits` từ `settings.json defaultMode`. Sau exit, teammate rơi vào một mode intermediate yêu cầu xác nhận mỗi tool call Write/Edit, thay vì auto-accept.

**Hệ quả:** Mọi session dùng `mode:"plan"` → ExitPlanMode → implement đều có nguy cơ prompt storm, kể cả khi `settings.json` đã set `defaultMode: acceptEdits`.

---

## 4. Đề xuất fix

### Option 1 — Workaround (LOW RISK, khuyến nghị trước)

**Không dùng `mode:"plan"` cho session ghi nhiều file.** Thay bằng brief-level plan approval:

```
# Thay vì:
Agent(..., mode="plan")  # prompt storm sau ExitPlanMode

# Dùng:
Agent(...) # default mode (acceptEdits)
# Trong brief, ghi:
"STOP SAU KHI SOẠN PLAN — đọc toàn bộ code cần thiết, soạn kế hoạch implement
(component tree + file list + risk), DỪNG tại 'Plan soạn xong. Chờ lead duyệt.'
KHÔNG ghi bất kỳ file src/ nào trước khi được ack. Chờ lead SendMessage 'approve'."
```

Cơ chế: teammate vẫn ở `acceptEdits`, chỉ dừng bằng instruction trong brief, không phải mode-level lock. Lead ack → teammate tiếp tục ghi file mà không cần ExitPlanMode.

**Trade-off:** Kém enforce hơn `mode:"plan"` (teammate có thể vô tình ghi file nếu không tuân brief). Tuy nhiên:
- Thực tế: teammate Nib tuân brief tốt (ít vi phạm scope trong log).
- Risk thấp hơn prompt storm phá session thật.

### Option 2 — Fix settings.json (cần verify + user duyệt)

Nếu root cause là `allow` list không được reload sau ExitPlanMode, có thể thêm explicit `acceptEdits` permission entry. Tuy nhiên cần verify runtime trước khi áp — KHÔNG làm trong task này.

### Option 3 — Document workaround trong playbook §10 (LOW-IMPACT, khuyến nghị)

Thêm cảnh báo vào `playbook.md §10 Plan-approval mode`:

> ⚠️ **ISSUE-7 — prompt storm sau ExitPlanMode:** Spawn `mode:"plan"` rồi ExitPlanMode có thể không khôi phục `acceptEdits`. Khuyến nghị thay thế: spawn **default mode** + dùng brief-level instruction "STOP sau khi soạn plan, chờ lead ack." Tránh `mode:"plan"` cho session có nhiều Write/Edit.

---

## 5. Hành động đề xuất

| Hành động | Impact | Cần user duyệt? | Priority |
|---|---|---|---|
| Workaround brief-level approval (Option 1) | LOW (chỉ đổi cách dùng) | Không — document trong playbook | ⭐ Làm ngay |
| Thêm cảnh báo playbook §10 (Option 3) | HIGH (playbook) | **Có** | ⭐ Gom vào diff Phase C |
| Verify runtime ExitPlanMode behavior | — | — | Để sau (cần env test riêng) |
| Fix settings.json nếu allow list là root cause | HIGH (settings.json) | **Có** | Sau khi verify runtime |

---

## 6. Diff đề xuất cho playbook §10 (chờ user duyệt)

Thêm vào cuối section §10 Plan-approval mode, TRƯỚC section "Human gate §11.2":

```markdown
> ⚠️ **ISSUE-7 — Không dùng `mode:"plan"` cho session ghi nhiều file:** ExitPlanMode có thể không
> khôi phục `acceptEdits` → prompt storm mỗi Write/Edit. **Khuyến nghị thay thế (workaround)**:
> spawn **default mode** (không `mode:"plan"`) + ghi rõ trong brief: *"STOP SAU KHI SOẠN PLAN —
> soạn component tree + file list + risk, DỪNG tại 'Plan xong, chờ lead duyệt.' KHÔNG ghi src/
> trước khi được ack."* Teammate dừng bằng instruction, không phải mode-level lock → không prompt
> storm. Áp `mode:"plan"` CHỈ khi session thuần read-only (researcher, architect) — không ghi file.
```

---

## 7. Status

- Findings: **HOÀN THÀNH** (không cần test runtime — đủ để document workaround).
- Playbook §10 diff: **ĐÃ SOẠN** (xem §6 trên) — **chờ user duyệt** trước khi áp.
- settings.json: **KHÔNG ĐỀ XUẤT** lúc này (chưa verify runtime root cause).
