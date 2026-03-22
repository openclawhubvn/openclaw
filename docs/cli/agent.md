---
summary: "Khám phá cách cấu hình và sử dụng OpenClaw Agent qua CLI để gửi agent qua Gateway hiệu quả."
read_when:
  - Bạn muốn chạy một lượt agent từ script (có thể gửi kèm phản hồi)
title: "Hướng Dẫn Cấu Hình OpenClaw Agent CLI"
---

# `openclaw agent`

Chạy một lượt agent qua Gateway (sử dụng `--local` cho nhúng). Dùng `--agent <id>` để nhắm đến một agent đã cấu hình trực tiếp.

Liên quan:

- Công cụ gửi Agent: [Agent send](/tools/agent-send)

## Ví dụ

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## Lưu ý

- Khi lệnh này kích hoạt tái tạo `models.json`, thông tin xác thực của nhà cung cấp được quản lý bởi SecretRef sẽ được lưu lại dưới dạng các marker không phải là bí mật (ví dụ tên biến môi trường, `secretref-env:ENV_VAR_NAME`, hoặc `secretref-managed`), không phải là văn bản bí mật đã giải mã.
- Việc ghi marker là nguồn gốc chính thức: OpenClaw lưu trữ các marker từ bản chụp cấu hình nguồn đang hoạt động, không phải từ các giá trị bí mật đã giải mã trong thời gian chạy.
