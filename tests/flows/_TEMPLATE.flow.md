---
slug: <feature-slug>
title: <Tên tính năng/màn được test>
status: draft        # draft | ready | executed
owner: tester
created: YYYY-MM-DD
last_run: null       # YYYY-MM-DD khi đã executed
---

# Flow test — <Tên tính năng>

## 1. Phạm vi & khi nào chạy (trigger)

- **Test cái gì:** <1–2 câu mô tả tính năng/luồng cần kiểm>
- **Route/màn:** <URL hoặc màn cụ thể trong app, vd `/` canvas, SettingsOverlay → AccountSection>
- **Khi nào chạy flow này:** <điều kiện kích hoạt — vd "sau khi editor-frontend hoàn tất block X", "trước release", "khi đụng sync">
- **Tiền điều kiện:** <state cần có trước khi chạy — vd đã đăng nhập, dev server :1420 đang chạy, có ≥1 block>

## 2. Liệt kê trường hợp (đủ các case có thể xảy ra)

> Mỗi case = 1 dòng. Phủ đủ 6 nhóm + 3 yêu cầu nền [LOCKED] (`docs/requirements.md`). Bỏ nhóm KHÔNG áp dụng nhưng phải ghi rõ "N/A — lý do".

| # | Nhóm | Case | Input/điều kiện | Kết quả kỳ vọng |
|---|---|---|---|---|
| 1 | Happy path | <luồng chính thành công> | | |
| 2 | Edge | <giá trị biên / rỗng / rất lớn> | | |
| 3 | Error | <input sai / mạng lỗi / server fail> | | |
| 4 | Boundary | <giới hạn: max length, 0, âm…> | | |
| 5 | Empty/初 | <trạng thái rỗng / lần đầu> | | |
| 6 | Concurrent/state | <thao tác chồng / reload giữ state> | | |
| 7 | **i18n** [LOCKED] | chuỗi hiển thị đúng cả `en` và `vi`, không hardcode | đổi `lang` | key i18n render đúng 2 ngôn ngữ |
| 8 | **Theme** [LOCKED] | light / dark / system | đổi theme | màu từ token, không vỡ, không hex rời lộ ra |
| 9 | **Thiết bị** [LOCKED] | ≥1024px landscape; 3 input (chuột+phím / cảm ứng / bút nếu áp dụng) | resize ≥1024 | layout không vỡ |

## 3. Các bước thao tác (browser)

> Thực thi bằng skill `browser-test` (Chrome foreground). Đánh số, mỗi bước 1 hành động + quan sát.

1. <navigate tới route> → quan sát <gì>
2. <computer: click/type ...> → quan sát <gì>
3. <read_console_messages: kỳ vọng 0 error>
4. ...

## 4. Kết quả kỳ vọng & evidence

- **PASS khi:** <điều kiện đo được — không cảm tính>
- **Evidence thu:** screenshot/GIF → `tests/flows/evidence/<slug>/`, console log (0 error), network nếu liên quan.

## 5. Kết quả chạy (điền khi executed)

| Case # | Kết quả | Evidence | Ghi chú |
|---|---|---|---|
| 1 | PASS/FAIL | <path> | |

**Verdict:** <PASS toàn bộ / FAIL tại case # — triệu chứng>
