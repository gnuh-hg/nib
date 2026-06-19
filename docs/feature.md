# Nib — Tính năng chính: 2 Đường nhập

> **Đây là tài liệu spec sản phẩm** (WHAT — hành vi / hợp đồng / ràng buộc), không phải thiết kế kỹ thuật (HOW).
> Mọi task build UI/editor đọc file này **cùng `docs/requirements.md`** (3 yêu cầu nền [LOCKED]: song ngữ en/vi · desktop-class min 1024px + 3 input · theme + design tokens).
> Các mục đánh dấu **[LOCKED]** kế thừa từ `CLAUDE.md §4`, không đề xuất ngược.
> Các mục **[USER-CHỐT]** là quyết định user phân xử trực tiếp (cân nhắc ghi đè LOCKED cũ nếu có).
> Các mục **[LEAD-CHỐT]** là điểm lead phân xử từ nghiên cứu thảo luận chéo.
> Các mục **[HUMAN GATE]** chờ user quyết — không tự chốt, không bắt đầu implement.

---

## Tổng quan — [LOCKED cấu trúc; [USER-CHỐT] mô hình tương tác mới]

App có **2 đường nhập ngang hàng**: người dùng **gõ** hoặc **viết tay bằng bút**, cùng đổ vào một document, cùng hội tụ về **LaTeX / MathJSON**. Kết quả symbolic render ngay trong block — không phải chuyển tab, không phải copy-paste.

```
[Bút]   Stylus → mực thô (inkStrokes[]) ─┐
                                           ├──[Tính]──→ HTR (nếu mực) → CAS → Kết quả symbolic inline
[Gõ]    Bàn phím → MathLive render sống  ─┘
```

Hai đường **không phải alternative** — trên thiết bị có bút, cả hai hoạt động trong cùng một block. User gõ một phần, bổ sung bằng bút, chuyển mode tự nhiên.

**[USER-CHỐT — LẬT auto-eval cũ] Nguyên tắc "bấm nút để tính":**

Gõ và viết thoải mái; app **KHÔNG tự nhận diện, KHÔNG tự tính** trong khi nhập. Khi sẵn sàng, user nhấn **nút Tính** — nút này làm **cả hai việc trong 1 lần bấm**:
1. Nếu block chứa mực bút: gọi HTR (MyScript) để nhận diện → LaTeX.
2. Gửi LaTeX sang CAS (SymPy) → nhận kết quả symbolic.

**Phạm vi tính:**
- *Đối tượng cần tính* = vùng user **bôi đen / chọn** trước khi nhấn Tính. Không chọn → target là biểu thức hiện tại / gần con trỏ (chi tiết để architect chốt).
- *Ngữ cảnh biến* = lấy từ **cả trang** — định nghĩa `x = 5` nằm ở block khác vẫn có hiệu lực khi tính block này.

**Gõ vs Bút là CÙNG một UX** — chỉ khác logic bên trong (gõ bỏ qua bước HTR vì đã là ký hiệu). Không có UI phân nhánh theo đường nhập → củng cố "2 đường cùng một hệ".

---

## 1. Nền giấy kẻ ngang — canvas chung — [LOCKED]

Document Nib trình bày như **tờ giấy kẻ ngang** (ruled paper). Đây là canvas chia sẻ cho cả 2 đường nhập:

- **Đường kẻ = baseline / writing-guide**: không phải snap cứng mà là guide thị giác — người viết tay tự align tự nhiên (MyScript iink normalize stroke độc lập với baseline); người gõ thấy block căn theo dòng.
- **Line-height ~60–80px**: đủ rộng để ký hiệu toán có ascender/descender (∫, Σ, phân số) hiển thị thoải mái mà không bị cắt.
- Màu đường kẻ dùng `--border` (nhạt, không chói) — không cạnh tranh với nội dung. Đổi tự động theo light/dark theme (design token, không hardcode hex).
- Không có lưới ô vuông (grid) — chỉ kẻ ngang. Giữ cảm giác "notebook toán", không phải bảng tính.

---

## 2. Mô hình "Free Placement" — block đặt tự do trên dòng kẻ — [LEAD-CHỐT]

### 2.1 Ý niệm: free cursor và free writing start là một

Người dùng muốn đặt nội dung **tự do trên mặt giấy** — không spam Enter/Space, không tạo bảng/layout phức tạp. Cả 2 đường nhập thể hiện cùng ý niệm này:

- **Gõ**: click vào **chỗ trống bất kỳ** trên dòng kẻ → tạo block tại vị trí click → con trỏ sẵn sàng nhập.
- **Bút**: pen-down vào **chỗ trống bất kỳ** → tạo cùng loại block tại đó → bắt đầu viết.

Đây là trục hội tụ làm 2 đường cảm giác như một.

### 2.2 Block là absolute-positioned object

Mỗi block định vị bằng **(lineIndex, xOffset)**:
- `lineIndex`: chỉ số dòng kẻ ngang (0, 1, 2, …).
- `xOffset`: vị trí ngang tính từ lề trái (pixel hoặc %).

Map sang **ProseMirror NodeView** — `lineIndex` và `xOffset` lưu trong node attributes, CSS `absolute` positioning cho render. ProseMirror vẫn quản toàn bộ nội dung + undo/redo + serialization.

Tham chiếu mô hình: **OneNote "note container"** — click-to-create tại vị trí tuỳ ý, ProseMirror kiểm soát nội dung bên trong.

### 2.3 Nhiều block trên cùng một dòng — [LEAD-CHỐT]

Cho phép **nhiều block cùng tồn tại trên một dòng kẻ** — `f(x) = x²` bên trái và `g(x) = 2x` bên phải trên cùng dòng. Đúng như notebook thật. Áp dụng đồng nhất cho gõ lẫn bút.

Khi hai block giãn ra đè nhau: **snap/nudge** sang khoảng trống gần nhất. Cơ chế collision cụ thể là việc của architect (§11.3).

### 2.4 Block bounding-box và claim dòng

Mỗi block chiếm **bounding-box N dòng kẻ** (N ≥ 1, tự giãn theo nội dung) gồm phần nhập + phần kết quả **nối tiếp** (xem §6 — liền mạch, không khung; kết quả cùng dòng nếu ngắn, xuống dòng kẻ kế nếu dài). Block "claim" N dòng nó dùng → block khác không đè vào vùng đã claim. Đây là ranh giới **vô hình** cho layout/collision/sửa, không phải hộp hiển thị.

Node lưu **song song** hai trạng thái nhập:
- `inkStrokes[]`: mực thô từ bút — **không bao giờ xoá sau khi nhận diện** (user cần re-write hoặc xem lại gốc).
- `latexContent`: chuỗi LaTeX đã nhận diện hoặc đã gõ.

### 2.5 Trade-off và rủi ro kỹ thuật

| Vấn đề | Hệ quả | Xử lý |
|---|---|---|
| Selection model của ProseMirror là **linear** (caret đi theo text flow), trong khi layout là **2D** | Arrow/Tab navigation không ra khỏi một block đến block "cạnh bên" theo không gian | Custom plugin xử lý navigation 2D — việc của architect + editor-frontend |
| **Canvas thuần** (Excalidraw-style) bị loại | Mất document semantics (serialize, a11y, undo) | Hybrid NodeView là lựa chọn đúng |
| **Bug MathLive + ProseMirror "draggable property conflict"** đã biết | Có thể gây event conflict khi drag block | Spike ≤1 ngày trước khi commit stack (§11.2) |
| Thêm ink-canvas overlay | Event propagation phức tạp hơn khi gõ + bút cùng block | Test kỹ interaction giữa MathLive focus và ink canvas |

---

## 3. Đường gõ — [LOCKED base; [USER-CHỐT] bỏ auto-eval]

### 3.1 Trải nghiệm

User click/tap vào chỗ trống trên dòng kẻ → block tạo tại vị trí đó → nhập công thức bằng bàn phím. Mặc định **block mới là loại Toán** (MathLive `<math-field>`).

**Live render sống khi gõ** (WYSIWYG, kiểu Typora — giữ nguyên):

| Gõ | Hiển thị | Gõ | Hiển thị |
|---|---|---|---|
| `x^2` | x² | `x_i` | xᵢ |
| `sqrt(x)` hoặc `\sqrt` | √x | `\frac` + Tab | phân số |
| `\int` hoặc `int` | ∫ | `\sum` hoặc `sum` | Σ |
| `\prod` | ∏ | `\lim` | lim |
| `\pi` | π | `\alpha`, `\beta`, `\theta`… | α, β, θ… |
| `\infty` hoặc `inf` | ∞ | `\partial` | ∂ |

Render sống giúp user thấy ngay ký hiệu toán mình đang nhập — nhưng **chưa tính gì cả**. CAS không được gọi khi đang gõ.

### 3.2 Bàn phím ảo toán

MathLive có **virtual keyboard tích hợp** với phím toán học:
- Máy có bàn phím vật lý: ẩn mặc định, hiện khi user toggle.
- Máy cảm ứng / iPad không bàn phím rời: tự hiện.
- Nút toggle ≥44×44px (yêu cầu nền §2). Label đi qua i18n.

### 3.3 Nút Tính — [USER-CHỐT]

Khi sẵn sàng nhận kết quả, user nhấn **nút Tính** (hoặc phím tắt `Shift+Enter` / qua Command Palette):

- Gõ **bôi đen** phần muốn tính trước → nhấn Tính → chỉ tính phần đó.
- **Không bôi đen** → nhấn Tính → tính biểu thức hiện tại / gần con trỏ (hành vi chính xác để architect chốt — §11 mục I).
- Biến định nghĩa ở bất kỳ đâu trên trang đều có hiệu lực (ngữ cảnh = cả trang).
- Loading indicator hiển thị trong khi CAS xử lý (SymPy latency 100–2000ms).
- Kết quả render theo §6 (liền mạch, không khung).

### 3.4 Nút Convert — đổi loại block toán ↔ chữ — [USER-CHỐT]

**Convert nằm trên floating toolbar** (§7 Lớp 2). Hành xử như toggle B/I/U:

| Trạng thái | Thao tác | Kết quả |
|---|---|---|
| **Có bôi đen** | Nhấn Convert | Chuyển đúng đoạn được chọn sang loại kia |
| **Không bôi đen** | Nhấn Convert | Lật chế độ; ký tự gõ tiếp theo thuộc loại mới tới khi đổi lại |
| Toán → Chữ | — | Lấy đúng ký tự đã gõ thành **chữ thường** — `x^2` thành text "x^2" (hết render x²) |
| Chữ → Toán | — | Nội dung chữ đưa vào bộ parse công thức — `x^2+1` → x²+1 render (sẵn sàng Tính) |

`\` (backslash) **KHÔNG** đổi loại block — `\` chỉ mở **bảng ký hiệu/lệnh LaTeX** để chèn (`\frac`, `\sqrt`, `\int`…).

### 3.5 Paste mặc định = chữ thuần — [USER-CHỐT]

- **`Ctrl+V`**: dán bỏ định dạng nguồn — tránh lệch tông notebook + design tokens.
- **`Ctrl+Shift+V`**: cũng plain (không có "paste với định dạng" trong phiên bản này).
- Giữ định dạng nguồn = thao tác chủ động, **để SAU MVP**.

### 3.6 Chạy trên mọi máy

Đường gõ không phụ thuộc stylus — laptop không cảm ứng, iPad bàn phím rời, Surface chỉ chuột đều dùng được. Đây là đường nhập phổ quát.

### 3.7 Ràng buộc bắt buộc

- **KHÔNG** dùng `<input>` / `<textarea>` thuần — phải dùng MathLive `<math-field>` (WYSIWYG).
- **KHÔNG** hiển thị raw LaTeX khi đang nhập.
- **KHÔNG** tự gọi CAS trong khi user đang gõ.
- Màu input: `--text-primary`; màu caret: `--caret` (token, không hardcode hex).
- Mọi label/tooltip/placeholder đi qua i18n (`src/locales/en.json` + `vi.json`).

---

## 4. Đường bút (Stylus) — [USER-CHỐT mô hình tương tác; HUMAN GATE license]

> **[HUMAN GATE §11.2]** Tích hợp MyScript yêu cầu user chốt **ngân sách license** và **thiết bị mục tiêu** trước khi implement. Xem chi tiết §11 bên dưới. Đường bút **không nằm trong MVP** nếu gate chưa chốt. Đường gõ luôn chạy offline độc lập.

### 4.1 Trải nghiệm

User cầm bút → pen-down vào chỗ trống trên dòng kẻ → block tạo tại đó → viết ký hiệu toán **giống viết trên giấy**. Không cần biết LaTeX.

Luồng: viết → mực hiện màu `--ink` (xanh ngọc teal) → mực lưu dưới dạng `inkStrokes[]` → **khi user nhấn Tính**: HTR nhận diện ngầm → LaTeX (ghi vào `latexContent`) → CAS → kết quả hiện riêng màu `--result`.

**Không có nhận diện tự động, không có preview auto-advance** — mực chỉ là mực cho tới khi user chủ động nhấn Tính.

**Mực giữ nguyên sau khi tính:** UI nét vẽ **KHÔNG thay đổi** khi nhấn Tính — strokes vẫn hiển thị màu `--ink` trên màn. HTR chạy ngầm ở tầng data (không biểu hiện thị giác). Kết quả symbolic hiện **riêng** bên dưới/cạnh nét mực (màu `--result`), không thay thế mực. Đây là đặc điểm tốt — user thấy cả nét viết tay gốc lẫn kết quả tính.

### 4.2 Kích hoạt — chỉ trên máy có bút

Chỉ kích hoạt khi `pointer: pen` hoặc `pointer: coarse` được detect (`requirements.md §2`):
- Máy chỉ chuột: canvas bút không xuất hiện, không chiếm chỗ.
- iPad Pro (Apple Pencil) / Surface (Surface Pen) / laptop bút: block tự có vùng nhận ink.

### 4.3 Palm rejection

Canvas chỉ nhận stroke từ `pointerType: pen`. Chạm tay/lòng bàn tay bị bỏ qua. MyScript iink hỗ trợ palm rejection tích hợp.

### 4.4 Zoom-box (GoodNotes-style)

Với ký hiệu cần viết nhỏ trên màn (chỉ số trên/dưới, phân số lồng nhau), user có thể mở **zoom-box** để viết cỡ lớn hơn rồi tự thu nhỏ vào vị trí. Tham chiếu: GoodNotes, Nebo.

### 4.5 Gesture bút

| Gesture | Hành động |
|---|---|
| Scratch/gạch ngang trên ký hiệu | Xóa ký hiệu đó |
| Scratch toàn block | Xóa toàn bộ block |
| Long-press (giữ bút) | Mở radial menu (tương đương `\` của gõ) |

### 4.6 Phạm vi nhận diện MyScript (~250 ký hiệu)

Đủ cover toán kỹ thuật phổ biến:
- Số, biến, toán tử cơ bản (+ − × ÷ = ≠ < > ≤ ≥)
- Hàm: sin, cos, tan, ln, log, exp, √, ∛
- Giải tích: ∫ ∂ Σ ∏ lim →
- Ký hiệu Hy Lạp: α β γ π θ λ μ σ ω…
- Phân số, lũy thừa, chỉ số trên/dưới, ma trận cơ bản

Giới hạn: notation lạ hoặc ký hiệu rất đặc thù → fallback gõ thủ công hoặc Convert chữ→toán.

### 4.7 Lưu trữ song song: inkStrokes[] + latexContent

Node block lưu **cả hai**:
- `inkStrokes[]`: mực thô gốc (không xóa sau nhận diện) — user có thể scratch-out, viết lại, undo.
- `latexContent`: LaTeX sau HTR (được ghi khi user nhấn Tính) — đưa vào CAS pipeline.

### 4.8 Lasso và "Use as Math / Use as Sketch" — [USER-CHỐT]

Đây là **bản sao parity của nút Convert** (§3.4) trên đường bút — cùng một ý niệm "đổi loại nội dung", qua kênh vật lý bút:

- User dùng lasso (bút khoanh vùng) chọn một nhóm nét mực.
- Floating toolbar hiện cạnh vùng chọn với 2 nút:
  - **[Use as Math]**: nhóm nét này là toán học — khi nhấn Tính sẽ được HTR nhận diện + gửi CAS.
  - **[Use as Sketch]**: nhóm nét này là ink tự do (vẽ minh hoạ) — không bao giờ đưa vào CAS.
- Mặc định: mực trong **block toán** → Use as Math; mực trong **block ink tự do** → Use as Sketch.

**Toolbar lasso nằm CẠNH vùng chọn, KHÔNG đè lên nét mực** (tránh lỗi UX phổ biến của GoodNotes).

### 4.9 Nút Tính trên đường bút — [USER-CHỐT]

Nút Tính trên đường bút **giống hệt** nút Tính trên đường gõ về UX — cùng vị trí, cùng icon, cùng phím tắt `Shift+Enter`. Khác duy nhất ở logic **nội bộ, không biểu hiện ra UI**:

1. (Nội bộ, không có bước xác nhận riêng): HTR MyScript nhận diện `inkStrokes[]` → ghi `latexContent`. User **không thấy gì thay đổi trên màn trong lúc này**.
2. (Giống gõ): gửi `latexContent` sang CAS → kết quả symbolic.

**Sau khi Tính xong:**
- Nét mực **giữ nguyên** màu `--ink`, không bị thay thế bằng công thức typeset.
- Kết quả hiện **riêng** bên cạnh/bên dưới nét mực (màu `--result`), đúng §6.
- Block trông giống hệt: bên trái = nét viết tay, bên phải/dưới = kết quả indigo.

Loading indicator duy nhất hiển thị trong khi HTR + CAS đang chạy — user không cần biết 2 bước nội bộ.

**Tùy chọn "Xem LaTeX nhận diện" (on-demand, không mặc định):**
Nếu user muốn kiểm tra app nhận diện đúng không (vd công thức phức tạp): floating toolbar sau khi có kết quả có mục "Xem LaTeX…" → hiện `latexContent` trong tooltip/popover để đọc. User có thể sửa trực tiếp từ đó (→ quay về `EDITING-MATH` với LaTeX đã chỉnh → Tính lại). Đây là flow **ngoại lệ**, không phải mặc định.

Nếu HTR fail (không nhận ra): block hiện thông báo lỗi `--error`; nút Tính vẫn sẵn để thử lại; "Xem LaTeX…" hiện lỗi HTR để user biết.

### 4.10 Ràng buộc bắt buộc

- **KHÔNG** dùng OS-level handwriting recognition — phải dùng MyScript iink (~250 ký hiệu toán).
- **KHÔNG** xóa `inkStrokes[]` sau nhận diện — giữ để scratch-out / viết lại / undo.
- **KHÔNG** tự chạy HTR khi user chưa nhấn Tính.
- **KHÔNG** thay thế nét mực bằng MathLive typeset render sau khi Tính — ink giữ nguyên visual, kết quả hiện riêng.
- Màu mực: `--ink` token, không hardcode.
- Loading indicator trong khi HTR + CAS eval (1 indicator cho cả 2 bước nội bộ).

---

## 5. Vòng đời block — State Machine — [LEAD-CHỐT]

Cả 2 đường nhập dùng **chung một state machine**. Từ `EVALUATING` → `RESULT-RENDERED` là 100% giống nhau.

```
  [click/tap chỗ trống]         [pen-down chỗ trống]
            │                              │
            ▼                              ▼
     EDITING-MATH                     INK-CAPTURE
    (MathLive live render)            (mực thô, không HTR)
    [nút Tính hiển thị]              [nút Tính hiển thị]
    [nút Convert hiển thị]           [lasso → Use as Math/Sketch]
            │                              │
            │ user nhấn [Tính]             │ user nhấn [Tính]
            │ (bôi đen hoặc                │ (bôi đen hoặc
            │  con trỏ)                    │  toàn block)
            │                       HTR-RECOGNIZING
            │                       (MyScript processing)
            │                              │
            │                        HTR-RESULT
            │                        (LaTeX từ HTR)
            │                        [nếu fail → ERROR]
            │                              │
            └──────────────┬───────────────┘
                           ▼
                      EVALUATING
                 (LaTeX → IPC → SymPy)
                 [loading indicator bắt buộc]
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
      RESULT-EXACT   RESULT-APPROX     ERROR
      (--result)     (--approx)        (--error)
      (symbolic)     (numeric fallback) (parse/HTR fail)

Từ RESULT-*:
  Trạng thái hiển thị: nét mực GIỮ NGUYÊN màu --ink (không bị thay) + kết quả hiện thêm màu --result.
  focus lại block → pointerType pen? → INK-CAPTURE (thêm/sửa bằng bút)
                  → mouse/keyboard?  → EDITING-MATH (sửa bằng gõ)
  [cùng 1 block, sửa được bằng cả 2 modality — hội tụ thực sự]
  Nhấn Tính lại → EVALUATING (tính lại sau khi sửa)

Convert trong vòng đời:
  EDITING-MATH ──[Convert]──→ EDITING-TEXT  (loại block đổi; nội dung chuyển sang text thuần)
  EDITING-TEXT ──[Convert]──→ EDITING-MATH  (text đưa qua parser; live render bật lại)
  Từ RESULT-*: Convert → block quay về EDITING-MATH hoặc EDITING-TEXT tùy hướng đổi,
               kết quả cũ bị xóa (cần Tính lại sau khi sửa).

Toggle exact/decimal từ RESULT-EXACT ↔ RESULT-APPROX:
  → không cần re-edit, không trigger EVALUATING lại
  → frontend chọn hiển thị từ response đã có (CAS trả cả 2 cùng lúc)
```

**Hành vi focus/blur kiểu Typora:** khi block `RESULT-RENDERED`, hiển thị kết quả. User click/tap/pen lại → block mở ra để sửa, nút Tính hiện lại. Không bao giờ hiển thị raw LaTeX với user không chủ động hỏi.

**Undo/redo** khả dụng ở mọi trạng thái — ProseMirror quản lý lịch sử. *Lưu ý rủi ro architect:* MathLive có undo stack riêng, ProseMirror có history riêng → cần unified undo manager (§11 mục I).

---

## 6. Render kết quả — [LEAD-CHỐT]

### 6.1 Hình thức: liền mạch, KHÔNG khung

Kết quả xuất hiện **sau khi user nhấn Tính** — không có preview live khi đang gõ.

Kết quả **không** nằm trong hộp/thẻ có viền và **không** có đường ngăn input/result. Trên giấy kẻ ngang, kết quả là phần **nối tiếp** của chính biểu thức — phân biệt với input **chỉ bằng MÀU** (`--result` indigo/violet), không bằng viền hay vạch ngăn.

```
···· dòng kẻ ····························
   ∫ x² dx  =  x³/3 + C
···· dòng kẻ ····························
   d/dx(sin x) = cos x
···· dòng kẻ ····························
```
(đen `--text-primary` = input · indigo `--result` = kết quả)

- **Kết quả ngắn → cùng dòng** với dấu `=` (giống viết trên giấy nháp).
- **Kết quả dài / nhiều tầng → tự xuống dòng kẻ kế**, vẫn không viền:

```
···· dòng kẻ ····························
   ∫ e^x sin x dx
···· dòng kẻ ····························
   = ½ e^x (sin x − cos x) + C
···· dòng kẻ ····························
```

### 6.2 Quy tắc đồng nhất + "block vô hình" — [LEAD-CHỐT]

- Quy tắc **"vừa thì cùng dòng, dài thì xuống dòng kế"** là **một quy tắc duy nhất**, áp dụng đồng nhất cho cả gõ lẫn bút.
- Khái niệm **"block" là đơn vị VÔ HÌNH**: chỉ tồn tại ở tầng logic/layout. Mặc định **không có biểu hiện thị giác**:
  - Trạng thái nghỉ: chỉ thấy mực/chữ trên giấy — không hộp, không viền.
  - Khi hover / select / đang sửa: highlight **nhẹ** (nền `--accent-subtle` hoặc viền mảnh tạm thời), rồi tắt khi rời.
- Giữ tinh thần "giấy nháp, đặt tự do" (CLAUDE.md §4.3).

### 6.3 Màu sắc kết quả

| Trạng thái kết quả | Token màu | Ý nghĩa |
|---|---|---|
| Symbolic exact | `--result` (indigo/violet) | Chính xác, không làm tròn |
| Numeric fallback | `--approx` (amber) | "Đây là làm tròn, KHÔNG phải nghiệm chính xác" |
| Lỗi | `--error` (red) | Parse fail hoặc HTR fail hoặc SymPy timeout |
| Mực đang viết | `--ink` (teal đậm) | Stroke chưa được HTR nhận diện |

Token tham chiếu từ `requirements.md §3`. Không hardcode hex.

---

## 7. UX nhập lệnh — 4 lớp đồng tồn

Mục tiêu: phục vụ cả **người mới** (chưa biết LaTeX, chưa biết shortcut) lẫn **người cũ** (thành thạo, ghét chuột).

### Lớp 1: `\` = Bảng ký hiệu/lệnh toán — [USER-CHỐT]

Gõ `\` → **bảng ký hiệu/lệnh LaTeX** hiện ra để chèn — `\frac`, `\sqrt`, `\int`, `\sum`…

- **Phạm vi: chèn ký hiệu / lệnh** — KHÔNG phải đổi loại block (đổi loại block = nút Convert, §3.4).
- Trong MathLive (block toán): `\` mở autocomplete lệnh LaTeX.
- Ở document level (ngoài block): `\` mở menu tạo block / chèn.
- `Escape` từ MathLive → trở về document focus.
- `/` **luôn giữ đúng nghĩa phép chia** — không bao giờ mở menu lệnh.
- Label trong bảng đi qua i18n.

**Mirror sang bút**: Long-press bút → **radial menu** (tương đương `\`) — parity về command access.

### Lớp 2: Floating toolbar — ngữ cảnh hoá theo loại + trạng thái

Select / focus một block → toolbar nổi xuất hiện. **Nội dung toolbar thay đổi theo loại nội dung và trạng thái block:**

**Block Toán — đang chỉnh sửa (`EDITING-MATH`):**
- **[Tính]** — kích hoạt HTR (nếu cần) + CAS; phím tắt `Shift+Enter`
- **[Convert → Chữ]** — đổi block toán sang text thuần
- Cỡ (normal / display) · màu nhấn · highlight
- Copy LaTeX · Xóa block

**Block Toán — đang viết bút (`INK-CAPTURE`):**
- **[Tính]** — HTR + CAS
- Lasso → **[Use as Math]** / **[Use as Sketch]**
- Xóa block

**Block Toán — đã có kết quả (`RESULT-*`):**
- Toggle exact ↔ decimal
- **[Tính lại]** — tính lại sau khi sửa
- Copy LaTeX (kết quả) · Reference block (@ID) · Xóa

**Block Chữ (`EDITING-TEXT`):**
- B · I · U · S · cỡ bậc (Heading/Body/Small) · màu · highlight
- **[Convert → Toán]** — đổi sang block toán
- Xóa block

**Block Ink tự do (lasso chọn nét):**
- **[Use as Math]** / **[Use as Sketch]** — phân loại lại loại nội dung
- Move / Copy / Delete

Hit target ≥44px (yêu cầu nền). Hiển thị cả trên máy chuột lẫn cảm ứng.
**Toolbar lasso cạnh nét, KHÔNG đè lên nét mực** — tránh che khuất stroke.
**Mirror sang bút**: nút ⋮ trên toolbar bút mở thêm lệnh; Tính + Convert ưu tiên đặt nổi bật.

### Lớp 3: Command Palette `Ctrl/Cmd+K`

Fuzzy search tất cả lệnh + hiện shortcut — **dành cho người cũ, tốc độ cao** (kiểu VSCode).
- Mọi lệnh trong app accessible qua đây, gồm cả "Tính" và "Convert".
- Hiện shortcut bàn phím → người dùng học shortcut qua dùng.

**Mirror sang bút**: nút "⋮" / menu trên toolbar nổi = entry point tương đương.

### Lớp 4: Contextual tips — hiện theo hành động lần đầu

Tips **không random, không spam** — đúng lúc hành động lần đầu:

| Hành động lần đầu | Tip xuất hiện |
|---|---|
| Gõ `sqrt` | "Bạn có thể dùng `\sqrt` nhanh hơn, hoặc nhấn `\` để xem bảng ký hiệu" |
| Nhập xong công thức nhưng không bấm Tính sau 30s | "Nhấn [Tính] hoặc Shift+Enter để tính kết quả" |
| Block đầu tiên có kết quả approx (amber) | "Kết quả amber = làm tròn. Nhấn toggle exact/decimal để xem chính xác" |
| Bôi đen lần đầu trước khi Tính | "Tốt! Bôi đen để chọn phạm vi tính — biến định nghĩa ở nơi khác trên trang vẫn có hiệu lực" |

Giới hạn: **tối đa 1 tip/session**, dismissible, không cản workflow.

---

## 7.5 Loại nội dung & định dạng — [LEAD-CHỐT]

Nib chứa 3 loại nội dung khác nhau. Loại ảnh hưởng đến **định dạng áp dụng được** và **đối tượng nút Tính nhắm đến** — không còn auto-trigger nhận diện theo loại.

### 7.5.1 Ba loại nội dung

| Loại | Là gì | Tính được? | Ví dụ |
|---|---|---|---|
| **Toán (Math)** | Block công thức: gõ MathLive hoặc mực bút được đánh dấu "Use as Math" | ✓ (nút Tính) | `∫x²dx`, `d/dx(sin x)`, `x²+2x` |
| **Chữ (Text/prose)** | Chú thích, nhãn, tiêu đề — KHÔNG đưa vào CAS | ✗ | "Bài 1:", "Chú ý: dùng L'Hôpital" |
| **Ink tự do** | Nét bút đánh dấu "Use as Sketch" — vẽ minh hoạ, không convert sang toán | ✗ | sơ đồ, mũi tên nối, khoanh tròn |

Loại có thể **đổi qua nút Convert** (gõ) hoặc **lasso Use as Math/Sketch** (bút) — không cố định khi tạo.

### 7.5.2 Định dạng theo loại — [LEAD-CHỐT]

**Toán (Math):**
- Định dạng ngữ nghĩa (biến nghiêng, mũ…) **tự động theo LaTeX** — user **không** tự B/I/U (phá nghĩa toán).
- Cho phép: **cỡ** (normal = inline / display = lớn, giống `\displaystyle`) + **màu nhấn** + highlight cả block — chỉ để nhấn mạnh thị giác.
- **Màu kết quả khóa theo token** (`--result` exact / `--approx` gần đúng) — **không cho user đổi** để giữ quy ước exact↔approx nhất quán.

**Chữ (Text/prose):**
- **Đậm / nghiêng / gạch chân / gạch ngang** (B · I · U · S).
- **Cỡ chữ theo 3 bậc** (Heading / Body / Small) — không nhập số pt tuỳ ý rườm rà.
- **Màu chữ** + **highlight** — chọn từ swatch 8 màu (§7.5.5).
- *Sau MVP (không bắt buộc MVP):* heading levels, list, alignment, link, table.

**Ink tự do (bút):**
- **Pen palette** (dải dọc) — chọn công cụ: bút / highlighter / stroke-eraser / lasso + cỡ nét + màu.
- 3 cỡ nét: mảnh / trung bình / đậm.
- Tẩy (eraser): stroke-eraser (xoá cả nét) — pixel-eraser *sau MVP*.
- Mực mặc định màu `--ink`; user đổi sang swatch 8 màu.

### 7.5.3 [LOCKED — user chốt] Cỡ chữ/bút KHÔNG đổi khoảng cách dòng kẻ

- **Khoảng cách giữa các dòng kẻ ngang là CỐ ĐỊNH** — lưới giấy không co giãn theo nội dung hay cỡ chữ.
- Cỡ chữ/bút lớn hơn → nội dung cao hơn → block **claim thêm dòng kẻ** (cơ chế bounding-box §2.4), không đẩy/giãn lưới.
- Cỡ chữ mặc định chọn sao cho chữ thường "ngồi" gọn trên 1 dòng kẻ; phóng to là ngoại lệ để nhấn mạnh.
- **Chỉnh khoảng cách dòng kẻ** (mật độ giấy) = tính năng riêng **để SAU** (user xác nhận: ngoài phạm vi hiện tại).

### 7.5.4 Surface định dạng — [LEAD-CHỐT, từ research]

**Pen palette** — dải dọc cố định, **ẩn khi không có `pointer: pen` hoặc `pointer: coarse`**:
- Vị trí: cạnh trái hoặc phải màn hình (không cản vùng viết).
- Chức năng: chọn CÔNG CỤ (pen / highlighter / stroke-eraser / lasso) + cỡ + màu.
- Chỉ dành cho ink tự do — không điều khiển block toán hay text.

**Floating toolbar** — khi select bất kỳ nội dung nào, **dùng CHUNG cả gõ lẫn bút**:
- Chức năng: THAO TÁC trên nội dung đã chọn (xem §7 Lớp 2 — nội dung theo loại + trạng thái).
- **Toolbar lasso nằm CẠNH nét, KHÔNG đè lên nét mực** (đây mới là lỗi UX phổ biến của GoodNotes bị chê; tránh tuyệt đối).
- Hit target ≥44px cho mọi nút, kể cả khi toolbar compact.

**Swatch màu** — 8 màu preset, áp cho cả text và ink:
- Thích ứng light/dark: mỗi màu có biến thể đọc được ở cả 2 theme (WCAG AA ≥4.5:1).
- Màu nội dung user chọn là **dữ liệu** (lưu theo nội dung), khác token theme.
- 8 màu dẫn xuất hài hoà từ palette token (teal / indigo / green / amber / red + trung tính) — không lệch tông.
- Màu kết quả CAS (`--result`, `--approx`) **không có trong swatch** — khóa, user không đổi.

Mọi label/tooltip đi qua i18n (en/vi). Hit target ≥44px.

### 7.5.5 Bộ tính năng MVP vs SAU — [LEAD-CHỐT, từ research]

**MVP — cả 2 đường (baseline notepad):**
- Undo/redo (Ctrl+Z/Y + gesture 2/3 ngón bút)
- 3 loại block (Toán / Chữ / Ink tự do) + free-placement + bounding-box claim dòng
- Block select / drag-2D / delete
- Copy/paste block (paste plain §3.5)
- Floating toolbar ngữ-cảnh hoá
- Find — chỉ trong text (không trong công thức)
- Shortcut chuẩn (Ctrl+Z/Y/C/V/A…)
- **Nút Tính** (HTR + CAS, target = chọn, ngữ cảnh = cả trang)
- **Nút Convert** (toggle toán ↔ chữ)

**MVP — đường gõ:**
- MathLive WYSIWYG + ASCII shortcut + LaTeX trực tiếp
- Paste plain (§3.5)
- Text block: B/I/U/S + 3 bậc cỡ + swatch 8 màu
- Virtual keyboard toggle

**MVP — đường bút:**
- Pen palette: pen / highlighter / stroke-eraser / lasso + 3 cỡ + 8 swatch
- Scratch-out gesture (luôn active, phân biệt bởi ngưỡng tốc độ/đè)
- Palm rejection
- Lasso "Use as Math / Use as Sketch"

**SAU MVP (không bắt buộc version 1.0):**
- Cross-block selection
- Find/replace; find trong công thức
- Export PDF/PNG
- @blockID reference (block dùng kết quả block khác)
- List / heading-levels / alignment / link / table
- Pencil / brush tool; pixel-eraser; shape-snap; ruler; rotate/resize ink; group ink
- HTR-to-text (viết tay chữ, không phải ký hiệu toán)
- Paste giữ định dạng nguồn (opt-in)
- Chỉnh khoảng cách dòng kẻ (mật độ giấy)

---

## 8. Bảng Parity gõ ↔ bút

Hai đường ngang hàng ở **core flow**. Phần một-bên là đặc tính vật lý của kênh nhập, không phá "cảm giác tương đương".

### 8.1 Parity — cơ chế khác, kết quả/intent giống

| Tính năng | Cơ chế gõ | Cơ chế bút |
|---|---|---|
| Tạo block | Click vào chỗ trống / `\` | Pen-down vào chỗ trống / long-press |
| Nhập nội dung | MathLive WYSIWYG + ASCII shortcut | Ink thô (mực) |
| Live render khi nhập | ✓ x^2→x² (MathLive, chưa tính) | ✗ (mực là mực cho tới khi Tính) |
| Tính kết quả symbolic | **Nhấn [Tính]** | **Nhấn [Tính]** (bao gồm HTR) |
| Đổi loại block toán↔chữ | **[Convert]** trên floating toolbar | **Lasso → [Use as Math/Sketch]** |
| Toggle exact ↔ decimal | Floating toolbar / Ctrl+K | Floating toolbar / nút ⋮ |
| Chỉnh sửa block | Click → EDITING-MATH | Pen-down → INK-CAPTURE |
| Di chuyển/reposition block | Drag bằng chuột | Drag bằng bút (hoặc lasso + move) |
| Xóa block | Backspace khi empty / toolbar | Scratch-out gesture toàn block |
| Undo/redo | Ctrl+Z / Ctrl+Y | Ctrl+Z / gesture 2-ngón hoặc 3-ngón |
| Copy LaTeX | Floating toolbar | Floating toolbar |
| Command access | `\` bảng ký hiệu + Ctrl+K palette | Long-press radial menu + nút ⋮ |
| Loading indicator | Spinner/shimmer khi CAS eval | Spinner/shimmer khi HTR + CAS eval |

### 8.2 Bắt buộc chỉ bút (đặc tính vật lý kênh nhập)

| Tính năng | Mô tả |
|---|---|
| **Palm rejection** | Bỏ qua chạm tay, chỉ nhận `pointerType: pen` |
| **Zoom-box** | Viết ký hiệu nhỏ trong vùng phóng to (GoodNotes-style) |
| **Scratch-out gesture** | Gạch xóa ký hiệu/block trực tiếp bằng bút (luôn active) |
| **Ink render** | Stroke hiển thị màu `--ink` (mực teal) trong quá trình viết |
| **Pen palette** | Dải dọc tool (pen/highlighter/stroke-eraser/lasso + cỡ + màu), ẩn khi không có bút |
| **Lasso Use-as-Math/Sketch** | Phân loại lại nhóm nét (parity với Convert trên gõ) |
| **HTR qua MyScript** | Nhận diện ~250 ký hiệu toán khi nhấn Tính |

### 8.3 Bắt buộc chỉ gõ (đặc tính vật lý kênh nhập)

| Tính năng | Mô tả |
|---|---|
| **Live render WYSIWYG** | MathLive: x^2→x², ∫, Σ… hiện ngay khi gõ (chưa tính) |
| **Bàn phím ảo toán** | MathLive virtual keyboard (toggle, dành thiết bị không có bàn phím vật lý) |
| **ASCII shortcut + LaTeX trực tiếp** | `sqrt`→√, `\frac{}{}`…; phím tắt physical keyboard |

---

## 9. Hợp đồng hội tụ — Input → LaTeX → CAS → Output

Cả 2 đường nhập tuân theo cùng **output contract**. Backend trả **cả hai dạng cùng lúc** — frontend không cần request lại khi toggle.

```
Input (gõ hoặc bút) — user nhấn [Tính]
  ↓
  (Nếu bút) HTR: inkStrokes[] → LaTeX string
  ↓
LaTeX string (UTF-8)
  ↓
IPC → FastAPI/SymPy sidecar
  ↓
Response:
  {
    "exact_latex":  "\\frac{x^3}{3} + C",  // symbolic, không làm tròn
    "approx_latex": "0.333x^3 + C",        // numeric (khi có)
    "is_approx":    false,                  // true = chỉ có số gần đúng
    "steps":        [...],                  // các bước (opt, cho lớp AI sau)
    "error":        null                    // thông báo lỗi parse/timeout/HTR
  }
```

**Quy tắc bắt buộc:**
- `exact_latex` **không bao giờ làm tròn**: `Rational(1,3)` → `\frac{1}{3}`, không `0.333`.
- `is_approx: true` → frontend **bắt buộc** dùng `--approx` token (amber) — không được dùng `--result` (indigo).
- Timeout backend (configurable, ~5–10s) → trả `is_approx: true` + numeric fallback. Không treo vô hạn.
- Parse fail hoặc HTR fail → `error` non-null → block hiện thông báo lỗi (`--error`), không crash.

---

## 10. Phạm vi toán — MVP

| Nhóm | Ví dụ | Ghi chú |
|---|---|---|
| **Số học chính xác** | `2/3 + 1/4 = 11/12`, `√8 = 2√2`, `3!` | Phân số, căn — không làm tròn |
| **Đại số** | `(x+1)² = x²+2x+1`, giải `x²=4` → `x=±2` | Khai triển, rút gọn, giải nghiệm |
| **Đạo hàm** | `d/dx(x³) = 3x²` | Ra hàm số, không phải số |
| **Tích phân** | `∫x dx = x²/2 + C` | Bất định + định tích phân |
| **Sum/Product** | `Σ_{i=1}^{n} i = n(n+1)/2` | Symbolic hoặc thay biến chạy |
| **Giới hạn** | `lim_{x→0} sinx/x = 1` | |
| **Phương trình** | Nghiệm dạng đóng khi có | Fallback thông báo "no closed form" |
| **Tính với biến đã định nghĩa** | `x = 5` trên trang → tính `x² + 1` → `26` | Ngữ cảnh cả trang |

**Ngoài MVP (để sau):** ma trận/tensor, lý thuyết số, tổ hợp phức tạp, vẽ đồ thị, lớp AI giải thích từng bước.

---

## 11. Rủi ro & câu hỏi mở

### 11.1 [HUMAN GATE] Cloud iink vs Native iink SDK + license — blocker cho đường bút

Đây là **quyết định quan trọng nhất chưa chốt**. User phải quyết trước khi architect/implementer commit bất kỳ task nào liên quan đường bút.

| Lựa chọn | Ưu | Nhược |
|---|---|---|
| **MyScript cloud iink** | Dễ tích hợp, luôn mới | **Online-only** — mất bút hoàn toàn khi offline |
| **MyScript native SDK** | Offline hoạt động | Chưa confirmed Linux/macOS; license đắt hơn; phức tạp hơn |

**Hệ quả bất đối xứng availability — vẫn còn với mô hình bấm-nút:**
- Đường gõ: nhấn Tính → SymPy sidecar cục bộ → **offline OK**.
- Đường bút: nhấn Tính → HTR cần iink (cloud hoặc SDK) → **nếu cloud: mất bút khi offline**.
- Mô hình bấm-nút không xoá bỏ bất đối xứng này — chỉ dời thời điểm gọi HTR từ "ngầm" sang "chủ động".
- Đây là **trade-off sản phẩm**, cần user quyết.

Chờ chốt: §11.1 thiết bị mục tiêu (iPad Pro / Surface / cả hai) + §11.2 ngân sách license + online-only có chấp nhận được không.

### 11.2 Bug MathLive + ProseMirror "draggable property conflict"

Bug đã biết: khi nhúng MathLive `<math-field>` vào ProseMirror NodeView, có thể conflict ở thuộc tính `draggable` → drag block lỗi hoặc event không đúng.

**Action:** **Spike ≤1 ngày** trước khi commit stack editor-frontend. Nếu confirm không nghiêm trọng → ghi workaround; nếu nghiêm trọng → cần architect đề xuất cách tránh.

### 11.3 Cơ chế "claim dòng kẻ" khi collision

Khi 2 block giãn ra đè nhau: snap/nudge sang khoảng trống. Cơ chế collision cụ thể (thuật toán, UX khi không còn chỗ) — việc của **architect**, chưa chốt ở level spec này.

### 11.4 [HUMAN GATE] Lớp AI (§11.3 CLAUDE.md)

LLM fallback: khi HTR miss hoặc input bừa (`sinx` không space), LLM parse intent → LaTeX. User chưa chốt có làm ngay MVP hay để sau.

### 11.5 Câu hỏi mở cho ARCHITECT (chặn thiết kế HOW, chưa cần user quyết)

Các điểm sau **architect phải chốt trước khi editor-frontend implement**:

| Câu hỏi | Mô tả | Tại sao chặn |
|---|---|---|
| **Unified undo manager** | MathLive có undo stack riêng; ProseMirror có history riêng → Ctrl+Z dễ fire sai layer | Nếu không giải, undo sẽ không đoán được; cần thiết kế trước khi build block |
| **Target của Tính khi không bôi đen** | "Biểu thức hiện tại / gần con trỏ" — hành vi cụ thể thế nào? (Cả block? Nửa block nếu block ghép nhiều phần?) | Ảnh hưởng trực tiếp behavior nút Tính |
| **Convert ở ca biên** | Block toán đã có kết quả render → Convert toán→chữ? Xóa kết quả hay giữ? Chữ nhiều dòng → Convert toán: parse cả đoạn hay từng dòng? | Cần nhất quán trước khi implement |
| **Gesture long-press radial menu** | Long-press bút mở radial menu — tránh xung đột với shape-snap (post-MVP) | Reserve trigger đúng sớm để không phải refactor |

---

## 12. Điều hướng team

| Vai | Section liên quan | Lưu ý |
|---|---|---|
| **editor-frontend** | §2 (free placement + block model) · §3 (gõ: Tính + Convert) · §5 (state machine) · §6 (render kết quả) · §7 (UX 4 lớp) · §7.5 (định dạng + MVP list) | Spike MathLive+ProseMirror (§11.2) trước khi commit. Bút chỉ build sau §11.1 HUMAN GATE chốt. Chờ architect chốt §11.5 (unified undo + target Tính) trước khi implement. |
| **backend-cas** | §9 (output contract) · §10 (phạm vi toán) · `CLAUDE.md §8.2–8.3` | `is_approx` flag bắt buộc, timeout configurable. Ngữ cảnh biến từ cả trang = cần hiểu scope context. |
| **handwriting** | §4 (đường bút: HTR theo yêu cầu khi Tính) · §5 state machine (INK-CAPTURE → HTR-RECOGNIZING) · §8.2 (pen tools) · `requirements.md §2` (pointer) | **[HUMAN GATE §11.1 + §11.2] trước khi start.** Không còn auto-HTR — HTR chỉ chạy khi Tính. |
| **glue-packaging** | §9 (IPC request/response shape) · `CLAUDE.md §6` (luồng dữ liệu) | |
| **architect** | §2.4 (NodeView trade-off) · §11.3 (collision) · §11.2 (MathLive+ProseMirror spike) · §11.5 (unified undo + target Tính + Convert ca biên) | **Phải chốt §11.5 trước khi editor-frontend implement nút Tính và undo.** |

---

> **Revision log:**
> - `2026-06-11` — Bản stub: 2 đường nhập mô tả sơ, có dòng "Chi tiết từng phần sẽ làm rõ ở chat sau".
> - `2026-06-11` — Bản trung gian (trước task #5): làm rõ sơ UX gõ, UX bút, block model, output contract, phạm vi toán.
> - `2026-06-11` — **Bản đầy đủ (task #5 — team feature-clarify):** Tổng hợp từ type-research + ink-research + phân xử lead. Thêm: nền giấy kẻ ngang · free-placement model · block bounding-box + inkStrokes song song · state machine đầy đủ · UX 4 lớp + contextual tips · bảng parity 3 nhóm · rủi ro đầy đủ (cloud-vs-native iink HUMAN GATE, MathLive+ProseMirror spike).
> - `2026-06-11` — **User-refine §7.5 + §6 + `\`:** Thêm 3 loại nội dung + định dạng theo loại · [LOCKED] cỡ chữ không đổi line-spacing · render liền mạch không khung · phím lệnh cố định `\` (backslash) = bảng ký hiệu, `/` luôn là phép chia.
> - `2026-06-12` — **[USER-CHỐT] Mô hình MỚI "bấm nút để tính" — LẬT auto-eval cũ (team editor-features — synth-planner):**
>   - **Bỏ hoàn toàn auto-eval** (gõ debounce 400ms / bút idle 1.5s + INK-PREVIEW auto-advance). Ghi/gõ thoải mái, app KHÔNG tự nhận diện, KHÔNG tự tính.
>   - **Nút Tính** = 1 hành động làm cả HTR (nếu mực bút) + CAS symbolic. Target = vùng bôi đen (hoặc biểu thức gần con trỏ); ngữ cảnh biến = cả trang.
>   - **Nút Convert** = toggle loại block toán↔chữ (như B/I/U toggle), nằm trên floating toolbar. KHÔNG phải xác nhận ink recognition.
>   - **`\`** = chỉ mở bảng ký hiệu/lệnh LaTeX để chèn — KHÔNG đổi loại block.
>   - **Live render WYSIWYG vẫn có** khi gõ (x^2→x²) — chỉ CAS không chạy khi chưa Tính.
>   - **Lasso "Use as Math/Sketch"** (bút) = parity của Convert (gõ) — cùng ý niệm đổi loại nội dung.
>   - **Paste mặc định = chữ thuần** (Ctrl+V bỏ định dạng nguồn; giữ định dạng = để SAU MVP).
>   - §7.5 viết lại đầy đủ: 3 loại + định dạng theo loại + swatch 8 màu + surface (pen palette + floating toolbar) + bộ tính năng MVP vs SAU + paste plain.
>   - §8 parity cập nhật; §11 thêm câu hỏi mở cho architect (§11.5: unified undo / target Tính / Convert ca biên).
> - `2026-06-12` — **Đính chính 2 nút + hành vi mực bút (team-lead):**
>   - **[Tính] = 1 nút làm cả HTR + CAS nội bộ** — HTR nhận diện ink→LaTeX chạy ngầm, KHÔNG có nút "xác nhận nhận diện" riêng. Gõ dùng cùng nút [Tính] (bỏ qua bước HTR).
>   - **[Convert] = chỉ toggle loại block toán↔chữ** — KHÔNG liên quan đến nhận diện ink. Bút không dùng Convert; bút dùng "Lasso → Use as Math/Sketch" (parity của Convert).
>   - **Mực giữ nguyên visual sau khi Tính**: UI nét vẽ KHÔNG thay đổi — strokes giữ màu `--ink`. Kết quả hiện riêng màu `--result`. HTR chạy ngầm ở tầng data (`latexContent`). Thêm ràng buộc: "KHÔNG thay mực bằng MathLive typeset".
>   - Thêm optional "Xem LaTeX nhận diện" (on-demand, không mặc định) trong floating toolbar sau khi có kết quả.
>   - Bất đối xứng offline gõ↔bút vẫn còn với mô hình bấm-nút (ghi chú lại §11.1).
