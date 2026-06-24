# tests/flows — Test-flow catalog (Nib)

> Thư mục này chứa **các flow test** dạng `.md` cho app Nib ("notepad toán học sống").
> Chủ sở hữu: vai **`tester`** (`.claude/agents/tester.md`). Flow được **soạn bằng skill
> `test-planning`** (lên kế hoạch: test gì / case nào / khi nào chạy) rồi **thực thi bằng skill
> `browser-test`** (lái Chrome thật, thu evidence).

## Một flow là gì

Một flow = 1 file `<feature-slug>.flow.md` mô tả **toàn bộ kế hoạch test cho một tính năng/màn/luồng**:
phải test cái gì, đủ các trường hợp có thể xảy ra (happy / edge / error / boundary + 3 yêu cầu nền
[LOCKED]), điều kiện kích hoạt (khi nào flow này được chạy), các bước thao tác, kết quả kỳ vọng,
evidence cần thu.

## Quy ước quản lý

| Mục | Quy ước |
|---|---|
| **Tên file** | `<feature-slug>.flow.md` — slug kebab-case theo tính năng (vd `math-block-eval.flow.md`, `settings-account.flow.md`). 1 tính năng/màn = 1 file. |
| **Template** | Copy `_TEMPLATE.flow.md` khi tạo flow mới. |
| **Status** | Frontmatter `status: draft | ready | executed` — `draft` (đang soạn) → `ready` (đủ case, sẵn sàng chạy) → `executed` (đã chạy + có evidence). |
| **Evidence** | Screenshot/GIF/console-log lưu trong `tests/flows/evidence/<slug>/`. Flow file trỏ tới evidence + ghi PASS/FAIL. |
| **Index** | Bảng "Catalog" dưới đây — thêm 1 dòng mỗi khi tạo flow mới. |
| **KHÔNG** | KHÔNG để code sản phẩm ở đây; KHÔNG hardcode chuỗi UI (kiểm cả en/vi qua key i18n); flow phải bám 3 yêu cầu nền `docs/requirements.md`. |

## Catalog

| Flow | Tính năng/màn | Status | Lần chạy gần nhất |
|---|---|---|---|
| [free-caret.flow.md](free-caret.flow.md) | Free-caret UX — ghost caret, materialize, arrow nav (Phase C) | executed | 2026-06-24 |

## Liên quan

- Skill lên kế hoạch flow: `.claude/skills/test-planning/SKILL.md`
- Skill thực thi browser: `.claude/skills/browser-test/SKILL.md`
- Vai sở hữu: `.claude/agents/tester.md`
- 3 yêu cầu nền [LOCKED] mọi flow phải phủ: `docs/requirements.md`
