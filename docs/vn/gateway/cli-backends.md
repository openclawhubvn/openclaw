---
summary: "CLI backends: dự phòng chỉ văn bản qua các AI CLI cục bộ"
read_when:
  - Bạn cần một phương án dự phòng đáng tin cậy khi các nhà cung cấp API gặp sự cố
  - Bạn đang chạy Claude Code CLI hoặc các AI CLI cục bộ khác và muốn tái sử dụng chúng
  - Bạn cần một con đường chỉ văn bản, không công cụ nhưng vẫn hỗ trợ phiên và hình ảnh
title: "CLI Backends"
---

# CLI backends (thời gian chạy dự phòng)

OpenClaw có thể chạy **AI CLI cục bộ** như một **phương án dự phòng chỉ văn bản** khi các nhà cung cấp API bị gián đoạn, bị giới hạn tốc độ, hoặc tạm thời gặp sự cố. Điều này được thiết kế một cách thận trọng:

- **Công cụ bị vô hiệu hóa** (không có cuộc gọi công cụ).
- **Văn bản vào → văn bản ra** (đáng tin cậy).
- **Hỗ trợ phiên** (để các lượt tiếp theo vẫn nhất quán).
- **Hình ảnh có thể được truyền qua** nếu CLI chấp nhận đường dẫn hình ảnh.

Đây được thiết kế như một **mạng an toàn** hơn là con đường chính. Sử dụng khi bạn muốn có phản hồi văn bản "luôn hoạt động" mà không phụ thuộc vào API bên ngoài.

## Hướng dẫn nhanh cho người mới bắt đầu

Bạn có thể sử dụng Claude Code CLI **mà không cần cấu hình** (OpenClaw có sẵn mặc định):

```bash
openclaw agent --message "hi" --model claude-cli/opus-4.6
```

Codex CLI cũng hoạt động ngay lập tức:

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Nếu gateway của bạn chạy dưới launchd/systemd và PATH là tối thiểu, chỉ cần thêm đường dẫn lệnh:

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

Đó là tất cả. Không cần khóa, không cần cấu hình xác thực thêm ngoài CLI.

## Sử dụng như một phương án dự phòng

Thêm một CLI backend vào danh sách dự phòng để nó chỉ chạy khi các mô hình chính thất bại:

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

- Nếu bạn sử dụng `agents.defaults.models` (danh sách cho phép), bạn phải bao gồm `claude-cli/...`.
- Nếu nhà cung cấp chính thất bại (xác thực, giới hạn tốc độ, hết thời gian), OpenClaw sẽ thử CLI backend tiếp theo.

## Tổng quan cấu hình

Tất cả CLI backends nằm dưới:

```
agents.defaults.cliBackends
```

Mỗi mục được khóa bằng một **provider id** (ví dụ: `claude-cli`, `my-cli`).
Provider id trở thành phần bên trái của tham chiếu mô hình:

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

1. **Chọn một backend** dựa trên tiền tố nhà cung cấp (`claude-cli/...`).
2. **Xây dựng một hệ thống prompt** sử dụng cùng prompt OpenClaw + ngữ cảnh workspace.
3. **Thực thi CLI** với một session id (nếu được hỗ trợ) để lịch sử vẫn nhất quán.
4. **Phân tích đầu ra** (JSON hoặc văn bản thuần) và trả về văn bản cuối cùng.
5. **Lưu trữ session ids** cho mỗi backend, để các lượt tiếp theo tái sử dụng cùng một phiên CLI.

## Phiên

- Nếu CLI hỗ trợ phiên, đặt `sessionArg` (ví dụ: `--session-id`) hoặc
  `sessionArgs` (chỗ chèn `{sessionId}`) khi ID cần được chèn vào nhiều cờ.
- Nếu CLI sử dụng một **lệnh phụ resume** với các cờ khác nhau, đặt
  `resumeArgs` (thay thế `args` khi tiếp tục) và tùy chọn `resumeOutput`
  (cho các lần tiếp tục không phải JSON).
- `sessionMode`:
  - `always`: luôn gửi một session id (UUID mới nếu không có lưu trữ).
  - `existing`: chỉ gửi một session id nếu đã lưu trữ trước đó.
  - `none`: không bao giờ gửi một session id.

## Hình ảnh (truyền qua)

Nếu CLI của bạn chấp nhận đường dẫn hình ảnh, đặt `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw sẽ ghi hình ảnh base64 vào các tệp tạm thời. Nếu `imageArg` được đặt, các đường dẫn đó sẽ được truyền dưới dạng tham số CLI. Nếu `imageArg` bị thiếu, OpenClaw sẽ thêm các đường dẫn tệp vào prompt (chèn đường dẫn), đủ cho các CLI tự động tải tệp cục bộ từ các đường dẫn thuần (hành vi của Claude Code CLI).

## Đầu vào / đầu ra

- `output: "json"` (mặc định) cố gắng phân tích JSON và trích xuất văn bản + session id.
- `output: "jsonl"` phân tích các luồng JSONL (Codex CLI `--json`) và trích xuất
  thông điệp cuối cùng của agent cùng với `thread_id` khi có.
- `output: "text"` coi stdout là phản hồi cuối cùng.

Chế độ đầu vào:

- `input: "arg"` (mặc định) truyền prompt dưới dạng tham số CLI cuối cùng.
- `input: "stdin"` gửi prompt qua stdin.
- Nếu prompt rất dài và `maxPromptArgChars` được đặt, stdin sẽ được sử dụng.

## Mặc định (tích hợp sẵn)

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

Chỉ ghi đè nếu cần thiết (thường là đường dẫn `command` tuyệt đối).

## Hạn chế

- **Không có công cụ OpenClaw** (CLI backend không bao giờ nhận cuộc gọi công cụ). Một số CLI có thể vẫn chạy công cụ agent của riêng chúng.
- **Không có streaming** (đầu ra CLI được thu thập rồi trả về).
- **Đầu ra có cấu trúc** phụ thuộc vào định dạng JSON của CLI.
- **Phiên Codex CLI** tiếp tục qua đầu ra văn bản (không phải JSONL), ít có cấu trúc hơn so với lần chạy `--json` ban đầu. Phiên OpenClaw vẫn hoạt động bình thường.

## Khắc phục sự cố

- **CLI không tìm thấy**: đặt `command` thành đường dẫn đầy đủ.
- **Sai tên mô hình**: sử dụng `modelAliases` để ánh xạ `provider/model` → mô hình CLI.
- **Không có sự liên tục phiên**: đảm bảo `sessionArg` được đặt và `sessionMode` không phải `none` (Codex CLI hiện không thể tiếp tục với đầu ra JSON).
- **Hình ảnh bị bỏ qua**: đặt `imageArg` (và xác minh CLI hỗ trợ đường dẫn tệp).
