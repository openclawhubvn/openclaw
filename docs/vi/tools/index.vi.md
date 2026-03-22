---
summary: "Tổng quan về công cụ và plugin OpenClaw: khả năng của agent và cách mở rộng"
read_when:
  - Muốn hiểu công cụ OpenClaw cung cấp
  - Cần cấu hình, cho phép hoặc chặn công cụ
  - Đang phân vân giữa công cụ tích hợp sẵn, kỹ năng và plugin
title: "Công cụ và Plugin"
---

# Công cụ và Plugin

Mọi thứ agent làm ngoài việc tạo văn bản đều thông qua **công cụ**. Công cụ giúp agent đọc file, chạy lệnh, duyệt web, gửi tin nhắn và tương tác với thiết bị.

## Công cụ, kỹ năng và plugin

OpenClaw có ba lớp hoạt động cùng nhau:

<Steps>
  <Step title="Công cụ là gì agent gọi">
    Công cụ là hàm có kiểu mà agent có thể gọi (ví dụ: `exec`, `browser`, `web_search`, `message`). OpenClaw có sẵn một bộ **công cụ tích hợp** và plugin có thể đăng ký thêm.

    Agent xem công cụ như định nghĩa hàm có cấu trúc gửi tới model API.

  </Step>

  <Step title="Kỹ năng dạy agent khi nào và cách nào">
    Kỹ năng là file markdown (`SKILL.md`) được chèn vào system prompt. Kỹ năng cung cấp bối cảnh, ràng buộc và hướng dẫn từng bước để sử dụng công cụ hiệu quả. Kỹ năng có thể nằm trong workspace, thư mục chia sẻ hoặc trong plugin.

    [Tham khảo kỹ năng](/tools/skills) | [Tạo kỹ năng](/tools/creating-skills)

  </Step>

  <Step title="Plugin đóng gói mọi thứ lại với nhau">
    Plugin là gói có thể đăng ký bất kỳ kết hợp nào của các khả năng: kênh, nhà cung cấp model, công cụ, kỹ năng, giọng nói, tạo hình ảnh và nhiều hơn nữa. Một số plugin là **core** (đi kèm với OpenClaw), số khác là **external** (được cộng đồng phát hành trên npm).

    [Cài đặt và cấu hình plugin](/tools/plugin) | [Tự xây dựng plugin](/plugins/building-plugins)

  </Step>
</Steps>

## Công cụ tích hợp sẵn

Các công cụ này đi kèm với OpenClaw và có sẵn mà không cần cài đặt plugin:

| Công cụ                      | Chức năng                                                   | Trang                              |
| ---------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `exec` / `process`           | Chạy lệnh shell, quản lý tiến trình nền                     | [Exec](/tools/exec)               |
| `browser`                    | Điều khiển trình duyệt Chromium (điều hướng, click, chụp màn hình) | [Browser](/tools/browser)         |
| `web_search` / `web_fetch`   | Tìm kiếm web, lấy nội dung trang                            | [Web](/tools/web)                 |
| `read` / `write` / `edit`    | File I/O trong workspace                                    |                                   |
| `apply_patch`                | Vá file nhiều hunk                                          | [Apply Patch](/tools/apply-patch) |
| `message`                    | Gửi tin nhắn qua tất cả các kênh                            | [Agent Send](/tools/agent-send)   |
| `canvas`                     | Điều khiển node Canvas (trình bày, đánh giá, chụp nhanh)   |                                   |
| `nodes`                      | Khám phá và nhắm mục tiêu thiết bị ghép đôi                 |                                   |
| `cron` / `gateway`           | Quản lý công việc định kỳ, khởi động lại gateway            |                                   |
| `image` / `image_generate`   | Phân tích hoặc tạo hình ảnh                                 |                                   |
| `sessions_*` / `agents_list` | Quản lý phiên, sub-agent                                    | [Sub-agents](/tools/subagents)    |

### Công cụ từ plugin

Plugin có thể đăng ký thêm công cụ. Một số ví dụ:

- [Lobster](/tools/lobster) — runtime workflow có kiểu với phê duyệt có thể tiếp tục
- [LLM Task](/tools/llm-task) — bước LLM chỉ JSON cho output có cấu trúc
- [Diffs](/tools/diffs) — trình xem và render diff
- [OpenProse](/prose) — điều phối workflow ưu tiên markdown

## Cấu hình công cụ

### Danh sách cho phép và chặn

Kiểm soát công cụ agent có thể gọi qua `tools.allow` / `tools.deny` trong config. Chặn luôn ưu tiên hơn cho phép.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Hồ sơ công cụ

`tools.profile` thiết lập danh sách cho phép cơ bản trước khi áp dụng `allow`/`deny`. Ghi đè từng agent: `agents.list[].tools.profile`.

| Hồ sơ       | Bao gồm gì                                      |
| ----------- | ----------------------------------------------- |
| `full`      | Tất cả công cụ (mặc định)                       |
| `coding`    | File I/O, runtime, sessions, memory, image      |
| `messaging` | Messaging, danh sách/history/send/status phiên  |
| `minimal`   | Chỉ `session_status`                            |

### Nhóm công cụ

Sử dụng `group:*` trong danh sách cho phép/chặn:

| Nhóm               | Công cụ                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `group:runtime`    | exec, bash, process                                                              |
| `group:fs`         | read, write, edit, apply_patch                                                   |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, session_status   |
| `group:memory`     | memory_search, memory_get                                                        |
| `group:web`        | web_search, web_fetch                                                            |
| `group:ui`         | browser, canvas                                                                  |
| `group:automation` | cron, gateway                                                                    |
| `group:messaging`  | message                                                                          |
| `group:nodes`      | nodes                                                                            |
| `group:openclaw`   | Tất cả công cụ tích hợp OpenClaw (không bao gồm công cụ plugin)                  |

### Hạn chế theo nhà cung cấp

Sử dụng `tools.byProvider` để hạn chế công cụ cho nhà cung cấp cụ thể mà không thay đổi mặc định toàn cầu:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```\n