# plan/ — Quy ước quản lý plan artifact (note-ch)

> Nơi chứa mọi artifact lập kế hoạch của dự án. Agent `planner` + skill `plan-short` / `plan-long` / `roadmap` đọc file này để biết đặt file ở đâu. **Đọc trước khi tạo bất kỳ file plan nào.**

## Ba tầng plan

| Tầng | Skill | Artifact | Tính chất |
|---|---|---|---|
| Lộ trình tổng (nhiều phase) | `roadmap` | `plan/ROADMAP.md` | mutable — cập nhật khi phase đổi trạng thái |
| Kế hoạch dài (1 phase/workstream) | `plan-long` | `plan/<slug>/PLAN.md` + `plan/<slug>/CHECKPOINT.md` | PLAN immutable sau approve; CHECKPOINT mutable |
| Kế hoạch ngắn (1 chat) | `plan-short` | (không file — inline trong chat) | ephemeral |

Quan hệ: **ROADMAP** chia sản phẩm thành phase → mỗi phase bửa thành **1 long-plan** → việc lẻ trong long-plan có thể là **short-plan**. Tầng trên xuống tầng dưới, không nhảy cóc (đừng code thẳng từ ROADMAP — phải qua long-plan).

## Cấu trúc thư mục

```
plan/
├── README.md              ← file này (quy ước + index)
├── ROADMAP.md             ← lộ trình tổng (1 file cho cả sản phẩm)
├── <phase-slug>/          ← 1 thư mục / 1 long-plan
│   ├── PLAN.md            ← thiết kế, immutable sau approve
│   ├── CHECKPOINT.md      ← sổ tiến độ, mutable, Constraint reminder ở ĐẦU
│   └── <tên>.md           ← artifact phụ của plan này (design note, benchmark, findings…)
└── <slug>/                ← long-plan không thuộc ROADMAP cũng đặt phẳng ở đây
```

## Quy tắc đặt tên & vị trí

1. **Slug kebab-case**, không dấu, không space. Phase ROADMAP: `phase-<x>-<tên>` (vd `phase-a-editor`, `phase-b-cas`). Plan lẻ: tên mô tả (vd `cas-latex-sympy-pipeline`).
2. **Mọi file của một plan nằm gọn trong `plan/<slug>/`** — không rải design note / benchmark ra ngoài.
3. **1 ROADMAP duy nhất** (`plan/ROADMAP.md`) cho note-ch. Chỉ tạo `plan/<batch>/ROADMAP.md` lồng nếu sau này có đợt tái thiết kế lớn cần tách bạch.
4. **Trước khi tạo** — verify thư mục/file chưa tồn tại (Glob/ls). Trùng → hỏi user (overwrite vs đổi slug), không ghi đè im lặng.

## Vòng đời & đồng bộ

- **Tạo long-plan** → thêm 1 hàng vào **bảng index** dưới đây + (nếu là phase) update bảng tiến độ cuối `plan/ROADMAP.md`.
- **Mỗi session** (plan-long) → update `CHECKPOINT.md` **TRƯỚC khi đóng chat** (bảng tiến độ + "Đang ở đâu" + per-session log). Ràng buộc: **1 chat = 1 session**, STOP tại STOP gate.
- **Phase xong** → đổi trạng thái trong `plan/ROADMAP.md` (✅ + 1 dòng evidence) và ở bảng index dưới.
- **PLAN cần đổi sau approve** → append "Revision log" cuối PLAN, không sửa session breakdown trừ khi user yêu cầu.

## Gate idiom (note-ch)

Mọi STOP gate / done-criteria phải đo được bằng stack thật:
`npm run build` exit 0 · `tsc --noEmit` 0 error · vitest pass · `cargo build` (src-tauri) pass · `pytest` pass · `POST /eval` trả LaTeX chính xác (vd `\frac{d}{dx}x^2`→`2x`) · N fixture parse pass · **vòng lõi: gõ 1 block → kết quả symbolic inline live** (gate vàng cho editor↔CAS).

Cấm gate cảm tính ("render đẹp", "ổn rồi").

## Index các plan

| Slug | Loại | Mô tả | Trạng thái |
|---|---|---|---|
| `ROADMAP.md` | roadmap | Lộ trình tổng 6 phase: Phase 0 Mock-UI · Phase 1 Real CAS · Phase 2 Tauri IPC · Phase 3 Handwriting · Phase 4 AI layer · Phase 5 Polish | 🔄 |
| `agent-team-setup` | long-plan | Dựng bộ máy multi-agent cho note-ch (settings, master, playbook, 8 agents, 5 skills, memory, smoke-test) | 🔄 |
| `nib-mock-ui` | long-plan (Phase 0) | Mock-UI shell: Vite+React/TS + tokens.css + canvas block model + MathLive + mock CAS stub + UX 4 lớp. Chạy được trong browser Vite dev. | ✅ |
| `dock-v2` | long-plan (Phase 0 add-on) | v2 Tool Dock: UnifiedDock thay FloatingToolbar+PenPalette. 2 phase / 3 session. Spec từ Nib-Dock-v2-ref.html. | 🔄 |
| `nib-editor-rebuild` | long-plan (Phase 0 re-align) | Rebuild 5 vùng UI (tokens/header/canvas-paper/rail/library) khớp `Nib Editor.dc.html`. 1 phase / 5 session. Landscape-only. UnifiedDock không đụng. | 🔄 |
| `nav-dock-redesign` | long-plan (Phase 0 nav overhaul) | Dock drill-down 2 level (NAV/TOOLS) + TopStrip mỏng + bỏ SidebarRail/TopChrome/ModeToggle + Settings overlay + AccountChip. Spec: `docs/nav-dock-design.md`. 1 phase / 3 session. | 🔄 |

> Cập nhật bảng này mỗi khi tạo/đóng một plan. Trạng thái: ⬜ chưa bắt đầu · 🔄 đang chạy · ✅ done.
