---
summary: "Tổng quan về công cụ và plugin của OpenClaw: khả năng của agent và cách mở rộng"
read_when:
  - Bạn muốn hiểu các công cụ OpenClaw cung cấp
  - Bạn cần cấu hình, cho phép hoặc từ chối công cụ
  - Bạn đang phân vân giữa công cụ tích hợp sẵn, kỹ năng và plugin
title: "Công cụ và Plugin"
---

# Công cụ và Plugin

Mọi hoạt động của agent ngoài việc tạo văn bản đều thông qua **công cụ**. Công cụ giúp agent đọc file, chạy lệnh, duyệt web, gửi tin nhắn và tương tác với thiết bị.

## Công cụ, kỹ năng và plugin

OpenClaw có ba lớp hoạt động cùng nhau:

<Steps>
  <Step title="Công cụ là những gì agent gọi">
    Công cụ là một hàm có kiểu mà agent có thể gọi (ví dụ: `exec`, `browser`, `web_search`, `message`). OpenClaw cung cấp một bộ **công cụ tích hợp sẵn** và plugin có thể đăng ký thêm.

    Agent xem công cụ như các định nghĩa hàm có cấu trúc được gửi đến API mô hình.

  </Step>

  <Step title="Kỹ năng hướng dẫn agent khi nào và cách nào">
    Kỹ năng là một file markdown (`SKILL.md`) được đưa vào hệ thống nhắc nhở. Kỹ năng cung cấp cho agent ngữ cảnh, ràng buộc và hướng dẫn từng bước để sử dụng công cụ hiệu quả. Kỹ năng có thể nằm trong workspace, thư mục chia sẻ hoặc đi kèm trong plugin.

    [Tham khảo kỹ năng](/tools/skills) | [Tạo kỹ năng](/tools/creating-skills)

  </Step>

  <Step title="Plugin đóng gói mọi thứ lại với nhau">
    Plugin là một gói có thể đăng ký bất kỳ sự kết hợp nào của các khả năng: kênh, nhà cung cấp mô hình, công cụ, kỹ năng, giọng nói, tạo hình ảnh và nhiều hơn nữa. Một số plugin là **cốt lõi** (đi kèm với OpenClaw), số khác là **bên ngoài** (được cộng đồng phát hành trên npm).

    [Cài đặt và cấu hình plugin](/tools/plugin) | [Tự xây dựng plugin](/plugins/building-plugins)

  </Step>
</Steps>

## Công cụ tích hợp sẵn

Những công cụ này đi kèm với OpenClaw và có sẵn mà không cần cài đặt plugin:

| Công cụ                      | Chức năng                                                   | Trang                              |
| ---------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `exec` / `process`           | Chạy lệnh shell, quản lý tiến trình nền                     | [Exec](/tools/exec)               |
| `browser`                    | Điều khiển trình duyệt Chromium (điều hướng, nhấp, chụp màn hình) | [Browser](/tools/browser)         |
| `web_search` / `web_fetch`   | Tìm kiếm web, lấy nội dung trang                            | [Web](/tools/web)                 |
| `read` / `write` / `edit`    | I/O file trong workspace                                    |                                   |
| `apply_patch`                | Vá file nhiều phần                                          | [Apply Patch](/tools/apply-patch) |
| `message`                    | Gửi tin nhắn qua tất cả các kênh                            | [Agent Send](/tools/agent-send)   |
| `canvas`                     | Điều khiển node Canvas (trình bày, đánh giá, chụp nhanh)    |                                   |
| `nodes`                      | Khám phá và nhắm mục tiêu thiết bị ghép đôi                 |                                   |
| `cron` / `gateway`           | Quản lý công việc định kỳ, khởi động lại gateway            |                                   |
| `image` / `image_generate`   | Phân tích hoặc tạo hình ảnh                                 |                                   |
| `sessions_*` / `agents_list` | Quản lý phiên, sub-agent                                    | [Sub-agents](/tools/subagents)    |

### Công cụ do plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Một số ví dụ:

- [Lobster](/tools/lobster) — runtime workflow có kiểu với phê duyệt có thể tiếp tục
- [LLM Task](/tools/llm-task) — bước LLM chỉ JSON cho đầu ra có cấu trúc
- [Diffs](/tools/diffs) — trình xem và render diff
- [OpenProse](/prose) — điều phối workflow ưu tiên markdown

## Cấu hình công cụ

### Danh sách cho phép và từ chối

Kiểm soát công cụ mà agent có thể gọi qua `tools.allow` / `tools.deny` trong cấu hình. Từ chối luôn ưu tiên hơn cho phép.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Hồ sơ công cụ

`tools.profile` thiết lập danh sách cho phép cơ bản trước khi áp dụng `allow`/`deny`. Ghi đè theo agent: `agents.list[].tools.profile`.

| Hồ sơ       | Bao gồm gì                                    |
| ----------- | --------------------------------------------- |
| `full`      | Tất cả công cụ (mặc định)                     |
| `coding`    | I/O file, runtime, phiên, bộ nhớ, hình ảnh    |
| `messaging` | Nhắn tin, danh sách/lịch sử/gửi/trạng thái phiên |
| `minimal`   | Chỉ `session_status`                          |

### Nhóm công cụ

Sử dụng viết tắt `group:*` trong danh sách cho phép/từ chối:

| Nhóm                | Công cụ                                                                         |
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
| `group:openclaw`   | Tất cả công cụ tích hợp sẵn của OpenClaw (không bao gồm công cụ plugin)          |

### Hạn chế theo nhà cung cấp

Sử dụng `tools.byProvider` để hạn chế công cụ cho các nhà cung cấp cụ thể mà không thay đổi mặc định toàn cầu:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
