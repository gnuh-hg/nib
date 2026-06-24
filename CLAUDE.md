# CLAUDE.md — Project Brief

> File này là context khởi đầu cho team agent. Giả định bạn (Claude Code) **chưa biết gì** về dự án.
> Đọc hết trước khi viết bất kỳ dòng code nào. Các mục đánh dấu **[LOCKED]** là quyết định đã chốt — không tự ý đổi.
> Project name: **TBD** (chưa đặt).

---

## 1. Một câu định nghĩa

Một **app desktop-class** dạng "notepad toán học sống": người dùng **viết tay bằng bút HOẶC gõ** công thức vào, app **tính toán symbolic chính xác ngay tại chỗ** (đạo hàm/tích phân ra hàm số cụ thể, số học không làm tròn, sigma/pi thay được biến chạy, giải phương trình ra nghiệm dạng đóng) — không phải chuyển qua lại giữa máy tính, giấy nháp và Google.

## 2. Vấn đề (why)

Dân kỹ thuật khi tính toán phải liên tục nhảy giữa máy tính cầm tay / phần mềm / giấy nháp. Máy tính (Casio nói chung) **làm tròn thay vì ra kết quả chính xác**, **không trả về hàm số** cho đạo hàm/tích phân, **không thay được biến chạy** trong sigma/pi. Có thể chữa bằng Google/code/LLM nhưng quá bất tiện và phá luồng làm việc.

## 3. User & thiết bị — **[LOCKED]**

- **Tập user:** dân kỹ thuật (sinh viên/kỹ sư).
- **Thiết bị:** **desktop-class, màn lớn** (laptop / iPad Pro / Surface). **KHÔNG phải điện thoại.** Đây là công cụ "ngồi làm việc tập trung, session dài", không phải "tính nhanh trên đường".
- **User KHÔNG bị thu hẹp về máy có bút:** đường gõ chạy trên mọi máy; bút là giá trị cộng thêm cho máy có stylus.

> **Spec sản phẩm chi tiết (BẮT BUỘC đọc trước khi build UI):**
> - `docs/feature.md` — 2 đường nhập cốt lõi (gõ / viết tay).
> - `docs/requirements.md` — **3 yêu cầu nền [LOCKED] xuyên suốt mọi feature**: (1) song ngữ en/vi, (2) giao diện theo thiết bị đích (desktop-class, min 1024px, 3 input chuột+phím/cảm ứng/bút), (3) theme light/dark/system + **root màu chính thức** (design tokens — cấm hex rời, cấm hardcode text). Mọi block/màn UI mới phải thoả cả 3.

## 4. Tính năng cốt lõi — **[LOCKED]**

1. **Hai input ngang hàng, cùng đổ vào một notepad:**
   - **Gõ** (LaTeX-style, ASCII tự render: `x^2`→x², `\int`→∫, `\sum`→Σ, `sqrt`→√).
   - **Viết tay bằng bút** (handwriting → LaTeX).
   - Cả hai hội tụ về **LaTeX / MathJSON**.
2. **Engine symbolic** nhận LaTeX/MathJSON → trả:
   - Số học **chính xác** (phân số, căn — không làm tròn), có toggle exact ↔ thập phân.
   - **Đạo hàm / tích phân ra hàm số** (giải tích, không phải số gần đúng).
   - **Sum / Product** giữ symbolic hoặc thay biến chạy để rút gọn.
   - Giải phương trình ra **nghiệm dạng đóng**, giới hạn, khai triển chuỗi.
3. **Document dạng block:** không phải mực tự do thuần (GoodNotes), cũng không phải 1 cột cứng (Soulver). Tài liệu = chuỗi **block toán** đặt tương đối tự do. Mỗi block nhận **cả bút lẫn gõ**; **kết quả render ngay cạnh/dưới block, cập nhật live.**

## 5. Quyết định kỹ thuật đã chốt — **[LOCKED]**

| Tầng | Lựa chọn | Lý do (thuần theo fit, KHÔNG theo kinh nghiệm cũ của owner) |
|---|---|---|
| Vỏ app | **Tauri 2** | App cài được thật; 1 codebase → desktop (+ mobile sau nếu cần); binary ~3MB; webview hệ thống. Electron = dự phòng nếu toolchain Rust phiền. |
| Frontend | **React + TypeScript + Vite** | Hệ sinh thái editor giàu nhất; TypeScript bắt lỗi khi codebase phình. |
| Editor core | **TipTap (ProseMirror) hoặc Lexical** | Quản document block; **KHÔNG tự code document model bằng tay.** |
| Math editor (gõ + render) | **MathLive** (`<math-field>`) nhúng làm một loại block | Web component, 800+ lệnh LaTeX, bàn phím ảo, xuất LaTeX/MathJSON. |
| Viết tay → LaTeX | **MyScript iink SDK** | Chuẩn ngành, ~250 ký hiệu toán, xuất LaTeX/MathML. **SDK thương mại, tốn license — xem mục 8.** |
| Backend / CAS | **Python + FastAPI + SymPy** | SymPy *là* Python, không có bản tương đương ở Swift/Kotlin/Dart. Chạy như **sidecar cục bộ** để offline, hoặc host thành API. |

**Tại sao không native thuần (Flutter/Swift):** ba engine lõi (MathLive, MyScript, SymPy) đều ở thế giới web/Python. Native thuần vẫn phải nhúng webview cho editor hoặc tự xây lại engine (bất khả thi cho team 2 người). Đi native thuần **không mua được gì cho phần lõi mà tốn rất nhiều**. → UI web trong vỏ native mỏng là fit đúng.

## 6. Kiến trúc & luồng dữ liệu

```
[Bút] --MyScript--> LaTeX  \
                            >--> LaTeX/MathJSON --> latex2sympy2 / parser --> SymPy
[Gõ]  --MathLive--> LaTeX  /                                                   |
                                                                               v
            render kết quả (MathLive static) <-- LaTeX kết quả <-- exact/diff/integrate/Sum/solve
```

- **Frontend (Tauri webview):** TipTap/Lexical quản document block → mỗi block là MathLive + lớp nhận bút MyScript → emit LaTeX.
- **IPC:** frontend gửi LaTeX/MathJSON sang backend.
- **Backend (FastAPI + SymPy, sidecar):** parse → tính → trả LaTeX kết quả (+ tùy chọn số thập phân, các bước).
- **Render:** kết quả hiển thị inline cạnh block, live.

## 7. Phụ thuộc chính & vai trò

- **Tauri 2** — vỏ app, đóng gói, IPC, spawn sidecar Python. (Kiểm tra bản mới nhất.)
- **React + TypeScript + Vite** — UI framework + build.
- **TipTap / Lexical** — document block model.
- **MathLive** — nhập + render công thức (đường gõ).
- **MyScript iink** — nhận diện viết tay → LaTeX (đường bút).
- **SymPy** — CAS (engine tính). **latex2sympy2** (hoặc MathJSON→SymPy) cho bước parse.
- **FastAPI** — server cục bộ bọc SymPy.

## 8. Phần khó & rủi ro — đọc kỹ, đây là nơi quyết định ưu tiên

1. **Editor là phần khó nhất và là rủi ro chính (nhiều tháng).** Nhúng MathLive + MyScript vào document block, đồng bộ live với SymPy. **Chọn framework chỉ là quyết định 1 ngày — đừng tốn thời gian tranh luận React-vs-Svelte. Dồn sức vào editor.**
2. **LaTeX → SymPy là lossy.** Cần pipeline parse chắc chắn (latex2sympy2 + dọn dẹp, cân nhắc LLM fallback cho input mơ hồ). Đây là điểm dễ vỡ.
3. **SymPy có thể chậm hoặc không tích phân được vài hàm.** Cần **timeout** và **fallback sang số (numeric)**.
4. **MyScript là SDK thương mại, tốn phí license** — cần quyết định ngân sách sớm; app tiêu dùng của họ chạy iOS/iPadOS/macOS/Android, Windows phải nhúng qua SDK/cloud.
5. **Tension thiết kế (không phải mâu thuẫn):** bút muốn canvas tự do, eval-live muốn cấu trúc block. Đã giải bằng **document block** (mục 4.3) — giữ đúng hướng này.

## 9. Nguyên tắc tránh "sai lầm vanilla"

Sai lầm cũ = dùng vanilla JS cho app lớn → thiếu cấu trúc, không scale. **Cái sửa nó là KIẾN TRÚC, không phải "đi native".** Áp dụng triệt để 3 tầng:
1. **Component framework (React)** thay thao tác DOM thủ công.
2. **TypeScript** thay JS không kiểu — bắt lỗi sớm khi lớn lên.
3. **Editor framework (TipTap/Lexical)** thay tự quản `contentEditable`.

## 10. Định vị cạnh tranh (để hiểu "tại sao")

- **Khác biệt = workflow, KHÔNG phải engine.** Engine (exact + symbolic) đã có Wolfram/Jupyter/SymPy làm, phần lớn free.
- Soulver/Calca = notepad nhưng **số học, không symbolic**. Wolfram = symbolic nhưng **dạng query, không phải notepad chảy**. Jupyter = cả hai nhưng **cần gõ code**.
- **Khoảng trống = gộp cả ba:** notepad mượt + symbolic inline + không cần code.
- Moat này thiên về **UX (mỏng)**. Lớp differentiation sâu hơn có thể là **AI** (LLM parse input bừa + giải thích từng bước) — cân nhắc cho giai đoạn sau.

## 11. Câu hỏi còn mở (cần con người quyết, đừng tự chốt)

1. **Thiết bị cụ thể trong nhóm desktop-class:** iPad Pro (Pencil) vs Surface/Windows 2-in-1 vs laptop cảm ứng. Ảnh hưởng cách tích hợp MyScript + kênh phân phối. (Viết-tay-cốt-lõi nghiêng về máy có bút.)
2. **Ngân sách license MyScript.**
3. Có làm **lớp AI** (parse + giải thích) ngay từ MVP hay để sau.
4. **Tên dự án.**

## 12. Gợi ý phân chia workstream (để lập team agent)

- **Agent A — Editor/Frontend:** Tauri + React/TS scaffold, TipTap/Lexical block model, nhúng MathLive block. (Đường găng, ưu tiên cao nhất.)
- **Agent B — Backend/CAS:** FastAPI + SymPy, pipeline LaTeX→SymPy, timeout + numeric fallback, API hợp đồng (LaTeX in → LaTeX out).
- **Agent C — Handwriting:** tích hợp MyScript iink, bút→LaTeX, palm rejection, cử chỉ sửa/xóa, auto-convert mực→toán.
- **Agent D — Glue/Packaging:** IPC frontend↔sidecar, đóng gói Tauri, build desktop, offline.

**Thứ tự khuyến nghị:** dựng được vòng "gõ 1 block → ra kết quả symbolic inline" trước (A + B, MathLive only). Bút (C) ghép vào sau khi vòng cơ bản chạy.

---

## 13. Trước khi lập team agent

> **Hard gate — đọc đủ 3 file dưới TRƯỚC khi spawn bất kỳ team nào.** Không spawn team trước khi đọc 3 file này.

- **(a)** Đọc `.claude/master.md` — nguyên tắc bất biến (lead điều phối không tự code task phức tạp), roster 10 vai, vòng lặp TaskList loop, phân biệt subagent vs teammate.
- **(b)** Đọc `.claude/teams/playbook.md` — khi nào TeamCreate vs Agent one-shot vs lead tự làm, recipe 7 bước spawn, brief 4 phần, gate evidence, anti-patterns.
- **(c)** Đọc `.claude/memory/context.md` — trạng thái hiện tại + task đang chạy + kết quả smoke-test.
- **(d)** Đọc `docs/requirements.md` + `docs/feature.md` — spec sản phẩm: 3 yêu cầu nền [LOCKED] (song ngữ / thiết bị / theme + root màu) và 2 đường nhập. Mọi task chạm UI phải bám.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **nib** (1791 symbols, 2758 relationships, 71 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/nib/context` | Codebase overview, check index freshness |
| `gitnexus://repo/nib/clusters` | All functional areas |
| `gitnexus://repo/nib/processes` | All execution flows |
| `gitnexus://repo/nib/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
