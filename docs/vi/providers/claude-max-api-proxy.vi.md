---
summary: "Proxy cộng đồng để expose thông tin đăng ký Claude dưới dạng endpoint tương thích OpenAI"
read_when:
  - Muốn dùng Claude Max với các công cụ tương thích OpenAI
  - Cần server API local gói Claude Code CLI
  - Muốn so sánh truy cập dựa trên đăng ký và API-key của Anthropic
title: "Claude Max API Proxy"
---

# Claude Max API Proxy

**claude-max-api-proxy** là công cụ cộng đồng giúp expose đăng ký Claude Max/Pro dưới dạng API endpoint tương thích OpenAI. Cho phép dùng đăng ký với bất kỳ công cụ nào hỗ trợ định dạng API OpenAI.

<Warning>
Đây chỉ là tương thích kỹ thuật. Anthropic từng chặn một số sử dụng đăng ký ngoài Claude Code. Cần tự quyết định và kiểm tra điều khoản hiện tại của Anthropic trước khi dùng.
</Warning>

## Tại Sao Nên Dùng?

| Cách Tiếp Cận          | Chi Phí                                           | Phù Hợp Nhất Cho                         |
| ---------------------- | ------------------------------------------------- | ---------------------------------------- |
| Anthropic API          | Trả theo token (~$15/M input, $75/M output Opus)  | Ứng dụng sản xuất, khối lượng lớn        |
| Đăng ký Claude Max     | $200/tháng cố định                                | Sử dụng cá nhân, phát triển, không giới hạn |

Nếu có đăng ký Claude Max và muốn dùng với công cụ tương thích OpenAI, proxy này có thể giảm chi phí cho một số workflow. API keys vẫn là lựa chọn rõ ràng hơn cho sản xuất.

## Cách Hoạt Động

```
Ứng dụng → claude-max-api-proxy → Claude Code CLI → Anthropic (qua đăng ký)
     (định dạng OpenAI)              (chuyển định dạng)      (dùng login của bạn)
```

Proxy:

1. Nhận request định dạng OpenAI tại `http://localhost:3456/v1/chat/completions`
2. Chuyển thành lệnh Claude Code CLI
3. Trả về response định dạng OpenAI (hỗ trợ streaming)

## Cài Đặt

```bash
# Yêu cầu Node.js 20+ và Claude Code CLI
npm install -g claude-max-api-proxy

# Xác nhận Claude CLI đã xác thực
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

# Liệt kê models
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Với OpenClaw

Có thể trỏ OpenClaw vào proxy như một endpoint tùy chỉnh tương thích OpenAI:

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

## Các Model Có Sẵn

| Model ID          | Tương Ứng Với    |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Tự Động Khởi Động trên macOS

Tạo LaunchAgent để chạy proxy tự động:

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
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Ghi Chú

- Đây là **công cụ cộng đồng**, không được hỗ trợ chính thức bởi Anthropic hay OpenClaw
- Yêu cầu đăng ký Claude Max/Pro hoạt động với Claude Code CLI đã xác thực
- Proxy chạy local và không gửi dữ liệu đến server bên thứ ba
- Hỗ trợ đầy đủ streaming responses

## Xem Thêm

- [Anthropic provider](/providers/anthropic) - Tích hợp OpenClaw gốc với Claude setup-token hoặc API keys
- [OpenAI provider](/providers/openai) - Cho đăng ký OpenAI/Codex\n