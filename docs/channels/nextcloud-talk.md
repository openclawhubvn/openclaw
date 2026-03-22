---
summary: "Khám phá cách cấu hình và tối ưu hóa Nextcloud Talk để cải thiện khả năng giao tiếp và hỗ trợ nhóm hiệu quả."
read_when:
  - Đang làm việc với các tính năng kênh Nextcloud Talk
title: "Hướng Dẫn Cấu Hình Nextcloud Talk"
---

# Nextcloud Talk (plugin)

Trạng thái: được hỗ trợ qua plugin (webhook bot). Hỗ trợ tin nhắn trực tiếp, phòng, phản ứng và tin nhắn markdown.

## Cần có Plugin

Nextcloud Talk được cung cấp dưới dạng plugin và không đi kèm với cài đặt lõi.

Cài đặt qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Kiểm tra cục bộ (khi chạy từ một repo git):

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

Nếu chọn Nextcloud Talk trong quá trình thiết lập và phát hiện có git checkout, OpenClaw sẽ tự động đề xuất đường dẫn cài đặt cục bộ.

Chi tiết: [Plugins](/tools/plugin)

## Thiết lập nhanh (dành cho người mới)

1. Cài đặt plugin Nextcloud Talk.
2. Trên máy chủ Nextcloud, tạo một bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Kích hoạt bot trong cài đặt phòng mục tiêu.
4. Cấu hình OpenClaw:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Hoặc env: `NEXTCLOUD_TALK_BOT_SECRET` (chỉ tài khoản mặc định)
5. Khởi động lại gateway (hoặc hoàn tất thiết lập).

Cấu hình tối thiểu:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Lưu ý

- Bot không thể khởi tạo tin nhắn trực tiếp. Người dùng phải nhắn tin cho bot trước.
- URL webhook phải có thể truy cập được bởi Gateway; đặt `webhookPublicUrl` nếu nằm sau proxy.
- API bot không hỗ trợ tải lên media; media được gửi dưới dạng URL.
- Payload webhook không phân biệt tin nhắn trực tiếp và phòng; đặt `apiUser` + `apiPassword` để kích hoạt tra cứu loại phòng (nếu không, tin nhắn trực tiếp được coi là phòng).

## Kiểm soát truy cập (tin nhắn trực tiếp)

- Mặc định: `channels.nextcloud-talk.dmPolicy = "pairing"`. Người gửi không xác định sẽ nhận mã ghép đôi.
- Phê duyệt qua:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Tin nhắn trực tiếp công khai: `channels.nextcloud-talk.dmPolicy="open"` cộng với `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` chỉ khớp với ID người dùng Nextcloud; tên hiển thị bị bỏ qua.

## Phòng (nhóm)

- Mặc định: `channels.nextcloud-talk.groupPolicy = "allowlist"` (cần nhắc đến).
- Danh sách cho phép phòng với `channels.nextcloud-talk.rooms`:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Để không cho phép phòng nào, giữ danh sách cho phép trống hoặc đặt `channels.nextcloud-talk.groupPolicy="disabled"`.

## Khả năng

| Tính năng       | Trạng thái    |
| --------------- | ------------- |
| Tin nhắn trực tiếp | Được hỗ trợ  |
| Phòng           | Được hỗ trợ   |
| Chủ đề          | Không hỗ trợ  |
| Media           | Chỉ URL       |
| Phản ứng        | Được hỗ trợ   |
| Lệnh gốc        | Không hỗ trợ  |

## Tham khảo cấu hình (Nextcloud Talk)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.nextcloud-talk.enabled`: bật/tắt khởi động kênh.
- `channels.nextcloud-talk.baseUrl`: URL của instance Nextcloud.
- `channels.nextcloud-talk.botSecret`: bí mật chia sẻ của bot.
- `channels.nextcloud-talk.botSecretFile`: đường dẫn tệp bí mật thông thường. Symlinks bị từ chối.
- `channels.nextcloud-talk.apiUser`: người dùng API để tra cứu phòng (phát hiện tin nhắn trực tiếp).
- `channels.nextcloud-talk.apiPassword`: mật khẩu API/ứng dụng cho tra cứu phòng.
- `channels.nextcloud-talk.apiPasswordFile`: đường dẫn tệp mật khẩu API.
- `channels.nextcloud-talk.webhookPort`: cổng lắng nghe webhook (mặc định: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhook (mặc định: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: đường dẫn webhook (mặc định: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL webhook có thể truy cập từ bên ngoài.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: danh sách cho phép tin nhắn trực tiếp (ID người dùng). `open` yêu cầu `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: danh sách cho phép nhóm (ID người dùng).
- `channels.nextcloud-talk.rooms`: cài đặt và danh sách cho phép theo phòng.
- `channels.nextcloud-talk.historyLimit`: giới hạn lịch sử nhóm (0 để vô hiệu hóa).
- `channels.nextcloud-talk.dmHistoryLimit`: giới hạn lịch sử tin nhắn trực tiếp (0 để vô hiệu hóa).
- `channels.nextcloud-talk.dms`: ghi đè theo tin nhắn trực tiếp (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: kích thước đoạn văn bản gửi đi (ký tự).
- `channels.nextcloud-talk.chunkMode`: `length` (mặc định) hoặc `newline` để chia theo dòng trống (ranh giới đoạn văn) trước khi chia theo độ dài.
- `channels.nextcloud-talk.blockStreaming`: vô hiệu hóa streaming khối cho kênh này.
- `channels.nextcloud-talk.blockStreamingCoalesce`: điều chỉnh hợp nhất streaming khối.
- `channels.nextcloud-talk.mediaMaxMb`: giới hạn media đầu vào (MB).
