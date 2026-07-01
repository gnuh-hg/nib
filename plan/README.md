# plan/ — Quy ước quản lý plan artifact (note-ch)

> Nơi chứa mọi artifact lập kế hoạch của dự án. Agent `planner` + skill `plan-short` / `plan-long` / `roadmap` đọc file này để biết đặt file ở đâu. **Đọc trước khi tạo bất kỳ file plan nào.**

## Ba tầng plan

| Tầng | Skill | Artifact | Tính chất |
|---|---|---|---|
| Lộ trình tổng (nhiều phase) | `roadmap` | `plan/<roadmap>/ROADMAP.md` | mutable — cập nhật khi phase đổi trạng thái |
| Kế hoạch dài (1 phase/workstream) | `plan-long` | `plan/<slug>/PLAN.md` + `plan/<slug>/CHECKPOINT.md` | PLAN immutable sau approve; CHECKPOINT mutable |
| Kế hoạch ngắn (1 chat) | `plan-short` | (không file — inline trong chat) | ephemeral |

Quan hệ: **ROADMAP** chia sản phẩm thành phase → mỗi phase bửa thành **1 long-plan** → việc lẻ trong long-plan có thể là **short-plan**. Tầng trên xuống tầng dưới, không nhảy cóc (đừng code thẳng từ ROADMAP — phải qua long-plan).

## Cấu trúc thư mục

```
plan/
├── README.md              ← file này (quy ước + index)
├── <roadmap>/             ← 1 thư mục / 1 roadmap (vd maintenance/, settings-redesign/)
│   ├── ROADMAP.md         ← lộ trình tổng của roadmap đó
│   └── <phase-slug>/      ← 1 thư mục / 1 long-plan nested dưới roadmap
├── <phase-slug>/          ← long-plan độc lập (không thuộc roadmap nào)
│   ├── PLAN.md            ← thiết kế, immutable sau approve
│   ├── CHECKPOINT.md      ← sổ tiến độ, mutable, Constraint reminder ở ĐẦU
│   └── <tên>.md           ← artifact phụ của plan này (design note, benchmark, findings…)
└── <slug>/                ← long-plan không thuộc ROADMAP cũng đặt phẳng ở đây
```

## Quy tắc đặt tên & vị trí

1. **Slug kebab-case**, không dấu, không space. Phase ROADMAP: `phase-<x>-<tên>` (vd `phase-a-editor`, `phase-b-cas`). Plan lẻ: tên mô tả (vd `cas-latex-sympy-pipeline`).
2. **Mọi file của một plan nằm gọn trong `plan/<slug>/`** — không rải design note / benchmark ra ngoài.
3. **ROADMAP nằm trong thư mục roadmap của nó** (`plan/<roadmap>/ROADMAP.md`, vd `plan/maintenance/ROADMAP.md`). Mỗi workstream/đợt lớn tạo thư mục riêng. Không đặt ROADMAP.md phẳng ở gốc `plan/`.
4. **Trước khi tạo** — verify thư mục/file chưa tồn tại (Glob/ls). Trùng → hỏi user (overwrite vs đổi slug), không ghi đè im lặng.

## Vòng đời & đồng bộ

- **Tạo long-plan** → thêm 1 hàng vào **bảng index** dưới đây + (nếu là phase) update bảng tiến độ cuối `plan/<roadmap>/ROADMAP.md`.
- **Mỗi session** (plan-long) → update `CHECKPOINT.md` **TRƯỚC khi đóng chat** (bảng tiến độ + "Đang ở đâu" + per-session log). Ràng buộc: **1 chat = 1 session**, STOP tại STOP gate.
- **Phase xong** → đổi trạng thái trong `plan/<roadmap>/ROADMAP.md` (✅ + 1 dòng evidence) và ở bảng index dưới.
- **PLAN cần đổi sau approve** → append "Revision log" cuối PLAN, không sửa session breakdown trừ khi user yêu cầu.

## Gate idiom (note-ch)

Mọi STOP gate / done-criteria phải đo được bằng stack thật:
`npm run build` exit 0 · `tsc --noEmit` 0 error · vitest pass · `cargo build` (src-tauri) pass · `pytest` pass · `POST /eval` trả LaTeX chính xác (vd `\frac{d}{dx}x^2`→`2x`) · N fixture parse pass · **vòng lõi: gõ 1 block → kết quả symbolic inline live** (gate vàng cho editor↔CAS).

Cấm gate cảm tính ("render đẹp", "ổn rồi").

## Index các plan

| Slug | Loại | Mô tả | Trạng thái |
|---|---|---|---|
| `agent-team-setup` | long-plan | Dựng bộ máy multi-agent cho note-ch (settings, master, playbook, 8 agents, 5 skills, memory, smoke-test) | ✅ (archived → `plan/_archived/agent-team-setup/`) |
| `nib-mock-ui` | long-plan (Phase 0) | Mock-UI shell: Vite+React/TS + tokens.css + canvas block model + MathLive + mock CAS stub + UX 4 lớp. Chạy được trong browser Vite dev. | ✅ (archived → `plan/_archived/nib-mock-ui/`) |
| `dock-v2` | long-plan (Phase 0 add-on) | v2 Tool Dock: UnifiedDock thay FloatingToolbar+PenPalette. 2 phase / 3 session. | ✅ (archived → `plan/_archived/dock-v2/`) |
| `nib-editor-rebuild` | long-plan (Phase 0 re-align) | Rebuild 5 vùng UI (tokens/header/canvas-paper/rail/library) khớp design HTML. 1 phase / 5 session. | ✅ (archived → `plan/_archived/nib-editor-rebuild/`) |
| `nav-dock-redesign` | long-plan (Phase 0 nav overhaul) | Dock drill-down NAV/TOOLS + TopStrip + bỏ SidebarRail. 1 phase / 3 session. | ✅ (archived → `plan/_archived/nav-dock-redesign/`) |
| `tauri-shell` | long-plan | Vỏ Tauri 2 desktop native. 2 session. | ✅ (archived → `plan/_archived/tauri-shell/`) |
| `design-agent-library` | roadmap | Thay agent design-figma bằng agent design code-native + thư viện .claude/design-library/. 4 phase. DONE. | ✅ (archived → `plan/_archived/design-agent-library/`) |
| `settings-redesign` | long-plan (active) | Thiết kế lại + mở rộng SettingsOverlay: sidebar-nav layout + section registry + 3 section MVP. 2 phase / 4 session. | 🔄 |
| `maintenance` | roadmap | Bảo trì hệ thống `.claude/`: 3 phase (A cleanup / B wiring upgrade / C workflow hardening HIGH-IMPACT). Nền: audit 2026-06-20. | 🔄 |
| `maintenance/phase-a-cleanup` | long-plan (Phase A) | Archive plan done + docs stale, annotate design.md, xóa flat ROADMAP, trim memory. 1 phase / 6 session. | 🔄 |
| `accounts-cloud-sync` | roadmap | Workstream Accounts + Cloud Sync: auth + sync engine (Yjs/CRDT) + backend deploy (Supabase+Hocuspocus) + UI polish. 4 phase. | 🔄 |
| `accounts-cloud-sync/phase-a-auth` | long-plan (Phase A) | Auth: Supabase auth trong Tauri + secure token storage (GNOME Keyring / fallback) + ProfileProvider migration. 3 session. | 🔄 |
| `accounts-cloud-sync/phase-b-sync-engine` | long-plan (Phase B) | Sync Engine: Yjs CRDT + Y.Map side-channel (CC-1) + y-indexeddb offline-first + Hocuspocus WS client + undo migrate + gate vàng 2-tab. 5 session. | 🔄 |
| `accounts-cloud-sync/phase-c-backend-deploy` | long-plan (Phase C) | Backend Deploy: Hocuspocus Node.js server (onAuthenticate JWT) + Supabase Postgres (yjs_updates/snapshots + compaction CC-3) + Render free deploy + 2 human-gate (Supabase setup + Render deploy) + gate vàng 2-browser thật. 3 CODE session + 2 HUMAN GATE. | 🔄 |
| `free-caret-rebuild` | roadmap | Rebuild document model sang FREE-CARET ROW-BASED (Hướng C): math = inline atom, caret văn bản thật xuyên trang, gõ = INSERT. 6 phase (A Architect / B Schema+Migration / C Text Engine / D Inline Math+Caret / E CAS+Vòng lõi / F Sync+Polish). | 🔄 |
| `free-caret-rebuild/phase-a-architect` | long-plan (Phase A) | Architect giải 6 rủi ro blocking (R1 CRDT bloat / R2 dual-caret / R3 migration an toàn / R4 insert semantics / R5 arrow-nav 2D / R6 vòng lõi continuity) → ARCHITECTURE.md. 2 session. | ✅ ARCHITECTURE.md gate PASS 2026-06-23 |
| `free-caret-rebuild/phase-b-schema-migration` | long-plan (Phase B) | Schema + Migration: PM schema row-based (Row/MathInline extensions) + Y.Doc adapt (blockMeta keyed atom-id + NEW rowMeta) + R1 proof + migration module an toàn (4 test case, deleteDatabase NEVER) + WS room v2. 3 session. | ✅ vitest 118/118, R1<1KB, migration PASS 2026-06-23 |
| `free-caret-rebuild/phase-c-text-cursor` | long-plan (Phase C) | Text Engine + Cursor: RowView thật (blankBefore/indent geometry) + text insert + click-to-position + ghost caret virtual-space + arrow nav 2D (up/down goalX + Tab). MathInline vẫn placeholder. 3 session. | 🔄 |
| `free-caret-v2` | roadmap | Rebuild đường gõ từ zero (WIPE 2026-06-25) theo Path B "spacer-atom" (virtual-space free-caret). 5 phase: A schema+caret / B nav+edit / C IME+undo / D MathLive inline / E CAS+vòng lõi. | 🔄 |
| `free-caret-v2/phase-a-schema-caret` | long-plan (Phase A) | SpacerAtom extension + schema NibParagraph update + click→virtual-caret + type→materialize. 3 session. Gate vàng: "click→gõ→text đúng x". | ✅ DONE (Playwright 12/12; bug Case 14/15 regression marker chờ Phase B) |
| `free-caret-v2/phase-b-nav-edit` | long-plan (Phase B) | Unified add-char/merge law (insert-side displace + backspace/delete) + arrow nav 2D (left/right gap-step, up/down goalX) + Tab spacer 4×space_width. 3 session. Gate vàng: Case 14+15 Playwright XANH + 15/15 full suite. | 🔄 |

> Cập nhật bảng này mỗi khi tạo/đóng một plan. Trạng thái: ⬜ chưa bắt đầu · 🔄 đang chạy · ✅ done.
