---
summary: "Hỗ trợ Signal qua signal-cli (JSON-RPC + SSE), thiết lập đường dẫn và mô hình số"
read_when:
  - Thiết lập hỗ trợ Signal
  - Debug gửi/nhận Signal
title: "Signal"
---

# Signal (signal-cli)

Trạng thái: tích hợp CLI bên ngoài. Gateway giao tiếp với `signal-cli` qua HTTP JSON-RPC + SSE.

## Yêu cầu trước

- Đã cài OpenClaw trên server (luồng Linux dưới đây đã test trên Ubuntu 24).
- `signal-cli` có sẵn trên host chạy gateway.
- Số điện thoại có thể nhận một SMS xác minh (cho đường dẫn đăng ký SMS).
- Truy cập trình duyệt cho captcha Signal (`signalcaptchas.org`) trong quá trình đăng ký.

## Thiết lập nhanh (cho người mới)

1. Dùng **số Signal riêng** cho bot (khuyến nghị).
2. Cài `signal-cli` (cần Java nếu dùng bản JVM).
3. Chọn một đường dẫn thiết lập:
   - **Đường dẫn A (QR link):** `signal-cli link -n "OpenClaw"` và quét bằng Signal.
   - **Đường dẫn B (đăng ký SMS):** đăng ký số riêng với captcha + xác minh SMS.
4. Cấu hình OpenClaw và khởi động lại gateway.
5. Gửi DM đầu tiên và chấp nhận ghép đôi (`openclaw pairing approve signal <CODE>`).

Cấu hình tối thiểu:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Tham khảo trường:

| Trường       | Mô tả                                               |
| ------------ | --------------------------------------------------- |
| `account`    | Số điện thoại bot theo định dạng E.164 (`+15551234567`) |
| `cliPath`    | Đường dẫn đến `signal-cli` (`signal-cli` nếu có trong `PATH`) |
| `dmPolicy`   | Chính sách truy cập DM (`pairing` khuyến nghị)     |
| `allowFrom`  | Số điện thoại hoặc giá trị `uuid:<id>` được phép DM |

## Nó là gì

- Kênh Signal qua `signal-cli` (không phải libsignal nhúng).
- Định tuyến quyết định: trả lời luôn quay lại Signal.
- DMs chia sẻ session chính của agent; nhóm được cô lập (`agent:<agentId>:signal:group:<groupId>`).

## Ghi cấu hình

Mặc định, Signal được phép ghi cập nhật cấu hình kích hoạt bởi `/config set|unset` (cần `commands.config: true`).

Tắt với:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Mô hình số (quan trọng)

- Gateway kết nối với một **thiết bị Signal** (tài khoản `signal-cli`).
- Nếu chạy bot trên **tài khoản Signal cá nhân**, nó sẽ bỏ qua tin nhắn của chính bạn (bảo vệ vòng lặp).
- Để "Tôi nhắn bot và nó trả lời," dùng **số bot riêng**.

## Thiết lập đường dẫn A: liên kết tài khoản Signal hiện có (QR)

1. Cài `signal-cli` (bản JVM hoặc native).
2. Liên kết tài khoản bot:
   - `signal-cli link -n "OpenClaw"` rồi quét QR trong Signal.
3. Cấu hình Signal và khởi động gateway.

Ví dụ:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Hỗ trợ nhiều tài khoản: dùng `channels.signal.accounts` với cấu hình từng tài khoản và `name` tùy chọn. Xem [`gateway/configuration`](/gateway/configuration-reference#multi-account-all-channels) cho mẫu chia sẻ.

## Thiết lập đường dẫn B: đăng ký số bot riêng (SMS, Linux)

Dùng khi muốn số bot riêng thay vì liên kết tài khoản ứng dụng Signal hiện có.

1. Lấy số có thể nhận SMS (hoặc xác minh giọng nói cho điện thoại bàn).
   - Dùng số bot riêng để tránh xung đột tài khoản/session.
2. Cài `signal-cli` trên host gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Nếu dùng bản JVM (`signal-cli-${VERSION}.tar.gz`), cài JRE 25+ trước.
Giữ `signal-cli` cập nhật; upstream lưu ý rằng các bản phát hành cũ có thể bị lỗi khi API server Signal thay đổi.

3. Đăng ký và xác minh số:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Nếu cần captcha:

1. Mở `https://signalcaptchas.org/registration/generate.html`.
2. Hoàn thành captcha, sao chép liên kết `signalcaptcha://...` từ "Open Signal".
3. Chạy từ cùng IP ngoài với session trình duyệt khi có thể.
4. Chạy đăng ký lại ngay lập tức (token captcha hết hạn nhanh):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Cấu hình OpenClaw, khởi động lại gateway, xác minh kênh:

```bash
# Nếu chạy gateway như dịch vụ systemd người dùng:
systemctl --user restart openclaw-gateway

# Sau đó xác minh:
openclaw doctor
openclaw channels status --probe
```

5. Ghép đôi người gửi DM:
   - Gửi bất kỳ tin nhắn nào đến số bot.
   - Chấp nhận mã trên server: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Lưu số bot làm liên hệ trên điện thoại để tránh "Liên hệ không xác định".

Quan trọng: đăng ký tài khoản số điện thoại với `signal-cli` có thể hủy xác thực session ứng dụng Signal chính cho số đó. Ưu tiên số bot riêng, hoặc dùng chế độ QR link nếu cần giữ thiết lập ứng dụng điện thoại hiện có.

Tham khảo upstream:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Luồng captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Luồng liên kết: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Chế độ daemon bên ngoài (httpUrl)

Nếu muốn tự quản lý `signal-cli` (khởi động JVM chậm, khởi tạo container, hoặc chia sẻ CPU), chạy daemon riêng và trỏ OpenClaw vào nó:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Điều này bỏ qua tự động khởi động và chờ khởi động trong OpenClaw. Đối với khởi động chậm khi tự động khởi động, đặt `channels.signal.startupTimeoutMs`.

## Kiểm soát truy cập (DMs + nhóm)

DMs:

- Mặc định: `channels.signal.dmPolicy = "pairing"`.
- Người gửi không xác định nhận mã ghép đôi; tin nhắn bị bỏ qua cho đến khi được chấp nhận (mã hết hạn sau 1 giờ).
- Chấp nhận qua:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Ghép đôi là trao đổi token mặc định cho DMs Signal. Chi tiết: [Pairing](/channels/pairing)
- Người gửi chỉ UUID (từ `sourceUuid`) được lưu dưới dạng `uuid:<id>` trong `channels.signal.allowFrom`.

Nhóm:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` kiểm soát ai có thể kích hoạt trong nhóm khi `allowlist` được đặt.
- `channels.signal.groups["<group-id>" | "*"]` có thể ghi đè hành vi nhóm với `requireMention`, `tools`, và `toolsBySender`.
- Dùng `channels.signal.accounts.<id>.groups` cho ghi đè từng tài khoản trong thiết lập nhiều tài khoản.
- Ghi chú runtime: nếu `channels.signal` hoàn toàn thiếu, runtime sẽ quay lại `groupPolicy="allowlist"` cho kiểm tra nhóm (ngay cả khi `channels.defaults.groupPolicy` được đặt).

## Cách hoạt động (hành vi)

- `signal-cli` chạy như một daemon; gateway đọc sự kiện qua SSE.
- Tin nhắn đến được chuẩn hóa vào phong bì kênh chia sẻ.
- Trả lời luôn định tuyến lại cùng số hoặc nhóm.

## Media + giới hạn

- Văn bản gửi đi được chia nhỏ theo `channels.signal.textChunkLimit` (mặc định 4000).
- Chia nhỏ theo dòng mới tùy chọn: đặt `channels.signal.chunkMode="newline"` để chia nhỏ trên dòng trống (ranh giới đoạn) trước khi chia nhỏ theo độ dài.
- Hỗ trợ đính kèm (base64 lấy từ `signal-cli`).
- Giới hạn media mặc định: `channels.signal.mediaMaxMb` (mặc định 8).
- Dùng `channels.signal.ignoreAttachments` để bỏ qua tải xuống media.
- Ngữ cảnh lịch sử nhóm dùng `channels.signal.historyLimit` (hoặc `channels.signal.accounts.*.historyLimit`), quay lại `messages.groupChat.historyLimit`. Đặt `0` để tắt (mặc định 50).

## Gõ + biên nhận đọc

- **Chỉ báo gõ**: OpenClaw gửi tín hiệu gõ qua `signal-cli sendTyping` và làm mới chúng khi một trả lời đang chạy.
- **Biên nhận đọc**: khi `channels.signal.sendReadReceipts` là true, OpenClaw chuyển tiếp biên nhận đọc cho DMs được phép.
- Signal-cli không cung cấp biên nhận đọc cho nhóm.

## Phản ứng (công cụ tin nhắn)

- Dùng `message action=react` với `channel=signal`.
- Mục tiêu: người gửi E.164 hoặc UUID (dùng `uuid:<id>` từ đầu ra ghép đôi; UUID trần cũng hoạt động).
- `messageId` là timestamp Signal cho tin nhắn bạn đang phản ứng.
- Phản ứng nhóm yêu cầu `targetAuthor` hoặc `targetAuthorUuid`.

Ví dụ:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Cấu hình:

- `channels.signal.actions.reactions`: bật/tắt hành động phản ứng (mặc định true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` tắt phản ứng agent (công cụ tin nhắn `react` sẽ lỗi).
  - `minimal`/`extensive` bật phản ứng agent và đặt mức hướng dẫn.
- Ghi đè từng tài khoản: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Mục tiêu gửi (CLI/cron)

- DMs: `signal:+15551234567` (hoặc E.164 trần).
- UUID DMs: `uuid:<id>` (hoặc UUID trần).
- Nhóm: `signal:group:<groupId>`.
- Tên người dùng: `username:<name>` (nếu được hỗ trợ bởi tài khoản Signal của bạn).

## Khắc phục sự cố

Chạy thứ tự này trước:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Sau đó xác nhận trạng thái ghép đôi DM nếu cần:

```bash
openclaw pairing list signal
```

Các lỗi phổ biến:

- Daemon có thể truy cập nhưng không có trả lời: xác minh cài đặt tài khoản/daemon (`httpUrl`, `account`) và chế độ nhận.
- DMs bị bỏ qua: người gửi đang chờ chấp nhận ghép đôi.
- Tin nhắn nhóm bị bỏ qua: chặn gửi/nhắc nhóm ngăn chặn gửi.
- Lỗi xác thực cấu hình sau khi chỉnh sửa: chạy `openclaw doctor --fix`.
- Signal thiếu trong chẩn đoán: xác nhận `channels.signal.enabled: true`.

Kiểm tra thêm:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Đối với luồng phân loại: [/channels/troubleshooting](/channels/troubleshooting).

## Ghi chú bảo mật

- `signal-cli` lưu trữ khóa tài khoản cục bộ (thường là `~/.local/share/signal-cli/data/`).
- Sao lưu trạng thái tài khoản Signal trước khi di chuyển hoặc xây dựng lại server.
- Giữ `channels.signal.dmPolicy: "pairing"` trừ khi bạn muốn truy cập DM rộng hơn.
- Xác minh SMS chỉ cần cho luồng đăng ký hoặc khôi phục, nhưng mất quyền kiểm soát số/tài khoản có thể làm phức tạp việc đăng ký lại.

## Tham khảo cấu hình (Signal)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Tùy chọn nhà cung cấp:

- `channels.signal.enabled`: bật/tắt khởi động kênh.
- `channels.signal.account`: E.164 cho tài khoản bot.
- `channels.signal.cliPath`: đường dẫn đến `signal-cli`.
- `channels.signal.httpUrl`: URL daemon đầy đủ (ghi đè host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: bind daemon (mặc định 127.0.0.1:8080).
- `channels.signal.autoStart`: tự động khởi động daemon (mặc định true nếu `httpUrl` chưa đặt).
- `channels.signal.startupTimeoutMs`: thời gian chờ khởi động tính bằng ms (giới hạn 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: bỏ qua tải xuống đính kèm.
- `channels.signal.ignoreStories`: bỏ qua stories từ daemon.
- `channels.signal.sendReadReceipts`: chuyển tiếp biên nhận đọc.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.signal.allowFrom`: danh sách cho phép DM (E.164 hoặc `uuid:<id>`). `open` yêu cầu `"*"`. Signal không có tên người dùng; dùng id điện thoại/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist).
- `channels.signal.groupAllowFrom`: danh sách cho phép người gửi nhóm.
- `channels.signal.groups`: ghi đè từng nhóm theo id nhóm Signal (hoặc `"*"`). Các trường hỗ trợ: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: phiên bản từng tài khoản của `channels.signal.groups` cho thiết lập nhiều tài khoản.
- `channels.signal.historyLimit`: tối đa tin nhắn nhóm để bao gồm làm ngữ cảnh (0 tắt).
- `channels.signal.dmHistoryLimit`: giới hạn lịch sử DM theo lượt người dùng. Ghi đè từng người dùng: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: kích thước đoạn văn bản gửi đi (ký tự).
- `channels.signal.chunkMode`: `length` (mặc định) hoặc `newline` để chia nhỏ trên dòng trống (ranh giới đoạn) trước khi chia nhỏ theo độ dài.
- `channels.signal.mediaMaxMb`: giới hạn media vào/ra (MB).

Tùy chọn toàn cầu liên quan:

- `agents.list[].groupChat.mentionPatterns` (Signal không hỗ trợ nhắc tên gốc).
- `messages.groupChat.mentionPatterns` (dự phòng toàn cầu).
- `messages.responsePrefix`.\n