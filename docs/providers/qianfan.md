---
summary: "Khám phá cách sử dụng API Qianfan để truy cập và tích hợp nhiều mô hình AI trong OpenClaw hiệu quả."
read_when:
  - Bạn muốn một API key duy nhất cho nhiều LLMs
  - Bạn cần hướng dẫn cài đặt Baidu Qianfan
title: "Hướng Dẫn Sử Dụng API Qianfan"
---

# Hướng dẫn sử dụng Qianfan

Qianfan là nền tảng MaaS của Baidu, cung cấp một **API thống nhất** để định tuyến yêu cầu đến nhiều mô hình thông qua một endpoint và API key duy nhất. Nó tương thích với OpenAI, vì vậy hầu hết các SDK của OpenAI có thể hoạt động bằng cách thay đổi URL cơ sở.

## Yêu cầu trước

1. Tài khoản Baidu Cloud có quyền truy cập API Qianfan
2. API key từ bảng điều khiển Qianfan
3. OpenClaw đã được cài đặt trên hệ thống của bạn

## Lấy API Key

1. Truy cập [Bảng điều khiển Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Tạo một ứng dụng mới hoặc chọn một ứng dụng có sẵn
3. Tạo API key (định dạng: `bce-v3/ALTAK-...`)
4. Sao chép API key để sử dụng với OpenClaw

## Thiết lập CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Tài liệu liên quan

- [Cấu hình OpenClaw](/gateway/configuration)
- [Nhà cung cấp mô hình](/concepts/model-providers)
- [Thiết lập Agent](/concepts/agent)
- [Tài liệu API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
