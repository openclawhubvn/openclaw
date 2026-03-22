---
summary: "Khám phá cách cấu hình và tối ưu hóa bot Zalo để nâng cao khả năng tương tác và hỗ trợ khách hàng hiệu quả."
read_when:
  - Làm việc với các tính năng hoặc webhook của Zalo
title: "Hướng Dẫn Cấu Hình Bot Zalo"
---

# Zalo (Bot API)

Trạng thái: thử nghiệm. Hỗ trợ tin nhắn trực tiếp (DM). Phần [Khả năng](#capabilities) bên dưới phản ánh hành vi hiện tại của bot trên Marketplace.

## Yêu cầu Plugin

Zalo được cung cấp dưới dạng plugin và không đi kèm với cài đặt gốc.

- Cài đặt qua CLI: `openclaw plugins install @openclaw/zalo`
- Hoặc chọn **Zalo** trong quá trình cài đặt và xác nhận thông báo cài đặt
- Chi tiết: [Plugins](/tools/plugin)

## Cài đặt nhanh (dành cho người mới bắt đầu)

1. Cài đặt plugin Zalo:
   - Từ một source checkout: `openclaw plugins install ./extensions/zalo`
   - Từ npm (nếu đã phát hành): `openclaw plugins install @openclaw/zalo`
   - Hoặc chọn **Zalo** trong quá trình cài đặt và xác nhận thông báo cài đặt
2. Thiết lập token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Hoặc config: `channels.zalo.accounts.default.botToken: "..."`.
3. Khởi động lại gateway (hoặc hoàn tất cài đặt).
4. Truy cập DM mặc định là pairing; chấp nhận mã pairing khi liên hệ lần đầu.

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

Zalo là ứng dụng nhắn tin tập trung vào thị trường Việt Nam; Bot API của nó cho phép Gateway chạy bot cho các cuộc trò chuyện 1:1.
Nó phù hợp cho hỗ trợ hoặc thông báo khi bạn muốn định tuyến chính xác trở lại Zalo.

Trang này phản ánh hành vi hiện tại của OpenClaw cho **Zalo Bot Creator / Marketplace bots**.
**Zalo Official Account (OA) bots** là một sản phẩm khác của Zalo và có thể hoạt động khác.

- Một kênh Zalo Bot API thuộc sở hữu của Gateway.
- Định tuyến chính xác: trả lời quay lại Zalo; mô hình không bao giờ chọn kênh.
- DM chia sẻ phiên chính của agent.
- Phần [Khả năng](#capabilities) bên dưới cho thấy hỗ trợ hiện tại của bot trên Marketplace.

## Cài đặt (đường tắt)

### 1) Tạo bot token (Zalo Bot Platform)

1. Truy cập [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) và đăng nhập.
2. Tạo bot mới và cấu hình cài đặt của nó.
3. Sao chép toàn bộ bot token (thường là `numeric_id:secret`). Đối với các bot trên Marketplace, token runtime có thể xuất hiện trong tin nhắn chào mừng của bot sau khi tạo.

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

Nếu sau này bạn chuyển sang một bề mặt bot Zalo nơi có sẵn nhóm, bạn có thể thêm cấu hình cụ thể cho nhóm như `groupPolicy` và `groupAllowFrom`. Để biết hành vi hiện tại của bot trên Marketplace, xem [Khả năng](#capabilities).

Tùy chọn Env: `ZALO_BOT_TOKEN=...` (chỉ hoạt động cho tài khoản mặc định).

Hỗ trợ nhiều tài khoản: sử dụng `channels.zalo.accounts` với token cho từng tài khoản và tùy chọn `name`.

3. Khởi động lại gateway. Zalo bắt đầu khi một token được giải quyết (env hoặc config).
4. Truy cập DM mặc định là pairing. Chấp nhận mã khi bot được liên hệ lần đầu.

## Cách hoạt động (hành vi)

- Tin nhắn đến được chuẩn hóa thành phong bì kênh chung với các placeholder media.
- Trả lời luôn định tuyến trở lại cùng cuộc trò chuyện Zalo.
- Mặc định là long-polling; chế độ webhook có sẵn với `channels.zalo.webhookUrl`.

## Giới hạn

- Văn bản gửi đi được chia thành 2000 ký tự (giới hạn của Zalo API).
- Tải xuống/tải lên media bị giới hạn bởi `channels.zalo.mediaMaxMb` (mặc định 5).
- Streaming bị chặn mặc định do giới hạn 2000 ký tự làm cho streaming ít hữu ích hơn.

## Kiểm soát truy cập (DMs)

### Truy cập DM

- Mặc định: `channels.zalo.dmPolicy = "pairing"`. Người gửi không xác định nhận mã pairing; tin nhắn bị bỏ qua cho đến khi được chấp nhận (mã hết hạn sau 1 giờ).
- Chấp nhận qua:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- Pairing là phương thức trao đổi token mặc định. Chi tiết: [Pairing](/channels/pairing)
- `channels.zalo.allowFrom` chấp nhận ID người dùng số (không có tra cứu tên người dùng).

## Kiểm soát truy cập (Nhóm)

Đối với **Zalo Bot Creator / Marketplace bots**, hỗ trợ nhóm không có sẵn trong thực tế vì bot không thể được thêm vào nhóm.

Điều đó có nghĩa là các khóa cấu hình liên quan đến nhóm dưới đây tồn tại trong schema, nhưng không thể sử dụng cho các bot trên Marketplace:

- `channels.zalo.groupPolicy` kiểm soát xử lý nhóm inbound: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` hạn chế ID người gửi nào có thể kích hoạt bot trong nhóm.
- Nếu `groupAllowFrom` không được đặt, Zalo sẽ quay lại `allowFrom` để kiểm tra người gửi.
- Ghi chú runtime: nếu `channels.zalo` hoàn toàn thiếu, runtime vẫn quay lại `groupPolicy="allowlist"` để an toàn.

Các giá trị chính sách nhóm (khi truy cập nhóm có sẵn trên bề mặt bot của bạn) là:

- `groupPolicy: "disabled"` — chặn tất cả tin nhắn nhóm.
- `groupPolicy: "open"` — cho phép bất kỳ thành viên nhóm nào (được đề cập).
- `groupPolicy: "allowlist"` — mặc định đóng; chỉ những người gửi được phép mới được chấp nhận.

Nếu bạn đang sử dụng một bề mặt sản phẩm bot Zalo khác và đã xác minh hành vi nhóm hoạt động, hãy tài liệu điều đó riêng thay vì giả định nó khớp với luồng bot trên Marketplace.

## Long-polling vs webhook

- Mặc định: long-polling (không yêu cầu URL công khai).
- Chế độ webhook: đặt `channels.zalo.webhookUrl` và `channels.zalo.webhookSecret`.
  - Secret webhook phải có từ 8-256 ký tự.
  - URL webhook phải sử dụng HTTPS.
  - Zalo gửi sự kiện với header `X-Bot-Api-Secret-Token` để xác minh.
  - Gateway HTTP xử lý yêu cầu webhook tại `channels.zalo.webhookPath` (mặc định là đường dẫn URL webhook).
  - Yêu cầu phải sử dụng `Content-Type: application/json` (hoặc các loại media `+json`).
  - Các sự kiện trùng lặp (`event_name + message_id`) bị bỏ qua trong một cửa sổ phát lại ngắn.
  - Lưu lượng bùng nổ bị giới hạn theo đường dẫn/nguồn và có thể trả về HTTP 429.

**Lưu ý:** getUpdates (polling) và webhook là loại trừ lẫn nhau theo tài liệu Zalo API.

## Các loại tin nhắn được hỗ trợ

Để có cái nhìn nhanh về hỗ trợ, xem [Khả năng](#capabilities). Các ghi chú dưới đây bổ sung chi tiết khi hành vi cần thêm ngữ cảnh.

- **Tin nhắn văn bản**: Hỗ trợ đầy đủ với chia nhỏ 2000 ký tự.
- **URL đơn giản trong văn bản**: Hoạt động như đầu vào văn bản bình thường.
- **Xem trước liên kết / thẻ liên kết phong phú**: Xem trạng thái bot trên Marketplace trong [Khả năng](#capabilities); chúng không kích hoạt phản hồi một cách đáng tin cậy.
- **Tin nhắn hình ảnh**: Xem trạng thái bot trên Marketplace trong [Khả năng](#capabilities); xử lý hình ảnh inbound không đáng tin cậy (chỉ báo gõ mà không có phản hồi cuối cùng).
- **Sticker**: Xem trạng thái bot trên Marketplace trong [Khả năng](#capabilities).
- **Ghi chú giọng nói / tệp âm thanh / video / tệp đính kèm chung**: Xem trạng thái bot trên Marketplace trong [Khả năng](#capabilities).
- **Các loại không được hỗ trợ**: Được ghi lại (ví dụ, tin nhắn từ người dùng được bảo vệ).

## Khả năng

Bảng này tóm tắt hành vi hiện tại của **Zalo Bot Creator / Marketplace bot** trong OpenClaw.

| Tính năng                    | Trạng thái                              |
| ---------------------------- | --------------------------------------- |
| Tin nhắn trực tiếp           | ✅ Được hỗ trợ                          |
| Nhóm                         | ❌ Không có sẵn cho bot trên Marketplace |
| Media (hình ảnh inbound)     | ⚠️ Hạn chế / xác minh trong môi trường của bạn |
| Media (hình ảnh outbound)    | ⚠️ Chưa được kiểm tra lại cho bot trên Marketplace |
| URL đơn giản trong văn bản   | ✅ Được hỗ trợ                          |
| Xem trước liên kết           | ⚠️ Không đáng tin cậy cho bot trên Marketplace |
| Phản ứng                     | ❌ Không được hỗ trợ                    |
| Sticker                      | ⚠️ Không có phản hồi từ agent cho bot trên Marketplace |
| Ghi chú giọng nói / âm thanh / video | ⚠️ Không có phản hồi từ agent cho bot trên Marketplace |
| Tệp đính kèm                 | ⚠️ Không có phản hồi từ agent cho bot trên Marketplace |
| Chủ đề                       | ❌ Không được hỗ trợ                    |
| Khảo sát                     | ❌ Không được hỗ trợ                    |
| Lệnh gốc                     | ❌ Không được hỗ trợ                    |
| Streaming                    | ⚠️ Bị chặn (giới hạn 2000 ký tự)       |

## Mục tiêu gửi (CLI/cron)

- Sử dụng ID chat làm mục tiêu.
- Ví dụ: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Khắc phục sự cố

**Bot không phản hồi:**

- Kiểm tra token có hợp lệ không: `openclaw channels status --probe`
- Xác minh người gửi đã được chấp nhận (pairing hoặc allowFrom)
- Kiểm tra log của gateway: `openclaw logs --follow`

**Webhook không nhận sự kiện:**

- Đảm bảo URL webhook sử dụng HTTPS
- Xác minh secret token có từ 8-256 ký tự
- Xác nhận endpoint HTTP của gateway có thể truy cập được trên đường dẫn đã cấu hình
- Kiểm tra rằng polling getUpdates không đang chạy (chúng loại trừ lẫn nhau)

## Tham khảo cấu hình (Zalo)

Cấu hình đầy đủ: [Configuration](/gateway/configuration)

Các khóa cấp cao nhất phẳng (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, và tương tự) là dạng viết tắt cho một tài khoản duy nhất. Ưu tiên `channels.zalo.accounts.<id>.*` cho cấu hình mới. Cả hai dạng vẫn được tài liệu ở đây vì chúng tồn tại trong schema.

Tùy chọn nhà cung cấp:

- `channels.zalo.enabled`: bật/tắt khởi động kênh.
- `channels.zalo.botToken`: bot token từ Zalo Bot Platform.
- `channels.zalo.tokenFile`: đọc token từ đường dẫn tệp thông thường. Symlinks bị từ chối.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: pairing).
- `channels.zalo.allowFrom`: danh sách cho phép DM (ID người dùng). `open` yêu cầu `"*"`. Wizard sẽ yêu cầu ID số.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (mặc định: allowlist). Có trong cấu hình; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) cho hành vi hiện tại của bot trên Marketplace.
- `channels.zalo.groupAllowFrom`: danh sách cho phép người gửi nhóm (ID người dùng). Quay lại `allowFrom` khi không được đặt.
- `channels.zalo.mediaMaxMb`: giới hạn media inbound/outbound (MB, mặc định 5).
- `channels.zalo.webhookUrl`: bật chế độ webhook (yêu cầu HTTPS).
- `channels.zalo.webhookSecret`: secret webhook (8-256 ký tự).
- `channels.zalo.webhookPath`: đường dẫn webhook trên máy chủ HTTP của gateway.
- `channels.zalo.proxy`: URL proxy cho các yêu cầu API.

Tùy chọn nhiều tài khoản:

- `channels.zalo.accounts.<id>.botToken`: token cho từng tài khoản.
- `channels.zalo.accounts.<id>.tokenFile`: tệp token thông thường cho từng tài khoản. Symlinks bị từ chối.
- `channels.zalo.accounts.<id>.name`: tên hiển thị.
- `channels.zalo.accounts.<id>.enabled`: bật/tắt tài khoản.
- `channels.zalo.accounts.<id>.dmPolicy`: chính sách DM cho từng tài khoản.
- `channels.zalo.accounts.<id>.allowFrom`: danh sách cho phép cho từng tài khoản.
- `channels.zalo.accounts.<id>.groupPolicy`: chính sách nhóm cho từng tài khoản. Có trong cấu hình; xem [Khả năng](#capabilities) và [Kiểm soát truy cập (Nhóm)](#access-control-groups) cho hành vi hiện tại của bot trên Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: danh sách cho phép người gửi nhóm cho từng tài khoản.
- `channels.zalo.accounts.<id>.webhookUrl`: URL webhook cho từng tài khoản.
- `channels.zalo.accounts.<id>.webhookSecret`: secret webhook cho từng tài khoản.
- `channels.zalo.accounts.<id>.webhookPath`: đường dẫn webhook cho từng tài khoản.
- `channels.zalo.accounts.<id>.proxy`: URL proxy cho từng tài khoản.
