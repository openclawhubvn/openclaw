---
summary: "CLI backends: fallback text-only qua local AI CLI"
read_when:
  - Cần fallback khi API providers gặp sự cố
  - Đang chạy Claude Code CLI hoặc AI CLI local khác và muốn tái sử dụng
  - Cần đường dẫn text-only, không cần tool nhưng vẫn hỗ trợ session và hình ảnh
title: "CLI Backends"
---

# CLI backends (fallback runtime)

OpenClaw có thể chạy **AI CLI local** như một **fallback text-only** khi API providers bị lỗi, bị giới hạn hoặc hoạt động không ổn định. Đây là phương án bảo thủ:

- **Tắt công cụ** (không gọi tool).
- **Text vào → text ra** (đáng tin cậy).
- **Hỗ trợ session** (đảm bảo các lượt tiếp theo nhất quán).
- **Hình ảnh có thể truyền qua** nếu CLI chấp nhận đường dẫn hình ảnh.

Thiết kế này như một **lưới an toàn** hơn là phương án chính. Dùng khi cần phản hồi text "luôn hoạt động" mà không phụ thuộc vào API bên ngoài.

## Bắt đầu nhanh cho người mới

Có thể dùng Claude Code CLI **mà không cần cấu hình** (OpenClaw có sẵn mặc định):

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI cũng hoạt động ngay:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Nếu gateway chạy dưới launchd/systemd và PATH tối giản, chỉ cần thêm đường dẫn lệnh:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Xong. Không cần key, không cần cấu hình auth ngoài CLI.

## Dùng như fallback

Thêm CLI backend vào danh sách fallback để chỉ chạy khi model chính thất bại:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/opus-4.6", "claude-cli/opus-4.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/opus-4.6": {},
        "claude-cli/opus-4.5": {},
      },
    },
  },
}
```

Lưu ý:

- Nếu dùng `agents.defaults.models` (allowlist), phải bao gồm `claude-cli/...`.
- Nếu provider chính thất bại (auth, rate limits, timeouts), OpenClaw sẽ thử CLI backend tiếp theo.

## Tổng quan cấu hình

Tất cả CLI backends nằm dưới:

```
agents.defaults.cliBackends
```

Mỗi mục được khóa bằng **provider id** (ví dụ: `claude-cli`, `my-cli`).
Provider id trở thành phần bên trái của model ref:

```
<provider>/<model>
```

### Ví dụ cấu hình

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Cách hoạt động

1. **Chọn backend** dựa trên prefix provider (`claude-cli/...`).
2. **Tạo system prompt** dùng prompt OpenClaw + context workspace.
3. **Thực thi CLI** với session id (nếu hỗ trợ) để giữ lịch sử nhất quán.
4. **Phân tích output** (JSON hoặc plain text) và trả về text cuối cùng.
5. **Lưu session ids** cho mỗi backend, để các lượt tiếp theo dùng lại session CLI.

## Sessions

- Nếu CLI hỗ trợ sessions, đặt `sessionArg` (ví dụ: `--session-id`) hoặc
  `sessionArgs` (placeholder `{sessionId}`) khi cần chèn ID vào nhiều flag.
- Nếu CLI dùng **resume subcommand** với flag khác, đặt
  `resumeArgs` (thay `args` khi resume) và tùy chọn `resumeOutput`
  (cho resume không JSON).
- `sessionMode`:
  - `always`: luôn gửi session id (UUID mới nếu không có).
  - `existing`: chỉ gửi session id nếu đã lưu trước đó.
  - `none`: không bao giờ gửi session id.

## Hình ảnh (pass-through)

Nếu CLI chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào file tạm. Nếu `imageArg` được đặt, các
đường dẫn này sẽ được truyền như CLI args. Nếu không có `imageArg`, OpenClaw
sẽ thêm đường dẫn file vào prompt (path injection), đủ cho CLIs tự động tải
file local từ đường dẫn plain (hành vi Claude Code CLI).

## Inputs / outputs

- `output: "json"` (mặc định) cố gắng phân tích JSON và trích xuất text + session id.
- `output: "jsonl"` phân tích JSONL streams (Codex CLI `--json`) và trích xuất
  tin nhắn agent cuối cùng cùng `thread_id` nếu có.
- `output: "text"` coi stdout là phản hồi cuối cùng.

Chế độ input:

- `input: "arg"` (mặc định) truyền prompt như CLI arg cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được dùng.

## Defaults (built-in)

OpenClaw có sẵn mặc định cho `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "json", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

OpenClaw cũng có sẵn mặc định cho `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Chỉ override nếu cần (thường là đường dẫn `command` tuyệt đối).

## Hạn chế

- **Không có công cụ OpenClaw** (CLI backend không nhận tool calls). Một số CLIs
  có thể vẫn chạy công cụ agent riêng.
- **Không streaming** (CLI output được thu thập rồi trả về).
- **Structured outputs** phụ thuộc vào định dạng JSON của CLI.
- **Codex CLI sessions** resume qua text output (không JSONL), ít cấu trúc hơn
  so với lần chạy `--json` đầu tiên. OpenClaw sessions vẫn hoạt động bình thường.

## Khắc phục sự cố

- **CLI không tìm thấy**: đặt `command` thành đường dẫn đầy đủ.
- **Sai tên model**: dùng `modelAliases` để map `provider/model` → CLI model.
- **Không có continuity session**: đảm bảo `sessionArg` được đặt và `sessionMode` không
  phải `none` (Codex CLI hiện không thể resume với JSON output).
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và kiểm tra CLI hỗ trợ đường dẫn file).\n