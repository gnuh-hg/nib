---
name: latex-sympy-pipeline
description: "Pipeline LaTeX→SymPy cho backend-cas (note-ch): latex2sympy2 + dọn input, ≥5 fixture mẫu, timeout config + numeric fallback khi SymPy treo, giữ exact không làm tròn. Điểm dễ vỡ — parse LaTeX là lossy (§8.2)."
---

# latex-sympy-pipeline — parse LaTeX → SymPy chắc tay

> Skill riêng cho **`backend-cas`**. Mục đích: biến LaTeX (từ MathLive đường gõ HOẶC MyScript đường bút) thành SymPy expr tính được, trả LaTeX kết quả **chính xác** — và **không bao giờ treo** server.
> Đây là **điểm dễ vỡ nhất của backend** (CLAUDE.md §8.2: "LaTeX → SymPy là lossy"). Pipeline phải có bước dọn dẹp + timeout + numeric fallback (§8.3).

---

## 0. Nguyên tắc bất biến

1. **Exact mặc định.** `1/3` ra `1/3`, `sqrt(2)` giữ `√2` — KHÔNG ép float. Chỉ trả thập phân khi user bật toggle decimal (CLAUDE.md §4.2). Dùng `sympy.Rational`, `sympy.nsimplify`, KHÔNG `float()` ngầm.
2. **Không bao giờ treo.** Mọi lời gọi SymPy nặng (`integrate`, `solve`, `summation`, `limit`, `series`) bọc trong **timeout**. Hết giờ → **numeric fallback** (đánh dấu kết quả là gần đúng), KHÔNG để request đứng.
3. **Parse là lossy — phải dọn.** LaTeX của MathLive/MyScript không map 1-1 sang SymPy. Luôn chạy bước **normalize** trước `latex2sympy`.
4. **Fail rõ ràng.** Parse được nhưng không tính được → trả thông điệp có cấu trúc (`{ok: false, reason}`), KHÔNG nuốt lỗi thành kết quả sai.

---

## 1. Kiến trúc pipeline

```
LaTeX (MathLive | MyScript)
   │
   ▼  (1) normalize: dọn ký hiệu lossy
LaTeX sạch
   │
   ▼  (2) latex2sympy2 → SymPy expr/Eq
SymPy object
   │
   ▼  (3) dispatch theo loại: eval / diff / integrate / Sum / Product / solve / limit / series
   │       (mỗi cái bọc timeout)
   │
   ├── thành công ──► (4) exact result ──► sympy.latex() ──► LaTeX kết quả
   │
   └── timeout/không giải được ──► (5) numeric fallback (evalf / nsolve / nintegrate)
                                          └─► LaTeX kết quả (đánh dấu ≈ numeric)
```

- **(1) normalize** và **(5) fallback** là 2 chỗ hay quên — chúng là lý do skill này tồn tại.

---

## 2. Bước (1) — normalize LaTeX (chống lossy)

Trước khi đưa vào `latex2sympy`, dọn các pattern hay vỡ:

| LaTeX vào | Vấn đề | Dọn thành |
|---|---|---|
| `\left( ... \right)` | latex2sympy đôi khi vướng `\left/\right` | bỏ `\left`/`\right`, giữ `(`/`)` |
| `e^x`, `\pi` | hằng số toán | map `e`→`E`, `\pi`→`pi` (hằng SymPy) |
| `\,` `\;` `\!` (spacing) | ký hiệu khoảng trắng vô nghĩa | xóa |
| dấu nhân ẩn `2x`, `x(x+1)` | SymPy cần `*` tường minh ở vài chỗ | latex2sympy2 xử phần lớn; kiểm fixture |
| `\frac{d}{dx}` | đạo hàm — cú pháp riêng | nhận diện → `diff(expr, x)` (không để latex2sympy hiểu nhầm là phân số) |
| `\int ... dx` / `\int_a^b` | tích phân bất định/xác định | tách cận → `integrate(expr, x)` hoặc `integrate(expr,(x,a,b))` |
| `\sum_{i=1}^{n}` / `\prod` | tổng/tích chạy | → `Sum(expr,(i,1,n)).doit()` / `Product(...)` |

> Nguyên tắc: phần **operator bậc cao** (d/dx, ∫, Σ, Π, lim) **nhận diện bằng regex/tiền-xử lý của bạn** rồi gọi đúng hàm SymPy — KHÔNG phó mặc latex2sympy đoán. Phần biểu thức đại số bên trong mới đẩy qua latex2sympy.

---

## 3. ≥5 fixture mẫu (bắt buộc có trong test)

Đây là bộ tối thiểu — mọi thay đổi pipeline phải chạy qua và pass:

| # | LaTeX in | Loại | SymPy kỳ vọng | LaTeX kết quả kỳ vọng |
|---|---|---|---|---|
| 1 | `x^2` | parse cơ bản | `x**2` | `x^{2}` |
| 2 | `\int x \, dx` | tích phân bất định | `integrate(x, x)` = `x**2/2` | `\frac{x^{2}}{2}` |
| 3 | `\frac{d}{dx} x^2` | đạo hàm | `diff(x**2, x)` = `2*x` | `2 x` |
| 4 | `\sum_{i=1}^{n} i` | tổng chạy | `Sum(i,(i,1,n)).doit()` = `n*(n+1)/2` | `\frac{n(n+1)}{2}` |
| 5 | `x^2 + x - 2 = 0` | giải phương trình | `solve(Eq(x**2+x-2,0), x)` = `[-2, 1]` | `\{-2, 1\}` |
| 6 | `\frac{1}{3} + \frac{1}{6}` | exact không làm tròn | `Rational(1,3)+Rational(1,6)` = `1/2` | `\frac{1}{2}` (KHÔNG `0.5`) |
| 7 | `\lim_{x \to 0} \frac{\sin x}{x}` | giới hạn | `limit(sin(x)/x, x, 0)` = `1` | `1` |

Fixture #6 là **chốt exact** — nếu ra `0.5` hoặc `0.333…` là pipeline sai (ép float). Fixture #2,#3,#4 chứng minh "ra hàm số" chứ không phải số gần đúng (CLAUDE.md §4.2).

Lưu fixture dạng bảng `(latex_in, expected_sympy_srepr_or_latex)` để `pytest` so khớp tự động.

---

## 4. Bước (3)+(4) — dispatch + timeout

- Bọc mọi phép nặng bằng timeout. Trên Linux dùng `signal.SIGALRM` hoặc chạy SymPy trong subprocess/thread có deadline; cấu hình `EVAL_TIMEOUT` (vd 5s) tập trung một chỗ.
- `solve` có thể trả nghiệm phức/điều kiện → giữ dạng đóng (CLAUDE.md §4.2 "nghiệm dạng đóng"). KHÔNG cắt nghiệm phức trừ khi brief yêu cầu real-only.
- `Sum`/`Product` để **symbolic** nếu không rút gọn được; gọi `.doit()` để thử thay biến chạy rút gọn (§4.2).

## 5. Bước (5) — numeric fallback (chống treo §8.3)

Khi timeout HOẶC SymPy trả `Integral(...)`/`Sum(...)` chưa giải (không đóng được):

| Phép | Fallback numeric |
|---|---|
| `integrate` không đóng | `Integral(expr,(x,a,b)).evalf()` (cần cận) hoặc `scipy`/`mpmath` quad |
| `solve` không đóng | `nsolve(expr, x, guess)` quanh vài điểm khởi đầu |
| `summation` vô hạn chậm | `Sum(...).evalf()` |
| eval biểu thức số | `expr.evalf(n)` |

- Kết quả fallback **PHẢI đánh dấu** là gần đúng (vd field `exact: false` hoặc tiền tố `\approx`), để UI hiển thị đúng bản chất — không lừa user rằng đó là exact.
- Fallback vẫn hết giờ → trả `{ok:false, reason:"timeout"}`, KHÔNG treo.

---

## 6. §11.3 — LLM fallback (OPTION, chưa chốt — đừng tự thêm)

CLAUDE.md §11.3 (câu hỏi mở): có làm **lớp AI** (LLM parse input bừa + giải thích từng bước) ngay từ MVP hay để sau — **chưa quyết, cần user chốt**.

- Vị trí cắm: khi normalize+latex2sympy **fail parse** (input mơ hồ/ẩu), có thể gọi LLM để chuẩn hóa LaTeX → thử parse lại. Đây là **fallback parse**, không phải đường chính.
- **KHÔNG tự thêm LLM call vào MVP.** Để hook/placeholder rõ ràng (`# TODO §11.3: LLM normalize fallback — chờ user chốt`). Khi user chốt → mới implement.
- Khi dùng LLM cho toán/parse: dùng model Claude mới nhất (vd Opus 4.8 `claude-opus-4-8`). Nhưng **chỉ sau khi §11.3 được chốt**.

---

## 7. Quick reference

```
PIPELINE: LaTeX → normalize → latex2sympy2 → dispatch(timeout) → exact LaTeX
          └ fail/timeout → numeric fallback (đánh dấu ≈) → KHÔNG bao giờ treo
EXACT mặc định: Rational/sqrt giữ nguyên. float CHỈ khi toggle decimal.
Operator bậc cao (d/dx, ∫, Σ, Π, lim): TỰ nhận diện rồi gọi hàm SymPy đúng — không phó mặc latex2sympy.
FIXTURE tối thiểu 7 (x^2, ∫x dx, d/dx x², Σi, x²+x-2=0, 1/3+1/6 exact, lim sinx/x).
TIMEOUT tập trung 1 chỗ (EVAL_TIMEOUT). Fallback đánh dấu exact:false.
§11.3 LLM fallback = OPTION, chưa chốt — để TODO, KHÔNG tự thêm.
```

## 8. Ranh giới — KHÔNG làm

| Không làm | Lý do |
|---|---|
| Ép `float()` kết quả exact | Phá tính năng cốt lõi §4.2 (chính xác không làm tròn) |
| Bỏ timeout cho `integrate`/`solve` | SymPy treo cả server (§8.3) |
| Trả numeric mà không đánh dấu ≈ | Lừa user là exact |
| Tự thêm LLM call khi §11.3 chưa chốt | Câu hỏi mở §11 — không tự quyết |
| Phó mặc latex2sympy đoán d/dx, ∫, Σ | Lossy — sai im lặng; tự nhận diện operator |
