---
summary: "Cách OpenClaw xoay vòng hồ sơ xác thực và chuyển đổi dự phòng giữa các mô hình"
read_when:
  - Chẩn đoán xoay vòng hồ sơ xác thực, thời gian chờ, hoặc hành vi chuyển đổi dự phòng mô hình
  - Cập nhật quy tắc chuyển đổi dự phòng cho hồ sơ xác thực hoặc mô hình
title: "Chuyển đổi dự phòng mô hình"
---

# Chuyển đổi dự phòng mô hình

OpenClaw xử lý lỗi qua hai giai đoạn:

1. **Xoay vòng hồ sơ xác thực** trong nhà cung cấp hiện tại.
2. **Chuyển đổi dự phòng mô hình** sang mô hình tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích các quy tắc thời gian chạy và dữ liệu hỗ trợ chúng.

## Lưu trữ xác thực (khóa + OAuth)

OpenClaw sử dụng **hồ sơ xác thực** cho cả khóa API và token OAuth.

- Bí mật được lưu trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (cũ: `~/.openclaw/agent/auth-profiles.json`).
- Cấu hình `auth.profiles` / `auth.order` chỉ là **metadata + định tuyến** (không có bí mật).
- File OAuth chỉ nhập cũ: `~/.openclaw/credentials/oauth.json` (được nhập vào `auth-profiles.json` khi sử dụng lần đầu).

Chi tiết thêm: [/concepts/oauth](/concepts/oauth)

Các loại thông tin xác thực:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` cho một số nhà cung cấp)

## ID hồ sơ

Đăng nhập OAuth tạo ra các hồ sơ riêng biệt để nhiều tài khoản có thể cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth với email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Hồ sơ được lưu trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dưới `profiles`.

## Thứ tự xoay vòng

Khi một nhà cung cấp có nhiều hồ sơ, OpenClaw chọn thứ tự như sau:

1. **Cấu hình rõ ràng**: `auth.order[provider]` (nếu có).
2. **Hồ sơ đã cấu hình**: `auth.profiles` được lọc theo nhà cung cấp.
3. **Hồ sơ đã lưu**: các mục trong `auth-profiles.json` cho nhà cung cấp.

Nếu không có thứ tự rõ ràng, OpenClaw sử dụng thứ tự vòng tròn:

- **Khóa chính:** loại hồ sơ (**OAuth trước khóa API**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong mỗi loại).
- **Hồ sơ trong thời gian chờ/đã vô hiệu hóa** được chuyển đến cuối, sắp xếp theo thời gian hết hạn sớm nhất.

### Tính dính của phiên (thân thiện với bộ nhớ đệm)

OpenClaw **ghim hồ sơ xác thực đã chọn cho mỗi phiên** để giữ cho bộ nhớ đệm của nhà cung cấp luôn sẵn sàng.
Nó **không** xoay vòng trên mỗi yêu cầu. Hồ sơ được ghim được sử dụng lại cho đến khi:

- phiên được đặt lại (`/new` / `/reset`)
- một lần nén hoàn tất (số lần nén tăng lên)
- hồ sơ đang trong thời gian chờ/đã vô hiệu hóa

Lựa chọn thủ công qua `/model …@<profileId>` thiết lập một **ghi đè người dùng** cho phiên đó
và không tự động xoay vòng cho đến khi một phiên mới bắt đầu.

Hồ sơ tự động ghim (được chọn bởi bộ định tuyến phiên) được coi là một **ưu tiên**:
chúng được thử trước, nhưng OpenClaw có thể xoay vòng sang hồ sơ khác khi gặp giới hạn tốc độ/thời gian chờ.
Hồ sơ được người dùng ghim vẫn giữ nguyên; nếu nó thất bại và các chuyển đổi dự phòng mô hình
được cấu hình, OpenClaw chuyển sang mô hình tiếp theo thay vì chuyển đổi hồ sơ.

### Tại sao OAuth có thể "trông như bị mất"

Nếu bạn có cả hồ sơ OAuth và hồ sơ khóa API cho cùng một nhà cung cấp, vòng tròn có thể chuyển đổi giữa chúng qua các tin nhắn trừ khi được ghim. Để buộc sử dụng một hồ sơ duy nhất:

- Ghim với `auth.order[provider] = ["provider:profileId"]`, hoặc
- Sử dụng ghi đè theo phiên qua `/model …` với ghi đè hồ sơ (khi được hỗ trợ bởi giao diện người dùng/bề mặt chat của bạn).

## Thời gian chờ

Khi một hồ sơ thất bại do lỗi xác thực/giới hạn tốc độ (hoặc thời gian chờ trông giống như giới hạn tốc độ), OpenClaw đánh dấu nó trong thời gian chờ và chuyển sang hồ sơ tiếp theo.
Lỗi định dạng/yêu cầu không hợp lệ (ví dụ lỗi xác thực ID cuộc gọi công cụ Cloud Code Assist) được coi là đủ điều kiện chuyển đổi dự phòng và sử dụng cùng thời gian chờ.
Các lỗi lý do dừng tương thích với OpenAI như `Unhandled stop reason: error`, `stop reason: error`, và `reason: error` được phân loại là tín hiệu thời gian chờ/chuyển đổi dự phòng.

Thời gian chờ sử dụng backoff lũy thừa:

- 1 phút
- 5 phút
- 25 phút
- 1 giờ (giới hạn)

Trạng thái được lưu trong `auth-profiles.json` dưới `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Vô hiệu hóa thanh toán

Các lỗi thanh toán/tín dụng (ví dụ “không đủ tín dụng” / “số dư tín dụng quá thấp”) được coi là đủ điều kiện chuyển đổi dự phòng, nhưng thường không phải là tạm thời. Thay vì thời gian chờ ngắn, OpenClaw đánh dấu hồ sơ là **đã vô hiệu hóa** (với backoff dài hơn) và xoay vòng sang hồ sơ/nhà cung cấp tiếp theo.

Trạng thái được lưu trong `auth-profiles.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Mặc định:

- Backoff thanh toán bắt đầu từ **5 giờ**, tăng gấp đôi mỗi lần thất bại thanh toán, và giới hạn ở **24 giờ**.
- Bộ đếm backoff được đặt lại nếu hồ sơ không thất bại trong **24 giờ** (có thể cấu hình).

## Chuyển đổi dự phòng mô hình

Nếu tất cả các hồ sơ cho một nhà cung cấp đều thất bại, OpenClaw chuyển sang mô hình tiếp theo trong
`agents.defaults.model.fallbacks`. Điều này áp dụng cho các lỗi xác thực, giới hạn tốc độ, và
thời gian chờ đã làm cạn kiệt xoay vòng hồ sơ (các lỗi khác không tiến tới chuyển đổi dự phòng).

Khi một lần chạy bắt đầu với ghi đè mô hình (hooks hoặc CLI), các chuyển đổi dự phòng vẫn kết thúc tại
`agents.defaults.model.primary` sau khi thử bất kỳ chuyển đổi dự phòng nào đã cấu hình.

## Cấu hình liên quan

Xem [Cấu hình Gateway](/gateway/configuration) cho:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` định tuyến

Xem [Mô hình](/concepts/models) để có cái nhìn tổng quan rộng hơn về lựa chọn và chuyển đổi dự phòng mô hình.
