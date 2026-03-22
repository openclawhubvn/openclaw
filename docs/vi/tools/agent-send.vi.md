---
summary: "Chạy agent từ CLI và tùy chọn gửi phản hồi đến các kênh chat"
read_when:
  - Muốn kích hoạt agent từ script hoặc command line
  - Cần gửi phản hồi của agent đến kênh chat qua lập trình
title: "Agent Send"
---

# Agent Send

`openclaw agent` chạy một agent từ command line mà không cần tin nhắn chat đầu vào. Dùng cho các workflow script, test, và gửi qua lập trình.

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một agent đơn giản">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Gửi tin nhắn qua Gateway và in ra phản hồi.

  </Step>

  <Step title="Nhắm đến agent hoặc session cụ thể">
    ```bash
    # Nhắm đến một agent cụ thể
    openclaw agent --agent ops --message "Summarize logs"

    # Nhắm đến số điện thoại (tạo session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Dùng lại session có sẵn
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Gửi phản hồi đến kênh chat">
    ```bash
    # Gửi đến WhatsApp (kênh mặc định)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Gửi đến Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Tham số

| Tham số                       | Mô tả                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | Tin nhắn cần gửi (bắt buộc)                                  |
| `--to \<dest\>`               | Tạo session key từ mục tiêu (số điện thoại, chat id)        |
| `--agent \<id\>`              | Nhắm đến agent đã cấu hình (dùng session `main`)            |
| `--session-id \<id\>`         | Dùng lại session có sẵn theo id                              |
| `--local`                     | Chạy runtime local (bỏ qua Gateway)                          |
| `--deliver`                   | Gửi phản hồi đến kênh chat                                   |
| `--channel \<name\>`          | Kênh gửi (whatsapp, telegram, discord, slack, v.v.)          |
| `--reply-to \<target\>`       | Ghi đè mục tiêu gửi                                          |
| `--reply-channel \<name\>`    | Ghi đè kênh gửi                                              |
| `--reply-account \<id\>`      | Ghi đè account id gửi                                        |
| `--thinking \<level\>`        | Đặt mức độ suy nghĩ (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Đặt mức độ chi tiết                                          |
| `--timeout \<seconds\>`       | Ghi đè thời gian chờ của agent                               |
| `--json`                      | Xuất ra JSON có cấu trúc                                     |

## Hoạt động

- Mặc định, CLI chạy **qua Gateway**. Thêm `--local` để chạy runtime local trên máy hiện tại.
- Nếu Gateway không truy cập được, CLI **chuyển sang** chạy local.
- Chọn session: `--to` tạo session key (mục tiêu group/kênh giữ nguyên; chat trực tiếp chuyển về `main`).
- Tham số thinking và verbose lưu vào session store.
- Output: plain text mặc định, hoặc `--json` cho payload có cấu trúc + metadata.

## Ví dụ

```bash
# Chạy đơn giản với output JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Chạy với mức độ suy nghĩ
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Gửi đến kênh khác với session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liên quan

- [Agent CLI reference](/cli/agent)
- [Sub-agents](/tools/subagents) — chạy sub-agent nền
- [Sessions](/concepts/session) — cách hoạt động của session keys\n