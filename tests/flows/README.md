# tests/flows — Test-flow catalog (Nib)

> Thư mục này chứa **các flow test** dạng `.md` cho app Nib ("notepad toán học sống").
> Chủ sở hữu: vai **`tester`** (`.claude/agents/tester.md`). Flow được **soạn bằng skill
> `test-planning`** (lên kế hoạch: test gì / case nào / khi nào chạy) rồi **thực thi bằng
> Playwright headless** (primary, background-safe) hoặc Chrome MCP (secondary, foreground-only)
> — xem skill `browser-test` + `playwright.config.ts` ở root repo.

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
| **Playwright spec** | `tests/flows/playwright/<feature-slug>.spec.ts` — 1 flow = 1 spec, **cùng slug** với `.flow.md`. Chạy: `npx playwright test tests/flows/playwright/<slug>.spec.ts`. Config: `playwright.config.ts` ở root (testDir, baseURL :1420). |
| **Evidence** | Screenshot/GIF/console-log lưu trong `tests/flows/evidence/<slug>/` — **có commit** (baseline regression). Flow file trỏ tới evidence + ghi PASS/FAIL. |
| **Artifact tạm** | `test-results/` và `playwright-report/` (sinh khi `npx playwright test`) — **KHÔNG commit**, đã có trong `.gitignore`. |
| **Index** | Bảng "Catalog" dưới đây — thêm 1 dòng mỗi khi tạo flow mới. |
| **KHÔNG** | KHÔNG để code sản phẩm ở đây; KHÔNG hardcode chuỗi UI (kiểm cả en/vi qua key i18n); flow phải bám 3 yêu cầu nền `docs/requirements.md`. |

## Catalog

| Flow | Tính năng/màn | Status | Lần chạy gần nhất |
|---|---|---|---|
| _(free-caret — đã xóa 2026-06-25)_ | Free-caret UX Phase C — Playwright spec + evidence đã remove trong working tree (xem git history commit 208b5b4) | archived | 2026-06-24 |
| [free-caret-v2-phase-a.flow.md](free-caret-v2-phase-a.flow.md) | Gate vàng Phase A free-caret-v2: spacer-atom + virtual-caret + materialize-on-input (click gap → vcaret → type → text đúng x) | executed | 2026-06-25 |

## Liên quan

- Skill lên kế hoạch flow: `.claude/skills/test-planning/SKILL.md`
- Skill thực thi browser: `.claude/skills/browser-test/SKILL.md`
- Vai sở hữu: `.claude/agents/tester.md`
- 3 yêu cầu nền [LOCKED] mọi flow phải phủ: `docs/requirements.md`
