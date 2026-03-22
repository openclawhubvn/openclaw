# `openclaw agent`

Chạy một agent turn qua Gateway (dùng `--local` nếu chạy embedded).
Dùng `--agent <id>` để chỉ định agent đã cấu hình.

Liên quan:

- Công cụ gửi Agent: [Agent send](/tools/agent-send)

## Ví dụ

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## Ghi chú

- Khi lệnh này kích hoạt tái tạo `models.json`, thông tin đăng nhập provider quản lý bởi SecretRef được lưu dưới dạng marker không bảo mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME`, hoặc `secretref-managed`), không phải plaintext của secret.
- Việc ghi marker là nguồn gốc: OpenClaw lưu trữ marker từ snapshot cấu hình nguồn đang hoạt động, không phải từ giá trị secret đã giải quyết tại runtime.\n