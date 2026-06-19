---
name: team-fix
description: "Phục vụ riêng team-ops (note-ch): format issue-queue .claude/teams/issues.md, bảng ≥8 code lỗi phối hợp team + playbook sửa từng loại, ngưỡng trigger khi nào vá-brief vs sửa-agent-body (cần user duyệt). KHÔNG đụng code sản phẩm src/backend/src-tauri."
---

# team-fix — sửa bộ máy phối hợp team note-ch

> Skill phục vụ **riêng `team-ops`**. Mục đích: biến "team trục trặc" thành **issue có code + target sửa đo được**, rồi sửa **bộ máy team** (agent body / playbook / master / skill / settings.json) — KHÔNG sửa code sản phẩm.
> Nguồn lỗi: lead ghi vào `.claude/teams/issues.md` khi phát hiện lỗi phối hợp (playbook §6). `team-ops` đọc queue → phân loại → fix → báo lead diff.

---

## 0. Nguyên tắc bất biến

1. **Chỉ sửa `.claude/`.** Phạm vi: `.claude/agents/*.md`, `.claude/teams/playbook.md`, `.claude/master.md`, `.claude/skills/*`, `.claude/settings.json`, `.claude/teams/issues.md`. **TUYỆT ĐỐI KHÔNG** đụng `src/`, `backend/`, `src-tauri/` — đó là việc implementer.
2. **Mỗi fix map tới 1 issue có code.** Không sửa "cho đẹp" — chỉ sửa issue đang `open` trong queue, đúng target.
3. **Fix nhỏ nhất chữa được triệu chứng.** Vá brief/agent-body tối thiểu; không viết lại cả file vì 1 dòng.
4. **High-impact → user duyệt.** Sửa `master.md` / `playbook.md` / `settings.json` → báo lead trình **user duyệt** trước khi coi là done. Sửa 1 agent body / skill → báo lead diff là đủ.
5. **Sửa xong → đóng issue NGAY (điều kiện done).** Quay lại `.claude/teams/issues.md` đổi `open → fixed` + ghi `target` RÕ **đã sửa file nào + sửa GÌ (HOW)** + ngày `(team-ops, YYYY-MM-DD)`. Báo lead "đã fix" trong khi queue vẫn `open`/`target` trống = **CHƯA done** (lỗi team-ops hay mắc). High-impact chưa duyệt → giữ `open`, target "ĐÃ SOẠN, chờ user duyệt".

---

## 1. Format issue-queue `.claude/teams/issues.md`

Mỗi issue 1 block. Lead append khi phát hiện; `team-ops` cập nhật `status` + `target` khi fix.

```markdown
## ISSUE-<n> — <CODE> — <status: open | fixed>
- **time**: YYYY-MM-DD HH:MM
- **teammate**: <vai gây lỗi, vd editor-frontend / researcher / — nếu lỗi cơ chế chung>
- **symptom**: <hành vi/output sai quan sát được — cụ thể, không cảm tính>
- **target**: <file `.claude/` sẽ sửa + sửa gì> (team-ops điền khi fix)
- **note**: <tùy chọn: liên quan ISSUE khác, hoặc cần user duyệt>
```

Ví dụ:

```markdown
## ISSUE-3 — SILENT — fixed
- **time**: 2026-06-11 14:20
- **teammate**: backend-cas
- **symptom**: xong task nhưng không SendMessage report, lead phải hỏi mới biết done
- **target**: .claude/agents/backend-cas.md — siết "Trong TeamCreate mode" bước done = bắt buộc SendMessage kèm evidence
- **note**: lần 1, chỉ vá brief; nếu lặp → sửa agent body
```

- **Quy ước**: append cuối file, **KHÔNG overwrite** issue cũ. `team-ops` chỉ đổi `status`/`target` của issue mình xử, giữ nguyên lịch sử.
- File này **`team-ops` sở hữu** về mặt cập nhật trạng thái; lead chỉ append issue mới.

---

## 2. Bảng code lỗi + playbook sửa (≥8 code)

| Code | Triệu chứng | Nguyên nhân hay gặp | Target sửa (`.claude/` only) |
|---|---|---|---|
| `SILENT` | Không ack lúc spawn / xong không SendMessage report | Thiếu tool `SendMessage` trong frontmatter; "Trong TeamCreate mode" thiếu bước ack/done | Kiểm `tools:` agent body có `SendMessage`; thêm bước ack tự gửi + done=SendMessage kèm evidence |
| `SLOW-PICKUP` | Cần resend ≥1 lần lead mới được ack | First-spawn delay (đọc "Đọc đầu phiên" lâu) hoặc gửi task quá sớm bị queue đè | Không sửa vội agent — nhắc lead recipe "chờ ack tự gửi, resend nếu >45s"; chỉ sửa nếu "Đọc đầu phiên" quá dài → rút gọn |
| `FORGOT-TASKUPDATE` | Quên `TaskUpdate(in_progress/completed)` → lead không track được | "Trong TeamCreate mode" không nhấn TaskGet+TaskUpdate **cùng turn** | Siết bước 2 "Trong TeamCreate mode": TaskGet(N)+TaskUpdate(N,in_progress) cùng turn; done=TaskUpdate(completed) trước SendMessage |
| `SCOPE` | Làm ngoài brief / tự lấy task khác / sửa vùng vai khác | Brief mơ hồ ranh giới; agent body thiếu hard-constraint vùng file | Siết `scope:` trong brief template (playbook §3); thêm/siết "Hard constraints" ranh giới file trong agent body |
| `STALE` | Dùng context cũ, lặp lỗi đã ghi memory | "Đọc đầu phiên" không trỏ `memory/context.md`/`mistakes.md` | Thêm `memory/context.md` (+`mistakes.md` nếu implementer) vào "Đọc đầu phiên" agent body |
| `FORM` | Output sai định dạng (JSON thay vì prose; thiếu mục output) | Agent body output-format lỏng | Siết section output (vd researcher 4 mục / architect 5 mục A–E); nhắc bất biến "prose không JSON" |
| `GATE` | Phán "trông ổn / render đẹp" không exit-code | Agent body thiếu self-verify gate idiom đo được | Thêm/siết "Self-verify gate" trỏ `build-verify/SKILL.md`; cấm gate cảm tính trong agent body |
| `NO-SHUTDOWN-RESP` | Tự thoát không chờ `shutdown_request` / không ack shutdown | "Trong TeamCreate mode" thiếu bước 4 shutdown handler | Thêm bước "nhận shutdown_request → ack 'Shutdown ack' rồi dừng" vào agent body |
| `LEAD-DIY` | Lead tự code task phức tạp thay vì spawn | master ngưỡng trivial chưa rõ / playbook thiếu anti-pattern | Siết ngưỡng trivial master §phân-loại (≤3 file, ≤15 dòng, scope rõ); nhắc anti-pattern Lead-DIY playbook |
| `OTHER` | Lỗi phối hợp không khớp code trên | — | Phân tích case-by-case; nếu mới lặp lại → đề xuất thêm code mới vào bảng này |

> Mapping nhanh (từ playbook §6): không ack/báo xong=`SILENT`; cần resend=`SLOW-PICKUP`; quên TaskUpdate=`FORGOT-TASKUPDATE`; ngoài brief=`SCOPE`; context cũ=`STALE`; JSON thay prose=`FORM`; cảm tính=`GATE`; tự thoát=`NO-SHUTDOWN-RESP`.

---

## 3. Ngưỡng trigger — vá-brief vs sửa-agent-body

Quyết định **mức** sửa theo tần suất, KHÔNG sửa agent body ngay từ lần đầu:

| Tình huống | Hành động | Cần user duyệt? |
|---|---|---|
| 1 issue, lần đầu, không lặp | **Vá tại chỗ** (lead đã vá brief) — chỉ ghi issue `fixed`, gợi ý theo dõi | Không |
| **1 code lặp >1 lần trong cùng session** | Đề xuất **sửa agent body / skill / playbook** (root-cause) | Nếu là agent body/skill: báo lead diff. Nếu master/playbook/settings: **user duyệt** |
| **≥3 issue cùng (vai, code)** | **Bắt buộc** sửa agent body của vai đó — vá brief không còn đủ | Báo lead diff; high-impact → user duyệt |
| Issue đụng `master.md`/`playbook.md`/`settings.json` | Sửa nhưng **dừng chờ user duyệt** trước khi coi done | **User duyệt (bắt buộc)** |

- **Nguyên tắc**: triệu chứng lặp = lỗi **cơ chế** (agent body/playbook), không phải lỗi 1 lần → phải sửa gốc. Triệu chứng đơn lẻ = vá brief đủ.
- Sau khi sửa agent body → **gợi ý lead chạy re-spawn smoke** 1 teammate vai đó (ack được + TaskUpdate đúng) để xác nhận fix không làm hỏng frontmatter.

---

## 4. Quy trình xử 1 issue (team-ops)

1. Đọc `.claude/teams/issues.md` — lọc issue `status: open`.
2. Với mỗi issue: xác nhận **code** (dùng mapping §2); nếu lead chưa gán code, gán theo triệu chứng.
3. Đếm tần suất (vai, code) trong queue → áp **ngưỡng §3** để chọn mức sửa.
4. Áp fix tối thiểu vào target `.claude/` (Edit/Write) — **chỉ `.claude/`**.
5. **NGAY sau Edit (trước khi báo lead):** cập nhật issue `open → fixed` + điền `target` ghi RÕ file đã sửa + **sửa GÌ (HOW)** + ngày. Đừng để bước này sau cùng — dễ rớt; queue chưa cập nhật = chưa done.
6. Báo lead: **diff thay đổi** (file + tóm tắt). High-impact (`master`/`playbook`/`settings.json`) → giữ issue `open` + target "ĐÃ SOẠN, chờ user duyệt", nói rõ "chờ user duyệt".
7. Sửa agent body → gợi ý lead re-spawn smoke vai đó.
8. Có bài học → append `.claude/memory/patterns.md` (theo skill `memory`).

---

## 5. Ranh giới — điều KHÔNG làm

| Không làm | Lý do |
|---|---|
| Sửa `src/` / `backend/` / `src-tauri/` | Code sản phẩm là việc implementer — `team-ops` chỉ sửa bộ máy team |
| Viết lại cả agent body vì 1 dòng lỗi | Fix nhỏ nhất chữa triệu chứng; giữ format `planner.md` |
| Sửa `master`/`playbook`/`settings.json` rồi tự coi done | High-impact → **user duyệt** trước |
| Sửa agent body ngay từ issue đơn lẻ lần đầu | Vá brief đủ — chỉ sửa gốc khi lặp (§3 ngưỡng) |
| Overwrite issue cũ trong queue | Append-only; chỉ đổi status/target issue mình xử, giữ lịch sử |
| Tự quyết WHAT/scope app hoặc đảo [LOCKED] | Ngoài vai — đó là planner/user |

---

## 6. Quick reference

```
ISSUE = code + symptom + target (.claude/ only). Lead append, team-ops fix.
Codes: SILENT · SLOW-PICKUP · FORGOT-TASKUPDATE · SCOPE · STALE · FORM · GATE · NO-SHUTDOWN-RESP · LEAD-DIY · OTHER
Ngưỡng: đơn lẻ → vá brief | lặp >1 / ≥3 cùng (vai,code) → sửa agent body (root-cause)
High-impact (master/playbook/settings) → USER DUYỆT trước khi done. Agent body/skill → báo lead diff.
Sau sửa agent body → gợi ý lead re-spawn smoke vai đó.
CHỈ .claude/ — KHÔNG src/ backend/ src-tauri/.
```
