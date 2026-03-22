---
summary: "Plugin OpenClaw do cộng đồng duy trì: duyệt, cài đặt và gửi plugin của bạn"
read_when:
  - Tìm plugin OpenClaw từ bên thứ ba
  - Muốn xuất bản hoặc liệt kê plugin của mình
title: "Plugin Cộng Đồng"
---

# Plugin Cộng Đồng

Plugin cộng đồng là các package bên thứ ba mở rộng OpenClaw với các channel, công cụ, provider mới hoặc các khả năng khác. Được cộng đồng xây dựng và duy trì, xuất bản trên npm, và cài đặt chỉ với một lệnh duy nhất.

```bash
openclaw plugins install <npm-spec>
```

## Plugin đã liệt kê

### Codex App Server Bridge

Bridge độc lập cho hội thoại Codex App Server. Kết nối chat với một thread Codex, trò chuyện bằng văn bản thuần túy và điều khiển bằng các lệnh chat-native cho resume, planning, review, model selection, compaction, và nhiều hơn nữa.

- **npm:** `openclaw-codex-app-server`
- **repo:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

Tích hợp robot doanh nghiệp sử dụng chế độ Stream. Hỗ trợ tin nhắn văn bản, hình ảnh và file qua bất kỳ client DingTalk nào.

- **npm:** `@largezhou/ddingtalk`
- **repo:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin quản lý ngữ cảnh không mất mát cho OpenClaw. Tóm tắt hội thoại dựa trên DAG với compaction tăng dần — giữ nguyên độ trung thực của ngữ cảnh trong khi giảm sử dụng token.

- **npm:** `@martian-engineering/lossless-claw`
- **repo:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin chính thức xuất traces agent sang Opik. Giám sát hành vi agent, chi phí, token, lỗi và nhiều hơn nữa.

- **npm:** `@opik/opik-openclaw`
- **repo:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### QQbot

Kết nối OpenClaw với QQ qua API QQ Bot. Hỗ trợ chat riêng tư, nhắc nhóm, tin nhắn channel và media phong phú bao gồm giọng nói, hình ảnh, video và file.

- **npm:** `@sliverp/qqbot`
- **repo:** [github.com/sliverp/qqbot](https://github.com/sliverp/qqbot)

```bash
openclaw plugins install @sliverp/qqbot
```

### wecom

Plugin Channel WeCom Enterprise cho OpenClaw. Plugin bot sử dụng kết nối WebSocket AI Bot của WeCom, hỗ trợ tin nhắn trực tiếp & chat nhóm, phản hồi streaming và nhắn tin chủ động.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **repo:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## Gửi plugin của bạn

Chào đón các plugin cộng đồng hữu ích, có tài liệu và an toàn để vận hành.

<Steps>
  <Step title="Xuất bản lên npm">
    Plugin phải có thể cài đặt qua `openclaw plugins install \<npm-spec\>`.
    Xem [Xây dựng Plugin](/plugins/building-plugins) để biết hướng dẫn đầy đủ.

  </Step>

  <Step title="Lưu trữ trên GitHub">
    Mã nguồn phải nằm trong một repository công khai với tài liệu setup và một issue tracker.

  </Step>

  <Step title="Mở PR">
    Thêm plugin vào trang này với:

    - Tên plugin
    - Tên package npm
    - URL repository GitHub
    - Mô tả một dòng
    - Lệnh cài đặt

  </Step>
</Steps>

## Tiêu chuẩn chất lượng

| Yêu cầu               | Lý do                                           |
| --------------------- | ----------------------------------------------- |
| Xuất bản trên npm     | Người dùng cần `openclaw plugins install` hoạt động |
| Repo GitHub công khai | Đánh giá mã nguồn, theo dõi issue, minh bạch    |
| Tài liệu setup và sử dụng | Người dùng cần biết cách cấu hình            |
| Bảo trì tích cực      | Cập nhật gần đây hoặc xử lý issue nhanh chóng   |

Các package bọc sơ sài, không rõ quyền sở hữu hoặc không được bảo trì có thể bị từ chối.

## Liên quan

- [Cài đặt và Cấu hình Plugin](/tools/plugin) — cách cài đặt bất kỳ plugin nào
- [Xây dựng Plugin](/plugins/building-plugins) — tự tạo plugin
- [Manifest Plugin](/plugins/manifest) — schema manifest\n