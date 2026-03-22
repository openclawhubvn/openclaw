---
summary: "Chạy agent từ CLI và tùy chọn gửi phản hồi đến các kênh"
read_when:
  - Bạn muốn kích hoạt agent từ script hoặc dòng lệnh
  - Bạn cần gửi phản hồi của agent đến một kênh chat một cách tự động
title: "Gửi Agent"
---

# Gửi Agent

`openclaw agent` cho phép chạy một lượt agent từ dòng lệnh mà không cần tin nhắn chat đầu vào. Sử dụng cho các quy trình tự động, kiểm thử và gửi thông điệp tự động.

## Bắt đầu nhanh

<Steps>
  <Step title="Chạy một lượt agent đơn giản">
    ```bash
    openclaw agent --message "Thời tiết hôm nay thế nào?"
    ```

    Lệnh này gửi tin nhắn qua Gateway và in ra phản hồi.

  </Step>

  <Step title="Nhắm đến một agent hoặc phiên cụ thể">
    ```bash
    # Nhắm đến một agent cụ thể
    openclaw agent --agent ops --message "Tóm tắt nhật ký"

    # Nhắm đến một số điện thoại (tạo khóa phiên)
    openclaw agent --to +15555550123 --message "Cập nhật trạng thái"

    # Sử dụng lại một phiên đã có
    openclaw agent --session-id abc123 --message "Tiếp tục công việc"
    ```

  </Step>

  <Step title="Gửi phản hồi đến một kênh">
    ```bash
    # Gửi đến WhatsApp (kênh mặc định)
    openclaw agent --to +15555550123 --message "Báo cáo đã sẵn sàng" --deliver

    # Gửi đến Slack
    openclaw agent --agent ops --message "Tạo báo cáo" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Các tùy chọn

| Tùy chọn                      | Mô tả                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| `--message \<text\>`          | Tin nhắn cần gửi (bắt buộc)                                  |
| `--to \<dest\>`               | Tạo khóa phiên từ một mục tiêu (số điện thoại, id chat)      |
| `--agent \<id\>`              | Nhắm đến một agent đã cấu hình (sử dụng phiên `main` của nó) |
| `--session-id \<id\>`         | Sử dụng lại một phiên đã có bằng id                          |
| `--local`                     | Buộc chạy cục bộ (bỏ qua Gateway)                            |
| `--deliver`                   | Gửi phản hồi đến một kênh chat                               |
| `--channel \<name\>`          | Kênh gửi (whatsapp, telegram, discord, slack, v.v.)          |
| `--reply-to \<target\>`       | Ghi đè mục tiêu gửi                                          |
| `--reply-channel \<name\>`    | Ghi đè kênh gửi                                              |
| `--reply-account \<id\>`      | Ghi đè id tài khoản gửi                                      |
| `--thinking \<level\>`        | Đặt mức độ suy nghĩ (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Đặt mức độ chi tiết                                          |
| `--timeout \<seconds\>`       | Ghi đè thời gian chờ của agent                               |
| `--json`                      | Xuất ra JSON có cấu trúc                                     |

## Hành vi

- Mặc định, CLI sẽ **qua Gateway**. Thêm `--local` để buộc chạy cục bộ trên máy hiện tại.
- Nếu Gateway không thể truy cập, CLI sẽ **chuyển sang** chạy cục bộ.
- Lựa chọn phiên: `--to` tạo khóa phiên (mục tiêu nhóm/kênh giữ nguyên cách ly; chat trực tiếp gộp vào `main`).
- Các tùy chọn suy nghĩ và chi tiết sẽ được lưu vào kho phiên.
- Đầu ra: văn bản đơn giản mặc định, hoặc `--json` cho dữ liệu có cấu trúc và metadata.

## Ví dụ

```bash
# Lượt đơn giản với đầu ra JSON
openclaw agent --to +15555550123 --message "Theo dõi nhật ký" --verbose on --json

# Lượt với mức độ suy nghĩ
openclaw agent --session-id 1234 --message "Tóm tắt hộp thư" --thinking medium

# Gửi đến kênh khác với phiên
openclaw agent --agent ops --message "Cảnh báo" --deliver --reply-channel telegram --reply-to "@admin"
```

## Liên quan

- [Tham khảo CLI Agent](/cli/agent)
- [Sub-agents](/tools/subagents) — khởi tạo sub-agent nền
- [Phiên](/concepts/session) — cách hoạt động của khóa phiên
