# Nextcloud Talk (plugin)

Trạng thái: Hỗ trợ qua plugin (webhook bot). Hỗ trợ tin nhắn trực tiếp, phòng, reactions và tin nhắn markdown.

## Cần cài plugin

Nextcloud Talk là plugin, không đi kèm cài đặt core.

Cài qua CLI (npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout local (khi chạy từ git repo):

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

Nếu chọn Nextcloud Talk khi setup và phát hiện git checkout, OpenClaw sẽ tự động đề xuất đường dẫn cài đặt local.

Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh (cho người mới)

1. Cài plugin Nextcloud Talk.
2. Trên server Nextcloud, tạo bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Kích hoạt bot trong cài đặt phòng mục tiêu.
4. Cấu hình OpenClaw:
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Hoặc env: `NEXTCLOUD_TALK_BOT_SECRET` (chỉ tài khoản mặc định)
5. Khởi động lại gateway (hoặc hoàn tất setup).

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

- Bot không thể khởi tạo DMs. Người dùng phải nhắn tin cho bot trước.
- Webhook URL phải có thể truy cập từ Gateway; đặt `webhookPublicUrl` nếu đứng sau proxy.
- API bot không hỗ trợ upload media; media gửi dưới dạng URL.
- Payload webhook không phân biệt DMs và rooms; đặt `apiUser` + `apiPassword` để bật lookup loại phòng (nếu không, DMs được xem như rooms).

## Kiểm soát truy cập (DMs)

- Mặc định: `channels.nextcloud-talk.dmPolicy = "pairing"`. Người gửi không xác định nhận mã pairing.
- Phê duyệt qua:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMs công khai: `channels.nextcloud-talk.dmPolicy="open"` cộng `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` chỉ khớp với user ID Nextcloud; bỏ qua display name.

## Rooms (nhóm)

- Mặc định: `channels.nextcloud-talk.groupPolicy = "allowlist"` (mention-gated).
- Cho phép rooms với `channels.nextcloud-talk.rooms`:

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

- Để không cho phép room nào, giữ allowlist trống hoặc đặt `channels.nextcloud-talk.groupPolicy="disabled"`.

## Khả năng

| Tính năng       | Trạng thái    |
| --------------- | ------------- |
| Tin nhắn trực tiếp | Hỗ trợ       |
| Rooms           | Hỗ trợ        |
| Threads         | Không hỗ trợ  |
| Media           | Chỉ URL       |
| Reactions       | Hỗ trợ        |
| Lệnh gốc        | Không hỗ trợ  |

## Tham khảo cấu hình (Nextcloud Talk)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn Provider:

- `channels.nextcloud-talk.enabled`: bật/tắt khởi động channel.
- `channels.nextcloud-talk.baseUrl`: URL instance Nextcloud.
- `channels.nextcloud-talk.botSecret`: bot shared secret.
- `channels.nextcloud-talk.botSecretFile`: đường dẫn file secret. Symlinks bị từ chối.
- `channels.nextcloud-talk.apiUser`: API user cho lookup phòng (phát hiện DM).
- `channels.nextcloud-talk.apiPassword`: API/app password cho lookup phòng.
- `channels.nextcloud-talk.apiPasswordFile`: đường dẫn file API password.
- `channels.nextcloud-talk.webhookPort`: cổng listener webhook (mặc định: 8788).
- `channels.nextcloud-talk.webhookHost`: host webhook (mặc định: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: đường dẫn webhook (mặc định: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL webhook có thể truy cập từ bên ngoài.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: DM allowlist (user IDs). `open` yêu cầu `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: group allowlist (user IDs).
- `channels.nextcloud-talk.rooms`: cài đặt và allowlist từng room.
- `channels.nextcloud-talk.historyLimit`: giới hạn lịch sử nhóm (0 để tắt).
- `channels.nextcloud-talk.dmHistoryLimit`: giới hạn lịch sử DM (0 để tắt).
- `channels.nextcloud-talk.dms`: ghi đè từng DM (historyLimit).
- `channels.nextcloud-talk.textChunkLimit`: kích thước chunk text outbound (chars).
- `channels.nextcloud-talk.chunkMode`: `length` (mặc định) hoặc `newline` để chia theo dòng trống (ranh giới đoạn) trước khi chunk theo độ dài.
- `channels.nextcloud-talk.blockStreaming`: tắt block streaming cho channel này.
- `channels.nextcloud-talk.blockStreamingCoalesce`: điều chỉnh coalesce block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: giới hạn media inbound (MB).\n