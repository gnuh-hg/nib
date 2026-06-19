---
name: figma-design
description: "Skill cho vai design-figma (note-ch): 3 workflow Figma (design-to-code / code-to-design / design-system sync), 3 req nền [LOCKED] (frame ≥1024px / i18n no-hardcode / 0 hex rời), quy trình load skill Figma trước use_figma/create_new_file, và Done-criteria gate design ≥5 điều kiện đo được."
---

# figma-design — skill cho vai design-figma (note-ch)

> Skill dùng riêng cho `design-figma`. Mục đích: chuẩn hoá 3 workflow Figma, enforce 3 req nền [LOCKED], và đảm bảo gate design đo được trước khi báo done.

---

## 1. planKey cố định

```
planKey: team::1618919057199763712
```

Dùng planKey này khi cần truyền vào Figma MCP tool yêu cầu plan/project context.

---

## 2. Quy trình load skill Figma (BẮT BUỘC)

**Trước khi gọi bất kỳ tool nào dưới đây, PHẢI load skill tương ứng:**

| Tool sắp dùng | Skill phải load trước |
|---|---|
| `use_figma`, `create_new_file` | `skill://figma/figma-use/SKILL.md` (fallback: `/figma-use`) |
| `generate_figma_design` | `skill://figma/figma-generate-design/SKILL.md` |
| `generate_figma_design` để tạo library | `skill://figma/figma-generate-library/SKILL.md` |
| `add_code_connect_map`, `get_code_connect_map` | `skill://figma/figma-code-connect/SKILL.md` |

Load bằng cách đọc file skill (Read tool) tại path trên. Nếu path không resolve → thử `/figma-use` (shorthand). Không load → không được gọi tool.

---

## 3. Ba workflow chính

### Workflow A — Design-to-code (Figma → spec/token/screenshot → editor-frontend)

Dùng khi: lead cung cấp Figma URL và yêu cầu handoff cho editor-frontend implement.

```
1. whoami                       → verify kết nối (PASS = email/name trả về)
2. get_metadata(fileKey)        → file name + last_modified (gate: tồn tại)
3. get_design_context(fileKey)  → cấu trúc node, màu, text layer
4. get_variable_defs(fileKey)   → Figma variables (light + dark mode)
5. get_screenshot(nodeId, ...)  → screenshot frame/component (bytes > 0)
6. search_design_system(...)    → tìm component/token hiện có
7. Tổng hợp → token spec bảng (Figma variable ↔ CSS token) + i18n key list en+vi + screenshot ref
8. Gate ≥5 điều kiện §4 trước SendMessage
```

### Workflow B — Code-to-design (brief/code → tạo/update Figma → xuất URL + screenshot)

Dùng khi: lead yêu cầu dựng Figma từ brief planner hoặc code hiện có.

```
1. Load skill://figma/figma-use/SKILL.md  ← BẮT BUỘC
2. whoami                                  → verify
3. get_libraries()                         → kiểm library/design system hiện có để tái dùng
4. (nếu cần dựng từ code) list_code_components, get_code_component_info → map component→Figma
5. create_new_file(name, planKey)          → tạo file mới (chỉ khi KHÔNG có file sẵn)
   HOẶC use_figma(fileKey, ...)            → cập nhật file hiện có
6. generate_figma_design(...)              → sinh design theo spec (sau khi load /figma-generate-design)
7. upload_assets(...)                      → nếu cần upload icon/image
8. get_screenshot(...)                     → xuất screenshot (bytes > 0)
9. Gate ≥5 điều kiện §4 trước SendMessage
```

### Workflow C — Design system sync (tokens.css ↔ Figma variables)

Dùng khi: cần đồng bộ token CSS hiện có (`src/styles/tokens.css`) với Figma variables.

```
1. Load skill://figma/figma-generate-library/SKILL.md  ← BẮT BUỘC nếu tạo/update library
2. whoami + get_metadata → verify + lấy file hiện có
3. Đọc src/styles/tokens.css (Read tool) → lấy danh sách CSS custom property
4. get_variable_defs(fileKey) → Figma variables hiện có
5. So sánh: token CSS ↔ Figma variable → lập bảng diff (thiếu / lệch / đúng)
6. use_figma(fileKey, ...) hoặc generate_figma_design → áp token mới/sửa lệch
7. Verify lại: get_variable_defs → 0 hex rời, đủ light+dark mode
8. Xuất token spec bảng cuối + Gate §4
```

---

## 4. Done-criteria gate design (BẮT BUỘC ≥5/7 điều kiện — đo được, không cảm tính)

Chạy đủ các điều kiện dưới TRƯỚC khi `SendMessage done`. Gate bằng output tool thật.

| # | Điều kiện | Cách kiểm | PASS = |
|---|---|---|---|
| 1 | `whoami` OK | Gọi `whoami` | Trả email/name, không lỗi |
| 2 | `get_metadata` trả file name + last_modified | Gọi `get_metadata(fileKey)` | Cả 2 field có giá trị |
| 3 | `get_screenshot` bytes > 0, ≥1 frame | Gọi `get_screenshot(nodeId)` | bytes > 0, không lỗi |
| 4 | `get_variable_defs` có mode light + dark | Gọi `get_variable_defs(fileKey)` | Tìm thấy ≥2 mode (light, dark) |
| 5 | 0 hex rời (qua `get_design_context`) | Kiểm output `get_design_context` — màu nằm trong variable, không phải literal hex `#XXXXXX` | 0 hex rời trong component fill/stroke |
| 6 | Frame gốc ≥1024px | Kiểm width frame trong `get_design_context` hoặc `get_metadata` | width ≥ 1024 |
| 7 | i18n key list en+vi kèm theo output | Output SendMessage có bảng key/en/vi | ≥1 key, đủ 2 cột en+vi |

> **Gate cứng (không thể bỏ):** điều kiện 1, 3, 5, 6, 7 — bắt buộc PASS. Điều kiện 2, 4 PASS khi liên quan workflow (bắt buộc cho workflow A+C; workflow B tùy file mới hay cũ).
>
> **Cấm gate cảm tính.** "Design đẹp", "màu hợp lý", "trông ổn" → KHÔNG phải evidence. Không verify được → nói thẳng "chưa verify được" + lý do.

---

## 5. Ba yêu cầu nền [LOCKED] (enforce trong mọi output Figma)

**1. Frame ≥1024px (landscape, desktop-class)**
- Mọi frame Figma cho note-ch phải width ≥ 1024px.
- Không tạo frame mobile/portrait < 1024px trong file chính.
- Nếu cần breakpoint: compact 1024–1279 · regular 1280–1679 · wide ≥1680 (từ `docs/requirements.md` §2; chú ý: min-width 1024px sau khi user chốt landscape-only 2026-06-17, context.md).

**2. i18n — không hardcode text**
- Không đặt text UI cố định trong Figma layer mà không kèm i18n key.
- Mọi chuỗi text xuất trong output phải có key en+vi: vd `sidebar.new_doc | New document | Tài liệu mới`.
- Không dịch nội dung toán/LaTeX (LaTeX render = ngôn ngữ toán, không qua i18n).

**3. 0 hex rời — mọi màu qua Figma variable**
- Fill, stroke, shadow, text color = Figma variable (light/dark mode).
- Không dùng literal hex (#XXXXXX) trực tiếp trong component/frame.
- Root màu note-ch: Teal `#0E7C86` (brand/accent) · Indigo `#4B3FBF` (kết quả exact) · Amber `#7A5200` (approx, WCAG AA) · Green `#137A52` (success) · Red `#B42318` (error). Xem `docs/requirements.md` §3 để biết đủ token semantic.

---

## 6. Mapping tool Figma MCP

| Mục đích | Tool |
|---|---|
| Verify kết nối | `whoami` |
| Đọc cấu trúc/màu/text Figma | `get_design_context` |
| Screenshot frame/component | `get_screenshot` |
| Metadata file (name, last_modified) | `get_metadata` |
| Xem Figma variables (light/dark) | `get_variable_defs` |
| Tìm component trong design system | `search_design_system` |
| Danh sách library | `get_libraries` |
| Tạo file Figma mới | `create_new_file` |
| Edit/update Figma hiện có | `use_figma` |
| Upload icon/image asset | `upload_assets` |
| Download asset từ Figma | `download_assets` |
| Sinh design từ spec/brief | `generate_figma_design` |
| Tạo diagram (FigJam) | `generate_diagram` |
| Danh sách code component | `list_code_components` |
| Chi tiết 1 code component | `get_code_component_info` |
| Xem Code Connect map | `get_code_connect_map` |
| Thêm Code Connect map | `add_code_connect_map` |

---

## 7. Quick reference

```
planKey: team::1618919057199763712

BẮT BUỘC trước use_figma/create_new_file: load skill://figma/figma-use/SKILL.md
BẮT BUỘC trước generate_figma_design: load skill://figma/figma-generate-design/SKILL.md

Gate ≥5/7: whoami ✓ · metadata ✓ · screenshot bytes>0 ✓ · variable light+dark ✓ · 0 hex rời ✓ · frame ≥1024px ✓ · i18n key en+vi ✓

3 req nền [LOCKED]: frame ≥1024px · text i18n key · 0 hex rời Figma variable
Root màu: Teal #0E7C86 · Indigo #4B3FBF · Amber #7A5200 · Green #137A52 · Red #B42318

Workflow: A=design-to-code (Figma→spec) · B=code-to-design (brief→Figma) · C=design-system-sync (tokens.css↔Figma var)
```
