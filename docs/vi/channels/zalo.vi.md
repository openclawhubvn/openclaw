---
summary: "Trạng thái hỗ trợ, khả năng và cấu hình bot Zalo"
read_when:
  - Làm việc với tính năng Zalo hoặc webhook
title: "Zalo"
---

# Zalo (Bot API)

Trạng thái: thử nghiệm. Hỗ trợ tin nhắn trực tiếp (DM). Phần [Khả năng](#capabilities) bên dưới phản ánh hành vi hiện tại của bot Marketplace.

## Cần cài Plugin

Zalo là plugin, không đi kèm với bản cài đặt gốc.

- Cài qua CLI: `openclaw plugins install @openclaw/zalo`
- Hoặc chọn **Zalo** trong quá trình cài đặt và xác nhận
- Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh (cho người mới)

1. Cài plugin Zalo:
   - Từ source checkout: `openclaw plugins install ./extensions/zalo`
   - Từ npm (nếu đã publish): `openclaw plugins install @openclaw/zalo`
   - Hoặc chọn **Zalo** trong setup và xác nhận
2. Đặt token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Hoặc config: `channels.zalo.accounts.default.botToken: "..."`
3. Khởi động lại gateway (hoặc hoàn tất setup).
4. DM mặc định là pairing; duyệt mã pairing khi liên hệ lần đầu.

Cấu hình tối thiểu:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Zalo là gì

Zalo là ứng dụng nhắn tin tập trung vào thị trường Việt Nam; Bot API cho phép Gateway chạy bot cho các cuộc trò chuyện 1:1. Phù hợp cho hỗ trợ hoặc thông báo khi cần định tuyến chính xác về Zalo.

Trang này phản ánh hành vi hiện tại của OpenClaw cho **Zalo Bot Creator / Marketplace bots**. **Zalo Official Account (OA) bots** là sản phẩm khác của Zalo và có thể hoạt động khác.

- Kênh Zalo Bot API thuộc sở hữu của Gateway.
- Định tuyến chính xác: trả lời quay lại Zalo; mô hình không chọn kênh.
- DM chia sẻ session chính của agent.
- Phần [Khả năng](#capabilities) bên dưới cho thấy hỗ trợ hiện tại của bot Marketplace.

## Cài đặt (đường tắt)

### 1) Tạo bot token (Zalo Bot Platform)

1. Truy cập [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) và đăng nhập.
2. Tạo bot mới và cấu hình.
3. Sao chép token đầy đủ của bot (thường là `numeric_id:secret`). Với bot Marketplace, token runtime có thể xuất hiện trong tin nhắn chào mừng sau khi tạo.

### 2) Cấu hình token (env hoặc config)

Ví dụ:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Nếu sau này chuyển sang bề mặt bot Zalo có hỗ trợ nhóm, có thể thêm cấu hình nhóm như `groupPolicy` và `groupAllowFrom`. Để biết hành vi hiện tại của bot Marketplace, xem [Khả năng](#capabilities).

Tùy chọn Env: `ZALO_BOT_TOKEN=...` (chỉ hoạt động cho tài khoản mặc định).

Hỗ trợ nhiều tài khoản: dùng `channels.zalo.accounts` với token cho từng tài khoản và tùy chọn `name`.

3. Khởi động lại gateway. Zalo bắt đầu khi token được giải quyết (env hoặc config).
4. DM mặc định là pairing. Duyệt mã khi bot được liên hệ lần đầu.

## Cách hoạt động (hành vi)

- Tin nhắn đến được chuẩn hóa vào envelope kênh chung với placeholder media.
- Trả lời luôn định tuyến về lại chat Zalo.
- Long-polling mặc định; chế độ webhook có sẵn với `channels.zalo.webhookUrl`.

## Giới hạn

- Văn bản gửi đi bị chia nhỏ thành 2000 ký tự (giới hạn API Zalo).
- Tải xuống/tải lên media bị giới hạn bởi `channels.zalo.mediaMaxMb` (mặc định 5).
- Streaming bị chặn mặc định do giới hạn 2000 ký tự làm cho streaming ít hữu ích.

## Kiểm soát truy cập (DMs)

### Truy cập DM

- Mặc định: `channels.zalo.dmPolicy = "pairing"`. Người gửi không xác định nhận mã pairing; tin nhắn bị bỏ qua cho đến khi được duyệt (mã hết hạn sau 1 giờ).
- Duyệt qua:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing là trao đổi token mặc định. Chi tiết: [Pairing](/channels/pairing)
- `channels.zalo.allowFrom` chấp nhận ID người dùng số (không có tra cứu username).

## Kiểm soát truy cập (Nhóm)

Với **Zalo Bot Creator / Marketplace bots**, hỗ trợ nhóm không khả dụng vì bot không thể được thêm vào nhóm.

Điều đó có nghĩa là các khóa cấu hình liên quan đến nhóm dưới đây tồn tại trong schema, nhưng không thể sử dụng cho bot Marketplace:

- `channels.zalo.groupPolicy` kiểm soát xử lý nhóm inbound: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` giới hạn ID người gửi nào có thể kích hoạt bot trong nhóm.
- Nếu `groupAllowFrom` không được đặt, Zalo sẽ quay lại `allowFrom` để kiểm tra người gửi.
- Ghi chú runtime: nếu `channels.zalo` hoàn toàn thiếu, runtime vẫn quay lại `groupPolicy="allowlist"` để an toàn.

Các giá trị chính sách nhóm (khi truy cập nhóm khả dụng trên bề mặt bot của bạn) là:

- `groupPolicy: "disabled"` — chặn tất cả tin nhắn nhóm.
- `groupPolicy: "open"` — cho phép bất kỳ thành viên nhóm nào (được đề cập).
- `groupPolicy: "allowlist"` — mặc định fail-closed; chỉ chấp nhận người gửi được phép.

Nếu bạn đang sử dụng bề mặt sản phẩm bot Zalo khác và đã xác minh hành vi nhóm hoạt động, hãy tài liệu điều đó riêng thay vì giả định nó khớp với luồng bot Marketplace.

## Long-polling vs webhook

- Mặc định: long-polling (không cần URL công khai).
- Chế độ webhook: đặt `channels.zalo.webhookUrl` và `channels.zalo.webhookSecret`.
  - Secret webhook phải từ 8-256 ký tự.
  - URL webhook phải dùng HTTPS.
  - Zalo gửi sự kiện với header `X-Bot-Api-Secret-Token` để xác minh.
  - Gateway HTTP xử lý yêu cầu webhook tại `channels.zalo.webhookPath` (mặc định là đường dẫn URL webhook).
  - Yêu cầu phải dùng `Content-Type: application/json` (hoặc loại media `+json`).
  - Sự kiện trùng lặp (`event_name + message_id`) bị bỏ qua trong cửa sổ phát lại ngắn.
  - Lưu lượng bùng nổ bị giới hạn theo đường dẫn/nguồn và có thể trả về HTTP 429.

**Lưu ý:** getUpdates (polling) và webhook là loại trừ lẫn nhau theo tài liệu API Zalo.

## Các loại tin nhắn được hỗ trợ

Để có cái nhìn nhanh về hỗ trợ, xem [Khả năng](#capabilities). Các ghi chú dưới đây bổ sung chi tiết khi hành vi cần ngữ cảnh thêm.

- **Tin nhắn văn bản**: Hỗ trợ đầy đủ với chia nhỏ 2000 ký tự.
- **URL trơn trong văn bản**: Hoạt động như đầu vào văn bản bình thường.
- **Xem trước liên kết / thẻ liên kết phong phú**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities); chúng không kích hoạt trả lời đáng tin cậy.
- **Tin nhắn hình ảnh**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities); xử lý hình ảnh inbound không đáng tin cậy (chỉ báo gõ mà không có trả lời cuối cùng).
- **Sticker**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities).
- **Ghi chú giọng nói / tệp âm thanh / video / tệp đính kèm chung**: Xem trạng thái bot Marketplace trong [Khả năng](#capabilities).
- **Các loại không được hỗ trợ**: Được ghi lại (ví dụ, tin nhắn từ người dùng được bảo vệ).

## Khả năng

Bảng này tóm tắt hành vi hiện tại của **Zalo Bot Creator / Marketplace bot** trong OpenClaw.

| Tính năng                   | Trạng thái                              |
| --------------------------- | --------------------------------------- |
| Tin nhắn trực tiếp          | ✅ Hỗ trợ                               |
| Nhóm                        | ❌ Không khả dụng cho bot Marketplace   |
| Media (hình ảnh inbound)    | ⚠️ Hạn chế / xác minh trong môi trường của bạn |
| Media (hình ảnh outbound)   | ⚠️ Chưa kiểm tra lại cho bot Marketplace |
| URL trơn trong văn bản      | ✅ Hỗ trợ                               |
| Xem trước liên kết          | ⚠️ Không đáng tin cậy cho bot Marketplace |
| Phản ứng                    | ❌ Không hỗ trợ                         |
| Sticker                     | ⚠️ Không có trả lời agent cho bot Marketplace |
| Ghi chú giọng nói / âm thanh / video | ⚠️ Không có trả lời agent cho bot Marketplace |
| Tệp đính kèm                | ⚠️ Không có trả lời agent cho bot Marketplace |
| Chủ đề                      | ❌ Không hỗ trợ                         |
| Khảo sát                    | ❌ Không hỗ trợ                         |
| Lệnh gốc                    | ❌ Không hỗ trợ                         |
| Streaming                   | ⚠️ Bị chặn (giới hạn 2000 ký tự)       |

## Mục tiêu gửi (CLI/cron)

- Sử dụng id chat làm mục tiêu.
- Ví dụ: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Khắc phục sự cố

**Bot không phản hồi:**

- Kiểm tra token có hợp lệ không: `openclaw channels status --probe`
- Xác minh người gửi đã được duyệt (pairing hoặc allowFrom)
- Kiểm tra log gateway: `openclaw logs --follow`

**Webhook không nhận sự kiện:**

- Đảm bảo URL webhook sử dụng HTTPS
- Xác minh secret token từ 8-256 ký tự
- Xác nhận endpoint HTTP của gateway có thể truy cập trên đường dẫn đã cấu hình
- Kiểm tra rằng getUpdates polling không chạy (chúng loại trừ lẫn nhau)

## Tham khảo cấu hình (Zalo)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Các khóa cấp cao nhất phẳng (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, và tương tự) là dạng viết tắt cho một tài khoản duy nhất. Ưu tiên `channels.zalo.accounts.<id>.*` cho cấu hình mới. Cả hai dạng vẫn được tài liệu ở đây vì chúng tồn tại trong schema.

Tùy chọn Provider:

- `channels.zalo.enabled`: bật/tắt khởi động kênh.
- `channels.zalo.botToken`: token bot từ Zalo Bot Platform.
- `channels.zalo.tokenFile`: đọc token từ đường dẫn tệp thông thường. Symlinks bị từ chối.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.zalo.allowFrom`: danh sách cho phép DM (ID người dùng). `open` yêu cầu `"*"`. Wizard sẽ yêu cầu ID số.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist). Có trong config; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) cho hành vi hiện tại của bot Marketplace.
- `channels.zalo.groupAllowFrom`: danh sách cho phép người gửi nhóm (ID người dùng). Quay lại `allowFrom` khi không được đặt.
- `channels.zalo.mediaMaxMb`: giới hạn media inbound/outbound (MB, mặc định 5).
- `channels.zalo.webhookUrl`: bật chế độ webhook (yêu cầu HTTPS).
- `channels.zalo.webhookSecret`: secret webhook (8-256 ký tự).
- `channels.zalo.webhookPath`: đường dẫn webhook trên server HTTP của gateway.
- `channels.zalo.proxy`: URL proxy cho yêu cầu API.

Tùy chọn nhiều tài khoản:

- `channels.zalo.accounts.<id>.botToken`: token cho từng tài khoản.
- `channels.zalo.accounts.<id>.tokenFile`: tệp token thông thường cho từng tài khoản. Symlinks bị từ chối.
- `channels.zalo.accounts.<id>.name`: tên hiển thị.
- `channels.zalo.accounts.<id>.enabled`: bật/tắt tài khoản.
- `channels.zalo.accounts.<id>.dmPolicy`: chính sách DM cho từng tài khoản.
- `channels.zalo.accounts.<id>.allowFrom`: danh sách cho phép cho từng tài khoản.
- `channels.zalo.accounts.<id>.groupPolicy`: chính sách nhóm cho từng tài khoản. Có trong config; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) cho hành vi hiện tại của bot Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: danh sách cho phép người gửi nhóm cho từng tài khoản.
- `channels.zalo.accounts.<id>.webhookUrl`: URL webhook cho từng tài khoản.
- `channels.zalo.accounts.<id>.webhookSecret`: secret webhook cho từng tài khoản.
- `channels.zalo.accounts.<id>.webhookPath`: đường dẫn webhook cho từng tài khoản.
- `channels.zalo.accounts.<id>.proxy`: URL proxy cho từng tài khoản.\n