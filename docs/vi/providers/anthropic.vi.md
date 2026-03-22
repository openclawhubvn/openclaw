---
summary: "Sử dụng Anthropic Claude qua API key hoặc setup-token trong OpenClaw"
read_when:
  - Muốn dùng mô hình Anthropic trong OpenClaw
  - Muốn dùng setup-token thay vì API key
title: "Anthropic"
---

# Anthropic (Claude)

Anthropic phát triển dòng mô hình **Claude** và cung cấp truy cập qua API. Trong OpenClaw, có thể xác thực bằng API key hoặc **setup-token**.

## Lựa chọn A: Anthropic API key

**Phù hợp nhất cho:** truy cập API tiêu chuẩn và thanh toán dựa trên sử dụng. Tạo API key trong Anthropic Console.

### Thiết lập CLI

```bash
openclaw onboard
# chọn: Anthropic API key

# hoặc không tương tác
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Đoạn cấu hình

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Mặc định tư duy (Claude 4.6)

- Mô hình Anthropic Claude 4.6 mặc định `adaptive` trong OpenClaw khi không đặt mức tư duy cụ thể.
- Có thể ghi đè theo từng tin nhắn (`/think:<level>`) hoặc trong tham số mô hình:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Tài liệu liên quan của Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Chế độ nhanh (Anthropic API)

Chế độ `/fast` của OpenClaw cũng hỗ trợ lưu lượng trực tiếp qua API key của Anthropic.

- `/fast on` ánh xạ tới `service_tier: "auto"`
- `/fast off` ánh xạ tới `service_tier: "standard_only"`
- Cấu hình mặc định:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Giới hạn quan trọng:

- Chỉ dành cho **API-key**. Setup-token / OAuth của Anthropic không hỗ trợ chế độ nhanh của OpenClaw.
- OpenClaw chỉ tiêm tầng dịch vụ của Anthropic cho các yêu cầu trực tiếp `api.anthropic.com`. Nếu định tuyến `anthropic/*` qua proxy hoặc gateway, `/fast` sẽ giữ nguyên `service_tier`.
- Anthropic báo cáo tầng hiệu quả trong phản hồi dưới `usage.service_tier`. Trên tài khoản không có khả năng Priority Tier, `service_tier: "auto"` có thể vẫn giải quyết thành `standard`.

## Bộ nhớ đệm prompt (Anthropic API)

OpenClaw hỗ trợ tính năng bộ nhớ đệm prompt của Anthropic. Chỉ dành cho **API**, xác thực đăng ký không hỗ trợ cài đặt bộ nhớ đệm.

### Cấu hình

Sử dụng tham số `cacheRetention` trong cấu hình mô hình:

| Giá trị | Thời gian lưu trữ | Mô tả                                |
| ------- | ----------------- | ------------------------------------ |
| `none`  | Không lưu trữ     | Tắt bộ nhớ đệm prompt                |
| `short` | 5 phút            | Mặc định cho xác thực API Key        |
| `long`  | 1 giờ             | Bộ nhớ đệm mở rộng (yêu cầu cờ beta) |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Mặc định

Khi sử dụng xác thực API Key của Anthropic, OpenClaw tự động áp dụng `cacheRetention: "short"` (bộ nhớ đệm 5 phút) cho tất cả các mô hình Anthropic. Có thể ghi đè bằng cách đặt `cacheRetention` trong cấu hình.

### Ghi đè cacheRetention theo từng agent

Sử dụng tham số cấp mô hình làm cơ sở, sau đó ghi đè các agent cụ thể qua `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // cơ sở cho hầu hết các agent
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // ghi đè cho agent này
    ],
  },
}
```

Thứ tự hợp nhất cấu hình cho các tham số liên quan đến bộ nhớ đệm:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (khớp `id`, ghi đè theo khóa)

Điều này cho phép một agent giữ bộ nhớ đệm lâu dài trong khi một agent khác trên cùng mô hình tắt bộ nhớ đệm để tránh chi phí ghi trên lưu lượng thấp/tái sử dụng thấp.

### Ghi chú Claude trên Bedrock

- Mô hình Anthropic Claude trên Bedrock (`amazon-bedrock/*anthropic.claude*`) chấp nhận truyền qua `cacheRetention` khi được cấu hình.
- Mô hình Bedrock không phải của Anthropic bị buộc `cacheRetention: "none"` khi chạy.
- Mặc định thông minh của API-key Anthropic cũng thiết lập `cacheRetention: "short"` cho các tham chiếu mô hình Claude-on-Bedrock khi không có giá trị cụ thể.

### Tham số cũ

Tham số `cacheControlTtl` cũ vẫn được hỗ trợ để tương thích ngược:

- `"5m"` ánh xạ tới `short`
- `"1h"` ánh xạ tới `long`

Khuyến nghị chuyển sang tham số `cacheRetention` mới.

OpenClaw bao gồm cờ beta `extended-cache-ttl-2025-04-11` cho các yêu cầu API Anthropic; giữ nó nếu ghi đè tiêu đề nhà cung cấp (xem [/gateway/configuration](/gateway/configuration)).

## Cửa sổ ngữ cảnh 1M (Anthropic beta)

Cửa sổ ngữ cảnh 1M của Anthropic đang trong giai đoạn beta. Trong OpenClaw, kích hoạt nó cho từng mô hình với `params.context1m: true` cho các mô hình Opus/Sonnet được hỗ trợ.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw ánh xạ điều này tới `anthropic-beta: context-1m-2025-08-07` trên các yêu cầu Anthropic.

Chỉ kích hoạt khi `params.context1m` được đặt rõ ràng là `true` cho mô hình đó.

Yêu cầu: Anthropic phải cho phép sử dụng ngữ cảnh dài trên thông tin xác thực đó (thường là thanh toán API key, hoặc tài khoản đăng ký với Extra Usage được bật). Nếu không, Anthropic trả về:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Lưu ý: Hiện tại Anthropic từ chối các yêu cầu beta `context-1m-*` khi sử dụng OAuth/subscription tokens (`sk-ant-oat-*`). OpenClaw tự động bỏ qua tiêu đề beta context1m cho xác thực OAuth và giữ các beta OAuth cần thiết.

## Lựa chọn B: Claude setup-token

**Phù hợp nhất cho:** sử dụng đăng ký Claude.

### Nơi lấy setup-token

Setup-token được tạo bởi **Claude Code CLI**, không phải Anthropic Console. Có thể chạy trên **bất kỳ máy nào**:

```bash
claude setup-token
```

Dán token vào OpenClaw (trình hướng dẫn: **Anthropic token (paste setup-token)**), hoặc chạy trên máy chủ gateway:

```bash
openclaw models auth setup-token --provider anthropic
```

Nếu tạo token trên máy khác, dán nó:

```bash
openclaw models auth paste-token --provider anthropic
```

### Thiết lập CLI (setup-token)

```bash
# Dán setup-token trong quá trình thiết lập
openclaw onboard --auth-choice setup-token
```

### Đoạn cấu hình (setup-token)

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Ghi chú

- Tạo setup-token với `claude setup-token` và dán nó, hoặc chạy `openclaw models auth setup-token` trên máy chủ gateway.
- Nếu thấy “OAuth token refresh failed …” trên đăng ký Claude, xác thực lại với setup-token. Xem [/gateway/troubleshooting](/gateway/troubleshooting).
- Chi tiết xác thực + quy tắc tái sử dụng có trong [/concepts/oauth](/concepts/oauth).

## Khắc phục sự cố

**Lỗi 401 / token đột ngột không hợp lệ**

- Xác thực đăng ký Claude có thể hết hạn hoặc bị thu hồi. Chạy lại `claude setup-token`
  và dán nó vào **máy chủ gateway**.
- Nếu đăng nhập Claude CLI nằm trên máy khác, sử dụng
  `openclaw models auth paste-token --provider anthropic` trên máy chủ gateway.

**Không tìm thấy API key cho nhà cung cấp "anthropic"**

- Xác thực là **theo từng agent**. Agent mới không thừa hưởng key của agent chính.
- Chạy lại onboarding cho agent đó, hoặc dán setup-token / API key trên
  máy chủ gateway, sau đó xác minh với `openclaw models status`.

**Không tìm thấy thông tin xác thực cho profile `anthropic:default`**

- Chạy `openclaw models status` để xem profile xác thực nào đang hoạt động.
- Chạy lại onboarding, hoặc dán setup-token / API key cho profile đó.

**Không có profile xác thực khả dụng (tất cả trong cooldown/không khả dụng)**

- Kiểm tra `openclaw models status --json` cho `auth.unusableProfiles`.
- Thêm profile Anthropic khác hoặc chờ cooldown.

Thêm: [/gateway/troubleshooting](/gateway/troubleshooting) và [/help/faq](/help/faq).\n