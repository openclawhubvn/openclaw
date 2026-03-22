---
summary: "Proxy cộng đồng để sử dụng thông tin đăng ký Claude như một endpoint tương thích OpenAI"
read_when:
  - Bạn muốn sử dụng gói Claude Max với các công cụ tương thích OpenAI
  - Bạn cần một server API cục bộ để bao bọc Claude Code CLI
  - Bạn muốn so sánh giữa truy cập dựa trên đăng ký và API-key của Anthropic
title: "Claude Max API Proxy"
---

# Claude Max API Proxy

**claude-max-api-proxy** là một công cụ cộng đồng giúp bạn sử dụng gói đăng ký Claude Max/Pro như một endpoint API tương thích với OpenAI. Điều này cho phép bạn sử dụng gói đăng ký với bất kỳ công cụ nào hỗ trợ định dạng API của OpenAI.

<Warning>
Đây chỉ là tương thích kỹ thuật. Anthropic đã từng chặn một số cách sử dụng đăng ký ngoài Claude Code. Bạn cần tự quyết định có sử dụng hay không và kiểm tra điều khoản hiện tại của Anthropic trước khi phụ thuộc vào nó.
</Warning>

## Tại Sao Nên Sử Dụng?

| Phương pháp             | Chi phí                                             | Phù hợp nhất cho                             |
| ----------------------- | --------------------------------------------------- | -------------------------------------------- |
| Anthropic API           | Trả theo token (~$15/M input, $75/M output cho Opus) | Ứng dụng sản xuất, khối lượng lớn            |
| Đăng ký Claude Max      | $200/tháng cố định                                  | Sử dụng cá nhân, phát triển, không giới hạn  |

Nếu bạn có gói đăng ký Claude Max và muốn sử dụng với các công cụ tương thích OpenAI, proxy này có thể giảm chi phí cho một số quy trình. API keys vẫn là lựa chọn rõ ràng hơn cho việc sử dụng sản xuất.

## Cách Hoạt Động

```
Ứng dụng của bạn → claude-max-api-proxy → Claude Code CLI → Anthropic (qua đăng ký)
     (định dạng OpenAI)              (chuyển đổi định dạng)      (sử dụng đăng nhập của bạn)
```

Proxy này:

1. Nhận yêu cầu định dạng OpenAI tại `http://localhost:3456/v1/chat/completions`
2. Chuyển đổi chúng thành lệnh Claude Code CLI
3. Trả về phản hồi theo định dạng OpenAI (hỗ trợ streaming)

## Cài Đặt

```bash
# Yêu cầu Node.js 20+ và Claude Code CLI
npm install -g claude-max-api-proxy

# Xác minh Claude CLI đã được xác thực
claude --version
```

## Sử Dụng

### Khởi động server

```bash
claude-max-api
# Server chạy tại http://localhost:3456
```

### Kiểm tra

```bash
# Kiểm tra sức khỏe
curl http://localhost:3456/health

# Liệt kê các mô hình
curl http://localhost:3456/v1/models

# Hoàn thành cuộc trò chuyện
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Với OpenClaw

Bạn có thể chỉ định OpenClaw sử dụng proxy như một endpoint tương thích OpenAI tùy chỉnh:

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

## Các Mô Hình Có Sẵn

| ID Mô Hình        | Tương ứng với     |
| ----------------- | ----------------- |
| `claude-opus-4`   | Claude Opus 4     |
| `claude-sonnet-4` | Claude Sonnet 4   |
| `claude-haiku-4`  | Claude Haiku 4    |

## Tự Động Khởi Động trên macOS

Tạo một LaunchAgent để chạy proxy tự động:

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Liên Kết

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Vấn đề:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Ghi Chú

- Đây là một **công cụ cộng đồng**, không được hỗ trợ chính thức bởi Anthropic hay OpenClaw
- Yêu cầu gói đăng ký Claude Max/Pro đang hoạt động với Claude Code CLI đã xác thực
- Proxy chạy cục bộ và không gửi dữ liệu đến bất kỳ server bên thứ ba nào
- Hỗ trợ đầy đủ phản hồi streaming

## Xem Thêm

- [Nhà cung cấp Anthropic](/providers/anthropic) - Tích hợp OpenClaw gốc với Claude setup-token hoặc API keys
- [Nhà cung cấp OpenAI](/providers/openai) - Cho các gói đăng ký OpenAI/Codex
