---
summary: "Sử dụng Qwen OAuth (miễn phí) trong OpenClaw"
read_when:
  - Bạn muốn sử dụng Qwen với OpenClaw
  - Bạn muốn truy cập OAuth miễn phí cho Qwen Coder
title: "Qwen"
---

# Qwen

Qwen cung cấp luồng OAuth miễn phí cho các mô hình Qwen Coder và Qwen Vision (2.000 yêu cầu/ngày, tuân theo giới hạn của Qwen).

## Kích hoạt plugin

```bash
openclaw plugins enable qwen-portal-auth
```

Khởi động lại Gateway sau khi kích hoạt.

## Xác thực

```bash
openclaw models auth login --provider qwen-portal --set-default
```

Lệnh này chạy luồng OAuth device-code của Qwen và ghi một mục nhà cung cấp vào `models.json` (cộng với bí danh `qwen` để chuyển đổi nhanh).

## ID mô hình

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

Chuyển đổi mô hình với:

```bash
openclaw models set qwen-portal/coder-model
```

## Tái sử dụng đăng nhập Qwen Code CLI

Nếu đã đăng nhập bằng Qwen Code CLI, OpenClaw sẽ đồng bộ thông tin xác thực từ `~/.qwen/oauth_creds.json` khi tải kho lưu trữ xác thực. Bạn vẫn cần một mục `models.providers.qwen-portal` (sử dụng lệnh đăng nhập ở trên để tạo).

## Lưu ý

- Token tự động làm mới; chạy lại lệnh đăng nhập nếu làm mới thất bại hoặc quyền truy cập bị thu hồi.
- URL cơ bản mặc định: `https://portal.qwen.ai/v1` (ghi đè với `models.providers.qwen-portal.baseUrl` nếu Qwen cung cấp endpoint khác).
- Xem [Nhà cung cấp mô hình](/concepts/model-providers) để biết các quy tắc chung cho nhà cung cấp.
