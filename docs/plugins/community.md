---
summary: "Khám phá cách duyệt, cài đặt và gửi plugin OpenClaw do cộng đồng phát triển. Tăng cường tính năng cho hệ thống của bạn."
read_when:
  - Bạn muốn tìm plugin OpenClaw từ bên thứ ba
  - Bạn muốn xuất bản hoặc liệt kê plugin của mình
title: "Hướng Dẫn Cài Đặt Plugin Cộng Đồng"
---

# Plugin Cộng Đồng

Plugin cộng đồng là các gói từ bên thứ ba mở rộng OpenClaw với các kênh, công cụ, nhà cung cấp hoặc khả năng mới. Chúng được cộng đồng xây dựng và duy trì, xuất bản trên npm, và có thể cài đặt chỉ với một lệnh duy nhất.

```bash
openclaw plugins install <npm-spec>
```

## Plugin được liệt kê

### Codex App Server Bridge

Cầu nối độc lập của OpenClaw cho các cuộc trò chuyện trên Codex App Server. Kết nối một cuộc trò chuyện với một luồng Codex, giao tiếp bằng văn bản thuần túy và điều khiển bằng các lệnh gốc của chat cho việc tiếp tục, lập kế hoạch, đánh giá, chọn mô hình, nén và nhiều hơn nữa.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Tích hợp robot doanh nghiệp sử dụng chế độ Stream. Hỗ trợ tin nhắn văn bản, hình ảnh và tệp qua bất kỳ client DingTalk nào.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin Quản lý Ngữ cảnh Không Mất Dữ Liệu cho OpenClaw. Tóm tắt cuộc trò chuyện dựa trên DAG với nén gia tăng — giữ nguyên độ trung thực của ngữ cảnh trong khi giảm sử dụng token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin chính thức xuất dữ liệu theo dõi agent sang Opik. Giám sát hành vi agent, chi phí, token, lỗi và nhiều hơn nữa.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Kết nối OpenClaw với QQ qua API QQ Bot. Hỗ trợ chat riêng tư, nhắc nhóm, tin nhắn kênh và phương tiện phong phú bao gồm giọng nói, hình ảnh, video và tệp.

- **npm:** `@sliverp/qqbot`
- **repo:** [github.com/sliverp/qqbot](https://github.com/sliverp/qqbot)

```bash
openclaw plugins install @sliverp/qqbot
```

### wecom

Plugin Kênh WeCom Doanh Nghiệp OpenClaw. Plugin bot được hỗ trợ bởi kết nối WebSocket AI Bot của WeCom, hỗ trợ tin nhắn trực tiếp & chat nhóm, trả lời theo luồng và nhắn tin chủ động.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Gửi plugin của bạn

Chúng tôi hoan nghênh các plugin cộng đồng hữu ích, có tài liệu và an toàn để vận hành.

<Steps>
  <Step title="Xuất bản lên npm">
    Plugin của bạn phải có thể cài đặt qua `openclaw plugins install \<npm-spec\>`.
    Xem [Xây dựng Plugin](/plugins/building-plugins) để biết hướng dẫn đầy đủ.

  </Step>

  <Step title="Lưu trữ trên GitHub">
    Mã nguồn phải nằm trong một kho lưu trữ công khai với tài liệu thiết lập và hệ thống theo dõi vấn đề.

  </Step>

  <Step title="Mở PR">
    Thêm plugin của bạn vào trang này với:

    - Tên plugin
    - Tên gói npm
    - URL kho lưu trữ GitHub
    - Mô tả ngắn gọn
    - Lệnh cài đặt

  </Step>
</Steps>

## Tiêu chuẩn chất lượng

| Yêu cầu                | Lý do                                           |
| ---------------------- | ----------------------------------------------- |
| Xuất bản trên npm      | Người dùng cần `openclaw plugins install` để hoạt động |
| Kho GitHub công khai   | Đánh giá mã nguồn, theo dõi vấn đề, minh bạch   |
| Tài liệu thiết lập và sử dụng | Người dùng cần biết cách cấu hình nó        |
| Bảo trì tích cực       | Cập nhật gần đây hoặc xử lý vấn đề nhanh chóng   |

Các gói không rõ nguồn gốc, không được bảo trì hoặc có chất lượng thấp có thể bị từ chối.

## Liên quan

- [Cài đặt và Cấu hình Plugin](/tools/plugin) — cách cài đặt bất kỳ plugin nào
- [Xây dựng Plugin](/plugins/building-plugins) — tạo plugin của riêng bạn
- [Manifest Plugin](/plugins/manifest) — schema manifest
