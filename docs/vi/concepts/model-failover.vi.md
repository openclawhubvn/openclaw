---
summary: "Cách OpenClaw xoay vòng auth profile và fallback giữa các model"
read_when:
  - Chẩn đoán xoay vòng auth profile, cooldown, hoặc hành vi fallback model
  - Cập nhật quy tắc failover cho auth profile hoặc model
title: "Model Failover"
---

# Model failover

OpenClaw xử lý lỗi qua hai giai đoạn:

1. **Xoay vòng auth profile** trong provider hiện tại.
2. **Fallback model** sang model tiếp theo trong `agents.defaults.model.fallbacks`.

Tài liệu này giải thích quy tắc runtime và dữ liệu hỗ trợ.

## Lưu trữ Auth (keys + OAuth)

OpenClaw dùng **auth profiles** cho cả API keys và OAuth tokens.

- Secrets nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`).
- Config `auth.profiles` / `auth.order` chỉ là **metadata + routing** (không chứa secrets).
- File OAuth legacy chỉ để import: `~/.openclaw/credentials/oauth.json` (import vào `auth-profiles.json` khi dùng lần đầu).

Chi tiết thêm: [/concepts/oauth](/concepts/oauth)

Các loại credential:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` cho một số provider)

## Profile IDs

OAuth logins tạo profile riêng biệt để nhiều tài khoản cùng tồn tại.

- Mặc định: `provider:default` khi không có email.
- OAuth với email: `provider:<email>` (ví dụ `google-antigravity:user@gmail.com`).

Profiles nằm trong `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dưới `profiles`.

## Thứ tự xoay vòng

Khi một provider có nhiều profile, OpenClaw chọn thứ tự như sau:

1. **Config rõ ràng**: `auth.order[provider]` (nếu có).
2. **Profile đã cấu hình**: `auth.profiles` lọc theo provider.
3. **Profile đã lưu**: entries trong `auth-profiles.json` cho provider.

Nếu không có thứ tự rõ ràng, OpenClaw dùng thứ tự round-robin:

- **Khóa chính:** loại profile (**OAuth trước API keys**).
- **Khóa phụ:** `usageStats.lastUsed` (cũ nhất trước, trong mỗi loại).
- **Profile cooldown/disabled** được chuyển xuống cuối, sắp xếp theo thời gian hết hạn sớm nhất.

### Session stickiness (cache-friendly)

OpenClaw **ghim auth profile đã chọn cho mỗi session** để giữ cache của provider. Không xoay vòng mỗi request. Profile ghim được dùng lại cho đến khi:

- session được reset (`/new` / `/reset`)
- hoàn tất compaction (tăng compaction count)
- profile đang cooldown/disabled

Chọn thủ công qua `/model …@<profileId>` thiết lập **user override** cho session đó và không tự xoay vòng cho đến khi bắt đầu session mới.

Profile tự động ghim (chọn bởi session router) được coi là **ưu tiên**: thử trước, nhưng OpenClaw có thể xoay sang profile khác khi gặp rate limits/timeouts. Profile ghim bởi user giữ nguyên; nếu thất bại và có cấu hình model fallbacks, OpenClaw chuyển sang model tiếp theo thay vì đổi profile.

### Tại sao OAuth có thể "mất dấu"

Nếu có cả OAuth profile và API key profile cho cùng provider, round-robin có thể chuyển đổi giữa chúng trừ khi ghim. Để ép dùng một profile:

- Ghim với `auth.order[provider] = ["provider:profileId"]`, hoặc
- Dùng override per-session qua `/model …` với profile override (khi UI/chat surface hỗ trợ).

## Cooldowns

Khi profile thất bại do lỗi auth/rate-limit (hoặc timeout giống rate limiting), OpenClaw đánh dấu cooldown và chuyển sang profile tiếp theo. Lỗi format/invalid-request (ví dụ lỗi xác thực ID của Cloud Code Assist tool) được coi là failover-worthy và dùng cùng cooldowns. Lỗi stop-reason tương thích OpenAI như `Unhandled stop reason: error`, `stop reason: error`, và `reason: error` được phân loại là tín hiệu timeout/failover.

Cooldowns dùng exponential backoff:

- 1 phút
- 5 phút
- 25 phút
- 1 giờ (giới hạn)

Trạng thái lưu trong `auth-profiles.json` dưới `usageStats`:

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

## Billing disables

Lỗi billing/credit (ví dụ “insufficient credits” / “credit balance too low”) được coi là failover-worthy, nhưng thường không phải tạm thời. Thay vì cooldown ngắn, OpenClaw đánh dấu profile là **disabled** (với backoff dài hơn) và xoay sang profile/provider tiếp theo.

Trạng thái lưu trong `auth-profiles.json`:

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

- Billing backoff bắt đầu từ **5 giờ**, tăng gấp đôi mỗi lần lỗi billing, và giới hạn ở **24 giờ**.
- Counters backoff reset nếu profile không lỗi trong **24 giờ** (có thể cấu hình).

## Model fallback

Nếu tất cả profile cho một provider thất bại, OpenClaw chuyển sang model tiếp theo trong `agents.defaults.model.fallbacks`. Áp dụng cho lỗi auth, rate limits, và timeouts đã xoay hết profile (các lỗi khác không kích hoạt fallback).

Khi chạy bắt đầu với model override (hooks hoặc CLI), fallbacks vẫn kết thúc ở `agents.defaults.model.primary` sau khi thử các fallbacks đã cấu hình.

## Cấu hình liên quan

Xem [Gateway configuration](/gateway/configuration) cho:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Xem [Models](/concepts/models) để có cái nhìn tổng quan về lựa chọn và fallback model.\n