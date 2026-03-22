---
summary: "Sử dụng API thống nhất của Qianfan để truy cập nhiều mô hình trong OpenClaw"
read_when:
  - Cần một API key cho nhiều LLM
  - Cần hướng dẫn setup Baidu Qianfan
title: "Qianfan"
---

# Hướng dẫn Qianfan Provider

Qianfan là nền tảng MaaS của Baidu, cung cấp **API thống nhất** để định tuyến yêu cầu đến nhiều mô hình qua một endpoint và API key duy nhất. Tương thích với OpenAI, nên hầu hết SDK của OpenAI hoạt động chỉ cần đổi base URL.

## Yêu cầu

1. Tài khoản Baidu Cloud có quyền truy cập API Qianfan
2. API key từ Qianfan console
3. Đã cài đặt OpenClaw trên hệ thống

## Lấy API Key

1. Truy cập [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Tạo ứng dụng mới hoặc chọn ứng dụng có sẵn
3. Tạo API key (định dạng: `bce-v3/ALTAK-...`)
4. Sao chép API key để dùng với OpenClaw

## Thiết lập CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Tài liệu liên quan

- [Cấu hình OpenClaw](/gateway/configuration)
- [Nhà cung cấp mô hình](/concepts/model-providers)
- [Thiết lập Agent](/concepts/agent)
- [Tài liệu API Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)\n