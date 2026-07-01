---
name: test-planning
description: "Lên kế hoạch flow test cho Nib (tester): soạn tests/flows/<slug>.flow.md theo _TEMPLATE — test gì, đủ case có thể xảy ra (6 nhóm + 3 yêu cầu nền [LOCKED]), khi nào chạy. Background-safe (không cần Chrome). Output = flow file status:ready."
---

# test-planning — lên kế hoạch flow test Nib

> Skill phục vụ riêng vai **`tester`**. Mục đích: trước khi chạm Chrome, soạn 1 **flow đầy đủ** — test GÌ, đủ CASE (mọi tình huống có thể), KHI NÀO chạy — để việc thực thi có hướng rõ ràng và không bỏ sót.
> Pha này **background-safe** (không cần Chrome).

---

## 1. Workflow soạn flow (các bước rõ ràng)

1. **Xác định phạm vi** — đọc brief task + đọc code liên quan trong `src/` (Grep/Glob trúng đích, KHÔNG đọc tràn):
   - Tính năng/màn cần test là gì? Route/component nào?
   - Hành vi kỳ vọng là gì? Đọc luồng code để hiểu đúng expected output.
   - 3 yêu cầu nền [LOCKED] áp như thế nào cho tính năng này? (xem §3 dưới)

2. **Copy template** `tests/flows/_TEMPLATE.flow.md` → tạo `tests/flows/<feature-slug>.flow.md`:
   - Slug = kebab-case tên tính năng/màn (vd `math-block-eval`, `settings-account`, `login-modal`).
   - Điền frontmatter: `slug`, `title`, `status: draft`, `created: YYYY-MM-DD`.

3. **Điền §1 — Phạm vi & trigger** (bắt buộc trước khi liệt case):
   - Viết rõ "test cái gì" (1–2 câu đo được).
   - Ghi route/màn cụ thể trong app Nib.
   - Định nghĩa trigger (xem §2 dưới).
   - Ghi tiền điều kiện (dev server :1420 đang chạy? cần login? cần có doc sẵn?).

4. **Liệt kê case đầy đủ** — theo checklist 6 nhóm + 3 req nền ở §3 + phân hoạch tương đương ở §3b. Mỗi case phải có:
   - Nhóm (Happy/Edge/Error/Boundary/Empty/Concurrent/i18n/Theme/Thiết bị).
   - Mô tả case rõ ràng.
   - Input/điều kiện cụ thể.
   - Kết quả kỳ vọng **đo được** (không cảm tính — không "trông đúng"; phải: "hiển thị text X", "console 0 error", "token màu Y", "layout không vỡ ≥1024px").
   - Nhóm không áp dụng → ghi `N/A — <lý do cụ thể>` (không bỏ trống).

5. **Điền §3 — Các bước thao tác**: viết sequence thao tác browser cụ thể (navigate → click → type → observe) theo format `browser-test/SKILL.md`. Đủ chi tiết để người khác (lead/user) cũng làm được.

6. **Điền §4 — Kết quả kỳ vọng & evidence**: PASS khi gì (đo được), evidence cần thu là gì (screenshot/GIF/console), lưu ở đâu (`tests/evidence/<slug>/`).

7. **Đổi `status: ready`** khi đủ done-criteria (xem §4).

8. **Cập nhật Catalog** `tests/flows/README.md` — thêm 1 dòng vào bảng Catalog:
   ```
   | <slug>.flow.md | <Tính năng/màn> | ready | — |
   ```

---

## 2. Định nghĩa "trigger" — khi nào flow này được chạy

Mỗi flow phải ghi rõ điều kiện kích hoạt. Dùng 1 trong các loại sau (có thể kết hợp):

| Loại trigger | Ví dụ |
|---|---|
| **Feature-complete** | "Sau khi `editor-frontend` hoàn tất Task #N — math-block-eval" |
| **Pre-release** | "Trước mỗi release (bất kể task nào trong phase)" |
| **Touch-area** | "Khi bất kỳ task nào đụng vùng `SettingsOverlay/` hoặc `AccountSection`" |
| **Regression** | "Mỗi khi có sửa liên quan `YjsProvider` / `yPersistence`" |
| **Human-gate** | "Sau khi user setup Supabase + Render (Phase C accounts-cloud-sync)" |

Trigger mơ hồ ("khi cần") → **KHÔNG hợp lệ**. Phải đo được / quan sát được.

---

## 3. Checklist case — 6 nhóm + 3 yêu cầu nền [LOCKED]

> **Bắt buộc phủ tất cả. Bỏ nhóm PHẢI ghi lý do N/A.**

### Nhóm 1 — Happy path
Luồng chính thành công, user thao tác đúng như thiết kế. Phải có ít nhất 1 case.

**Câu hỏi gợi ý:** Tính năng này làm gì khi mọi thứ đúng? Output chính là gì?

### Nhóm 2 — Edge
Giá trị biên, trống, rất lớn, ký tự đặc biệt. Áp dụng khi tính năng nhận input của user.

**Câu hỏi gợi ý:** Input rỗng thì sao? Input 1 ký tự / 10.000 ký tự? Ký tự LaTeX đặc biệt?

### Nhóm 3 — Error
Input sai format, mạng lỗi, server fail, auth hết hạn. Áp dụng khi có network call hoặc validation.

**Câu hỏi gợi ý:** Server 500 thì UI báo gì? Token expired thì sao? Form submit thiếu field bắt buộc?

### Nhóm 4 — Boundary
Giới hạn hệ thống: max length, min value, số 0, số âm, overflow. Áp dụng khi có số/text/list có giới hạn.

**Câu hỏi gợi ý:** Tên doc 200 ký tự có bị cắt không? Block thứ 1000 có lag không?

### Nhóm 5 — Empty / First-run
Trạng thái rỗng, lần đầu dùng tính năng, chưa có data. Luôn áp dụng.

**Câu hỏi gợi ý:** App mới cài, chưa có doc → hiển thị gì? List rỗng trông như thế nào?

### Nhóm 6 — Concurrent / State
Thao tác chồng nhau, reload giữ state, nhiều tab, undo/redo. Áp dụng khi có state persist hoặc real-time.

**Câu hỏi gợi ý:** Reload sau khi gõ → state còn không? Undo nhiều lần → không crash? 2 tab cùng edit → sync đúng không?

---

### Yêu cầu nền [LOCKED] — scope-driven relevance gate

| # | Nhóm | Case bắt buộc kiểm | Input/điều kiện | Kết quả kỳ vọng |
|---|---|---|---|---|
| 7 | **i18n [LOCKED]** | Chuỗi hiển thị đúng cả `en` và `vi`, không hardcode | Đổi `lang` trong Settings | Key i18n render đúng 2 ngôn ngữ; không thấy key raw (vd `settings.lang`) hay chuỗi tiếng Anh cứng khi chọn vi |
| 8 | **Theme [LOCKED]** | Màu từ token, không hex rời; light/dark/system đều đúng | Đổi theme trong Settings → light → dark → system | Không vỡ layout; không thấy màu không đổi khi switch; `--accent`, `--bg-base`, v.v. áp đúng |
| 9 | **Thiết bị [LOCKED]** | ≥1024px landscape; chuột+phím tối thiểu; cảm ứng nếu áp dụng | Resize cửa sổ ≥1024px | Layout không vỡ; hit target ≥44px; không có horizontal scrollbar ở 1024px |

> **Scope-driven relevance gate (ISSUE-21):** 3 nền LOCKED **chỉ test khi changeset CHẠM tới** — logic thuần không đổi text/màu/layout → `N/A — changeset không chạm <X>` là **HỢP LỆ**.
> - **i18n**: test khi changeset đổi/thêm/xoá chuỗi hiển thị (`en.json`/`vi.json`). Logic thuần (caret, insertion, math engine) không đổi chuỗi → N/A.
> - **Theme**: test khi changeset đổi màu, CSS, token, rendering visual. Thuật toán caret/nav thuần không chạm CSS → N/A.
> - **Thiết bị**: test khi changeset đổi layout, component kích thước, responsive breakpoint. Logic insertion thuần không ảnh hưởng layout → N/A.
>
> **N/A KHÔNG hợp lệ** nếu: không có lý do changeset cụ thể ("N/A vì lười" = bị trả lại). Phải ghi rõ "N/A — changeset không chạm i18n/theme/layout".

---

## 3b. Phân hoạch case TRONG 1 hành vi (equivalence + boundary + tổ hợp)

> 6 nhóm §3 = phân loại **HÀNG DỌC** (loại vấn đề). Khi 1 hành vi có **tham số biến thiên** ("vị trí bất kỳ", "ký tự bất kỳ", "thứ tự bất kỳ"…), cần phân hoạch **HÀNG NGANG** bên TRONG hành vi đó. Thiếu bước này → "1 happy case" cho hành vi nhiều điểm → false-pass (ISSUE-22/23).

### A. Phân hoạch lớp tương đương (equivalence partition)

Từ acceptance criterion, trích tham số biến thiên → chia lớp tương đương → ít nhất 1 representative case mỗi lớp.

**Worked example: acceptance = "chèn ký tự ở VỊ TRÍ BẤT KỲ trên cùng 1 dòng"**

Tham số biến thiên = **vị trí** → lớp tương đương:

| Lớp | Representative case | Input | Expected |
|---|---|---|---|
| Đầu dòng (pos=0) | chèn trước ký tự đầu | click pos 0, gõ "X" | "X" xuất hiện đầu dòng |
| Giữa dòng (0 < pos < end) | chèn giữa chuỗi | click giữa "hello", gõ "!" | "hel!lo" |
| Cuối dòng (pos=end) | chèn sau ký tự cuối | click sau ký tự cuối, gõ "Z" | chuỗi kết thúc "...Z" |
| Giữa 2 đoạn sát nhau | chèn giữa vùng text kề | click giữa 2 đoạn, gõ | text đúng x, đoạn phải không bị đẩy sai |
| Dòng trống | chèn vào dòng trống | click dòng trống, gõ | row có text tại đúng vị trí click |

→ **≥5 case** thay vì 2 (đầu+giữa). **Red-flag:** thấy "vị trí bất kỳ" nhưng chỉ có 2 case → THIẾU.

### B. Boundary-value

Kiểm điểm biên của tham số: giá trị nhỏ nhất, lớn nhất, vừa-trong/vừa-ngoài.

- pos=0 (đầu tuyệt đối), pos=len (cuối tuyệt đối), pos=len-1 (trước cuối).
- Dòng có đúng 1 ký tự, dòng trống.
- Dòng đã đầy (line_len = paper width) khi thêm ký tự vào giữa.

### C. Tổ hợp chuỗi thao tác (sequence combo)

≥1 case gồm ≥2 thao tác liên tiếp ở vị trí khác nhau — kiểm tính bất biến.

- Chèn A ở pos=2 → chèn B ở pos=5 → verify cả hai đúng vị trí (đoạn bên phải không bị đẩy sai).
- Chèn → Undo → caret và text khôi phục đúng.
- Gõ nhiều ký tự liên tiếp tại cùng vị trí → string ghép đúng thứ tự.

### Checklist red-flag (khi review flow trước khi đánh `ready`)

- [ ] Acceptance có từ "bất kỳ" / "tùy ý" / "mọi vị trí" → **BẮT BUỘC liệt lớp tương đương §3b.A**.
- [ ] Chỉ có 1–2 happy case cho hành vi có ≥3 lớp tương đương rõ ràng → **THIẾU, bổ sung trước khi `ready`**.
- [ ] Không có sequence combo khi hành vi có thao tác liên tiếp → có thể thiếu regression.
- [ ] N/A cho nhóm Boundary khi có tham số số/vị trí → **bắt buộc có lý do cụ thể**.

**Anti-pattern điển hình:** "Test đầu+giữa cho acceptance 'vị trí bất kỳ'" — bỏ cuối/biên/tổ hợp → Playwright xanh nhưng user test tay vẫn lỗi.

---

## 4. Done-criteria của 1 flow "ready"

Flow được đánh `status: ready` khi **tất cả** điều kiện sau thoả:

- [ ] Frontmatter đầy đủ: `slug` / `title` / `status: ready` / `owner: tester` / `created`.
- [ ] §1 có đủ: test-cái-gì + route/màn + trigger đo được + tiền điều kiện.
- [ ] §2 có ≥6 nhóm (hoặc N/A có lý do cụ thể) + 3 req nền [LOCKED] đủ.
- [ ] **Mỗi case** có: mô tả rõ + input/điều kiện + kết quả kỳ vọng **đo được** (không cảm tính).
- [ ] §3 có sequence thao tác đủ chi tiết để người khác thực thi được.
- [ ] §4 có PASS condition đo được + evidence plan.
- [ ] Catalog `tests/flows/README.md` đã được cập nhật (1 dòng thêm).

---

## 5. Cấu trúc quản lý file

```
tests/
├── flows/                       # Kế hoạch: .flow.md + README + _TEMPLATE (ISSUE-25 Phương án A)
│   ├── README.md                # Catalog tổng (team-ops sở hữu; tester cập nhật Catalog)
│   ├── _TEMPLATE.flow.md        # Template bắt buộc copy khi tạo mới
│   └── <feature-slug>.flow.md  # Flow mỗi tính năng/màn (tester sở hữu)
├── e2e/
│   └── <feature-slug>.spec.ts  # Playwright spec — 1 flow = 1 spec, cùng slug với .flow.md
└── evidence/
    └── <feature-slug>/          # Screenshot/GIF/console per flow (commit; tái dùng làm baseline)
        ├── case-1-happy.png
        ├── case-3-error.gif
        └── console.txt
test-results/                    # Artifact tạm — KHÔNG commit (gitignore)
playwright-report/               # HTML report tạm — KHÔNG commit (gitignore)
```

> **Evidence** (`tests/evidence/<slug>/`) = artifact có chủ đích, **CÓ commit** để làm baseline regression.
> **Artifact tạm (KHÔNG commit):** `test-results/`, `playwright-report/` — đã ghi vào `.gitignore`.

| File | Quy ước |
|---|---|
| Tên flow | `<feature-slug>.flow.md` — kebab-case tên tính năng; 1 tính năng = 1 file |
| Playwright spec | `tests/e2e/<feature-slug>.spec.ts` — cùng slug với flow.md tương ứng |
| Status | `draft` (đang soạn) → `ready` (đủ case) → `executed` (đã chạy có evidence) |
| Evidence | `tests/evidence/<slug>/` — tên file gợi nhớ case (vd `case-1-happy.png`) |
| Catalog | Thêm dòng vào bảng README.md khi tạo flow mới; cập nhật "Lần chạy gần nhất" khi executed |

---

## 6. Quick reference

```
WORKFLOW:
  1. Xác định phạm vi (đọc src/, đọc brief)
  2. Copy _TEMPLATE.flow.md → tests/flows/<slug>.flow.md
  3. Điền §1 (phạm vi + trigger + tiền điều kiện)
  4. Liệt case theo checklist 6 nhóm + 3 req nền [LOCKED]
  5. Điền §3 thao tác browser (đủ chi tiết)
  6. Điền §4 PASS condition + evidence plan
  7. status: ready → cập nhật README.md Catalog

DONE-CRITERIA "ready":
  - ≥6 nhóm case (N/A có lý do) + 3 req nền scope-driven (§3: chỉ khi changeset CHẠM)
  - Hành vi có "bất kỳ"/"tùy ý" → phân hoạch tương đương §3b (≥1 case/lớp)
  - Mỗi case: input + expected ĐO ĐƯỢC (không cảm tính)
  - Trigger đo được; tiền điều kiện rõ
  - Catalog cập nhật

TRIGGER TYPES: feature-complete | pre-release | touch-area | regression | human-gate
3 NỀN [LOCKED] scope-driven: i18n (khi đổi chuỗi) · theme (khi đổi màu/CSS) · thiết bị (khi đổi layout)
  Logic thuần không chạm → N/A hợp lệ (ghi "N/A — changeset không chạm <X>")
EQUIVALENCE (§3b): "bất kỳ" → chia lớp → ≥1 case/lớp; ≥1 sequence combo; boundary min/max
```
